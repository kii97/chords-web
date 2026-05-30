import type { PianoNote, TonalityContext } from "../types";
import { chromaToFlatPitchClass, chromaToSharpPitchClass, pitchClassToChroma } from "./piano";

type TonalityOption = {
  value: string;
  label: string;
  context: TonalityContext | null;
};

const MAJOR_KEYS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
  "Cb",
] as const;

const MINOR_KEYS = [
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "G#",
  "D#",
  "A#",
  "D",
  "G",
  "C",
  "F",
  "Bb",
  "Eb",
  "Ab",
] as const;

const KEY_SIGNATURE_STYLE: Record<string, "sharp" | "flat"> = {
  C: "sharp",
  G: "sharp",
  D: "sharp",
  A: "sharp",
  E: "sharp",
  B: "sharp",
  "F#": "sharp",
  "C#": "sharp",
  F: "flat",
  Bb: "flat",
  Eb: "flat",
  Ab: "flat",
  Db: "flat",
  Gb: "flat",
  Cb: "flat",
  "A#": "sharp",
  "D#": "sharp",
  "G#": "sharp",
};

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

export const TONALITY_OPTIONS: TonalityOption[] = [
  { value: "auto", label: "自动", context: null },
  ...MAJOR_KEYS.map((tonic) => ({
    value: `${tonic}:major`,
    label: `${tonic} 大调`,
    context: { tonic, mode: "major" as const },
  })),
  ...MINOR_KEYS.map((tonic) => ({
    value: `${tonic}:minor`,
    label: `${tonic} 小调`,
    context: { tonic, mode: "minor" as const },
  })),
];

export function getTonalityContext(value: string): TonalityContext | null {
  return TONALITY_OPTIONS.find((option) => option.value === value)?.context ?? null;
}

export function describeTonality(context: TonalityContext | null): string {
  if (!context) {
    return "自动";
  }

  return `${context.tonic} ${context.mode === "major" ? "大调" : "小调"}`;
}

export function getPreferredPitchClass(chroma: number, context: TonalityContext | null): string {
  if (!context) {
    return chromaToSharpPitchClass(chroma);
  }

  const scaleName = getScalePitchClass(chroma, context);
  if (scaleName) {
    return scaleName;
  }

  return getAccidentalStyle(context) === "flat"
    ? chromaToFlatPitchClass(chroma)
    : chromaToSharpPitchClass(chroma);
}

export function formatPianoNoteName(note: PianoNote, context: TonalityContext | null): string {
  const chroma = pitchClassToChroma(note.pitchClass);
  const pitchClass = getPreferredPitchClass(chroma, context);
  const octave = getSpelledOctave(note.octave, chroma, pitchClass);

  return `${pitchClass}${octave}`;
}

function getScalePitchClass(chroma: number, context: TonalityContext): string | null {
  const tonicChroma = pitchClassToChroma(context.tonic);
  const tonicLetterIndex = LETTERS.indexOf(context.tonic[0] as (typeof LETTERS)[number]);
  const steps = context.mode === "major" ? MAJOR_SCALE_STEPS : MINOR_SCALE_STEPS;

  for (let degree = 0; degree < steps.length; degree += 1) {
    const degreeChroma = (tonicChroma + steps[degree]) % 12;
    if (degreeChroma !== ((chroma % 12) + 12) % 12) {
      continue;
    }

    const letter = LETTERS[(tonicLetterIndex + degree) % LETTERS.length];
    return spellPitchClass(letter, degreeChroma);
  }

  return null;
}

function getAccidentalStyle(context: TonalityContext): "sharp" | "flat" {
  return KEY_SIGNATURE_STYLE[context.tonic] ?? (context.tonic.includes("b") ? "flat" : "sharp");
}

function spellPitchClass(letter: string, chroma: number): string {
  const naturalChroma = pitchClassToChroma(letter);
  const diff = (chroma - naturalChroma + 12) % 12;

  if (diff === 0) {
    return letter;
  }

  if (diff === 1) {
    return `${letter}#`;
  }

  if (diff === 11) {
    return `${letter}b`;
  }

  if (diff === 2) {
    return `${letter}##`;
  }

  if (diff === 10) {
    return `${letter}bb`;
  }

  return chromaToSharpPitchClass(chroma);
}

function getSpelledOctave(defaultOctave: number, chroma: number, pitchClass: string): number {
  const normalizedChroma = ((chroma % 12) + 12) % 12;
  const letter = pitchClass[0];

  if (letter === "C" && normalizedChroma === 11) {
    return defaultOctave + 1;
  }

  if (letter === "B" && normalizedChroma === 0) {
    return defaultOctave - 1;
  }

  return defaultOctave;
}
