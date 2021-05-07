# Codec Parser

`codec-parser` is a JavaScript library that takes in audio data and returns an array of audio frames with information.

### Supports:
  * ### MPEG (MP3) - `audio/mpeg`
  * ### AAC - `audio/aac`, `audio/aacp`
  * ### Ogg FLAC - `application/ogg`, `audio/ogg`
  * ### Ogg Opus - `application/ogg`, `audio/ogg`
  * ### Ogg Vorbis - `application/ogg`, `audio/ogg`


## Demo
The demo for [`icecast-metadata-js`](https://github.com/eshaz/icecast-metadata-js) uses this library to allow for playback of streaming audio. `codec-parser` is used by [`mse-audio-wrapper`](https://github.com/eshaz/mse-audio-wrapper) to wrap streaming audio in ISOBMFF or WEBM so it can be played back using the MediaSource API.

## View the live demo [here](https://eshaz.github.io/icecast-metadata-js/)!

---

* [Usage](#usage)
  * [Instantiation](#instantiation)
  * [Methods](#methods)
  * [Properties](#properties)
* [Data Types](#data-types)
  * [Frame](#frame)
  * [Header](#header)
    * [MPEGHeader](#mpegheader)
    * [AACHeader](#aacheader)
    * [FLACHeader](#flacheader)
    * [OpusHeader](#opusheader)
    * [VorbisHeader](#vorbisheader)

## Usage

1. To use `CodecParser`, create a new instance of the class by passing in the mimetype of your audio data along with the options object.

    *Note: For directly reading from a HTTP response, use the mimetype contained in the `Content-Type` header*
    
    ```
    import CodecParser from "codec-parser";

    const mimeType = "audio/mpeg";
    const options = {
        onCodec: () => {}
        onCodecUpdate: () => {}
    };

    const parser = new CodecParser(mimeType, options);
    ```
    
1. To begin processing audio data, pass in a Uint8Array of audio data into the instance's `.iterator()`. This method returns an iterator that can be consumed using a `for ...of` or `for await...of` loop.

    ```    
    for (const frame of parser.iterator(audioData)) {
      // Do something with each frame
    }
    ```
    ***or***
    ```
    const frames = [...parser.iterator(audioData)]
    ```

    `CodecParser` will read the passed in data and attempt to parse audio frames according to the passed in `mimeType`. Any partial data will be stored until enough data is passed in for a complete frame can be formed. Iterations will begin to return frames once at least two consecutive frames have been detected in the passed in data.

    *Note: Any data that does not conform to the instance's mimetype will be discarded.*

    ### Example:

  * 1st `.iterator()` call
    * Input
        ```
        [MPEG frame 0 (partial)],
        [MPEG frame 1 (partial)], 
        ```
    * Output (no iterations)
      ```
      (none)
      ```
    * `Frame 0` is dropped since it doesn't start with a valid header.
    * `Frame 1` is parsed and stored internally until enough data is passed in to properly sync.
  * 2nd `.iterator()` call
    * Input
        ```
        [MPEG frame 1 (partial)], 
        [MPEG frame 2 (partial)]
        ```
    * Output (1 iteration)
      ```
      MPEG Frame 1 {
          data,
          header
          ...
      }
      ```
    * `Frame 1` is joined with the partial data and returned since it was immediately followed by `Frame 2`.
    * `Frame 2` is stored internally as partial data.
  * 3rd `.iterator()` call
    * Input
      ```
      [MPEG frame 2 (partial)],
      [MPEG frame 3 (full)], 
      [MPEG frame 4 (partial)]
      ```
    * Output (2 iterations)
      ```
      MPEG Frame 2 {
          data,
          header
          ...
      }
      ```
      ```
      MPEG Frame 3 {
          data,
          header
          ...
      }
      ```
    * `Frame 2` is joined with the partial data and returned since it was immediately followed by `Frame 3`.
    * `Frame 3` is returned since it was immediately followed by `Frame 4`.
    * `Frame 4` is stored internally as partial data.

### Instantiation

`const parser = new CodecParser("audio/mpeg", options);`
* `constructor` Creates a new instance of CodecParser that can be used to parse audio for a given mimetype.
  * `mimetype` *required* Incoming audio codec or container
    * MP3 - `audio/mpeg`
    * AAC - `audio/aac`, `audio/aacp`
    * Ogg FLAC - `application/ogg`, `audio/ogg`
    * Ogg Opus - `application/ogg`, `audio/ogg`
    * Ogg Vorbis - `application/ogg`, `audio/ogg`
  * `options` *optional*
    * `options.onCodec()` *optional* Called when the output codec is determined.
      * See `parser.codec` for a list of the possible output codecs
    * `options.onCodecUpdate()` *optional* Called when there is a change in the codec header.

### Methods

* `parser.iterator(data)` Returns an iterator where each iteration returns an audio frame.
  * `data` Uint8Array of audio data to wrap

### Properties

* `parser.codec` The detected codec of the audio data
    * **Note: For Ogg streams, the codec will only be available after Ogg identification header has been parsed.**
  * Values:
    * MPEG (MP3) - `"mpeg"`
    * AAC - `"aac"`
    * FLAC - `"flac"`
    * Opus - `"opus"`
    * Vorbis - `"vorbis"`

## Data Types

### Frame

Each iteration of `CodecParser.iterator()` will return a single `Frame`.

* `data`: `Uint8Array` containing the audio data within this frame.
* `header`: [`Header`](#header) object describing the codec information.
* `samples`: Audio samples contained within this frame.
* `duration`: Audio duration in milliseconds contained within this frame.
* `frameNumber`: Total count of frames output by `CodecParser` starting at 0.
* `totalBytesOut`: Total bytes output by `CodecParer` not including this frame.
* `totalSamples`: Total audio samples output by `CodecParer` not including this frame.
* `totalDuration`: Total audio duration in milliseconds output by `CodecParer` not including this frame.

#### Example
```
// First Frame
MPEGFrame {
  data: Uint8Array(417),
  header: MPEGHeader {
    bitDepth: 16,
    channels: 2,
    sampleRate: 44100,
    bitrate: 128,
    channelMode: "Joint stereo",
    emphasis: "none",
    framePadding: 1,
    isCopyrighted: false,
    isOriginal: true,
    isPrivate: false,
    layer: "Layer III",
    modeExtension: "Intensity stereo off, MS stereo on",
    mpegVersion: "MPEG Version 1 (ISO/IEC 11172-3)",
    protection: "none"
  },
  samples: 1152,
  duration: 26.122448979591837,
  frameNumber: 0,
  totalBytesOut: 0,
  totalSamples: 0,
  totalDuration: 0
}

// Second Frame
MPEGFrame {
  data: Uint8Array(416),
  header: MPEGHeader {
    bitDepth: 16,
    channels: 2,
    sampleRate: 44100,
    bitrate: 128,
    channelMode: "Joint stereo",
    emphasis: "none",
    framePadding: 0,
    isCopyrighted: false,
    isOriginal: true,
    isPrivate: false,
    layer: "Layer III",
    modeExtension: "Intensity stereo off, MS stereo on",
    mpegVersion: "MPEG Version 1 (ISO/IEC 11172-3)",
    protection: "none"
  },
  samples: 1152,
  duration: 26.122448979591837,
  frameNumber: 1,
  totalBytesOut: 418,
  totalSamples: 1152,
  totalDuration: 26.122448979591837
}
```

### Header

Each codec has it's own `Header` data type. See each `Header` class for documentation on each codec specific header.

### MPEGHeader
[***Documentation***](https://github.com/eshaz/codec-parser/blob/master/src/codecs/mpeg/MPEGHeader.js)
```
{
  bitDepth: 16,
  channels: 2,
  sampleRate: 44100,
  bitrate: 192,
  channelMode: "Joint stereo",
  emphasis: "none",
  framePadding: 1,
  isCopyrighted: false,
  isOriginal: false,
  isPrivate: false,
  layer: "Layer III",
  modeExtension: "Intensity stereo off, MS stereo on",
  mpegVersion: "MPEG Version 1 (ISO/IEC 11172-3)",
  protection: "16bit CRC"
}
```
### AACHeader
[***Documentation***](https://github.com/eshaz/codec-parser/blob/master/src/codecs/aac/AACHeader.js)
```
{
  bitDepth: 16,
  channels: 2,
  sampleRate: 22050,
  copyrightId: false,
  copyrightIdStart: false,
  channelMode: "front-left, front-right",
  bufferFullness: 98,
  isHome: false,
  isOriginal: false,
  isPrivate: false,
  layer: "valid",
  mpegVersion: "MPEG-4",
  numberAACFrames: 0,
  profile: "AAC LC (Low Complexity)",
  protection: "none"
}
```

### FLACHeader
[***Documentation***](https://github.com/eshaz/codec-parser/blob/master/src/codecs/flac/FLACHeader.js)
```
{
  bitDepth: 16,
  channels: 2,
  sampleRate: 44100,
  channelMode: "left, right",
  blockingStrategy: "Fixed",
  blockSize: 4096,
  frameNumber: 15183508,
  streamInfo: `Uint8Array`
}
```

### OpusHeader
[***Documentation***](https://github.com/eshaz/codec-parser/blob/master/src/codecs/opus/OpusHeader.js)
```
{
  bitDepth: 16,
  channels: 2,
  sampleRate: 48000,
  data: `Uint8Array`,
  channelMappingFamily: 0,
  channelMode: "stereo (left, right)",
  preSkip: 312,
  outputGain: 0,
  inputSampleRate: 48000
}
```
### VorbisHeader
[***Documentation***](https://github.com/eshaz/codec-parser/blob/master/src/codecs/vorbis/VorbisHeader.js)
```
{
  bitDepth: 32,
  channels: 2,
  sampleRate: 44100,
  bitrateMaximum: 0,
  bitrateMinimum: 0,
  bitrateNominal: 160000,
  blocksize0: 256,
  blocksize1: 2048,
  data: `Uint8Array`,
  vorbisComments: `Uint8Array`,
  vorbisSetup: `Uint8Array`
}
```