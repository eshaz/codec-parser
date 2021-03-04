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

export default class Frame {
  constructor(header, data) {
    if (header) {
      this._samples = header.samples;
    }

    if (data) {
      this._length = data.length;
    }

    this._header = header;
    this._data = data || [];
  }

  /**
   * @returns Total length of the original codec frame
   */
  get length() {
    return this._length;
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
    return this._samples;
  }

  /**
   * @returns {MPEGHeader} This frame's header
   */
  get header() {
    return this._header;
  }

  /**
   * @returns {MPEGHeader} {Uint8Array} This frame's data
   */
  get data() {
    return this._data;
  }
}
