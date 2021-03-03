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

import CodecParser from "../CodecParser";
import AACFrame from "./AACFrame";

export default class AACParser extends CodecParser {
  constructor(onCodecUpdate) {
    super(onCodecUpdate);
    this.CodecFrame = AACFrame;
    this._maxHeaderLength = 9;
  }

  get codec() {
    return "mp4a.40.2";
  }

  parseFrames(data) {
    return this.fixedLengthFrameSync(data);
  }
}
