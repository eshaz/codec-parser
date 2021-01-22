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
import FlacFrame from "./FlacFrame";
import FlacHeader from "./FlacHeader";

export default class FlacParser extends CodecParser {
  constructor(onCodecUpdate) {
    super(onCodecUpdate);
    this.CodecFrame = FlacFrame;
  }

  get codec() {
    return "flac";
  }

  parseFrames(oggPage) {
    if (this._initialHeader) {
      return {
        frames: oggPage.segments
          .filter(
            (segment) =>
              segment[0] === 0xff &&
              (segment[1] === 0xf8 || segment[1] === 0xf9)
          )
          .map((segment) => new FlacFrame(segment, this._initialHeader)),
        remainingData: 0,
      };
    }

    this._initialHeader = FlacHeader.getHeader(oggPage.data, this._headerCache);
    return { frames: [], remainingData: 0 };
  }
}
