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

export default class HeaderCache {
  constructor(onCodecUpdate) {
    this._onCodecUpdate = onCodecUpdate;
    this.reset();
  }

  enable() {
    this._isEnabled = true;
  }

  reset() {
    this._headerCache = new Map();
    this._codecUpdateData = new WeakMap();
    this._codecShouldUpdate = false;
    this._bitrate = null;
    this._isEnabled = false;
  }

  checkCodecUpdate(bitrate, totalDuration) {
    if (this._onCodecUpdate) {
      if (this._bitrate !== bitrate) {
        this._bitrate = bitrate;
        this._codecShouldUpdate = true;
      }

      if (this._codecShouldUpdate) {
        this._onCodecUpdate(
          {
            bitrate,
            ...this._codecUpdateData.get(
              this._headerCache.get(this._currentHeader)
            ),
          },
          totalDuration
        );
      }

      this._codecShouldUpdate = false;
    }
  }

  updateCurrentHeader(key) {
    if (this._onCodecUpdate && key !== this._currentHeader) {
      this._codecShouldUpdate = true;
      this._currentHeader = key;
    }
  }

  getHeader(key) {
    const header = this._headerCache.get(key);

    if (header) {
      this.updateCurrentHeader(key);
    }

    return header;
  }

  setHeader(key, header, codecUpdateFields) {
    if (this._isEnabled) {
      this.updateCurrentHeader(key);

      this._headerCache.set(key, header);
      this._codecUpdateData.set(header, codecUpdateFields);
    }
  }
}
