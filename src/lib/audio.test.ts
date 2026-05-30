import { describe, expect, it } from "vitest";
import { chooseNearestPianoSample, getSamplePlaybackRate } from "./audio";

describe("sampled piano audio", () => {
  it.each([
    [48, 48],
    [49, 49],
    [50, 50],
    [62, 62],
    [83, 83],
  ])("maps midi %s to nearest sample %s", (noteMidi, sampleMidi) => {
    expect(chooseNearestPianoSample(noteMidi).midi).toBe(sampleMidi);
  });

  it("computes playback rate by semitone distance", () => {
    expect(getSamplePlaybackRate(60, 60)).toBeCloseTo(1);
    expect(getSamplePlaybackRate(61, 60)).toBeCloseTo(2 ** (1 / 12));
    expect(getSamplePlaybackRate(59, 60)).toBeCloseTo(2 ** (-1 / 12));
  });
});
