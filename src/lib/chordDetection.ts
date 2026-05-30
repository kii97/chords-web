import { Chord } from "@tonaljs/tonal";
import type { ChordCandidate, PianoNote, TonalityContext } from "../types";
import {
  pitchClassToChroma,
  uniquePitchClasses,
} from "./piano";
import { getPreferredPitchClass } from "./tonality";

type ChordFormula = {
  suffix: string;
  intervals: number[];
  chinese: string;
  priority: number;
};

const CHORD_FORMULAS: ChordFormula[] = [
  { suffix: "", intervals: [0, 4, 7], chinese: "大三和弦", priority: 10 },
  { suffix: "m", intervals: [0, 3, 7], chinese: "小三和弦", priority: 10 },
  { suffix: "dim", intervals: [0, 3, 6], chinese: "减三和弦", priority: 18 },
  { suffix: "aug", intervals: [0, 4, 8], chinese: "增三和弦", priority: 18 },
  { suffix: "sus2", intervals: [0, 2, 7], chinese: "挂二和弦", priority: 20 },
  { suffix: "sus4", intervals: [0, 5, 7], chinese: "挂四和弦", priority: 20 },
  { suffix: "6", intervals: [0, 4, 7, 9], chinese: "六和弦", priority: 24 },
  { suffix: "m6", intervals: [0, 3, 7, 9], chinese: "小六和弦", priority: 24 },
  { suffix: "7", intervals: [0, 4, 7, 10], chinese: "属七和弦", priority: 22 },
  { suffix: "maj7", intervals: [0, 4, 7, 11], chinese: "大七和弦", priority: 22 },
  { suffix: "m7", intervals: [0, 3, 7, 10], chinese: "小七和弦", priority: 22 },
  { suffix: "mMaj7", intervals: [0, 3, 7, 11], chinese: "小大七和弦", priority: 28 },
  { suffix: "dim7", intervals: [0, 3, 6, 9], chinese: "减七和弦", priority: 26 },
  { suffix: "m7b5", intervals: [0, 3, 6, 10], chinese: "半减七和弦", priority: 26 },
  { suffix: "aug7", intervals: [0, 4, 8, 10], chinese: "增属七和弦", priority: 30 },
  { suffix: "augmaj7", intervals: [0, 4, 8, 11], chinese: "增大七和弦", priority: 32 },
  { suffix: "7sus4", intervals: [0, 5, 7, 10], chinese: "属七挂四和弦", priority: 28 },
  { suffix: "add9", intervals: [0, 2, 4, 7], chinese: "加九和弦", priority: 25 },
  { suffix: "madd9", intervals: [0, 2, 3, 7], chinese: "小加九和弦", priority: 25 },
  { suffix: "add11", intervals: [0, 4, 5, 7], chinese: "加十一和弦", priority: 34 },
  { suffix: "6/9", intervals: [0, 2, 4, 7, 9], chinese: "六九和弦", priority: 30 },
  { suffix: "m6/9", intervals: [0, 2, 3, 7, 9], chinese: "小六九和弦", priority: 30 },
  { suffix: "9", intervals: [0, 2, 4, 7, 10], chinese: "属九和弦", priority: 30 },
  { suffix: "maj9", intervals: [0, 2, 4, 7, 11], chinese: "大九和弦", priority: 30 },
  { suffix: "m9", intervals: [0, 2, 3, 7, 10], chinese: "小九和弦", priority: 30 },
  { suffix: "mMaj9", intervals: [0, 2, 3, 7, 11], chinese: "小大九和弦", priority: 36 },
  { suffix: "7b9", intervals: [0, 1, 4, 7, 10], chinese: "属七降九和弦", priority: 36 },
  { suffix: "7#9", intervals: [0, 3, 4, 7, 10], chinese: "属七升九和弦", priority: 36 },
  { suffix: "7b5", intervals: [0, 4, 6, 10], chinese: "属七降五和弦", priority: 36 },
  { suffix: "7#5", intervals: [0, 4, 8, 10], chinese: "属七升五和弦", priority: 36 },
  { suffix: "maj7#11", intervals: [0, 4, 6, 7, 11], chinese: "大七升十一和弦", priority: 38 },
  { suffix: "9#11", intervals: [0, 2, 4, 6, 7, 10], chinese: "九升十一和弦", priority: 40 },
  { suffix: "11", intervals: [0, 2, 4, 5, 7, 10], chinese: "十一和弦", priority: 42 },
  { suffix: "m11", intervals: [0, 2, 3, 5, 7, 10], chinese: "小十一和弦", priority: 42 },
  { suffix: "maj11", intervals: [0, 2, 4, 5, 7, 11], chinese: "大十一和弦", priority: 44 },
  { suffix: "13", intervals: [0, 2, 4, 5, 7, 9, 10], chinese: "十三和弦", priority: 46 },
  { suffix: "m13", intervals: [0, 2, 3, 5, 7, 9, 10], chinese: "小十三和弦", priority: 46 },
  { suffix: "maj13", intervals: [0, 2, 4, 5, 7, 9, 11], chinese: "大十三和弦", priority: 46 },
  { suffix: "13b9", intervals: [0, 1, 4, 7, 9, 10], chinese: "十三降九和弦", priority: 50 },
  { suffix: "13#11", intervals: [0, 2, 4, 6, 7, 9, 10], chinese: "十三升十一和弦", priority: 50 },
  { suffix: "7b9b5", intervals: [0, 1, 4, 6, 10], chinese: "属七降九降五和弦", priority: 52 },
  { suffix: "7b9#5", intervals: [0, 1, 4, 8, 10], chinese: "属七降九升五和弦", priority: 52 },
  { suffix: "7#9b5", intervals: [0, 3, 4, 6, 10], chinese: "属七升九降五和弦", priority: 52 },
  { suffix: "7#9#5", intervals: [0, 3, 4, 8, 10], chinese: "属七升九升五和弦", priority: 52 },
  { suffix: "7alt", intervals: [0, 1, 3, 4, 6, 8, 10], chinese: "属七变化和弦", priority: 60 },
];

const DEFAULT_CHINESE = "和弦";

function sameIntervals(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function intervalsFromRoot(chromas: number[], root: number): number[] {
  return chromas.map((chroma) => (chroma - root + 12) % 12).sort((a, b) => a - b);
}

function formatSymbol(root: string, suffix: string, bass?: string): string {
  return `${root}${suffix}${bass && bass !== root ? `/${bass}` : ""}`;
}

function formatChinese(root: string, chinese: string, bass?: string): string {
  return `${root} ${chinese}${bass && bass !== root ? `/${bass} 低音` : ""}`;
}

function normalizeTonalSymbol(symbol: string): string {
  return symbol
    .replace(/^([A-G](?:#|b)?)M($|\/)/, "$1$2")
    .replace("maj", "maj")
    .replace("min", "m");
}

function parseSymbolRoot(symbol: string): { root: string; suffix: string } {
  const chordPart = symbol.split("/")[0];
  const match = chordPart.match(/^([A-G](?:#|b)?)(.*)$/);

  return {
    root: match?.[1] ?? symbol,
    suffix: match?.[2] ?? "",
  };
}

function candidateKey(candidate: ChordCandidate): string {
  return candidate.symbol;
}

function pushUnique(candidates: ChordCandidate[], candidate: ChordCandidate): void {
  const existingIndex = candidates.findIndex((item) => candidateKey(item) === candidateKey(candidate));

  if (existingIndex === -1) {
    candidates.push(candidate);
    return;
  }

  if (candidate.confidence > candidates[existingIndex].confidence) {
    candidates[existingIndex] = candidate;
  }
}

function buildLocalCandidates(
  notes: PianoNote[],
  pitchClasses: string[],
  context: TonalityContext | null,
): ChordCandidate[] {
  const chromas = pitchClasses.map(pitchClassToChroma).sort((a, b) => a - b);
  const bass = [...notes].sort((a, b) => a.midi - b.midi)[0]?.pitchClass;
  const bassChroma = bass ? pitchClassToChroma(bass) : undefined;
  const candidates: ChordCandidate[] = [];

  for (let rootChroma = 0; rootChroma < 12; rootChroma += 1) {
    const intervals = intervalsFromRoot(chromas, rootChroma);
    const root = getPreferredPitchClass(rootChroma, context);

    for (const formula of CHORD_FORMULAS) {
      if (!sameIntervals(intervals, formula.intervals)) {
        continue;
      }

      const slashBass =
        bassChroma !== undefined && bassChroma !== rootChroma
          ? getPreferredPitchClass(bassChroma, context)
          : undefined;
      const bassBonus = bassChroma === rootChroma ? 120 : 0;
      const triadBonus = formula.intervals.length === 3 ? 15 : 0;
      const confidence = 1000 - formula.priority * 5 + bassBonus + triadBonus - formula.suffix.length;

      pushUnique(candidates, {
        symbol: formatSymbol(root, formula.suffix, slashBass),
        chineseName: formatChinese(root, formula.chinese, slashBass),
        bass: slashBass,
        notes: pitchClasses,
        confidence,
      });
    }
  }

  return candidates;
}

function buildTonalCandidates(
  notes: PianoNote[],
  pitchClasses: string[],
  context: TonalityContext | null,
): ChordCandidate[] {
  const bass = [...notes].sort((a, b) => a.midi - b.midi)[0]?.pitchClass;
  const bassChroma = bass ? pitchClassToChroma(bass) : undefined;
  const candidates: ChordCandidate[] = [];

  try {
    for (const tonalSymbol of Chord.detect(pitchClasses)) {
      const symbol = normalizeTonalSymbol(tonalSymbol);
      const { root: detectedRoot, suffix } = parseSymbolRoot(symbol);
      const rootChroma = detectedRoot ? pitchClassToChroma(detectedRoot) : null;
      const root = rootChroma === null ? detectedRoot : getPreferredPitchClass(rootChroma, context);
      const slashBass =
        bassChroma !== undefined && rootChroma !== null && bassChroma !== rootChroma
          ? getPreferredPitchClass(bassChroma, context)
          : undefined;
      const symbolWithBass = formatSymbol(root, suffix, slashBass);

      pushUnique(candidates, {
        symbol: symbolWithBass,
        chineseName: formatChinese(root || symbol, DEFAULT_CHINESE, slashBass),
        bass: slashBass,
        notes: pitchClasses,
        confidence: 520 - symbol.length,
      });
    }
  } catch {
    return [];
  }

  return candidates;
}

export function detectChord(
  selectedNotes: PianoNote[],
  context: TonalityContext | null = null,
): { primary: ChordCandidate | null; alternatives: ChordCandidate[] } {
  const sortedNotes = [...selectedNotes].sort((a, b) => a.midi - b.midi);
  const pitchClasses = uniquePitchClasses(sortedNotes);

  if (pitchClasses.length < 3) {
    return {
      primary: null,
      alternatives: [],
    };
  }

  const candidates = [
    ...buildLocalCandidates(sortedNotes, pitchClasses, context),
    ...buildTonalCandidates(sortedNotes, pitchClasses, context),
  ].sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    return a.symbol.length - b.symbol.length;
  });

  const deduped: ChordCandidate[] = [];
  for (const candidate of candidates) {
    pushUnique(deduped, candidate);
  }

  return {
    primary: deduped[0] ?? null,
    alternatives: deduped.slice(1, 5),
  };
}
