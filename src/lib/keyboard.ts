import type { PianoNote } from "../types";

type KeyBinding = {
  code: string;
  shift?: boolean;
  label: string;
};

const LOW_OCTAVE_BINDINGS: KeyBinding[] = [
  { code: "KeyZ", label: "Z" },
  { code: "KeyS", label: "S" },
  { code: "KeyX", label: "X" },
  { code: "KeyD", label: "D" },
  { code: "KeyC", label: "C" },
  { code: "KeyV", label: "V" },
  { code: "KeyG", label: "G" },
  { code: "KeyB", label: "B" },
  { code: "KeyH", label: "H" },
  { code: "KeyN", label: "N" },
  { code: "KeyJ", label: "J" },
  { code: "KeyM", label: "M" },
];

const TOP_ROW_BINDINGS: KeyBinding[] = [
  { code: "KeyQ", label: "Q" },
  { code: "Digit2", label: "2" },
  { code: "KeyW", label: "W" },
  { code: "Digit3", label: "3" },
  { code: "KeyE", label: "E" },
  { code: "KeyR", label: "R" },
  { code: "Digit5", label: "5" },
  { code: "KeyT", label: "T" },
  { code: "Digit6", label: "6" },
  { code: "KeyY", label: "Y" },
  { code: "Digit7", label: "7" },
  { code: "KeyU", label: "U" },
];

export function buildKeyboardBindings(notes: PianoNote[]): Map<number, KeyBinding> {
  const bindings = new Map<number, KeyBinding>();

  notes.forEach((note, index) => {
    if (index < LOW_OCTAVE_BINDINGS.length) {
      bindings.set(note.midi, LOW_OCTAVE_BINDINGS[index]);
      return;
    }

    if (index < LOW_OCTAVE_BINDINGS.length + TOP_ROW_BINDINGS.length) {
      bindings.set(note.midi, TOP_ROW_BINDINGS[index - LOW_OCTAVE_BINDINGS.length]);
      return;
    }

    const highIndex = index - LOW_OCTAVE_BINDINGS.length - TOP_ROW_BINDINGS.length;
    if (highIndex < TOP_ROW_BINDINGS.length) {
      const binding = TOP_ROW_BINDINGS[highIndex];
      bindings.set(note.midi, {
        ...binding,
        shift: true,
        label: `Shift+${binding.label}`,
      });
    }
  });

  return bindings;
}

export function findNoteByKeyboardEvent(
  event: KeyboardEvent,
  notes: PianoNote[],
  bindings: Map<number, KeyBinding>,
): PianoNote | null {
  for (const note of notes) {
    const binding = bindings.get(note.midi);
    if (!binding) {
      continue;
    }

    const shiftMatches = Boolean(binding.shift) === event.shiftKey;
    if (binding.code === event.code && shiftMatches) {
      return note;
    }
  }

  return null;
}

export function bindingId(binding: KeyBinding): string {
  return `${binding.shift ? "Shift+" : ""}${binding.code}`;
}
