export const reserved = "reserved";
export const bad = "bad";
export const free = "free";
export const valid = "valid";
export const invalid = "invalid";
export const none = "none";
export const sixteenBitCRC = "16bit CRC";

// channel mappings
const left = "left";
const center = "center";
const right = "right";
const front = "front";
const side = "side";
const rear = "rear";
const lfe = "LFE";

const stereo = "stereo";
const linear = "linear";
const quadraphonic = "quadraphonic";
const surround = "surround";

// ['front left', 'front center', 'front right', 'side left', 'side center', 'side right', 'rear left', 'rear center', 'rear right']
const c = [front, side, rear].flatMap((x) =>
  [left, center, right].map((y) => x + " " + y)
);

const channelMappingJoin = ", ";
// prettier-ignore
export const monophonicMapping = "monophonic (mono)";
// prettier-ignore
export const stereoMapping = `${stereo} (${[left,right].join(channelMappingJoin)})`;
// prettier-ignore
export const linearSurroundMapping = `${linear} ${surround} (${[left,center,right].join(channelMappingJoin)})`;
// prettier-ignore
export const quadraphonicMapping = `${quadraphonic} (${[c[0],c[2],c[6],c[8]].join(channelMappingJoin)})`;
// prettier-ignore
export const fivePointZeroSurroundMapping = `5.0 ${surround} (${[c[0],c[1],c[2],c[6],c[8]].join(channelMappingJoin)})`;
// prettier-ignore
export const fivePointOneSurroundMapping = `5.1 ${surround} (${[c[0],c[1],c[2],c[6],c[8],lfe].join(channelMappingJoin)})`;
// prettier-ignore
export const sixPointOneSurroundMapping = `6.1 ${surround} (${[c[0],c[1],c[2],c[3],c[5],c[7],lfe].join(channelMappingJoin)})`;
// prettier-ignore
export const sevenPointOneSurroundMapping = `7.1 ${surround} (${[c[0],c[1],c[2],c[3],c[5],c[6],c[8],lfe].join(channelMappingJoin)})`;

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
