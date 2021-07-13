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

import { frameStore } from "../../globals.js";
import Parser from "../Parser.js";
import FLACFrame from "./FLACFrame.js";
import FLACHeader from "./FLACHeader.js";

export default class FLACParser extends Parser {
  constructor(onCodecUpdate) {
    super(onCodecUpdate);
    this.Frame = FLACFrame;
  }

  get codec() {
    return "flac";
  }

  parseFrames(oggPage) {
    if (oggPage.pageSequenceNumber === 0) {
      // Identification header

      this._headerCache.enable();
      this._streamInfo = oggPage.data.subarray(13);

      return { frames: [], remainingData: 0 };
    } else if (oggPage.pageSequenceNumber === 1) {
      // Vorbis comments
    } else {
      oggPage.codecFrames = frameStore
        .get(oggPage)
        .segments.filter((segment) => segment[0] === 0xff) // filter out padding and other metadata frames
        .map(
          (segment) =>
            new FLACFrame(
              segment,
              FLACHeader.getHeader(segment, this._headerCache),
              this._streamInfo
            )
        );
    }

    return {
      frames: [oggPage],
      remainingData: 0,
    };
  }
}
