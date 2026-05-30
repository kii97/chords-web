# AGENTS.md

## Project Overview

Chord Piano is a Web app built with Vite, React, and TypeScript. It displays a three-octave piano keyboard, lets users select notes with the mouse or computer keyboard, detects the chord name, and spells note/chord names according to the selected tonality.

## Common Commands

- Install dependencies: `npm install`
- Run the web app in development: `npm run dev`
- Run tests: `npm test`
- Build the web app: `npm run build`
- Preview the production build locally: `npm run preview`

Run `npm test` and `npm run build` after behavioral changes.

## Important Files

- `src/App.tsx`: Main UI, keyboard interaction, selected notes, tonality selector, playback controls.
- `src/lib/chordDetection.ts`: Chord candidate generation, ranking, and Tonal.js integration.
- `src/lib/tonality.ts`: Key/tonality options and enharmonic spelling rules.
- `src/lib/piano.ts`: MIDI-to-note helpers and three-octave range constants.
- `src/lib/keyboard.ts`: Computer-keyboard-to-piano-note mapping.
- `src/lib/audio.ts`: Sampled piano playback with synth fallback.
- `scripts/generate-piano-samples.mjs`: Generates the bundled synthetic piano-like WAV samples.
- `src/App.test.tsx` and `src/lib/chordDetection.test.ts`: UI and chord-detection regression tests.

## Implementation Notes

- Keep chord theory logic in `src/lib/*`; keep `src/App.tsx` focused on UI state and rendering.
- Prefer `@tonaljs/tonal` for music-theory primitives instead of hand-rolling broad theory behavior.
- Local chord formulas in `src/lib/chordDetection.ts` are used to improve naming, Chinese descriptions, and ranking. Add tests for every new formula or naming rule.
- Enharmonic spelling must respect `TonalityContext`. For example, the same pitch set may display as `G#` in E major but `Ab` in Eb minor.
- Use `formatPianoNoteName()` for displayed selected note names that include octaves. Do not display `note.name` in tonality-sensitive UI.
- Use `getPreferredPitchClass()` for displayed pitch classes without octaves.
- Internal piano keys use sharp names such as `D#4` for stable IDs and test selectors. User-facing names may differ by tonality.
- The black-key position is centered on the boundary between adjacent white keys. Keep `blackKeyOffset()` aligned with the CSS `translateX(-50%)`.
- Piano audio uses local generated per-key samples from `public/samples/piano/`. Keep samples redistributable; do not add third-party recordings without checking their license.
- `playNote(note, muted)` should remain the public UI-facing audio API unless there is a strong reason to change it.

## UI Guidelines

- Keep the app as a working tool, not a marketing page.
- Use lucide icons for button icons when an icon exists.
- Keep controls compact and readable; avoid nested cards.
- Text in controls must fit at the supported window sizes.
- UI strings are intentionally Chinese. Preserve UTF-8 text even if PowerShell displays mojibake in command output.

## Testing Expectations

- Add chord-detection tests for new recognition, ranking, slash-chord, or enharmonic-spelling behavior.
- Add React Testing Library tests for UI behavior such as selected notes, tonality changes, playback button state, keyboard shortcuts, and clear behavior.
- Keep tests deterministic; avoid relying on real audio output.
- Test sample selection and playback-rate math in unit tests rather than trying to assert audible output.

## Dependency Notes

- The project currently uses React 19, Vite 6, Vitest 2, and `@tonaljs/tonal`.
- Do not run `npm audit fix --force` as a routine cleanup; it can introduce breaking dependency changes.
- `npm run dev` starts the Vite web dev server.
