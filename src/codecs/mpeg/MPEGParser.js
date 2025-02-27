/* Copyright 2020-2023 Ethan Halsall
    
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

import {
  codec,
  mpeg,
  fixedLengthFrameSync,
  parseFrame,
} from "../../constants.js";

import Parser from "../Parser.js";
import MPEGFrame from "./MPEGFrame.js";
import MPEGHeader from "./MPEGHeader.js";

export default class MPEGParser extends Parser {
  constructor(codecParser, headerCache, onCodec) {
    super(codecParser, headerCache);
    this.Frame = MPEGFrame;
    this.Header = MPEGHeader;

    onCodec(this[codec]);
  }

  get [codec]() {
    return mpeg;
  }

  *[parseFrame]() {
    return yield* this[fixedLengthFrameSync]();
  }
}
