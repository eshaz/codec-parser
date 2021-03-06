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

import { frameStore } from "../globals";

export default class Frame {
  constructor(header, data, samples) {
    this.data = data || [];
    this.header = header;
    this.samples = samples;
    this.duration =
      header && samples && (this.samples / this.header.sampleRate) * 1000;
    this.frameNumber = undefined;
    this.totalBytesOut = undefined;
    this.totalSamples = undefined;
    this.totalDuration = undefined;

    frameStore.set(this, { length: this.data.length });
  }
}
