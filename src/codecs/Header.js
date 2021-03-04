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

export default class Header {
  /**
   * @private
   */
  constructor(header, isParsed) {
    this._isParsed = isParsed;
    this._channelMode = header.channelMode;
    this._channels = header.channels;
    this._length = header.length;
    this._sampleRate = header.sampleRate;
    this._samples = header.samples;
  }

  /**
   * @returns Boolean that returns true if the header has been completely parsed and there is no remaining data
   */
  get isParsed() {
    return this._isParsed;
  }

  get bitDepth() {
    return this._bitDepth;
  }

  get channels() {
    return this._channels;
  }

  get length() {
    return this._length;
  }

  get sampleRate() {
    return this._sampleRate;
  }

  get samples() {
    return this._samples;
  }
}
