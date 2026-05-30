import { describe, expect, it } from "vitest";
import { detectChord } from "./chordDetection";
import { midiToNote } from "./piano";

function notes(midi: number[]) {
  return midi.map(midiToNote);
}

describe("detectChord", () => {
  it.each([
    [[48, 52, 55], "C"],
    [[48, 51, 55], "Cm"],
    [[48, 51, 54], "Cdim"],
    [[48, 52, 56], "Caug"],
    [[48, 50, 55], "Csus2"],
    [[48, 53, 55], "Csus4"],
    [[48, 52, 55, 57], "C6"],
    [[48, 51, 55, 57], "Cm6"],
    [[48, 52, 55, 58], "C7"],
    [[48, 52, 55, 59], "Cmaj7"],
    [[48, 51, 55, 58], "Cm7"],
    [[48, 51, 54, 58], "Cm7b5"],
    [[48, 51, 54, 57], "Cdim7"],
    [[48, 52, 55, 58, 62], "C9"],
    [[48, 52, 55, 59, 62], "Cmaj9"],
    [[48, 51, 55, 58, 62], "Cm9"],
    [[48, 52, 55, 58, 62, 65], "C11"],
    [[48, 52, 55, 58, 62, 65, 69], "C13"],
    [[48, 52, 55, 62], "Cadd9"],
    [[48, 52, 55, 58, 49], "C7b9"],
    [[48, 52, 55, 58, 51], "C7#9"],
  ])("recognizes %s as %s", (input, expected) => {
    expect(detectChord(notes(input)).primary?.symbol).toBe(expected);
  });

  it("shows slash chord names when the lowest selected note is not the root", () => {
    expect(detectChord(notes([52, 55, 60])).primary?.symbol).toBe("C/E");
  });

  it("does not name fewer than three distinct pitch classes", () => {
    expect(detectChord(notes([48, 52])).primary).toBeNull();
    expect(detectChord(notes([48, 60, 72])).primary).toBeNull();
  });

  it("spells enharmonic chord names from the selected tonality", () => {
    const abMajorKeys = notes([56, 60, 63]);

    expect(detectChord(abMajorKeys, { tonic: "E", mode: "major" }).primary?.symbol).toBe("G#");
    expect(detectChord(abMajorKeys, { tonic: "Eb", mode: "minor" }).primary?.symbol).toBe("Ab");
  });
});
