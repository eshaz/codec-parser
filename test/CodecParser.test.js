import fs from "fs/promises";
import path from "path";

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

const removeDataElementsOgg = ({
  absoluteGranulePosition, // can't serialize BigInt
  data,
  rawData,
  codecFrames,
  ...rest
}) => ({
  codecFrames: codecFrames.map(removeDataElements),
  ...rest,
});

const generateTestData = async (files) => {
  const dataPath = new URL("data", import.meta.url).pathname;
  const resultsPath = new URL("expected-results", import.meta.url).pathname;

  await Promise.all(
    files.map(async (testFilePath) => {
      const testFile = await fs.readFile(path.join(dataPath, testFilePath));
      const codec = testFilePath.split(".")[0];

      const codecParser = new CodecParser("audio/" + codec);

      const framesWithoutData = [...codecParser.iterator(testFile)].map(
        codec === "ogg" ? removeDataElementsOgg : removeDataElements
      );

      await fs.writeFile(
        path.join(resultsPath, `${testFilePath}_iterator.json`),
        JSON.stringify(framesWithoutData, null, 2)
      );
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
    let file, codecParser;

    beforeAll(async () => {
      file = await fs.readFile(path.join(dataPath, testFilePath));
    });

    beforeEach(() => {
      codecParser = new CodecParser(mimeType);
    });

    it(`should parse ${testFilePath} header information for each frame`, async () => {
      const framesWithoutData = [...codecParser.iterator(file)].map(
        mimeType === "audio/ogg" ? removeDataElementsOgg : removeDataElements
      );

      const expectedFrames = await fs.readFile(
        path.join(resultsPath, `${testFilePath}_iterator.json`)
      );

      expect(framesWithoutData).toEqual(JSON.parse(expectedFrames));
    });
  };

  // uncomment to regenerate the test data
  /*
  it("should generate the test data", async () => {
    await generateTestData(await fs.readdir(dataPath));

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
