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

import { frameStore, headerStore } from "../globals";

export default class Frame {
  constructor(header, data) {
    frameStore.set(this, {
      header,
      samples: header && headerStore.get(header).samples,
      data: data || [],
      length: data && data.length,
    });
  }

  /**
   * @returns {MPEGHeader} {Uint8Array} This frame's data
   */
  get data() {
    return frameStore.get(this).data;
  }

  /**
   * @returns {MPEGHeader} This frame's header
   */
  get header() {
    return frameStore.get(this).header;
  }

  /**
   * @returns Total length of the original codec frame
   */
  get length() {
    return frameStore.get(this).length;
  }

  /**
   * @returns Total duration in milliseconds of the frame
   */
  get duration() {
    return (this.samples / this.header.sampleRate) * 1000;
  }

  /**
   * @returns Total audio samples contained in the frame
   */
  get samples() {
    return frameStore.get(this).samples;
  }

  get frameNumber() {
    return frameStore.get(this).frameNumber;
  }

  get totalBytesOut() {
    return frameStore.get(this).totalBytesOut;
  }

  get totalSamples() {
    return frameStore.get(this).totalSamples;
  }

  get totalDuration() {
    return frameStore.get(this).totalDuration;
  }
}
