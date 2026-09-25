import StickyNote from './StickyNote.jsx';

function StepHeader({ step, index, ui, subActionsOpen, visible, staggerMs }) {
  return (
    <header
      class={`flex flex-col gap-2 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${visible ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-1'}`}
      style={{ transitionDelay: `${staggerMs}ms` }}
    >
      <span class="text-xs font-medium tabular-nums text-on-surface-subdue">
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 class="text-lg font-medium leading-tight text-on-surface-default [text-wrap:balance]">
        {step.label}
      </h3>
      {step.subActions?.length > 0 && (
        <details
          class="group/sub text-sm text-on-surface-subdue"
          open={subActionsOpen}
        >
          <summary class="flex min-h-6 cursor-pointer list-none items-center gap-1 outline-offset-2 hover:text-on-surface-default focus-visible:outline-2 focus-visible:outline-on-surface-raise [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              class="inline-block transition-transform duration-200 group-open/sub:rotate-90 motion-reduce:transition-none"
            >
              ›
            </span>
            {`${ui.subActions} (${step.subActions.length})`}
          </summary>
          <ul class="mt-2 flex flex-col gap-1 ps-3">
            {step.subActions.map((action) => (
              <li>{action.label}</li>
            ))}
          </ul>
        </details>
      )}
    </header>
  );
}

// Per-column delay for the step-header stagger-in (see `stepsVisible`).
export const STEP_STAGGER_MS = 80;
export const STEP_REVEAL_MS = 500;

/**
 * The shared timeline referential: one column per UserStoryStep (sorted by
 * order), notes clustered under their step. Every mode that shows the
 * timeline renders through this grid, so positions never jump between them.
 *   noteProps(note, position) → extra StickyNote props (state per mode)
 *   stepExtra(step, index)    → optional node under a step header
 *   above / below             → rows aligned on the same columns (curve, features)
 *   stepsVisible               → step headers AND column dividers shown,
 *                                 headers staggered by column (still reserve
 *                                 their box via `invisible` rather than
 *                                 removing them, so hiding them never
 *                                 changes the grid's height)
 * From md up the columns sit side by side; below md each step is a full-width
 * card with its notes stacked.
 */
export default function BoardGrid({
  steps,
  notesByStep,
  noteProps = () => ({}),
  stepExtra,
  above,
  below,
  idPrefix,
  ui,
  subActionsOpen = false,
  stepsVisible = true,
}) {
  const offsets = columnNoteOffsets(steps, notesByStep);
  return (
    <div class="md:max-lg:overflow-x-auto md:max-lg:pb-4">
      <div class="md:max-lg:min-w-[880px]">
        {above}
        <ol
          class="grid grid-cols-1 gap-4 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:gap-0"
          style={{ '--cols': steps.length }}
        >
          {steps.map((step, columnIndex) => (
            <li
              class={`flex flex-col gap-6 rounded-lg border p-4 transition-colors duration-500 motion-reduce:transition-none md:rounded-none md:border-0 md:border-s md:px-3 md:py-0 md:first:border-s-0 ${stepsVisible ? 'border-surface-default' : 'border-transparent'}`}
            >
              <StepHeader
                step={step}
                index={columnIndex}
                ui={ui}
                subActionsOpen={subActionsOpen}
                visible={stepsVisible}
                staggerMs={stepsVisible ? columnIndex * STEP_STAGGER_MS : 0}
              />
              {stepExtra?.(step, columnIndex)}
              <div class="flex flex-col gap-4">
                {(notesByStep[step.id] ?? []).map((note, rowIndex) => (
                  <StickyNote
                    note={note}
                    id={idPrefix ? `${idPrefix}-${note.id}` : undefined}
                    {...noteProps(note, {
                      columnIndex,
                      rowIndex,
                      columnCount: steps.length,
                      orderIndex: offsets[step.id] + rowIndex,
                    })}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
        {below}
      </div>
    </div>
  );
}

/** @pure - index of each column's first note in reading order (for staggers) */
function columnNoteOffsets(steps, notesByStep) {
  let total = 0;
  return Object.fromEntries(
    steps.map((step) => {
      const offset = total;
      total += (notesByStep[step.id] ?? []).length;
      return [step.id, offset];
    })
  );
}
