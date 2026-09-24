/** @pure */
function formatCounter(template, current, total) {
  return template.replace('{current}', current).replace('{total}', total);
}

function ArrowButton({ label, disabled, onClick, direction }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled ? 'true' : 'false'}
      onClick={() => !disabled && onClick()}
      class={[
        'grid size-11 place-items-center rounded-full border border-surface-raise text-on-surface-default',
        'transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:border-on-surface-subdue',
      ].join(' ')}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        class="size-4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          d={direction === 'previous' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Previous/next buttons for a sequence. Buttons stay focusable at the ends
 * (aria-disabled rather than disabled) so keyboard focus is never lost.
 */
export default function SequenceControls({ step, count, goTo, ui }) {
  return (
    <div class="flex shrink-0 items-center gap-3">
      <ArrowButton
        label={ui.previous}
        direction="previous"
        disabled={step === 0}
        onClick={() => goTo(step - 1)}
      />
      <span class="min-w-24 text-center text-sm tabular-nums text-on-surface-subdue">
        {formatCounter(ui.stepCounter, step + 1, count)}
      </span>
      <ArrowButton
        label={ui.next}
        direction="next"
        disabled={step === count - 1}
        onClick={() => goTo(step + 1)}
      />
    </div>
  );
}
