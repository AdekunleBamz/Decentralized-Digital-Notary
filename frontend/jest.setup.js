import '@testing-library/jest-dom';

// Mock window.location
delete window.location;
window.location = {
  origin: 'http://localhost:5173',
  href: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
};

// Mock File API
global.File = class MockFile {
  constructor(parts, filename, options = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.size = parts.reduce((total, part) => total + part.length, 0);
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsArrayBuffer(blob) {
    // Simulate async file reading
    setTimeout(() => {
      this.result = new ArrayBuffer(32); // Mock 32-byte hash
      if (this.onload) this.onload();
    }, 0);
  }

  readAsText(blob) {
    setTimeout(() => {
      this.result = 'mock file content';
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock crypto.subtle.digest for SHA-256 hashing
global.crypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new Uint8Array(32).buffer)
  }
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Keep logs for debugging but can be suppressed in CI
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
