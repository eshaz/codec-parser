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

import { isParsedStore, frameStore } from "../globals.js";
import HeaderCache from "./HeaderCache.js";

/**
 * @abstract
 * @description Abstract class containing methods for parsing codec frames
 */
export default class Parser {
  constructor(codecParser, onCodecUpdate) {
    this._codecParser = codecParser;
    this._headerCache = new HeaderCache(onCodecUpdate);
  }

  *syncFrame() {
    let frame;

    do {
      frame = yield* this.Frame.getFrame(
        this._codecParser,
        this._headerCache,
        0
      );
      if (!frame) yield* this._codecParser.incrementAndReadData(1); // increment to invalidate the invalid frame
    } while (!frame);

    return frame;
  }

  /**
   * @description Searches for Frames within bytes containing a sequence of known codec frames.
   * @param {Uint8Array} data Codec data that should contain a sequence of known length frames.
   * @returns {object} Object containing the actual offset and frame. Frame is undefined if no valid header was found
   */
  *fixedLengthFrameSync(keepUnsyncedFrames) {
    const frame = yield* this.syncFrame();
    const frameLength = frameStore.get(frame).length;
    const nextFrame = yield* this.Frame.getFrame(
      this._codecParser,
      this._headerCache,
      frameLength
    );

    // check if there is a valid frame immediately after this frame
    if (nextFrame) {
      this._headerCache.enable(); // start caching when synced

      yield* this._codecParser.incrementAndReadData(frameLength); // increment to invalidate the invalid frame
      this._codecParser.mapFrameStats(frame);
      yield frame;
    } else {
      this._headerCache.reset(); // frame is invalid and must re-sync and clear cache

      yield* this._codecParser.incrementAndReadData(1); // increment to invalidate the invalid frame

      if (keepUnsyncedFrames) {
        this._codecParser.mapFrameStats(frame);
        yield frame;
      }
    }
  }
}
