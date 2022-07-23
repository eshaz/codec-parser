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
  onCodec?: (codec: CodecValue) => any;
  onCodecUpdate?: (
    codecHeaderData: CodecHeader,
    updateTimestamp: number
  ) => any;
  enableLogging?: boolean;
  enableFrameCRC32?: boolean;
}

declare class CodecParser<
  T extends CodecFrame | OggPage = CodecFrame | OggPage
> {
  public readonly codec: CodecValue;

  constructor(mimeType: MimeType, options?: ICodecParserOptions);

  public parseAll(file: Uint8Array): T[];
  public parseChunk(chunk: Uint8Array): Iterator<T>;
  public flush(): Iterator<T>;
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
