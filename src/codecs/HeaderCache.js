export default class HeaderCache {
  constructor(onCodecUpdate) {
    this._onCodecUpdate = onCodecUpdate;
    this.reset();
  }

  static getKey(bytes) {
    return String.fromCharCode(...bytes);
  }

  enable() {
    this._isEnabled = true;
  }

  reset() {
    this._headerCache = new Map();
    this._codecUpdateData = new WeakMap();
    this._isEnabled = false;
  }

  getHeader(key) {
    const header = this._headerCache.get(key);

    if (header) {
      if (key !== this._currentHeader) {
        this._currentHeader = key;
        this._onCodecUpdate({ ...this._codecUpdateData.get(header) });
      }
    }

    return header;
  }

  setHeader(key, header, codecUpdateFields) {
    if (this._isEnabled) {
      if (key !== this._currentHeader) {
        this._currentHeader = key;
        this._onCodecUpdate({ ...codecUpdateFields });
      }

      this._headerCache.set(key, header);
      this._codecUpdateData.set(header, codecUpdateFields);
    }
  }
}
