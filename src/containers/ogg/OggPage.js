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

import { headerStore, frameStore, isParsedStore } from "../../globals.js";
import Frame from "../Frame.js";
import OggPageHeader from "./OggPageHeader.js";

export default class OggPage extends Frame {
  constructor(data) {
    const oggPage = OggPageHeader.getHeader(data);
    const pageStore = headerStore.get(oggPage);

    super(
      oggPage,
      oggPage
        ? data.subarray(
            pageStore.length,
            pageStore.length + pageStore.frameLength
          )
        : []
    );

    if (isParsedStore.get(oggPage)) {
      const length = pageStore.length + pageStore.frameLength;

      let offset = pageStore.length;

      this.segments = oggPage.pageSegmentTable.map((segmentLength) => {
        const segment = data.subarray(offset, offset + segmentLength);
        offset += segmentLength;
        return segment;
      });
      this.rawData = data.subarray(0, length);

      Object.assign(this, oggPage);

      frameStore.get(this).length = length;
    }
  }
}
