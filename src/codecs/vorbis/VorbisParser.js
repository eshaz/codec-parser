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

import CodecParser from "../CodecParser";
import VorbisFrame from "./VorbisFrame";
import VorbisHeader from "./VorbisHeader";
import { BitReader, reverse, logError } from "../../utilities";

export default class VorbisParser extends CodecParser {
  constructor(onCodecUpdate) {
    super(onCodecUpdate);
    this.CodecFrame = VorbisFrame;
    this._maxHeaderLength = 29;

    this._vorbisHead = null;

    this._codecPrivate = {
      lacing: [],
      vorbisHead: null,
      vorbisSetup: null,
    };

    this._mode = {
      count: 0,
    };
    this._prevBlockSize = 0;
    this._currBlockSize = 0;
  }

  get codec() {
    return "vorbis";
  }

  parseFrames(oggPage) {
    if (oggPage.header.pageSequenceNumber === 0) {
      this._vorbisHead = VorbisHeader.getHeader(
        oggPage.data,
        this._headerCache
      );
      // gather WEBM CodecPrivate data
      this._codecPrivate.vorbisHead = oggPage.segments[0];
      this._codecPrivate.lacing = this._codecPrivate.lacing.concat(
        ...oggPage.header.pageSegmentBytes
      );

      return { frames: [], remainingData: 0 };
    }

    if (oggPage.header.pageSequenceNumber === 1) {
      // gather WEBM CodecPrivate data
      this._codecPrivate.vorbisSetup = oggPage.data;
      for (const lace of oggPage.header.pageSegmentBytes) {
        this._codecPrivate.lacing.push(lace);
        if (lace !== 0xff) break;
      }

      this._vorbisHead.codecPrivate = this._codecPrivate;
      this._mode = this._parseSetupHeader(oggPage.segments[1]);

      return { frames: [], remainingData: 0 };
    }

    return {
      frames: oggPage.segments.map(
        (segment) =>
          new VorbisFrame(
            segment,
            new VorbisHeader(this._vorbisHead, true),
            this._getSamplesPerFrame(segment)
          )
      ),
      remainingData: 0,
    };
  }

  _getSamplesPerFrame(segment) {
    const byte = segment[0] >> 1;

    const blockFlag = this._mode[byte & this._mode.mask];

    // is this a large window
    if (blockFlag) {
      this._prevBlockSize =
        byte & this._mode.prevMask
          ? this._vorbisHead.blocksize1
          : this._vorbisHead.blocksize0;
    }

    this._currBlockSize = blockFlag
      ? this._vorbisHead.blocksize1
      : this._vorbisHead.blocksize0;

    const samples = (this._prevBlockSize + this._currBlockSize) >> 2;
    this._prevBlockSize = this._currBlockSize;

    return samples;
  }

  // https://gitlab.xiph.org/xiph/liboggz/-/blob/master/src/liboggz/oggz_auto.c
  // https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/vorbis_parser.c
  /*
   * This is the format of the mode data at the end of the packet for all
   * Vorbis Version 1 :
   *
   * [ 6:number_of_modes ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:size | 16:window_type(0) | 16:transform_type(0) | 8:mapping ]
   * [ 1:framing(1) ]
   *
   * e.g.:
   *
   * MsB         LsB
   *              <-
   * 0 0 0 0 0 1 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1 0 0 0 0 0
   * 0 0 1|0 0 0 0 0
   * 0 0 0 0|0|0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 0 0|0 0 0 0
   * 0 0 0|1|0 0 0 0 |
   * 0 0 0 0 0 0 0 0 V
   * 0 0 0|0 0 0 0 0
   * 0 0 0 0 0 0 0 0
   * 0 0 1|0 0 0 0 0
   *
   * The simplest way to approach this is to start at the end
   * and read backwards to determine the mode configuration.
   *
   * liboggz and ffmpeg both use this method.
   */
  _parseSetupHeader(setup) {
    const bitReader = new BitReader(setup);

    let mode = {
      count: 0,
    };

    // sync with the framing bit
    while ((bitReader.read(1) & 0x01) !== 1) {}

    let modeBits;
    // search in reverse to parse out the mode entries
    // limit mode count to 63 so previous block flag will be in first packet byte
    while (mode.count < 64 && bitReader.position > 0) {
      const mapping = reverse(bitReader.read(8));
      if (mapping in mode) {
        logError(
          "received duplicate mode mapping, failed to parse vorbis modes"
        );
        throw new Error("Failed to read Vorbis stream");
      }

      // 16 bits transform type, 16 bits window type, all values must be zero
      let i = 0;
      while (bitReader.read(8) === 0x00 && i++ < 3) {} // a non-zero value may indicate the end of the mode entries, or a read error

      if (i === 4) {
        // transform type and window type were all zeros
        modeBits = bitReader.read(7); // modeBits may need to be used in the next iteration if this is the last mode entry
        mode[mapping] = modeBits & 0x01; // read and store mode -> block flag mapping
        bitReader.position += 6; // go back 6 bits so next iteration starts right after the block flag
        mode.count++;
      } else {
        // transform type and window type were not all zeros
        // check for mode count using previous iteration modeBits
        if (((reverse(modeBits) & 0b01111110) >> 1) + 1 !== mode.count) {
          logError(
            "mode count did not match actual modes, failed to parse vorbis modes"
          );
          throw new Error("Failed to read Vorbis stream");
        }

        break;
      }
    }

    // mode mask to read the mode from the first byte in the vorbis frame
    mode.mask = (1 << Math.log2(mode.count)) - 1;
    // previous window flag is the next bit after the mode mask
    mode.prevMask = (mode.mask | 0x1) + 1;

    return mode;
  }
}
