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

const getCrcTable = (crcTable, crcInitialValueFunction, crcFunction) => {
  for (let byte = 0; byte < crcTable.length; byte++) {
    let crc = crcInitialValueFunction(byte);

    for (let bit = 8; bit > 0; bit--) {
      crc = crcFunction(crc);
    }

    crcTable[byte] = crc;
  }
  return crcTable;
};

const crc8Table = getCrcTable(
  new Uint8Array(256),
  (b) => b,
  (crc) => (crc & 0x80 ? 0x07 ^ (crc << 1) : crc << 1)
);

const flacCrc16Table = getCrcTable(
  new Uint16Array(256),
  (b) => b << 8,
  (crc) => (crc << 1) ^ (crc & (1 << 15) ? 0x8005 : 0)
);

const crc32Table = getCrcTable(
  new Uint32Array(256),
  (b) => b,
  (crc) => (crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1)
);

const crc8 = (data) => {
  const crc = new Uint8Array(1);

  for (let i = 0; i != data.length; i++)
    crc[0] = crc8Table[(crc[0] ^ data[i]) & 0xff];

  return crc[0];
};

const flacCrc16 = (data) => {
  const crc = new Uint16Array(1);

  for (let i = 0; i != data.length; i++)
    crc[0] = (crc[0] << 8) ^ flacCrc16Table[(crc[0] >> 8) ^ data[i]];

  return crc[0];
};

const crc32 = (data) => {
  const crc = new Uint32Array(1);

  for (let i = 0; i != data.length; i++)
    crc[0] = crc32Table[(crc[0] ^ data[i]) & 0xff] ^ (crc[0] >>> 8);

  return crc[0] ^ -1;
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

export { crc8, flacCrc16, crc32, reverse, logError, concatBuffers, BitReader };
