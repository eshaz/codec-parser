export const reserved = "reserved";
export const bad = "bad";
export const free = "free";
export const none = "none";
export const sixteenBitCRC = "16bit CRC";

// channel mappings
const mappingJoin = ", ";

const front = "front";
const side = "side";
const rear = "rear";
const left = "left";
const center = "center";
const right = "right";

// prettier-ignore
/*
[
  [
    "left, right",
    "left, right, center",
    "left, center, right",
    "center, left, right",
    "center"
  ],
  [
    "front left, front right",
    "front left, front right, front center",
    "front left, front center, front right",
    "front center, front left, front right",
    "front center"
  ],
  [
    "side left, side right",
    "side left, side right, side center",
    "side left, side center, side right",
    "side center, side left, side right",
    "side center"
  ],
  [
    "rear left, rear right",
    "rear left, rear right, rear center",
    "rear left, rear center, rear right",
    "rear center, rear left, rear right",
    "rear center"
  ]
]
*/
export const channelMappings = 
  [
    "", 
    front + " ",
    side + " ",
    rear + " "
  ].map((x) =>
  [
    [left, right],
    [left, right, center],
    [left, center, right],
    [center, left, right],
    [center],
  ].flatMap((y) => y.map((z) => x + z).join(mappingJoin))
);

export const lfe = "LFE";
export const monophonic = "monophonic (mono)";
export const stereo = "stereo";
const surround = "surround";

const channelTypes = [
  monophonic,
  stereo,
  `linear ${surround}`,
  "quadraphonic",
  `5.0 ${surround}`,
  `5.1 ${surround}`,
  `6.1 ${surround}`,
  `7.1 ${surround}`,
];

export const getChannelMapping = (channelCount, ...mappings) =>
  `${channelTypes[channelCount - 1]} (${mappings.join(mappingJoin)})`;

// prettier-ignore
export const vorbisOpusChannelMapping = [
  monophonic,
  getChannelMapping(2,channelMappings[0][0]),
  getChannelMapping(3,channelMappings[0][2]),
  getChannelMapping(4,channelMappings[1][0],channelMappings[3][0]),
  getChannelMapping(5,channelMappings[1][2],channelMappings[3][0]),
  getChannelMapping(6,channelMappings[1][2],channelMappings[3][0],lfe),
  getChannelMapping(7,channelMappings[1][2],channelMappings[2][0],channelMappings[3][4],lfe),
  getChannelMapping(8,channelMappings[1][2],channelMappings[2][0],channelMappings[3][0],lfe),
]

// sampleRates
export const rate192000 = 192000;
export const rate176400 = 176400;
export const rate96000 = 96000;
export const rate88200 = 88200;
export const rate64000 = 64000;
export const rate48000 = 48000;
export const rate44100 = 44100;
export const rate32000 = 32000;
export const rate24000 = 24000;
export const rate22050 = 22050;
export const rate16000 = 16000;
export const rate12000 = 12000;
export const rate11025 = 11025;
export const rate8000 = 8000;
export const rate7350 = 7350;

// header key constants
export const header = "header";
export const bitDepth = "bitDepth";
export const channelMode = "channelMode";
export const sampleRate = "sampleRate";
export const bitrate = "bitrate";
export const channels = "channels";
export const copyrightId = "copyrightId";
export const copyrightIdStart = "copyrightIdStart";
export const bufferFullness = "bufferFullness";
export const isHome = "isHome";
export const isOriginal = "isOriginal";
export const isPrivate = "isPrivate";
export const layer = "layer";
export const length = "length";
export const mpegVersion = "mpegVersion";
export const numberAACFrames = "numberAACFrames";
export const profile = "profile";
export const protection = "protection";
export const crc16 = "crc16";
export const blockingStrategy = "blockingStrategy";
export const blockSize = "blockSize";
export const frameNumber = "frameNumber";
export const sampleNumber = "sampleNumber";
export const streamInfo = "streamInfo";
export const emphasis = "emphasis";
export const framePadding = "framePadding";
export const isCopyrighted = "isCopyrighted";
export const modeExtension = "modeExtension";
export const bandwidth = "bandwidth";
export const channelMappingFamily = "channelMappingFamily";
export const channelMappingTable = "channelMappingTable";
export const coupledStreamCount = "coupledStreamCount";
export const frameCount = "frameCount";
export const frameSize = "frameSize";
export const hasOpusPadding = "hasOpusPadding";
export const inputSampleRate = "inputSampleRate";
export const isVbr = "isVbr";
export const mode = "mode";
export const outputGain = "outputGain";
export const preSkip = "preSkip";
export const streamCount = "streamCount";
export const bitrateMaximum = "bitrateMaximum";
export const bitrateMinimum = "bitrateMinimum";
export const bitrateNominal = "bitrateNominal";
export const blocksize0 = "blocksize0";
export const blocksize1 = "blocksize1";
export const data = "data";
export const vorbisComments = "vorbisComments";
export const vorbisSetup = "vorbisSetup";

export const pageChecksum = "pageChecksum";
export const codecFrames = "codecFrames";
export const rawData = "rawData";
export const absoluteGranulePosition = "absoluteGranulePosition";
export const crc32 = "crc32";
export const duration = "duration";
export const isContinuedPacket = "isContinuedPacket";
export const isFirstPage = "isFirstPage";
export const isLastPage = "isLastPage";
export const pageSequenceNumber = "pageSequenceNumber";
export const samples = "samples";
export const streamSerialNumber = "streamSerialNumber";
export const frameLength = "frameLength";
export const streamStructureVersion = "streamStructureVersion";
export const pageSegmentTable = "pageSegmentTable";
export const pageSegmentBytes = "pageSegmentBytes";
export const segments = "segments";

export const totalBytesOut = "totalBytesOut";
export const totalSamples = "totalSamples";
export const totalDuration = "totalDuration";

export const description = "description";
export const profileBits = "profileBits";
export const sampleRateBits = "sampleRateBits";
export const channelModeBits = "channelModeBits";
export const blockingStrategyBits = "blockingStrategyBits";
export const blockSizeBits = "blockSizeBits";
export const crc = "crc";

export const codec = "codec";
export const version = "version";

export const buffer = "buffer";
export const subarray = "subarray";

export const readRawData = Symbol();
export const incrementRawData = Symbol();
