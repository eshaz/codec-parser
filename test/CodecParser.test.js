import fs from "fs/promises";
import path from "path";
import bson from "bson";

import CodecParser from "../index.js";

const removeDataElements = ({ data, header, ...rest }) => ({
  header: {
    ...header,
    data: undefined,
    vorbisComments: undefined,
    vorbisSetup: undefined,
    streamInfo: undefined,
  },
  ...rest,
});

const generateTestData = async (files) => {
  const dataPath = new URL("data", import.meta.url).pathname;
  const resultsPath = new URL("expected-results", import.meta.url).pathname;

  await Promise.allSettled(
    files.map(async (testFilePath) => {
      const testFile = await fs.readFile(path.join(dataPath, testFilePath));

      const parser = new CodecParser("audio/" + testFilePath.split(".")[0]);
      const frames = [...parser.iterator(testFile)];
      const framesNoData = frames.map(removeDataElements);

      await Promise.all([
        fs.writeFile(
          path.join(resultsPath, `${testFilePath}_iterator_no_data.json`),
          JSON.stringify(framesNoData, null, 2)
        ),
        fs.writeFile(
          path.join(resultsPath, `${testFilePath}_iterator.bson`),
          bson.serialize(frames)
        ),
      ]);
    })
  );
};

describe("Given the CodeParser", () => {
  let dataPath, resultsPath;

  beforeAll(async () => {
    dataPath = new URL("data", import.meta.url).pathname;
    resultsPath = new URL("expected-results", import.meta.url).pathname;
  });

  const testParser = (testFilePath, mimeType) => {
    let file, parser;

    beforeAll(async () => {
      file = await fs.readFile(path.join(dataPath, testFilePath));
    });

    beforeEach(() => {
      parser = new CodecParser(mimeType);
    });

    it(`should parse ${testFilePath} header information for each frame`, async () => {
      const frames = [...parser.iterator(file)];

      const framesWithoutData = frames.map(removeDataElements);

      const expectedFrames = await fs.readFile(
        path.join(resultsPath, `${testFilePath}_iterator_no_data.json`)
      );

      expect(framesWithoutData).toEqual(JSON.parse(expectedFrames));
    });

    it(`should parse ${testFilePath} data for each frame`, async () => {
      const frames = [...parser.iterator(file)];

      const expectedFrames = await fs.readFile(
        path.join(resultsPath, `${testFilePath}_iterator.bson`)
      );

      expect(Buffer.compare(expectedFrames, bson.serialize(frames))).toEqual(0);
    });
  };

  // uncomment to regenerate the test data
  /*it("should generate the test data", async () => {
    await generateTestData(await fs.readdir(dataPath));

    expect(true).toBeTruthy();
  }, 10000);*/

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
