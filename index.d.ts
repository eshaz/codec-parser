declare type OggMimeType = "application/ogg" | "audio/ogg";
declare type FramedMimeType =
  | "audio/mpeg"
  | "audio/aac"
  | "audio/aacp"
  | "audio/flac";
declare type MimeType = FramedMimeType | OggMimeType;
declare type CodecValue = "mpeg" | "aac" | "flac" | "opus" | "vorbis";

declare class MPEGHeader {
  public bitDepth: number;
  public bitrate: number;
  public channels: number;
  public sampleRate: number;
  public channelMode: string;
  public emphasis: string;
  public framePadding: number;
  public isCopyrighted: boolean;
  public isOriginal: boolean;
  public isPrivate: boolean;
  public layer: string;
  public modeExtension: string;
  public mpegVersion: string;
  public protection: string;
}

declare class AACHeader {
  public bitDepth: number;
  public bitrate: number;
  public channels: number;
  public sampleRate: number;
  public copyrightId: boolean;
  public copyrightIdStart: boolean;
  public channelMode: string;
  public bufferFullness: string;
  public isHome: boolean;
  public isOriginal: boolean;
  public isPrivate: boolean;
  public layer: string;
  public length: number;
  public mpegVersion: string;
  public numberAACFrames: number;
  public profile: string;
  public protection: string;
}

declare class FLACHeader {
  public bitDepth: number;
  public bitrate: number;
  public channels: number;
  public sampleRate: number;
  public channelMode: string;
  public blockingStrategy: string;
  public blockSize: number;
  public frameNumber: number;
  public crc16: number;
  public streamInfo: Uint8Array;
}

declare class OpusHeader {
  public bitDepth: number;
  public bitrate: number;
  public channels: number;
  public data: Uint8Array;
  public sampleRate: number;
  public bandwidth: string;
  public channelMappingFamily: number;
  public channelMappingTable: number[];
  public coupledStreamCount: number;
  public streamCount: number;
  public channelMode: string;
  public frameCount: number;
  public frameSize: number;
  public inputSampleRate: number;
  public mode: string;
  public outputGain: number;
  public preSkip: number;
}

declare class VorbisHeader {
  public bitDepth: number;
  public bitrate: number;
  public channels: number;
  public channelMode: string;
  public sampleRate: number;
  public bitrateMaximum: number;
  public bitrateMinimum: number;
  public bitrateNominal: number;
  public blocksize0: number;
  public blocksize1: number;
  public data: Uint8Array;
  public vorbisComments: Uint8Array;
  public vorbisSetup: Uint8Array;
}

declare type CodecHeader =
  | MPEGHeader
  | AACHeader
  | FLACHeader
  | OpusHeader
  | VorbisHeader;

declare class CodecFrame {
  public data: Uint8Array;
  public header: CodecHeader;
  public crc32: number;
  public samples: number;
  public duration: number;
  public frameNumber: number;
  public totalBytesOut: number;
  public totalSamples: number;
  public totalDuration: number;
}

declare class OggPage {
  public absoluteGranulePosition: number;
  public codecFrames: CodecFrame[];
  public crc32: number;
  public data: Uint8Array;
  public duration: number;
  public isContinuedPacket: boolean;
  public isFirstPage: boolean;
  public isLastPage: boolean;
  public pageSequenceNumber: number;
  public rawData: Uint8Array;
  public samples: number;
  public streamSerialNumber: number;
  public totalBytesOut: number;
  public totalDuration: number;
  public totalSamples: number;
}

declare interface ICodecParserOptions {
  /**
   * Called when the output codec is determined.
   * @param codec See {@link CodecParser.codec}
   */
  onCodec?: (codec: CodecValue) => void;
  /**
   * Called once when the codec header is first parsed.
   * @param codecHeaderData Object containing codec header information.
   */
  onCodecHeader?: (codecHeaderData: CodecHeader) => void;
  /**
   * Called when there is a change in the codec header.
   * @param codecHeaderData Object containing codec header information that was updated.
   * @param updateTimestamp Timestamp in milliseconds when the codec information was updated.
   */
  onCodecUpdate?: (
    codecHeaderData: CodecHeader,
    updateTimestamp: number,
  ) => void;
  /** Set to true to enable warning and error messages. */
  enableLogging?: boolean;
  /** 
   * Set to false to disable the crc32 calculation for each frame.
   * This will save a marginal amount of execution time if you don't need this information. 
   */
  enableFrameCRC32?: boolean;
}

declare class CodecParser<
  T extends CodecFrame | OggPage = CodecFrame | OggPage,
> {
  /** 
   * The detected codec of the audio data. 
   * 
   * **Note**:  For Ogg streams, the codec will only be available after Ogg identification header has been parsed.
   * 
   * Possible Values:
   * - MPEG (MP3) - `"mpeg"`
   * - AAC - `"aac"`
   * - FLAC - `"flac"`
   * - Opus - `"opus"`
   * - Vorbis - `"vorbis"`
   */
  public readonly codec: CodecValue;

  /**
   * Creates a new instance of CodecParser that can be used to parse audio for a given mimetype.
   * @param mimeType Incoming audio codec or container. Possible values:
   * - MP3 - `audio/mpeg`
   * - AAC - `audio/aac`, `audio/aacp`
   * - FLAC - `audio/flac`
   * - Ogg FLAC - `application/ogg`, `audio/ogg`
   * - Ogg Opus - `application/ogg`, `audio/ogg`
   * - Ogg Vorbis - `application/ogg`, `audio/ogg`
   * @param options See {@link ICodecParserOptions}.
   */
  constructor(mimeType: MimeType, options?: ICodecParserOptions);

  /**
   * Function that takes a audio data for an entire file.
   * @param file `Uint8Array` of audio data for a complete audio stream / file.
   * @returns Returns an Array of {@link CodecFrame}s or {@link OggPage}s for the entire file.
   */
  public parseAll(file: Uint8Array): T[];
  /**
   * Generator function that yields frames for a partial chunk of audio data from an audio stream or file.
   * @param chunk `Uint8Array` of audio data.
   * @returns Returns Iterable that yields a parsed {@link CodecFrame} or {@link OggPage} for each iteration.
   */
  public parseChunk(chunk: Uint8Array): Iterable<T>;
  /**
   * Generator function that yields any buffered frames that are stored after `parseChunk()` completes.
   * 
   * This function can be used after parseChunk has been called with all of the audio data you intend to parse.
   * The final iterator returned by `parseChunk()` must be consumed before calling `flush()`.
   * 
   * Calling `flush()` will reset the internal state of the CodecParser instance.
   * You may re-use the instance to parse additional streams.
   * 
   * @returns Returns Iterable that yields a parsed {@link CodecFrame} or {@link OggPage} for each iteration.
   */
  public flush(): Iterable<T>;
}

export default CodecParser;

export type {
  CodecValue,
  CodecHeader,
  MPEGHeader,
  AACHeader,
  CodecFrame,
  FLACHeader,
  ICodecParserOptions,
  OggPage,
  OpusHeader,
  VorbisHeader,
  MimeType,
  OggMimeType,
  FramedMimeType,
};

export const absoluteGranulePosition = "absoluteGranulePosition";
export const bandwidth = "bandwidth";
export const bitDepth = "bitDepth";
export const bitrate = "bitrate";
export const bitrateMaximum = "bitrateMaximum";
export const bitrateMinimum = "bitrateMinimum";
export const bitrateNominal = "bitrateNominal";
export const buffer = "buffer";
export const bufferFullness = "bufferFullness";
export const codec = "codec";
export const codecFrames = "codecFrames";
export const coupledStreamCount = "coupledStreamCount";
export const crc = "crc";
export const crc16 = "crc16";
export const crc32 = "crc32";
export const data = "data";
export const description = "description";
export const duration = "duration";
export const emphasis = "emphasis";
export const hasOpusPadding = "hasOpusPadding";
export const header = "header";
export const isContinuedPacket = "isContinuedPacket";
export const isCopyrighted = "isCopyrighted";
export const isFirstPage = "isFirstPage";
export const isHome = "isHome";
export const isLastPage = "isLastPage";
export const isOriginal = "isOriginal";
export const isPrivate = "isPrivate";
export const isVbr = "isVbr";
export const layer = "layer";
export const length = "length";
export const mode = "mode";
export const modeExtension = "modeExtension";
export const mpeg = "mpeg";
export const mpegVersion = "mpegVersion";
export const numberAACFrames = "numberAACFrames";
export const outputGain = "outputGain";
export const preSkip = "preSkip";
export const profile = "profile";
export const protection = "protection";
export const rawData = "rawData";
export const segments = "segments";
export const subarray = "subarray";
export const version = "version";
export const vorbis = "vorbis";
export const vorbisComments = "vorbisComments";
export const vorbisSetup = "vorbisSetup";
export const blockingStrategy = "blockingStrategy";
export const blockSize = "blockSize";
export const blocksize0 = "blocksize0";
export const blocksize1 = "blocksize1";
export const channelMappingFamily = "channelMappingFamily";
export const channelMappingTable = "channelMappingTable";
export const channelMode = "channelMode";
export const channels = "channels";
export const copyrightId = "copyrightId";
export const copyrightIdStart = "copyrightIdStart";
export const frame = "frame";
export const frameCount = "frameCount";
export const frameLength = "frameLength";
export const frameNumber = "frameNumber";
export const framePadding = "framePadding";
export const frameSize = "frameSize";
export const inputSampleRate = "inputSampleRate";
export const pageChecksum = "pageChecksum";
export const pageSegmentTable = "pageSegmentTable";
export const pageSequenceNumber = "pageSequenceNumber";
export const sampleNumber = "sampleNumber";
export const sampleRate = "sampleRate";
export const samples = "samples";
export const streamCount = "streamCount";
export const streamInfo = "streamInfo";
export const streamSerialNumber = "streamSerialNumber";
export const streamStructureVersion = "streamStructureVersion";
export const totalBytesOut = "totalBytesOut";
export const totalDuration = "totalDuration";
export const totalSamples = "totalSamples";
