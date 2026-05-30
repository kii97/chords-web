import "@testing-library/jest-dom/vitest";

class MockAudioContext {
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: "triangle",
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      playbackRate: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  createDynamicsCompressor() {
    return {
      threshold: {
        setValueAtTime: vi.fn(),
      },
      knee: {
        setValueAtTime: vi.fn(),
      },
      ratio: {
        setValueAtTime: vi.fn(),
      },
      attack: {
        setValueAtTime: vi.fn(),
      },
      release: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }

  decodeAudioData() {
    return Promise.resolve({
      duration: 1.85,
    });
  }
}

Object.defineProperty(window, "AudioContext", {
  value: MockAudioContext,
  writable: true,
});
