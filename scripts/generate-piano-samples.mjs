import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sampleRate = 44100;
const durationSeconds = 1.85;
const outputDir = join(process.cwd(), "public", "samples", "piano");

mkdirSync(outputDir, { recursive: true });
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (let midi = 48; midi <= 83; midi += 1) {
  const name = midiToFileStem(midi);
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const pcm = renderPianoLikeSample(frequency);
  writeFileSync(join(outputDir, `${name}.wav`), encodeWav(pcm));
}

writeFileSync(
  join(outputDir, "README.md"),
  [
    "# Piano Samples",
    "",
    "These WAV files are generated locally by `scripts/generate-piano-samples.mjs`.",
    "",
    "They are synthetic piano-like samples created for this project, not third-party recordings, so they can be redistributed with the app.",
    "",
  ].join("\n"),
);

function renderPianoLikeSample(frequency) {
  const frameCount = Math.floor(sampleRate * durationSeconds);
  const pcm = new Float32Array(frameCount);
  const partials = [
    [1, 1.0, 1.25],
    [2.001, 0.34, 0.68],
    [3.003, 0.18, 0.45],
    [4.006, 0.1, 0.32],
    [5.01, 0.055, 0.24],
    [6.014, 0.028, 0.18],
  ];

  const phases = partials.map((_, index) => index * 1.73);

  for (let index = 0; index < frameCount; index += 1) {
    const time = index / sampleRate;
    const attack = Math.min(1, time / 0.006);
    const hammer =
      Math.exp(-time * 95) *
      (Math.sin(2 * Math.PI * 1800 * time) + 0.45 * Math.sin(2 * Math.PI * 3100 * time)) *
      0.028;
    let value = hammer;

    for (let partialIndex = 0; partialIndex < partials.length; partialIndex += 1) {
      const [ratio, amplitude, decay] = partials[partialIndex];
      const envelope = Math.exp(-time / decay);
      const detune = 1 + partialIndex * 0.0009;
      value +=
        Math.sin(2 * Math.PI * frequency * ratio * detune * time + phases[partialIndex]) *
        amplitude *
        envelope;
    }

    const body = Math.sin(2 * Math.PI * frequency * 0.5 * time) * Math.exp(-time / 1.1) * 0.015;
    pcm[index] = Math.tanh((value + body) * attack * 0.68);
  }

  fadeOut(pcm, Math.floor(sampleRate * 0.12));
  normalize(pcm, 0.72);

  return pcm;
}

function midiToFileStem(midi) {
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
  const pitchClass = pitchClasses[midi % 12];
  const octave = Math.floor(midi / 12) - 1;

  return `${pitchClass}${octave}`;
}

function fadeOut(pcm, fadeFrames) {
  for (let index = pcm.length - fadeFrames; index < pcm.length; index += 1) {
    const progress = (pcm.length - index) / fadeFrames;
    pcm[index] *= Math.max(0, Math.min(1, progress));
  }
}

function normalize(pcm, targetPeak) {
  let peak = 0;
  for (const sample of pcm) {
    peak = Math.max(peak, Math.abs(sample));
  }

  if (peak === 0) {
    return;
  }

  const scale = targetPeak / peak;
  for (let index = 0; index < pcm.length; index += 1) {
    pcm[index] *= scale;
  }
}

function encodeWav(pcm) {
  const bytesPerSample = 2;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < pcm.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, pcm[index]));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * bytesPerSample);
  }

  return buffer;
}
