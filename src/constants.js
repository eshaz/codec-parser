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

const channels = [
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
  `${channels[channelCount - 1]} (${mappings.join(mappingJoin)})`;

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
