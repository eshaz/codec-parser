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

1  1) [packet_type] : 8 bit value
2  2) 0x76, 0x6f, 0x72, 0x62, 0x69, 0x73: the characters ’v’,’o’,’r’,’b’,’i’,’s’ as six octets

Letter bits Description
A      8    Packet type
B      48   Magic signature (vorbis)
C      32   Version number
D      8    Channels
E      32   Sample rate
F      32   Bitrate Maximum (signed)
G      32   Bitrate Nominal (signed)
H      32   Bitrate Minimum (signed)
I      4    blocksize 1
J      4    blocksize 0
K      1    Framing flag
*/

import CodecHeader from "../CodecHeader";
import HeaderCache from "../HeaderCache";

/* prettier-ignore */
const blockSizes = {
  0b0110: 64,
  0b0111: 128,
  0b1000: 256,
  0b1001: 512,
  0b1010: 1024,
  0b1011: 2048,
  0b1100: 4096,
  0b1101: 8192
};

export default class VorbisHeader extends CodecHeader {
  static getHeader(data, headerCache) {
    const header = { length: 29 };

    // Must be at least 29 bytes.
    if (data.length < 29) return new VorbisHeader(header, false);

    // Check header cache
    const key = HeaderCache.getKey(data.subarray(0, 29));
    const cachedHeader = headerCache.getHeader(key);
    if (cachedHeader) return new VorbisHeader(cachedHeader, true);

    // Bytes (1-7 of 29): /01vorbis - Magic Signature
    if (
      data[0] !== 0x01 || // identification header packet type
      data[1] !== 0x76 || // v
      data[2] !== 0x6f || // o
      data[3] !== 0x72 || // r
      data[4] !== 0x62 || // b
      data[5] !== 0x69 || // i
      data[6] !== 0x73 //    s
    ) {
      return null;
    }

    const view = new DataView(Uint8Array.of(...data.subarray(0, 29)).buffer);

    // Byte (8-11 of 29)
    // * `CCCCCCCC|CCCCCCCC|CCCCCCCC|CCCCCCCC`: Version number
    header.version = view.getUint32(7, true);
    if (header.version !== 0) return null;

    // Byte (12 of 29)
    // * `DDDDDDDD`: Channel Count
    header.channels = data[11];

    // Byte (13-16 of 29)
    // * `EEEEEEEE|EEEEEEEE|EEEEEEEE|EEEEEEEE`: Sample Rate
    header.sampleRate = view.getUint32(12, true);

    // Byte (17-20 of 29)
    // * `FFFFFFFF|FFFFFFFF|FFFFFFFF|FFFFFFFF`: Bitrate Maximum
    header.bitrateMaximum = view.getInt32(16, true);

    // Byte (21-24 of 29)
    // * `GGGGGGGG|GGGGGGGG|GGGGGGGG|GGGGGGGG`: Bitrate Nominal
    header.bitrateNominal = view.getInt32(20, true);

    // Byte (25-28 of 29)
    // * `HHHHHHHH|HHHHHHHH|HHHHHHHH|HHHHHHHH`: Bitrate Minimum
    header.bitrateMinimum = view.getInt32(24, true);

    // Byte (29 of 29)
    // * `IIII....` Blocksize 1
    // * `....JJJJ` Blocksize 0
    header.blocksize1 = blockSizes[(data[28] & 0b11110000) >> 4];
    header.blocksize0 = blockSizes[data[28] & 0b00001111];

    header.bitDepth = 32;
    header.bytes = data.subarray(0, header.length);

    // set header cache
    const { length, bytes, version, ...codecUpdateFields } = header;

    headerCache.setHeader(key, header, codecUpdateFields);
    return header;
  }

  /**
   * @private
   * Call VorbisHeader.getHeader(Array<Uint8>) to get instance
   */
  constructor(header, isParsed) {
    super(header, isParsed);
    this._version = header.version;
    this._bitrateMaximum = header.bitrateMaximum;
    this._bitrateNominal = header.bitrateNominal;
    this._bitrateMinimum = header.bitrateMinimum;
    this._bitDepth = header.bitDepth;
    this._blocksize0 = header.blocksize0;
    this._blocksize1 = header.blocksize1;
    this._codecPrivate = header.codecPrivate;
  }

  set dataByteLength(dataByteLength) {
    this._dataByteLength = dataByteLength;
  }

  get blocksize0() {
    return this._blocksize0;
  }

  get blocksize1() {
    return this._blocksize1;
  }

  get codecPrivate() {
    return this._codecPrivate;
  }

  get bitrateNominal() {
    return this._bitrateNominal;
  }
}
