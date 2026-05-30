import type { PianoNote } from "../types";

type PianoSample = {
  midi: number;
  path: string;
};

export const PIANO_SAMPLES: PianoSample[] = Array.from({ length: 36 }, (_, index) => {
  const midi = 48 + index;
  return {
    midi,
    path: `/samples/piano/${midiToFileStem(midi)}.wav`,
  };
});

let audioContext: AudioContext | null = null;
let masterOutput: GainNode | null = null;
let sampleLoadPromise: Promise<boolean> | null = null;
const sampleBuffers = new Map<number, AudioBuffer>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

function getMasterOutput(context: AudioContext): GainNode {
  if (masterOutput) {
    return masterOutput;
  }

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.knee.setValueAtTime(18, context.currentTime);
  compressor.ratio.setValueAtTime(5, context.currentTime);
  compressor.attack.setValueAtTime(0.003, context.currentTime);
  compressor.release.setValueAtTime(0.18, context.currentTime);

  masterOutput = context.createGain();
  masterOutput.gain.setValueAtTime(0.72, context.currentTime);
  masterOutput.connect(compressor);
  compressor.connect(context.destination);

  return masterOutput;
}

export function preloadPianoSamples(): Promise<boolean> {
  if (sampleBuffers.size === PIANO_SAMPLES.length) {
    return Promise.resolve(true);
  }

  if (sampleLoadPromise) {
    return sampleLoadPromise;
  }

  const context = getAudioContext();
  if (!context || typeof fetch !== "function") {
    return Promise.resolve(false);
  }

  sampleLoadPromise = Promise.all(
    PIANO_SAMPLES.map(async (sample) => {
      const response = await fetch(sample.path);
      if (!response.ok) {
        throw new Error(`Failed to load piano sample: ${sample.path}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      sampleBuffers.set(sample.midi, audioBuffer);
    }),
  )
    .then(() => true)
    .catch(() => {
      sampleBuffers.clear();
      sampleLoadPromise = null;
      return false;
    });

  return sampleLoadPromise;
}

export function chooseNearestPianoSample(midi: number): PianoSample {
  return PIANO_SAMPLES.reduce((nearest, sample) => {
    const nearestDistance = Math.abs(nearest.midi - midi);
    const sampleDistance = Math.abs(sample.midi - midi);

    if (sampleDistance < nearestDistance) {
      return sample;
    }

    return nearest;
  });
}

export function getSamplePlaybackRate(noteMidi: number, sampleMidi: number): number {
  return 2 ** ((noteMidi - sampleMidi) / 12);
}

export function playNote(note: PianoNote, muted: boolean): void {
  if (muted) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  void preloadPianoSamples();

  if (sampleBuffers.size > 0) {
    playSampledNote(context, note);
    return;
  }

  playSynthFallback(context, note);
}

function playSampledNote(context: AudioContext, note: PianoNote): void {
  const sample = chooseNearestPianoSample(note.midi);
  const audioBuffer = sampleBuffers.get(sample.midi);
  if (!audioBuffer) {
    playSynthFallback(context, note);
    return;
  }

  const now = context.currentTime;
  const source = context.createBufferSource();
  const gain = context.createGain();
  const lowpass = context.createBiquadFilter();
  const highpass = context.createBiquadFilter();
  const duration = Math.min(audioBuffer.duration / getSamplePlaybackRate(note.midi, sample.midi), 1.8);

  source.buffer = audioBuffer;
  source.playbackRate.setValueAtTime(getSamplePlaybackRate(note.midi, sample.midi), now);

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(26, now);

  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(7200, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.34, now + 0.006);
  gain.gain.setValueAtTime(0.26, now + Math.max(0.012, duration - 0.12));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(getMasterOutput(context));

  source.start(now);
  source.stop(now + duration + 0.02);
}

function playSynthFallback(context: AudioContext, note: PianoNote): void {
  const now = context.currentTime;
  const frequency = 440 * 2 ** ((note.midi - 69) / 12);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2600, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.32);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(getMasterOutput(context));

  oscillator.start(now);
  oscillator.stop(now + 0.58);
}

function midiToFileStem(midi: number): string {
  const pitchClasses = [
    "C",
    "CSharp",
    "D",
    "DSharp",
    "E",
    "F",
    "FSharp",
    "G",
    "GSharp",
    "A",
    "ASharp",
    "B",
  ];
  const pitchClass = pitchClasses[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;

  return `${pitchClass}${octave}`;
}
