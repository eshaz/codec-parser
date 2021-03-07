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

import { concatBuffers } from "./utilities";
import MPEGParser from "./codecs/mpeg/MPEGParser";
import AACParser from "./codecs/aac/AACParser";
import OggParser from "./codecs/ogg/OggParser";

const noOp = () => {};

export default class CodecParser {
  constructor(mimeType, { onCodecUpdate, onCodec }) {
    this._inputMimeType = mimeType;
    this._onCodecUpdate = onCodecUpdate || noOp;
    this._onCodec = onCodec || noOp;

    if (this._inputMimeType.match(/aac/)) {
      this._codecParser = new AACParser(this._onCodecUpdate, this._onCodec);
    } else if (this._inputMimeType.match(/mpeg/)) {
      this._codecParser = new MPEGParser(this._onCodecUpdate, this._onCodec);
    } else if (this._inputMimeType.match(/ogg/)) {
      this._codecParser = new OggParser(this._onCodecUpdate, this._onCodec);
    } else {
      throw new Error(`Unsupported Codec ${mimeType}`);
    }

    this._frameNumber = 0;
    this._totalBytesOut = 0;
    this._totalSamples = 0;

    this._frames = [];
    this._codecData = new Uint8Array(0);

    this._generator = this._generator();
    this._generator.next();
  }

  /**
   * @public
   * @returns The detected codec
   */
  get codec() {
    return this._codecParser.codec;
  }

  /**
   * @public
   * @description Returns an iterator for the passed in codec data.
   * @param {Uint8Array} chunk Next chunk of codec data to read
   * @returns {IterableIterator} Iterator that operates over the codec data.
   * @yields {Uint8Array} Codec Frames
   */
  *iterator(chunk) {
    for (
      let i = this._generator.next(chunk);
      i.value;
      i = this._generator.next()
    ) {
      yield i.value;
    }
  }

  *_generator() {
    let frames = [];
    // start parsing out frames
    while (true) {
      yield* this._sendReceiveData(frames);
      frames = this._parseFrames();
    }
  }

  /**
   * @private
   */
  *_sendReceiveData(frames) {
    for (const frame of frames) {
      yield frame;
    }

    let codecData;

    do {
      codecData = yield;
    } while (!codecData);

    this._codecData = concatBuffers(this._codecData, codecData);
  }

  /**
   * @private
   */
  _parseFrames() {
    const { frames, remainingData } = this._codecParser.parseFrames(
      this._codecData
    );

    this._codecData = this._codecData.subarray(remainingData);

    return frames.map((frame) => {
      frame.frameNumber = this._frameNumber++;
      frame.totalBytesOut = this._totalBytesOut;
      frame.totalSamples = this._totalSamples;
      frame.totalDuration =
        (this._totalSamples / frame.header.sampleRate) * 1000;

      this._totalBytesOut += frame.data.length;
      this._totalSamples += frame.samples;

      return frame;
    });
  }
}
