import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("updates the chord name when piano keys are clicked", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("note-C3"));
    fireEvent.click(screen.getByTestId("note-E3"));
    fireEvent.click(screen.getByTestId("note-G3"));

    expect(screen.getByTestId("primary-chord")).toHaveTextContent("C");
    expect(screen.getByTestId("chinese-name")).toHaveTextContent("C 大三和弦");

    fireEvent.click(screen.getByTestId("note-E3"));
    expect(screen.getByTestId("primary-chord")).toHaveTextContent("请选择至少 3 个音");
  });

  it("toggles notes from keyboard shortcuts", () => {
    render(<App />);

    fireEvent.keyDown(window, { code: "KeyZ" });
    fireEvent.keyUp(window, { code: "KeyZ" });
    fireEvent.keyDown(window, { code: "KeyC" });
    fireEvent.keyUp(window, { code: "KeyC" });
    fireEvent.keyDown(window, { code: "KeyB" });
    fireEvent.keyUp(window, { code: "KeyB" });

    expect(screen.getByTestId("primary-chord")).toHaveTextContent("C");

    fireEvent.keyDown(window, { code: "Escape" });
    expect(screen.getByTestId("primary-chord")).toHaveTextContent("请选择至少 3 个音");
  });

  it("enables chord playback only when notes are selected", () => {
    render(<App />);

    const playChordButton = screen.getByRole("button", { name: "播放" });
    expect(playChordButton).toBeDisabled();

    fireEvent.click(screen.getByTestId("note-C3"));
    expect(playChordButton).toBeEnabled();
  });

  it("uses the selected tonality to spell enharmonic chord names", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("note-G#3"));
    fireEvent.click(screen.getByTestId("note-C4"));
    fireEvent.click(screen.getByTestId("note-D#4"));

    expect(screen.getByTestId("primary-chord")).toHaveTextContent("G#");

    fireEvent.change(screen.getByRole("combobox", { name: "选择调式" }), {
      target: { value: "Eb:minor" },
    });

    expect(screen.getByTestId("primary-chord")).toHaveTextContent("Ab");
  });

  it("uses the selected tonality to spell selected note names", () => {
    render(<App />);

    fireEvent.change(screen.getByRole("combobox", { name: "选择调式" }), {
      target: { value: "Eb:major" },
    });
    fireEvent.click(screen.getByTestId("note-D#4"));

    expect(screen.getByTestId("selected-notes")).toHaveTextContent("Eb4");
  });
});
