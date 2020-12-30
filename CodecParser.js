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

/**
 * @abstract
 * @description Abstract class containing methods for parsing codec frames
 */
export default class CodecParser {
  syncFrame(data, remainingData = 0) {
    let frame = new this.CodecFrame(data.subarray(remainingData));

    while (
      !frame.header &&
      remainingData + this._maxHeaderLength < data.length
    ) {
      remainingData += frame.length || 1;
      frame = new this.CodecFrame(data.subarray(remainingData));
    }

    return { frame, remainingData };
  }

  /**
   * @description Searches for CodecFrames within bytes containing a sequence of known codec frames.
   * @param {Uint8Array} data Codec data that should contain a sequence of known length frames.
   * @returns {object} Object containing the actual offset and frame. Frame is undefined if no valid header was found
   */
  fixedLengthFrame(data) {
    // initial sync
    let { frame, remainingData } = this.syncFrame(data);
    let frames = [];

    // find a header in the data
    while (
      frame.header &&
      frame.length + remainingData + this._maxHeaderLength < data.length
    ) {
      // check if there is a valid frame immediately after this frame
      const nextFrame = new this.CodecFrame(
        data.subarray(frame.length + remainingData)
      );

      if (nextFrame.header) {
        // there is a next frame, so the current frame is valid
        frames.push(frame);
        remainingData += frame.length;
        frame = nextFrame;
      } else {
        // frame is invalid and must re-sync
        remainingData++;
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
