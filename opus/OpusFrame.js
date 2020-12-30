/* Copyright 2020 Ethan Halsall
    
    This file is part of isobmff-audio.
    
    isobmff-audio is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    isobmff-audio is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

import CodecFrame from "../CodecFrame";

//  0 1 2 3 4 5 6 7
// +-+-+-+-+-+-+-+-+
// | config  |s| c |
// +-+-+-+-+-+-+-+-+
const configTable = {
  0b00000000: { mode: "SILK-only", bandwidth: "NB", frameSize: 10 },
  0b00001000: { mode: "SILK-only", bandwidth: "NB", frameSize: 20 },
  0b00010000: { mode: "SILK-only", bandwidth: "NB", frameSize: 40 },
  0b00011000: { mode: "SILK-only", bandwidth: "NB", frameSize: 60 },
  0b00100000: { mode: "SILK-only", bandwidth: "MB", frameSize: 10 },
  0b00101000: { mode: "SILK-only", bandwidth: "MB", frameSize: 20 },
  0b00110000: { mode: "SILK-only", bandwidth: "MB", frameSize: 40 },
  0b00111000: { mode: "SILK-only", bandwidth: "MB", frameSize: 60 },
  0b01000000: { mode: "SILK-only", bandwidth: "WB", frameSize: 10 },
  0b01001000: { mode: "SILK-only", bandwidth: "WB", frameSize: 20 },
  0b01010000: { mode: "SILK-only", bandwidth: "WB", frameSize: 40 },
  0b01011000: { mode: "SILK-only", bandwidth: "WB", frameSize: 60 },
  0b01100000: { mode: "Hybrid", bandwidth: "SWB", frameSize: 10 },
  0b01101000: { mode: "Hybrid", bandwidth: "SWB", frameSize: 20 },
  0b01110000: { mode: "Hybrid", bandwidth: "FB", frameSize: 10 },
  0b01111000: { mode: "Hybrid", bandwidth: "FB", frameSize: 20 },
  0b10000000: { mode: "CELT-only", bandwidth: "NB", frameSize: 2.5 },
  0b10001000: { mode: "CELT-only", bandwidth: "NB", frameSize: 5 },
  0b10010000: { mode: "CELT-only", bandwidth: "NB", frameSize: 10 },
  0b10011000: { mode: "CELT-only", bandwidth: "NB", frameSize: 20 },
  0b10100000: { mode: "CELT-only", bandwidth: "WB", frameSize: 2.5 },
  0b10101000: { mode: "CELT-only", bandwidth: "WB", frameSize: 5 },
  0b10110000: { mode: "CELT-only", bandwidth: "WB", frameSize: 10 },
  0b10111000: { mode: "CELT-only", bandwidth: "WB", frameSize: 20 },
  0b11000000: { mode: "CELT-only", bandwidth: "SWB", frameSize: 2.5 },
  0b11001000: { mode: "CELT-only", bandwidth: "SWB", frameSize: 5 },
  0b11010000: { mode: "CELT-only", bandwidth: "SWB", frameSize: 10 },
  0b11011000: { mode: "CELT-only", bandwidth: "SWB", frameSize: 20 },
  0b11100000: { mode: "CELT-only", bandwidth: "FB", frameSize: 2.5 },
  0b11101000: { mode: "CELT-only", bandwidth: "FB", frameSize: 5 },
  0b11110000: { mode: "CELT-only", bandwidth: "FB", frameSize: 10 },
  0b11111000: { mode: "CELT-only", bandwidth: "FB", frameSize: 20 },
};

export default class OpusFrame extends CodecFrame {
  static getPacket(data) {
    const packet = {
      config: configTable[0b11111000 & data[0]],
      channels: 0b00000100 & data[0] ? 2 : 1,
      // 0: 1 frame in the packet
      // 1: 2 frames in the packet, each with equal compressed size
      // 2: 2 frames in the packet, with different compressed sizes
      // 3: an arbitrary number of frames in the packet
      code: 0b00000011 & data[0],
    };

    // https://tools.ietf.org/html/rfc6716#appendix-B
    switch (packet.code) {
      case 0:
        packet.frameCount = 1;
        return packet;
      case 1:
        packet.frameCount = 2;
        return packet;
      case 2:
        packet.frameCount = 2;
        return packet;
      case 3:
        packet.isVbr = Boolean(0b10000000 & data[1]);
        packet.hasOpusPadding = Boolean(0b01000000 & data[1]);
        packet.frameCount = 0b00111111 & data[1];
        return packet;
    }
  }

  constructor(data, header) {
    super(header, data, data.length);

    const packet = OpusFrame.getPacket(data);

    this._header.sampleLength =
      (packet.config.frameSize / 1000) *
      this._header.sampleRate *
      packet.frameCount;
  }
}
