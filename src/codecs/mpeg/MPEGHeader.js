/* Copyright 2020-2021 Ethan Halsall
    
    This file is part of codec-parser.
    
    codec-parser is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    codec-parser is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

import { headerStore } from "../../globals";
import Header from "../Header";
import HeaderCache from "../HeaderCache";

// http://www.mp3-tech.org/programmer/frame_header.html

const bitrateMatrix = {
  // bits | V1,L1 | V1,L2 | V1,L3 | V2,L1 | V2, L2 & L3
  0b00000000: ["free", "free", "free", "free", "free"],
  0b00010000: [32, 32, 32, 32, 8],
  0b00100000: [64, 48, 40, 48, 16],
  0b00110000: [96, 56, 48, 56, 24],
  0b01000000: [128, 64, 56, 64, 32],
  0b01010000: [160, 80, 64, 80, 40],
  0b01100000: [192, 96, 80, 96, 48],
  0b01110000: [224, 112, 96, 112, 56],
  0b10000000: [256, 128, 112, 128, 64],
  0b10010000: [288, 160, 128, 144, 80],
  0b10100000: [320, 192, 160, 160, 96],
  0b10110000: [352, 224, 192, 176, 112],
  0b11000000: [384, 256, 224, 192, 128],
  0b11010000: [416, 320, 256, 224, 144],
  0b11100000: [448, 384, 320, 256, 160],
  0b11110000: ["bad", "bad", "bad", "bad", "bad"],
};

const v1Layer1 = 0;
const v1Layer2 = 1;
const v1Layer3 = 2;
const v2Layer1 = 3;
const v2Layer23 = 4;

const layer12ModeExtensions = {
  0b00000000: "bands 4 to 31",
  0b00010000: "bands 8 to 31",
  0b00100000: "bands 12 to 31",
  0b00110000: "bands 16 to 31",
};

const layer3ModeExtensions = {
  0b00000000: "Intensity stereo off, MS stereo off",
  0b00010000: "Intensity stereo on, MS stereo off",
  0b00100000: "Intensity stereo off, MS stereo on",
  0b00110000: "Intensity stereo on, MS stereo on",
};

const layers = {
  0b00000000: { description: "reserved" },
  0b00000010: {
    description: "Layer III",
    framePadding: 1,
    modeExtensions: layer3ModeExtensions,
    v1: {
      bitrateIndex: v1Layer3,
      samples: 1152,
    },
    v2: {
      bitrateIndex: v2Layer23,
      samples: 576,
    },
  },
  0b00000100: {
    description: "Layer II",
    framePadding: 1,
    modeExtensions: layer12ModeExtensions,
    samples: 1152,
    v1: {
      bitrateIndex: v1Layer2,
    },
    v2: {
      bitrateIndex: v2Layer23,
    },
  },
  0b00000110: {
    description: "Layer I",
    framePadding: 4,
    modeExtensions: layer12ModeExtensions,
    samples: 384,
    v1: {
      bitrateIndex: v1Layer1,
    },
    v2: {
      bitrateIndex: v2Layer1,
    },
  },
};

const mpegVersions = {
  0b00000000: {
    description: "MPEG Version 2.5 (later extension of MPEG 2)",
    layers: "v2",
    sampleRates: {
      0b00000000: 11025,
      0b00000100: 12000,
      0b00001000: 8000,
      0b00001100: "reserved",
    },
  },
  0b00001000: { description: "reserved" },
  0b00010000: {
    description: "MPEG Version 2 (ISO/IEC 13818-3)",
    layers: "v2",
    sampleRates: {
      0b00000000: 22050,
      0b00000100: 24000,
      0b00001000: 16000,
      0b00001100: "reserved",
    },
  },
  0b00011000: {
    description: "MPEG Version 1 (ISO/IEC 11172-3)",
    layers: "v1",
    sampleRates: {
      0b00000000: 44100,
      0b00000100: 48000,
      0b00001000: 32000,
      0b00001100: "reserved",
    },
  },
};

const protection = {
  0b00000000: "16bit CRC",
  0b00000001: "none",
};

const emphasis = {
  0b00000000: "none",
  0b00000001: "50/15 ms",
  0b00000010: "reserved",
  0b00000011: "CCIT J.17",
};

const channelModes = {
  0b00000000: { channels: 2, description: "Stereo" },
  0b01000000: { channels: 2, description: "Joint stereo" },
  0b10000000: { channels: 2, description: "Dual channel" },
  0b11000000: { channels: 1, description: "Single channel (Mono)" },
};

export default class MPEGHeader extends Header {
  static getHeader(data, headerCache) {
    const header = {};
    // Must be at least four bytes.
    if (data.length < 4) return new MPEGHeader(header, false);

    // Check header cache
    const key = HeaderCache.getKey(data.subarray(0, 4));
    const cachedHeader = headerCache.getHeader(key);
    if (cachedHeader) return new MPEGHeader(cachedHeader, true);

    // Frame sync (all bits must be set): `11111111|111`:
    if (data[0] !== 0xff || data[1] < 0xe0) return null;

    // Byte (2 of 4)
    // * `111BBCCD`
    // * `...BB...`: MPEG Audio version ID
    // * `.....CC.`: Layer description
    // * `.......D`: Protection bit (0 - Protected by CRC (16bit CRC follows header), 1 = Not protected)
    const mpegVersionBits = data[1] & 0b00011000;
    const layerBits = data[1] & 0b00000110;
    const protectionBit = data[1] & 0b00000001;

    header.length = 4;

    // Mpeg version (1, 2, 2.5)
    const mpegVersion = mpegVersions[mpegVersionBits];
    if (mpegVersion.description === "reserved") return null;

    // Layer (I, II, III)
    if (layers[layerBits].description === "reserved") return null;
    const layer = {
      ...layers[layerBits],
      ...layers[layerBits][mpegVersion.layers],
    };

    header.mpegVersion = mpegVersion.description;
    header.layer = layer.description;
    header.samples = layer.samples;
    header.protection = protection[protectionBit];

    // Byte (3 of 4)
    // * `EEEEFFGH`
    // * `EEEE....`: Bitrate index. 1111 is invalid, everything else is accepted
    // * `....FF..`: Sample rate
    // * `......G.`: Padding bit, 0=frame not padded, 1=frame padded
    // * `.......H`: Private bit.
    const bitrateBits = data[2] & 0b11110000;
    const sampleRateBits = data[2] & 0b00001100;
    const paddingBit = data[2] & 0b00000010;
    const privateBit = data[2] & 0b00000001;

    header.bitrate = bitrateMatrix[bitrateBits][layer.bitrateIndex];
    if (header.bitrate === "bad") return null;

    header.sampleRate = mpegVersion.sampleRates[sampleRateBits];
    if (header.sampleRate === "reserved") return null;

    header.framePadding = paddingBit >> 1 && layer.framePadding;
    header.isPrivate = !!privateBit;

    header.frameLength = Math.floor(
      (125 * header.bitrate * header.samples) / header.sampleRate +
        header.framePadding
    );
    if (!header.frameLength) return null;

    // Byte (4 of 4)
    // * `IIJJKLMM`
    // * `II......`: Channel mode
    // * `..JJ....`: Mode extension (only if joint stereo)
    // * `....K...`: Copyright
    // * `.....L..`: Original
    // * `......MM`: Emphasis
    const channelModeBits = data[3] & 0b11000000;
    const modeExtensionBits = data[3] & 0b00110000;
    const copyrightBit = data[3] & 0b00001000;
    const originalBit = data[3] & 0b00000100;
    const emphasisBits = data[3] & 0b00000011;

    header.channelMode = channelModes[channelModeBits].description;
    header.channels = channelModes[channelModeBits].channels;
    header.modeExtension = layer.modeExtensions[modeExtensionBits];
    header.isCopyrighted = !!(copyrightBit >> 3);
    header.isOriginal = !!(originalBit >> 2);

    header.emphasis = emphasis[emphasisBits];
    if (header.emphasis === "reserved") return null;

    header.bitDepth = 16;

    // set header cache
    const { length, frameLength, samples, ...codecUpdateFields } = header;

    headerCache.setHeader(key, header, codecUpdateFields);
    return new MPEGHeader(header, true);
  }

  /**
   * @private
   * Call MPEGHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header, isParsed) {
    super(header, isParsed);
  }

  get bitrate() {
    return headerStore.get(this).bitrate;
  }

  get emphasis() {
    return headerStore.get(this).emphasis;
  }

  get framePadding() {
    return headerStore.get(this).framePadding;
  }

  get frameLength() {
    return headerStore.get(this).frameLength;
  }

  get isCopyrighted() {
    return headerStore.get(this).isCopyrighted;
  }

  get isOriginal() {
    return headerStore.get(this).isOriginal;
  }

  get isPrivate() {
    return headerStore.get(this).isPrivate;
  }

  get layer() {
    return headerStore.get(this).layer;
  }

  get modeExtension() {
    return headerStore.get(this).modeExtension;
  }

  get mpegVersion() {
    return headerStore.get(this).mpegVersion;
  }

  get protection() {
    return headerStore.get(this).protection;
  }
}
