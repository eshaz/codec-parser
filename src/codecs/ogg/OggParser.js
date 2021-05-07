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
import OggPage from "./OggPage.js";

import FLACParser from "../flac/FLACParser.js";
import OpusParser from "../opus/OpusParser.js";
import VorbisParser from "../vorbis/VorbisParser.js";

export default class OggParser extends Parser {
  constructor(onCodecUpdate, onCodec) {
    super();
    this._onCodecUpdate = onCodecUpdate;
    this._onCodec = onCodec;
    this.Frame = OggPage;
    this._maxHeaderLength = 283;
    this._codec = null;
  }

  get codec() {
    return this._codec || "";
  }

  _updateCodec(codec, parser) {
    if (this._codec !== codec) {
      this._parser = new parser(this._onCodecUpdate);
      this._codec = codec;
      this._onCodec(codec);
    }
  }

  checkForIdentifier({ data }) {
    const idString = String.fromCharCode(...data.subarray(0, 8));

    switch (idString) {
      case "fishead\0":
        return false; // ignore ogg skeleton packets
      case "fisbone\0":
        return false; // ignore ogg skeleton packets
      case "OpusHead":
        this._updateCodec("opus", OpusParser);
        return true;
      case /^\x7fFLAC/.test(idString) && idString:
        this._updateCodec("flac", FLACParser);
        return true;
      case /^\x01vorbis/.test(idString) && idString:
        this._updateCodec("vorbis", VorbisParser);
        return true;
      default:
        return true;
    }
  }

  parseFrames(data) {
    const oggPages = this.fixedLengthFrame(data);

    return {
      frames: oggPages.frames
        .filter((frame) => this.checkForIdentifier(frame) && this._codec)
        .flatMap((oggPage) => this._parser.parseFrames(oggPage).frames),
      remainingData: oggPages.remainingData,
    };
  }
}
