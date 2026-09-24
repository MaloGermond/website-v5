import { ALL_TAGS } from './stickyBoardModel.js';

const SWATCH_CLASSES = {
  1: 'bg-note-1',
  2: 'bg-note-2',
  3: 'bg-note-3',
  4: 'bg-note-4',
  5: 'bg-note-5',
};

function Chip({ label, pressed, swatch, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={pressed ? 'true' : 'false'}
      onClick={onClick}
      class={[
        'inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm',
        'transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise',
        pressed
          ? 'border-on-surface-default bg-on-surface-default text-background'
          : 'border-surface-raise text-on-surface-default hover:border-on-surface-subdue',
      ].join(' ')}
    >
      {swatch && (
        <span
          aria-hidden="true"
          class={`size-3 rounded-full ring-1 ring-current/20 ${SWATCH_CLASSES[swatch]}`}
        />
      )}
      {label}
    </button>
  );
}

/**
 * Filter chips derived from the board's tags. Pressed state is conveyed by
 * aria-pressed and an inverted fill, and every chip carries a text label.
 */
export default function TagFilter({
  tags,
  colorForTag,
  activeTag,
  onChange,
  ui,
}) {
  return (
    <div role="group" aria-label={ui.filterLabel} class="flex flex-wrap gap-2">
      <Chip
        label={ui.allTags}
        pressed={activeTag === ALL_TAGS}
        onClick={() => onChange(ALL_TAGS)}
      />
      {tags.map((tag) => (
        <Chip
          label={tag}
          swatch={colorForTag(tag)}
          pressed={activeTag === tag}
          onClick={() => onChange(activeTag === tag ? ALL_TAGS : tag)}
        />
      ))}
    </div>
  );
}
