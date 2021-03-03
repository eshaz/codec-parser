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

import HeaderCache from "./HeaderCache";

/**
 * @abstract
 * @description Abstract class containing methods for parsing codec frames
 */
export default class CodecParser {
  constructor(onCodecUpdate) {
    this._headerCache = new HeaderCache(onCodecUpdate);
  }

  syncFrame(data, remainingData = 0) {
    let frame = new this.CodecFrame(
      data.subarray(remainingData),
      this._headerCache
    );

    while (
      !frame.header &&
      remainingData + this._maxHeaderLength < data.length
    ) {
      remainingData += frame.length || 1;
      frame = new this.CodecFrame(
        data.subarray(remainingData),
        this._headerCache
      );
    }

    return { frame, remainingData };
  }

  /**
   * @description Searches without as much sync logic for more resilient framing
   * @param {Uint8Array} data Codec data that should contain a sequence of known length frames.
   * @returns {object} Object containing the actual offset and frame. Frame is undefined if no valid header was found
   */
  fixedLengthFrame(data) {
    return this.fixedLengthFrameSync(data, false);
  }

  /**
   * @description Searches for CodecFrames within bytes containing a sequence of known codec frames.
   * @param {Uint8Array} data Codec data that should contain a sequence of known length frames.
   * @returns {object} Object containing the actual offset and frame. Frame is undefined if no valid header was found
   */
  fixedLengthFrameSync(data, sync = true) {
    // initial sync
    let { frame, remainingData } = this.syncFrame(data);
    let frames = [];

    while (
      frame.header && // was a header found
      frame.header.isParsed && // was there enough data to parse the header
      frame.length + remainingData + this._maxHeaderLength < data.length // is there enough data left to form a frame and check the next frame
    ) {
      // check if there is a valid frame immediately after this frame
      const nextFrame = new this.CodecFrame(
        data.subarray(frame.length + remainingData),
        this._headerCache
      );

      if (nextFrame.header || !sync) {
        // start caching when synced
        this._headerCache.enable();
        // there is a next frame, so the current frame is valid
        frames.push(frame);
        remainingData += frame.length;
        frame = nextFrame;

        if (nextFrame.header && !nextFrame.header.isParsed) break; // out of data
      } else {
        // frame is invalid and must re-sync and clear cache
        this._headerCache.reset();
        remainingData++; // increment to invalidate the invalid frame
        const syncResult = this.syncFrame(data, remainingData);
        remainingData += syncResult.remainingData;
        frame = syncResult.frame;
      }
    }

    return {
      frames,
      remainingData,
    };
  }
}
