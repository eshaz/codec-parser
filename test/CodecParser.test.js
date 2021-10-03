import fs from "fs/promises";
import path from "path";
import { getBuffArray, writeResults } from "./utils.js";

import CodecParser from "../index.js";

const EXPECTED_PATH = new URL("expected-results", import.meta.url).pathname;
const ACTUAL_PATH = new URL("actual-results", import.meta.url).pathname;
const TEST_DATA_PATH = new URL("test-data", import.meta.url).pathname;

const generateTestData = async () => {
  const files = await fs.readdir(TEST_DATA_PATH);

  await Promise.all(
    files.map(async (testFileName) => {
      const testFile = await fs.readFile(
        path.join(TEST_DATA_PATH, testFileName)
      );
      const mimeType = "audio/" + testFileName.split(".")[0];

      const codecParser = new CodecParser(mimeType);
      const frames = [...codecParser.iterator(testFile)];

      await writeResults(
        frames,
        mimeType,
        EXPECTED_PATH,
        `${fileName}_iterator.json`
      );
    })
  );
};

describe("Given the CodecParser", () => {
  const assertFrames = async (actualFileName, expectedFileName) => {
    const [actualFrames, expectedFrames] = await Promise.all([
      fs.readFile(path.join(ACTUAL_PATH, actualFileName)).then(JSON.parse),
      fs.readFile(path.join(EXPECTED_PATH, expectedFileName)).then(JSON.parse)
    ]);

    expect(actualFrames).toEqual(expectedFrames);
  };

  const testParser = (fileName, mimeType) => {
    it.concurrent(`should parse ${fileName}`, async () => {
      const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator.json`;
      const expectedFileName = `${fileName}_iterator.json`;

      const frames = [...codecParser.iterator(file)];

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    }, 20000);

    it.concurrent(`should parse ${fileName} when reading small chunks`, async () => {
      const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_chunks.json`;
      const expectedFileName = `${fileName}_iterator.json`;

      let frames = [];
      const chunks = getBuffArray(file, 100);

      for (const chunk of chunks) {
        frames = [...frames, ...codecParser.iterator(chunk)];
      }

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    }, 20000);

    /*it.concurrent(`should parse ${fileName} when reading one byte at a time`, async () => {
      const file = await fs.readFile(path.join(TEST_DATA_PATH, fileName));
      const codecParser = new CodecParser(mimeType);

      const actualFileName = `${fileName}_iterator_one_byte.json`;
      const expectedFileName = `${fileName}_iterator.json`;

      let frames = [];
      const chunks = getBuffArray(file, 5);

      for (const chunk of chunks) {
        frames = [...frames, ...codecParser.iterator(chunk)];
      }

      await writeResults(frames, mimeType, ACTUAL_PATH, actualFileName);

      assertFrames(actualFileName, expectedFileName);
    }, 20000);*/
  };

  // uncomment to regenerate the test data
  /*
  it("should generate the test data", async () => {
    await generateTestData();

    expect(true).toBeTruthy();
  }, 10000);
  */

  describe("Given MP3 CBR", () => {
    testParser("mpeg.cbr.mp3", "audio/mpeg");
  });

  describe("Given MP3 VBR", () => {
    testParser("mpeg.vbr.mp3", "audio/mpeg");
  });

  describe("Given AAC", () => {
    testParser("aac.aac", "audio/aac");
  });

  describe("Given Ogg Flac", () => {
    testParser("ogg.flac", "audio/ogg");
  });

  describe("Given Ogg Opus", () => {
    testParser("ogg.opus", "audio/ogg");
  });

  describe("Given Ogg Vorbis", () => {
    testParser("ogg.vorbis", "audio/ogg");
    testParser("ogg.vorbis.fishead", "audio/ogg");
  });
});
