import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import BoardGrid, { STEP_REVEAL_MS, STEP_STAGGER_MS } from './BoardGrid.jsx';
import { deriveBoard } from './StickyBoard.jsx';
import { noteColorSlot, notePileOffset } from './stickyBoardModel.js';

const NOTE_STAGGER_MS = 100;

const STATES = [
  { key: 'pile', label: 'Non triées', piled: true, stepsVisible: false },
  { key: 'sorted', label: 'Triées par étape', piled: false, stepsVisible: true },
];

/** @pure - per-note StickyNote props for the pile vs. sorted state */
function noteProps(note, position, piled, board) {
  return {
    colorSlot: noteColorSlot(note, board.tags),
    colored: !piled,
    pile: piled
      ? notePileOffset(note.id, position.columnIndex, position.columnCount, position.rowIndex)
      : null,
    delayMs: Math.min(position.orderIndex * NOTE_STAGGER_MS, 1200),
  };
}

/**
 * Demo-only: the board's two entry states — every note piled up unsorted
 * (before the reading pass, step headers hidden) vs. sorted into its step's
 * column — toggled by chips. Reuses the same pile mechanic as
 * StorySequence's sort phase (see notePileOffset), standalone and without
 * the rest of the narrative. Going to "sorted" reveals the step headers
 * first (staggered), then releases the notes into their columns, so the
 * sort reads as "here's where they go" before "here's how they land".
 */
export default function StickyBoardPreview({ data, idPrefix }) {
  const board = useMemo(() => deriveBoard(data), [data]);
  const [stateKey, setStateKey] = useState('sorted');
  const target = STATES.find((state) => state.key === stateKey);
  const [stepsVisible, setStepsVisible] = useState(target.stepsVisible);
  const [piled, setPiled] = useState(target.piled);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return undefined;
    }
    if (!target.stepsVisible) {
      setStepsVisible(false);
      setPiled(true);
      return undefined;
    }
    setStepsVisible(true);
    const releaseDelay = board.steps.length * STEP_STAGGER_MS + STEP_REVEAL_MS;
    const timer = setTimeout(() => setPiled(false), releaseDelay);
    return () => clearTimeout(timer);
  }, [stateKey]);

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap gap-2">
        {STATES.map((state) => (
          <button
            type="button"
            onClick={() => setStateKey(state.key)}
            class={`rounded-full border px-3 py-1 text-sm transition-colors ${
              state.key === stateKey
                ? 'border-on-surface-default bg-on-surface-default text-background'
                : 'border-surface-raise text-on-surface-default hover:border-on-surface-subdue'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>
      <BoardGrid
        steps={board.steps}
        notesByStep={board.notesByStep}
        noteProps={(note, position) => noteProps(note, position, piled, board)}
        idPrefix={idPrefix}
        ui={board.ui}
        stepsVisible={stepsVisible}
      />
    </div>
  );
}
