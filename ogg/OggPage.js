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

import CodecFrame from "../CodecFrame";
import OggPageHeader from "./OggPageHeader";

export default class OggPage extends CodecFrame {
  constructor(data) {
    const oggPage = OggPageHeader.getHeader(data);

    super(
      oggPage,
      oggPage &&
        data.subarray(oggPage.length, oggPage.length + oggPage.dataByteLength)
    );

    if (oggPage && oggPage.isParsed) {
      let offset = oggPage.length;
      this._segments = oggPage.pageSegmentTable.map((segmentLength) => {
        const segment = data.subarray(offset, offset + segmentLength);
        offset += segmentLength;
        return segment;
      });
    }
  }

  /**
   * @returns Total length of frame (header + data)
   */
  get length() {
    return this._header ? this._header.length + this._header.dataByteLength : 0;
  }

  get segments() {
    return this._segments;
  }
}
