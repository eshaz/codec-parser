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

import Parser from "../Parser";
import FlacFrame from "./FlacFrame";
import FlacHeader from "./FlacHeader";

export default class FlacParser extends Parser {
  constructor(onCodecUpdate) {
    super(onCodecUpdate);
    this.Frame = FlacFrame;
  }

  get codec() {
    return "flac";
  }

  parseFrames(oggPage) {
    if (oggPage.header.pageSequenceNumber === 0) {
      // Identification header
      return { frames: [], remainingData: 0 };
    }

    if (oggPage.header.pageSequenceNumber === 1) {
      // Vorbis comments
      return { frames: [], remainingData: 0 };
    }

    return {
      frames: oggPage.segments.map(
        (segment) =>
          new FlacFrame(
            segment,
            FlacHeader.getHeader(segment, this._headerCache)
          )
      ),
      remainingData: 0,
    };
  }
}
