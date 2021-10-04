import fs from "fs/promises";
import path from "path";

export const getBuffArray = (buffer, increment) => {
  let rawBuffs = [];

  for (let currPos = 0; currPos <= buffer.length; currPos += increment) {
    rawBuffs.push(buffer.subarray(currPos, increment + currPos));
  }

  return rawBuffs;
};

export const writeResults = async (
  frames,
  mimeType,
  outputPath,
  outputFile
) => {
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
    path.join(outputPath, outputFile),
    JSON.stringify(framesWithoutData, null, 2)
  );
};
