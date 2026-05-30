import type { PianoNote } from "../types";

export const SHARP_PITCH_CLASSES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const FLAT_PITCH_CLASSES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

const ENHARMONIC_CHROMA: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

export const FIRST_MIDI = 48;
export const LAST_MIDI = 83;

export function midiToPitchClass(midi: number): string {
  return SHARP_PITCH_CLASSES[((midi % 12) + 12) % 12];
}

export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiToNote(midi: number): PianoNote {
  const pitchClass = midiToPitchClass(midi);
  const octave = midiToOctave(midi);

  return {
    midi,
    name: `${pitchClass}${octave}`,
    pitchClass,
    octave,
    isBlack: pitchClass.includes("#"),
  };
}

export function buildPianoRange(firstMidi = FIRST_MIDI, lastMidi = LAST_MIDI): PianoNote[] {
  const notes: PianoNote[] = [];

  for (let midi = firstMidi; midi <= lastMidi; midi += 1) {
    notes.push(midiToNote(midi));
  }

  return notes;
}

export function pitchClassToChroma(pitchClass: string): number {
  const match = pitchClass.match(/^([A-G](?:#|b)?)/);
  const normalized = match?.[1];

  if (!normalized || ENHARMONIC_CHROMA[normalized] === undefined) {
    throw new Error(`Unknown pitch class: ${pitchClass}`);
  }

  return ENHARMONIC_CHROMA[normalized];
}

export function chromaToSharpPitchClass(chroma: number): string {
  return SHARP_PITCH_CLASSES[((chroma % 12) + 12) % 12];
}

export function chromaToFlatPitchClass(chroma: number): string {
  return FLAT_PITCH_CLASSES[((chroma % 12) + 12) % 12];
}

export function uniquePitchClasses(notes: PianoNote[]): string[] {
  const seen = new Set<number>();
  const result: string[] = [];

  for (const note of notes) {
    const chroma = pitchClassToChroma(note.pitchClass);
    if (!seen.has(chroma)) {
      seen.add(chroma);
      result.push(chromaToSharpPitchClass(chroma));
    }
  }

  return result;
}
