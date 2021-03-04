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

import { headerStore, isParsedStore } from "../globals";

export default class Header {
  /**
   * @private
   */
  constructor(header, isParsed) {
    headerStore.set(this, header);
    isParsedStore.set(this, isParsed);
  }

  get bitDepth() {
    return headerStore.get(this).bitDepth;
  }

  get channels() {
    return headerStore.get(this).channels;
  }

  get channelMode() {
    return headerStore.get(this).channelMode;
  }

  get length() {
    return headerStore.get(this).length;
  }

  get sampleRate() {
    return headerStore.get(this).sampleRate;
  }

  get samples() {
    return headerStore.get(this).samples;
  }
}
