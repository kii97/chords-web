import { useEffect, useMemo, useRef, useState } from "react";
import { Music2, Play, Trash2, Volume2, VolumeX } from "lucide-react";
import { detectChord } from "./lib/chordDetection";
import { bindingId, buildKeyboardBindings, findNoteByKeyboardEvent } from "./lib/keyboard";
import { buildPianoRange, pitchClassToChroma, uniquePitchClasses } from "./lib/piano";
import {
  formatPianoNoteName,
  getPreferredPitchClass,
  getTonalityContext,
  TONALITY_OPTIONS,
} from "./lib/tonality";
import { playNote, preloadPianoSamples } from "./lib/audio";
import type { PianoNote } from "./types";

const pianoNotes = buildPianoRange();
const whiteNotes = pianoNotes.filter((note) => !note.isBlack);

function getWhiteIndex(note: PianoNote): number {
  return whiteNotes.findIndex((whiteNote) => whiteNote.midi === note.midi);
}

function blackKeyOffset(note: PianoNote): number {
  const previousWhiteIndex = whiteNotes.findIndex((whiteNote) => whiteNote.midi > note.midi) - 1;
  return previousWhiteIndex + 1;
}

export function App() {
  const [selectedMidi, setSelectedMidi] = useState<Set<number>>(() => new Set());
  const [muted, setMuted] = useState(false);
  const [tonalityValue, setTonalityValue] = useState("auto");
  const pressedBindings = useRef(new Set<string>());

  const bindings = useMemo(() => buildKeyboardBindings(pianoNotes), []);
  const tonalityContext = useMemo(() => getTonalityContext(tonalityValue), [tonalityValue]);
  const selectedNotes = useMemo(
    () => pianoNotes.filter((note) => selectedMidi.has(note.midi)),
    [selectedMidi],
  );
  const chordResult = useMemo(
    () => detectChord(selectedNotes, tonalityContext),
    [selectedNotes, tonalityContext],
  );
  const selectedPitchClasses = useMemo(
    () =>
      uniquePitchClasses(selectedNotes).map((pitchClass) =>
        getPreferredPitchClass(pitchClassToChroma(pitchClass), tonalityContext),
      ),
    [selectedNotes, tonalityContext],
  );

  useEffect(() => {
    void preloadPianoSamples();
  }, []);

  const toggleNote = (note: PianoNote) => {
    setSelectedMidi((current) => {
      const next = new Set(current);
      if (next.has(note.midi)) {
        next.delete(note.midi);
      } else {
        next.add(note.midi);
      }
      return next;
    });
    playNote(note, muted);
  };

  const playSelectedChord = () => {
    selectedNotes.forEach((note) => playNote(note, muted));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.code === "Escape") {
        setSelectedMidi(new Set());
        return;
      }

      const note = findNoteByKeyboardEvent(event, pianoNotes, bindings);
      if (!note) {
        return;
      }

      const binding = bindings.get(note.midi);
      if (!binding) {
        return;
      }

      const id = bindingId(binding);
      if (pressedBindings.current.has(id)) {
        return;
      }

      event.preventDefault();
      pressedBindings.current.add(id);
      toggleNote(note);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      for (const binding of bindings.values()) {
        const id = bindingId(binding);
        if (binding.code === event.code) {
          pressedBindings.current.delete(id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [bindings, muted]);

  return (
    <main className="app-shell">
      <section className="top-panel" aria-label="和弦识别结果">
        <div className="brand-line">
          <span className="mark" aria-hidden="true">
            <Music2 size={18} strokeWidth={2.4} />
          </span>
          <span>Chord Piano</span>
        </div>

        <div className="result-row">
          <div className="primary-result">
            <span className="eyebrow">当前和弦</span>
            <h1 data-testid="primary-chord">
              {chordResult.primary ? chordResult.primary.symbol : "请选择至少 3 个音"}
            </h1>
            <p data-testid="chinese-name">
              {chordResult.primary
                ? chordResult.primary.chineseName
                : "点击琴键或使用键盘快捷键，组成和弦后会实时命名。"}
            </p>
          </div>

          <div className="note-strip" aria-label="已选择音符" data-testid="selected-notes">
            {selectedNotes.length === 0 ? (
              <span className="empty-note">未选择音符</span>
            ) : (
              selectedNotes.map((note) => (
                <span className="note-chip" key={note.midi}>
                  {formatPianoNoteName(note, tonalityContext)}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="meta-row">
          <div className="alternatives" aria-label="备选和弦名称">
            <span className="meta-label">备选</span>
            {chordResult.alternatives.length > 0 ? (
              chordResult.alternatives.map((candidate) => (
                <span className="alt-chip" key={candidate.symbol}>
                  {candidate.symbol}
                </span>
              ))
            ) : (
              <span className="quiet-text">暂无</span>
            )}
          </div>

          <div className="controls">
            <label className="tonality-field">
              <span>调式</span>
              <select
                value={tonalityValue}
                onChange={(event) => setTonalityValue(event.target.value)}
                aria-label="选择调式"
              >
                {TONALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="control-button"
              type="button"
              onClick={playSelectedChord}
              disabled={selectedNotes.length === 0}
              title="播放所有已选琴键的和声"
              aria-label="播放"
            >
              <Play size={18} aria-hidden="true" />
              播放
            </button>
            <button
              className="control-button"
              type="button"
              onClick={() => setMuted((value) => !value)}
              title={muted ? "打开声音" : "静音"}
              aria-label={muted ? "打开声音" : "静音"}
            >
              {muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
              {muted ? "静音" : "发声"}
            </button>
            <button
              className="control-button"
              type="button"
              onClick={() => setSelectedMidi(new Set())}
              title="清空已选音符"
            >
              <Trash2 size={18} aria-hidden="true" />
              清空
            </button>
          </div>
        </div>
      </section>

      <section className="keyboard-section" aria-label="三八度钢琴键盘">
        <div className="keyboard-frame">
          <div
            className="piano-keyboard"
            style={{ "--white-key-count": whiteNotes.length } as React.CSSProperties}
          >
            {pianoNotes
              .filter((note) => !note.isBlack)
              .map((note) => {
                const binding = bindings.get(note.midi);
                const selected = selectedMidi.has(note.midi);
                return (
                  <button
                    className={`piano-key white-key${selected ? " is-selected" : ""}`}
                    type="button"
                    key={note.midi}
                    onClick={() => toggleNote(note)}
                    aria-pressed={selected}
                    aria-label={note.name}
                    data-testid={`note-${note.name}`}
                    style={{ gridColumn: `${getWhiteIndex(note) + 1}` }}
                  >
                    <span className="key-label">{note.name}</span>
                    {binding ? <span className="key-shortcut">{binding.label}</span> : null}
                  </button>
                );
              })}

            {pianoNotes
              .filter((note) => note.isBlack)
              .map((note) => {
                const binding = bindings.get(note.midi);
                const selected = selectedMidi.has(note.midi);
                return (
                  <button
                    className={`piano-key black-key${selected ? " is-selected" : ""}`}
                    type="button"
                    key={note.midi}
                    onClick={() => toggleNote(note)}
                    aria-pressed={selected}
                    aria-label={note.name}
                    data-testid={`note-${note.name}`}
                    style={{ left: `calc(${blackKeyOffset(note)} * var(--white-key-width))` }}
                  >
                    <span className="key-label">{note.name}</span>
                    {binding ? <span className="key-shortcut">{binding.label}</span> : null}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="footer-status" aria-label="音级摘要">
          <span>音级</span>
          <strong>{selectedPitchClasses.length ? selectedPitchClasses.join(" · ") : "无"}</strong>
          <span>Esc 清空</span>
        </div>
      </section>
    </main>
  );
}
