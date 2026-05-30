/// <reference types="vite/client" />

interface Window {
  chordPiano?: {
    platform: NodeJS.Platform;
  };
  webkitAudioContext?: typeof AudioContext;
}
