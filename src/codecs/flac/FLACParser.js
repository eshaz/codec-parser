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

import { frameStore, headerStore } from "../../globals.js";
import Parser from "../Parser.js";
import FLACFrame from "./FLACFrame.js";
import FLACHeader from "./FLACHeader.js";

const MIN_FLAC_FRAME_SIZE = 2;
const MAX_FLAC_FRAME_SIZE = 512 * 1024;

export default class FLACParser extends Parser {
  constructor(codecParser, onCodecUpdate) {
    super(codecParser, onCodecUpdate);
    this.Frame = FLACFrame;
    this.Header = FLACHeader;
  }

  get codec() {
    return "flac";
  }

  *parseFrame() {
    // find the first valid frame header
    do {
      const header = yield* FLACHeader.getHeader(
        this._codecParser,
        this._headerCache,
        0
      );

      if (header) {
        // found a valid frame header
        // find the next valid frame header
        for (
          let nextHeaderOffset =
            headerStore.get(header).length + MIN_FLAC_FRAME_SIZE;
          nextHeaderOffset <= MAX_FLAC_FRAME_SIZE;
          nextHeaderOffset++
        ) {
          if (
            this._codecParser._flushing ||
            (yield* FLACHeader.getHeader(
              this._codecParser,
              this._headerCache,
              nextHeaderOffset
            ))
          ) {
            // found a valid next frame header
            let frameData = yield* this._codecParser.readRawData(
              nextHeaderOffset
            );

            if (!this._codecParser._flushing)
              frameData = frameData.subarray(0, nextHeaderOffset);

            // check that this is actually the next header by validating the frame footer crc16
            if (FLACFrame.checkFrameFooterCrc16(frameData)) {
              // both frame headers, and frame footer crc16 are valid, we are synced (odds are pretty low of a false positive)
              const frame = new FLACFrame(frameData, header);

              this._headerCache.enable(); // start caching when synced
              this._codecParser.incrementRawData(nextHeaderOffset); // increment to the next frame
              this._codecParser.mapFrameStats(frame);

              return frame;
            }
          }
        }

        this._codecParser.logWarning("Unable to sync FLAC frame.");
      }
      // not synced, increment data to continue syncing
      this._codecParser.incrementRawData(1);
    } while (true);
  }

  parseOggPage(oggPage) {
    if (oggPage.pageSequenceNumber === 0) {
      // Identification header

      this._headerCache.enable();
      this._streamInfo = oggPage.data.subarray(13);
    } else if (oggPage.pageSequenceNumber === 1) {
      // Vorbis comments
    } else {
      oggPage.codecFrames = frameStore
        .get(oggPage)
        .segments.map((segment) => {
          const header = FLACHeader.getHeaderFromUint8Array(
            segment,
            this._headerCache
          );

          if (header) {
            return new FLACFrame(segment, header, this._streamInfo);
          } else {
            this._codecParser.logWarning(
              "Failed to parse Ogg FLAC frame",
              "Skipping invalid FLAC frame"
            );
          }
        })
        .filter((frame) => Boolean(frame));
    }

    return oggPage;
  }
}
