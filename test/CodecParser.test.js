import { jest } from "@jest/globals";
import fs from "fs/promises";
import path from "path";
import { getBuffArray, writeResults } from "./utils.js";

import CodecParser from "../index.js";

const EXPECTED_PATH = new URL("expected-results", import.meta.url).pathname;
const ACTUAL_PATH = new URL("actual-results", import.meta.url).pathname;
const TEST_DATA_PATH = new URL("test-data", import.meta.url).pathname;

describe("CodecParser", () => {
  const assertFrames = async (actualFileName, expectedFileName) => {
    const [actualFrames, expectedFrames] = await Promise.all([
      fs.readFile(path.join(ACTUAL_PATH, actualFileName)).then(JSON.parse),
      fs.readFile(path.join(EXPECTED_PATH, expectedFileName)).then(JSON.parse),
    ]);

    expect(actualFrames).toEqual(expectedFrames);
  };

  const testParser = (
    fileName,
    mimeType,
    codec,
    codecUpdateCount,
    dataOffset,
  ) => {
    it.concurrent(
      `should parse ${fileName}`,
      async () => {
        const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));

        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator.json`;
        const expectedFileName = `${fileName}_iterator.json`;

        const frames = [];

        for (const frame of codecParser.parseChunk(file)) {
          frames.push(frame);
        }

        // await fs.writeFile("test-output.flac", Buffer.concat(frames.map(frame => frame.data)));
        // cmp test-output.flac test/test-data/flac.flac 0 8430

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      },
      20000,
    );

    it.concurrent(
      `should parse ${fileName} when reading small chunks`,
      async () => {
        const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_chunks.json`;
        const expectedFileName = `${fileName}_iterator.json`;

        let frames = [];
        const chunks = getBuffArray(file, 1000);

        for (const chunk of chunks) {
          frames = [...frames, ...codecParser.parseChunk(chunk)];
        }

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      },
      20000,
    );

    const outputShouldMatchInput = dataOffset !== undefined;
    const flushTestName = outputShouldMatchInput
      ? `should parse ${fileName}, flush any buffered frames, and output should match input`
      : `should parse ${fileName} and flush any buffered frames`;

    it.concurrent(
      flushTestName,
      async () => {
        const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_flush.json`;
        const expectedFileName = `${fileName}_iterator_flush.json`;

        const frames = [];

        for (const frame of codecParser.parseChunk(file)) {
          frames.push(frame);
        }

        for (const frame of codecParser.flush()) {
          frames.push(frame);
        }

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);

        if (outputShouldMatchInput) {
          const data = Buffer.concat(
            frames.map((frame) => frame.rawData || frame.data),
          );

          const fileWithOffset = file.subarray(dataOffset);
          expect(Buffer.compare(fileWithOffset, data)).toEqual(0);
        }
      },
      20000,
    );

    const parseAllTestName = outputShouldMatchInput
      ? `should parse ${fileName} when parseAll() is called, and output should match input`
      : `should parse ${fileName} when parseAll() is called`;

    it.concurrent(
      parseAllTestName,
      async () => {
        const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));

        const onCodec = jest.fn();
        const onCodecHeader = jest.fn();
        const onCodecUpdate = jest.fn();
        const codecParser = new CodecParser(mimeType, {
          onCodec,
          onCodecHeader,
          onCodecUpdate,
        });

        const actualFileName = `${fileName}_iterator_parseAll.json`;
        const expectedFileName = `${fileName}_iterator_flush.json`;

        const frames = codecParser.parseAll(file);

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);

        expect(onCodec).toBeCalledWith(codec);
        expect(onCodecHeader).toBeCalledTimes(1);
        expect(onCodecUpdate).toBeCalledTimes(codecUpdateCount);

        if (outputShouldMatchInput) {
          const data = Buffer.concat(
            frames.map((frame) => frame.rawData || frame.data),
          );

          const fileWithOffset = file.subarray(dataOffset);
          expect(Buffer.compare(fileWithOffset, data)).toEqual(0);
        }
      },
      20000,
    );

    it.concurrent(
      parseAllTestName + ", and instance is reused",
      async () => {
        const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));

        const onCodec = jest.fn();
        const onCodecHeader = jest.fn();
        const onCodecUpdate = jest.fn();
        const codecParser = new CodecParser(mimeType, {
          onCodec,
          onCodecHeader,
          onCodecUpdate,
        });

        const expectedFileName = `${fileName}_iterator_flush.json`;

        const frames = codecParser.parseAll(file);

        const actualFileName1 = `${fileName}_iterator_parseAll_reuse_1.json`;
        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName1);

        assertFrames(actualFileName1, expectedFileName);

        if (outputShouldMatchInput) {
          const data = Buffer.concat(
            frames.map((frame) => frame.rawData || frame.data),
          );

          const fileWithOffset = file.subarray(dataOffset);
          expect(Buffer.compare(fileWithOffset, data)).toEqual(0);
        }

        const frames2 = codecParser.parseAll(file);

        const actualFileName2 = `${fileName}_iterator_parseAll_reuse_2.json`;
        await writeResults(frames2, mimeType, ACTUAL_PATH, actualFileName2);

        assertFrames(actualFileName2, expectedFileName);

        expect(onCodec).toBeCalledWith(codec);
        expect(onCodecHeader).toBeCalledTimes(2);
        expect(onCodecUpdate).toBeCalledTimes(codecUpdateCount * 2);

        if (outputShouldMatchInput) {
          const data = Buffer.concat(
            frames2.map((frame) => frame.rawData || frame.data),
          );

          const fileWithOffset = file.subarray(dataOffset);
          expect(Buffer.compare(fileWithOffset, data)).toEqual(0);
        }
      },
      20000,
    );

    it.concurrent(`should return ${codec} when .codec is called`, async () => {
      const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
      const codecParser = new CodecParser(mimeType);

      [...codecParser.parseChunk(file.subarray(0x0, 0xffff))];

      expect(codecParser.codec).toEqual(codec);
    });
  };

  describe("MP3 CBR", () => {
    testParser("mpeg.cbr.mp3", "audio/mpeg", "mpeg", 573, 45);
  });

  describe("MP3 VBR", () => {
    testParser("mpeg.vbr.mp3", "audio/mpeg", "mpeg", 2213, 45);
  });

  describe("AAC", () => {
    testParser("aac.aac", "audio/aac", "aac", 2200, 0);
    testParser("aac.320", "audio/aac", "aac", 1940);

    it("should return the correct audioSpecificConfig", async () => {
      const file = await fs.readFile(path.join(TEST_DATA_PATH, "aac.aac"));

      const codecParser = new CodecParser("audio/aac");
      const frames = [...codecParser.parseChunk(file.subarray(0, 1000))];

      const audioSpecificConfig = frames[0].header.audioSpecificConfig;

      expect(audioSpecificConfig[0]).toEqual(0b00010010);
      expect(audioSpecificConfig[1]).toEqual(0b00010000);
    });
  });

  describe("Flac", () => {
    testParser("flac.flac", "audio/flac", "flac", 761, 8430);
  });

  describe("Ogg", () => {
    const mimeType = "audio/ogg";

    it.concurrent(
      "should return empty string when .codec is called before parsing",
      () => {
        const codecParser = new CodecParser("application/ogg");

        expect(codecParser.codec).toEqual("");
      },
    );

    describe("Ogg page parsing", () => {
      it.concurrent(
        "should invalidate ogg page when it does not start with 'OggS'",
        async () => {
          const fileName = "ogg.opus";
          const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
          const codecParser = new CodecParser(mimeType);

          file.set([0, 0, 0, 0], 0x0);
          const frames = [...codecParser.parseAll(file.subarray(0x0, 46))];

          expect(frames).toEqual([]);
        },
      );

      it.concurrent(
        "should invalidate ogg page when the last five bits of the 6th byte of the page is not zero",
        async () => {
          const fileName = "ogg.opus";
          const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
          const codecParser = new CodecParser(mimeType);

          file.set([0b00001000], 0x5);
          const frames = [...codecParser.parseAll(file.subarray(0x0, 46))];

          expect(frames).toEqual([]);
        },
      );
    });

    describe("Ogg Flac", () => {
      testParser("ogg.flac", mimeType, "flac", 743, 0);
      testParser("ogg.flac.samplerate_50000", mimeType, "flac", 218, 0);
      testParser("ogg.flac.samplerate_12345", mimeType, "flac", 179, 0);
      testParser("ogg.flac.blocksize_65535", mimeType, "flac", 14, 0);
      testParser("ogg.flac.blocksize_64", mimeType, "flac", 13138, 0);
      testParser("ogg.flac.blocksize_variable_1", mimeType, "flac", 447, 0);
      testParser("ogg.flac.blocksize_variable_2", mimeType, "flac", 479, 0);
      testParser("ogg.flac.utf8_frame_number", mimeType, "flac", 108, 0);
    });

    describe("Ogg Opus", () => {
      testParser("ogg.opus", mimeType, "opus", 1749, 0);
      testParser("ogg.opus.framesize_40", mimeType, "opus", 346, 0);
      testParser("ogg.opus.framesize_60", mimeType, "opus", 251, 0);
      testParser("ogg.opus.surround", mimeType, "opus", 737, 0);
      testParser("ogg.opus.channel_family_255", mimeType, "opus", 284, 0);
      testParser("ogg.opus.last_page_trimming", mimeType, "opus", 51, 0);
    });

    describe("Ogg Vorbis", () => {
      testParser("ogg.vorbis", mimeType, "vorbis", 2462, 0);
      testParser("ogg.vorbis.extra_metadata", mimeType, "vorbis", 1657);
      testParser("ogg.vorbis.fishead", mimeType, "vorbis", 1375);
      testParser("ogg.vorbis.continued", mimeType, "vorbis", 1159);
      testParser(
        "ogg.vorbis.setup_packets_separate_pages",
        mimeType,
        "vorbis",
        119,
      );
      testParser("metronome2.vorbis", mimeType, "vorbis", 3);
    });
  });

  describe("Unsupported Codecs", () => {
    it("should throw an error when an unsupported mimetype is passed in", () => {
      let error;

      try {
        new CodecParser("audio/wma");
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
  });

  describe("Synchronization", () => {
    const mimeType = "audio/mpeg";
    const fileName = "mpeg.cbr.16k.mp3";
    let file;

    beforeAll(async () => {
      file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
    });

    it("should sync when incoming data starts at a valid frame", async () => {
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_sync_1.json`;
      const expectedFileName = `${fileName}_iterator_sync_1.json`;

      // [--0x90 bytes--|--0x510 bytes--]
      // [-- frame 0 ---|-- frame 1-9 --]
      // [0x50---------------------0x5f0]
      const frames = [...codecParser.parseChunk(file.subarray(0x50, 0x5f0))];

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    });

    it("should sync when the next frame header is detected after the current frame", async () => {
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_sync_2.json`;
      const expectedFileName = `${fileName}_iterator_sync_2.json`;

      // [--0x90 bytes--|------0x04 bytes------]
      // [-- frame 0 ---|-- frame 1 (header) --]
      // [0x50-----------------------------0xe5]
      const frames = [...codecParser.parseChunk(file.subarray(0x50, 0xe5))];

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    });

    it("should only output the synced frame even if the entire next frame is found", async () => {
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_sync_3.json`;
      const expectedFileName = `${fileName}_iterator_sync_3.json`;

      // [--0x90 bytes--|-----0x04 bytes------]
      // [-- frame 0 ---|--frame 1 (header) --]
      // [0x50----------------------------0xe5]
      const frame1 = file.subarray(0x50, 0xe0);
      const frame2 = file.subarray(0xe0, 0x170);
      const frames = [
        ...codecParser.parseChunk(Buffer.concat([frame1, frame2])),
      ];

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    });

    it("should sync accross multiple iterations while the header is still being parsed", async () => {
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_sync_4.json`;
      const expectedFileName = `${fileName}_iterator_sync_4.json`;

      // [--0x90 bytes--|------0x01 bytes------]
      // [-- frame 0 ---|-- frame 1 (header) --]
      // [0x50-----------------------------0xe1]
      let frames = [...codecParser.parseChunk(file.subarray(0x50, 0xe1))];

      // [-----0x02 bytes-------]
      // [-- frame 1 (header) --]
      // [0xe1--------------0xe3]
      frames = [
        ...frames,
        ...codecParser.parseChunk(file.subarray(0xe1, 0xe3)),
      ];

      // [------------0x02 bytes-----------]
      // [-- frame 1 (header), frame 1-9 --]
      // [0xe3-------------------------0xe3]
      frames = [
        ...frames,
        ...codecParser.parseChunk(file.subarray(0xe3, 0x5f0)),
      ];

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    });

    describe("invalid data", () => {
      it("should sync when invalid data is found at the beginning", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_invalid_data_1.json`;
        const expectedFileName = `${fileName}_iterator_sync_invalid_data_1.json`;

        // [--0x50 bytes--|--0x90 bytes--|--0x510 bytes--]
        // [-invalid data-|-- frame 0 ---|-- frame 1-9 --]
        // [0x0-------------------------------------0x5f0]
        const frames = [...codecParser.parseChunk(file.subarray(0, 0x5f0))];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });

      it("should sync when invalid data is found inside the stream", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_invalid_data_2.json`;
        const expectedFileName = `${fileName}_iterator_sync_invalid_data_2.json`;

        // [--0x5A0 bytes--|--0x50 bytes--|--0x5A0 bytes--]
        // [-- frame 0-9 --|-invalid data-|-- frame 0-9 --]
        // [0x50------0x5f0|0x00---------------------0x5f0]
        const invalidData = file.subarray(0x00, 0x50);
        const validFrames = file.subarray(0x50, 0x5f0);
        const frames = [
          ...codecParser.parseChunk(
            Buffer.concat([validFrames, invalidData, validFrames]),
          ),
        ];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });
    });

    describe("false positives", () => {
      it("should sync when a false positive frame is found at the beginning", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_false_pos_1.json`;
        const expectedFileName = `${fileName}_iterator_sync_false_pos_1.json`;

        // [------0x8f bytes-------|--0x510 bytes--]
        // [-- frame 0 (-1 byte) --|-- frame 0-9 --]
        // [0x50---------------0xdf|0xe0------0x5f0]
        const falsePositiveFrame = file.subarray(0x50, 0xdf);
        const validFrames = file.subarray(0xe0, 0x5f0);
        const frames = [
          ...codecParser.parseChunk(
            Buffer.concat([falsePositiveFrame, validFrames]),
          ),
        ];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });

      it("should sync when multiple false positive frames are found at the beginning", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_false_pos_2.json`;
        const expectedFileName = `${fileName}_iterator_sync_false_pos_2.json`;

        // [-----------0x8d bytes-----------|--0x510 bytes--]
        // [----- false positive data ------|-- 9 frames ---]
        // [0x50--0x54|0x50--0xa2|0x50--0x88|0xe0------0x5f0]
        const falsePositiveFrame1 = file.subarray(0x50, 0x54);
        const falsePositiveFrame2 = file.subarray(0x50, 0xa2);
        const falsePositiveFrame3 = file.subarray(0x50, 0x88);
        const validFrames = file.subarray(0xe0, 0x5f0);
        const frames = [
          ...codecParser.parseChunk(
            Buffer.concat([
              falsePositiveFrame1,
              falsePositiveFrame2,
              falsePositiveFrame3,
              validFrames,
            ]),
          ),
        ];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });

      it("should sync when false positive frames are found inside the stream", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_false_pos_3.json`;
        const expectedFileName = `${fileName}_iterator_sync_false_pos_3.json`;

        // |--0x510 bytes--|-------0x04 bytes------|--0x510 bytes--]
        // |-- 9 frames ---|--false positive data--|-- 9 frames ---]
        // |0xe0------0x5f0|0x50---------------0x54|0xe0------0x5f0]
        const validFrames = file.subarray(0xe0, 0x5f0);
        const falsePositiveFrame1 = file.subarray(0x50, 0x54);
        const frames = [
          ...codecParser.parseChunk(
            Buffer.concat([validFrames, falsePositiveFrame1, validFrames]),
          ),
        ];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });

      it("should sync when multiple false positive frames are found inside the stream", async () => {
        const codecParser = new CodecParser(mimeType);

        const actualFileName = `${fileName}_iterator_sync_false_pos_4.json`;
        const expectedFileName = `${fileName}_iterator_sync_false_pos_4.json`;

        // |--0x510 bytes--|-------0x04 bytes------|--0x510 bytes--|-------0x52 bytes------|--0x510 bytes--]
        // |-- 9 frames ---|--false positive data--|-- 9 frames ---|--false positive data--|-- 9 frames ---]
        // |0xe0------0x5f0|0x50---------------0x54|0xe0------0x5f0|0x50---------------0xa2|0xe0------0x5f0]
        const validFrames = file.subarray(0xe0, 0x5f0);
        const falsePositiveFrame1 = file.subarray(0x50, 0x54);
        const falsePositiveFrame2 = file.subarray(0x50, 0xa2);
        const frames = [
          ...codecParser.parseChunk(
            Buffer.concat([
              validFrames,
              falsePositiveFrame1,
              validFrames,
              falsePositiveFrame2,
              validFrames,
            ]),
          ),
        ];

        await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

        assertFrames(actualFileName, expectedFileName);
      });
    });
  });
});
