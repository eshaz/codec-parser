import fs from "fs/promises";
import path from "path";

import CodecParser from "../index.js";

const EXPECTED_PATH = new URL("expected-results", import.meta.url).pathname;
const ACTUAL_PATH = new URL("actual-results", import.meta.url).pathname;
const TEST_DATA_PATH = new URL("test-data", import.meta.url).pathname;

const writeResults = async (frames, mimeType, outputPath, outputFile) => {
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

  const framesWithoutData = frames.map(
    mimeType === "audio/ogg" ? removeDataElementsOgg : removeDataElements
  );

  await fs.writeFile(
    path.join(outputPath, `${outputFile}_iterator.json`),
    JSON.stringify(framesWithoutData, null, 2)
  );
};

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

      await writeResults(frames, mimeType, EXPECTED_PATH, testFileName);
    })
  );
};

describe("Given the CodeParser", () => {
  const testParser = (testFileName, mimeType) => {
    let file, codecParser;

    beforeAll(async () => {
      file = await fs.readFile(path.join(TEST_DATA_PATH, testFileName));
    });

    beforeEach(() => {
      codecParser = new CodecParser(mimeType);
    });

    it(`should parse ${testFileName} header information for each frame`, async () => {
      const frames = [...codecParser.iterator(file)];

      await writeResults(frames, mimeType, ACTUAL_PATH, testFileName);

      const expectedFrames = JSON.parse(
        await fs.readFile(
          path.join(EXPECTED_PATH, `${testFileName}_iterator.json`)
        )
      );

      const actualFrames = JSON.parse(
        await fs.readFile(
          path.join(ACTUAL_PATH, `${testFileName}_iterator.json`)
        )
      );

      expect(actualFrames).toEqual(expectedFrames);
    });
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
