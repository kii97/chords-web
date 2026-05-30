export interface PianoNote {
  midi: number;
  name: string;
  pitchClass: string;
  octave: number;
  isBlack: boolean;
}

export interface ChordCandidate {
  symbol: string;
  chineseName: string;
  bass?: string;
  notes: string[];
  confidence: number;
}

export type TonalityMode = "major" | "minor";

export interface TonalityContext {
  tonic: string;
  mode: TonalityMode;
}
