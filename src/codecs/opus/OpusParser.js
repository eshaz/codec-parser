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

import Parser from "../Parser.js";
import OpusFrame from "./OpusFrame.js";
import OpusHeader from "./OpusHeader.js";

export default class OpusParser extends Parser {
  constructor(onCodecUpdate, onCodec) {
    super(onCodecUpdate);
    this.Frame = OpusFrame;
    this._identificationHeader = null;
    this._maxHeaderLength = 26;
    this._oggPages = [];
  }

  get codec() {
    return "opus";
  }

  parseFrames(oggPage) {
    if (oggPage.pageSequenceNumber === 0) {
      this._headerCache.enable();

      this._identificationHeader = OpusHeader.getHeader(
        oggPage.data,
        this._headerCache
      );
      this._oggPages.push(oggPage);

      return { frames: [], remainingData: 0 };
    }

    if (oggPage.pageSequenceNumber === 1) {
      // OpusTags
      this._oggPages.push(oggPage);

      return { frames: [], remainingData: 0 };
    }

    let oggPages;

    if (this._oggPages.length) {
      oggPages = [...this._oggPages, oggPage];
      this._oggPages = [];
    } else {
      oggPages = [oggPage];
    }

    return {
      frames: oggPage.segments.map(
        (segment) =>
          new OpusFrame(segment, this._identificationHeader, oggPages)
      ),
      remainingData: 0,
    };
  }
}
