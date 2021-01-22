/* Copyright 2020-2021 Ethan Halsall
    
    This file is part of mse-audio-wrapper.
    
    mse-audio-wrapper is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    mse-audio-wrapper is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

/*
https://wiki.multimedia.cx/index.php/ADTS

AAAAAAAA AAAABCCD EEFFFFGH HHIJKLMM MMMMMMMM MMMOOOOO OOOOOOPP (QQQQQQQQ QQQQQQQQ)

AACHeader consists of 7 or 9 bytes (without or with CRC).
Letter 	Length (bits) 	Description
A 	12 	syncword 0xFFF, all bits must be 1
B 	1 	MPEG Version: 0 for MPEG-4, 1 for MPEG-2
C 	2 	Layer: always 0
D 	1 	protection absent, Warning, set to 1 if there is no CRC and 0 if there is CRC
E 	2 	profile, the MPEG-4 Audio Object Type minus 1
F 	4 	MPEG-4 Sampling Frequency Index (15 is forbidden)
G 	1 	private bit, guaranteed never to be used by MPEG, set to 0 when encoding, ignore when decoding
H 	3 	MPEG-4 Channel Configuration (in the case of 0, the channel configuration is sent via an inband PCE)
I 	1 	originality, set to 0 when encoding, ignore when decoding
J 	1 	home, set to 0 when encoding, ignore when decoding
K 	1 	copyrighted id bit, the next bit of a centrally registered copyright identifier, set to 0 when encoding, ignore when decoding
L 	1 	copyright id start, signals that this frame's copyright id bit is the first bit of the copyright id, set to 0 when encoding, ignore when decoding
M 	13 	frame length, this value must include 7 or 9 bytes of header length: FrameLength = (ProtectionAbsent == 1 ? 7 : 9) + size(AACFrame)
O 	11 	Buffer fullness // 0x7FF for VBR
P 	2 	Number of AAC frames (RDBs) in ADTS frame minus 1, for maximum compatibility always use 1 AAC frame per ADTS frame
Q 	16 	CRC if protection absent is 0 
*/

import CodecHeader from "../CodecHeader";
import HeaderCache from "../HeaderCache";

const mpegVersion = {
  0b00000000: "MPEG-4",
  0b00001000: "MPEG-2",
};

const layer = {
  0b00000000: "valid",
  0b00000010: "bad",
  0b00000100: "bad",
  0b00000110: "bad",
};

const protection = {
  0b00000000: "16bit CRC",
  0b00000001: "none",
};

const profile = {
  0b00000000: "AAC Main",
  0b01000000: "AAC LC (Low Complexity)",
  0b10000000: "AAC SSR (Scalable Sample Rate)",
  0b11000000: "AAC LTP (Long Term Prediction)",
};

const sampleRates = {
  0b00000000: 96000,
  0b00000100: 88200,
  0b00001000: 64000,
  0b00001100: 48000,
  0b00010000: 44100,
  0b00010100: 32000,
  0b00011000: 24000,
  0b00011100: 22050,
  0b00100000: 16000,
  0b00100100: 12000,
  0b00101000: 11025,
  0b00101100: 8000,
  0b00110000: 7350,
  0b00110100: "reserved",
  0b00111000: "reserved",
  0b00111100: "frequency is written explicitly",
};

const channelMode = {
  0b000000000: { channels: 0, description: "Defined in AOT Specific Config" },
  0b001000000: { channels: 1, description: "front-center" },
  0b010000000: { channels: 2, description: "front-left, front-right" },
  0b011000000: {
    channels: 3,
    description: "front-center, front-left, front-right",
  },
  0b100000000: {
    channels: 4,
    description: "front-center, front-left, front-right, back-center",
  },
  0b101000000: {
    channels: 5,
    description: "front-center, front-left, front-right, back-left, back-right",
  },
  0b110000000: {
    channels: 6,
    description:
      "front-center, front-left, front-right, back-left, back-right, LFE-channel",
  },
  0b111000000: {
    channels: 8,
    description:
      "front-center, front-left, front-right, side-left, side-right, back-left, back-right, LFE-channel",
  },
};

export default class AACHeader extends CodecHeader {
  static getHeader(data, headerCache) {
    const header = {};

    // Must be at least seven bytes. Out of data
    if (data.length < 7) return new AACHeader(header, false);

    // Check header cache
    const key = HeaderCache.getKey([
      data[0],
      data[1],
      data[2],
      data[3] & 111111100, // frame length varies so don't cache it
    ]);
    const cachedHeader = headerCache.getHeader(key);

    if (!cachedHeader) {
      // Frame sync (all bits must be set): `11111111|1111`:
      if (data[0] !== 0xff || data[1] < 0xf0) return null;

      // Byte (2 of 7)
      // * `1111BCCD`
      // * `....B...`: MPEG Version: 0 for MPEG-4, 1 for MPEG-2
      // * `.....CC.`: Layer: always 0
      // * `.......D`: protection absent, Warning, set to 1 if there is no CRC and 0 if there is CRC
      const mpegVersionBits = data[1] & 0b00001000;
      const layerBits = data[1] & 0b00000110;
      const protectionBit = data[1] & 0b00000001;

      header.mpegVersion = mpegVersion[mpegVersionBits];

      header.layer = layer[layerBits];
      if (header.layer === "bad") return null;

      header.protection = protection[protectionBit];
      header.length = protectionBit ? 7 : 9;

      // Byte (3 of 7)
      // * `EEFFFFGH`
      // * `EE......`: profile, the MPEG-4 Audio Object Type minus 1
      // * `..FFFF..`: MPEG-4 Sampling Frequency Index (15 is forbidden)
      // * `......G.`: private bit, guaranteed never to be used by MPEG, set to 0 when encoding, ignore when decoding
      header.profileBits = data[2] & 0b11000000;
      header.sampleRateBits = data[2] & 0b00111100;
      const privateBit = data[2] & 0b00000010;

      header.profile = profile[header.profileBits];

      header.sampleRate = sampleRates[header.sampleRateBits];
      if (header.sampleRate === "reserved") return null;

      header.isPrivate = !!(privateBit >> 1);

      // Byte (3,4 of 7)
      // * `.......H|HH......`: MPEG-4 Channel Configuration (in the case of 0, the channel configuration is sent via an inband PCE)
      header.channelModeBits =
        new DataView(Uint8Array.of(data[2], data[3]).buffer).getUint16() &
        0b111000000;
      header.channelMode = channelMode[header.channelModeBits].description;
      header.channels = channelMode[header.channelModeBits].channels;

      // Byte (4 of 7)
      // * `HHIJKLMM`
      // * `..I.....`: originality, set to 0 when encoding, ignore when decoding
      // * `...J....`: home, set to 0 when encoding, ignore when decoding
      // * `....K...`: copyrighted id bit, the next bit of a centrally registered copyright identifier, set to 0 when encoding, ignore when decoding
      // * `.....L..`: copyright id start, signals that this frame's copyright id bit is the first bit of the copyright id, set to 0 when encoding, ignore when decoding
      const originalBit = data[3] & 0b00100000;
      const homeBit = data[3] & 0b00001000;
      const copyrightIdBit = data[3] & 0b00001000;
      const copyrightIdStartBit = data[3] & 0b00000100;

      header.isOriginal = !!(originalBit >> 5);
      header.isHome = !!(homeBit >> 4);
      header.copyrightId = !!(copyrightIdBit >> 3);
      header.copyrightIdStart = !!(copyrightIdStartBit >> 2);
      header.bitDepth = 16;
    } else {
      Object.assign(header, cachedHeader);
    }

    // Byte (4,5,6 of 7)
    // * `.......MM|MMMMMMMM|MMM.....`: frame length, this value must include 7 or 9 bytes of header length: FrameLength = (ProtectionAbsent == 1 ? 7 : 9) + size(AACFrame)
    const frameLengthBits =
      new DataView(
        Uint8Array.of(0x00, data[3], data[4], data[5]).buffer
      ).getUint32() & 0x3ffe0;
    header.dataByteLength = frameLengthBits >> 5;
    if (!header.dataByteLength) return null;

    // Byte (6,7 of 7)
    // * `...OOOOO|OOOOOO..`: Buffer fullness
    const bufferFullnessBits =
      new DataView(Uint8Array.of(data[5], data[6]).buffer).getUint16() & 0x1ffc;
    header.bufferFullness =
      bufferFullnessBits === 0x1ffc ? "VBR" : bufferFullnessBits >> 2;

    // Byte (7 of 7)
    // * `......PP` Number of AAC frames (RDBs) in ADTS frame minus 1, for maximum compatibility always use 1 AAC frame per ADTS frame
    header.numberAACFrames = data[6] & 0b00000011;
    header.samplesPerFrame = 1024;

    if (!cachedHeader) {
      const {
        length,
        channelModeBits,
        profileBits,
        sampleRateBits,
        dataByteLength,
        bufferFullness,
        numberAACFrames,
        samplesPerFrame,
        ...codecUpdateFields
      } = header;
      headerCache.setHeader(key, header, codecUpdateFields);
    }
    return new AACHeader(header, true);
  }

  /**
   * @private
   * Call AACHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header, isParsed) {
    super(header, isParsed);
    this._copyrightId = header.copyrightId;
    this._copyrightIdStart = header.copyrightIdStart;
    this._bufferFullness = header.bufferFullness;
    this._isHome = header.isHome;
    this._isOriginal = header.isOriginal;
    this._isPrivate = header.isPrivate;
    this._layer = header.layer;
    this._mpegVersion = header.mpegVersion;
    this._numberAACFrames = header.numberAACFrames;
    this._profile = header.profile;
    this._protection = header.protection;
    this._profileBits = header.profileBits;
    this._sampleRateBits = header.sampleRateBits;
    this._channelModeBits = header.channelModeBits;
  }

  get audioSpecificConfig() {
    // Audio Specific Configuration
    // * `000EEFFF|F0HHH000`:
    // * `000EE...|........`: Object Type (profileBit + 1)
    // * `.....FFF|F.......`: Sample Rate
    // * `........|.0HHH...`: Channel Configuration
    // * `........|.....0..`: Frame Length (1024)
    // * `........|......0.`: does not depend on core coder
    // * `........|.......0`: Not Extension
    const audioSpecificConfig =
      ((this._profileBits + 0x40) << 5) |
      (this._sampleRateBits << 5) |
      (this._channelModeBits >> 3);

    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, audioSpecificConfig, false);
    return bytes;
  }
}
