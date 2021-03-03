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

export default class CodecFrame {
  constructor(header, data) {
    this._header = header;
    this._data = data || [];
  }
  /**
   * @returns Total length of frame (header + data)
   */
  get length() {
    return this._header ? this._header.dataByteLength : 0;
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
