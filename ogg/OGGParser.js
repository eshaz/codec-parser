/* Copyright 2020 Ethan Halsall
    
    This file is part of isobmff-audio.
    
    isobmff-audio is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    isobmff-audio is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

import CodecParser from "../CodecParser";
import OGGPage from "./OGGPage";
import FlacParser from "../flac/FlacParser";
import OpusParser from "../opus/OpusParser";

export default class OGGParser extends CodecParser {
  constructor() {
    super();
    this.CodecFrame = OGGPage;
    this._maxHeaderLength = 283;
    this._codec = null;
  }

  get codec() {
    return this._codec || "flac,opus";
  }

  _matchBytes(matchString, bytes) {
    return String.fromCharCode(...bytes).match(matchString);
  }

  setCodec({ data }) {
    if (this._matchBytes(/\x7fFLAC/, data.subarray(0, 5))) {
      this._codec = "flac";
      this._parser = new FlacParser();
    } else if (this._matchBytes(/OpusHead/, data.subarray(0, 8))) {
      this._codec = "opus";
      this._parser = new OpusParser();
    } else if (this._matchBytes(/\x01vorbis/, data.subarray(0, 7))) {
      throw new Error("Vorbis is currently not supported by isobmff-audio");
    }
  }

  parseFrames(data) {
    const oggPages = this.fixedLengthFrame(data);

    if (!this._codec && oggPages.frames.length)
      this.setCodec(oggPages.frames[0]);

    return {
      frames: oggPages.frames.flatMap(
        (oggPage) => this._parser.parseFrames(oggPage).frames
      ),
      remainingData: oggPages.remainingData,
    };
  }
}
