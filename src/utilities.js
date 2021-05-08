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

const logError = (...messages) => {
  console.error(
    "codec-parser",
    messages.reduce((acc, message) => acc + "\n  " + message, "")
  );
};

const getCrcTable = (crcFunction) => {
  let crcTable = [];
  for (let byte = 0; byte < 256; byte++) {
    let crc = byte;

    for (let bit = 8; bit > 0; bit--) {
      crc = crcFunction(crc);
    }

    crcTable[byte] = crc;
  }
  return crcTable;
};

const crc8Table = getCrcTable((crc) =>
  crc & 0x80 ? 0x07 ^ (crc << 1) : crc << 1
);
const crc32Table = getCrcTable((crc) =>
  crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
);

const crc8 = (buf) => {
  let crc;

  for (const byte of buf) {
    crc = crc8Table[(crc ^ byte) & 0xff] & 0xff;
  }

  return crc;
};

const crc32 = (buf) => {
  let crc;

  for (const byte of buf) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return crc ^ -1;
};

const concatBuffers = (...buffers) => {
  const buffer = new Uint8Array(
    buffers.reduce((acc, buf) => acc + buf.length, 0)
  );

  buffers.reduce((offset, buf) => {
    buffer.set(buf, offset);
    return offset + buf.length;
  }, 0);

  return buffer;
};

// prettier-ignore
const reverseTable = [0x0,0x8,0x4,0xc,0x2,0xa,0x6,0xe,0x1,0x9,0x5,0xd,0x3,0xb,0x7,0xf];
const reverse = (val) =>
  (reverseTable[val & 0b1111] << 4) | reverseTable[val >> 4];

class BitReader {
  constructor(data) {
    this._data = data;
    this._pos = data.length * 8;
  }

  set position(position) {
    this._pos = position;
  }

  get position() {
    return this._pos;
  }

  read(bits) {
    const byte = Math.floor(this._pos / 8);
    const bit = this._pos % 8;
    this._pos -= bits;

    const window =
      (reverse(this._data[byte - 1]) << 8) + reverse(this._data[byte]);

    return (window >> (7 - bit)) & 0xff;
  }
}

export { crc8, crc32, reverse, logError, concatBuffers, BitReader };
