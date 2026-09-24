import { noteScatter } from './stickyBoardModel.js';

// Literal class names so Tailwind can see them (tokens live in global.css).
const COLOR_CLASSES = {
  1: 'bg-note-1',
  2: 'bg-note-2',
  3: 'bg-note-3',
  4: 'bg-note-4',
  5: 'bg-note-5',
};

/** @pure */
function colorClass(colorSlot, colored) {
  if (!colored) return 'bg-surface-default';
  return COLOR_CLASSES[colorSlot] ?? COLOR_CLASSES[1];
}

/** @pure */
function visibilityClass(hidden, dimmed) {
  if (hidden) return 'invisible opacity-0';
  if (dimmed) return 'visible opacity-40 grayscale';
  return 'visible opacity-100';
}

/** @pure - CSS custom properties for the seeded rotation and the pile offset */
function noteStyle(note, pile, delayMs) {
  const { rotate, offsetX } = noteScatter(note.id);
  return {
    '--note-rotate': `${pile ? pile.rotate : rotate}deg`,
    '--note-x': pile ? `${pile.x * 100}%` : `${offsetX}px`,
    '--note-y': pile ? `${pile.y * 100}%` : '0px',
    transitionDelay: `${delayMs}ms`,
  };
}

/** @impure - DOM event handler: selects the note on Enter / Space */
function onKeySelect(event, onSelect) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onSelect();
}

/**
 * A user-test verbatim. Static by default (readable without JS); pass
 * `onSelect` to make it a focusable toggle.
 *   colorSlot   1..5, from the note's tag (see noteColorSlot)
 *   colored     tag color on (false = neutral, before the sort)
 *   scattered   seeded ±2–4° rotation (from md up)
 *   pile        { x, y, rotate } offset from its slot, for the unsorted pile
 *   dimmed      filtered out / not linked: stays in place, faded
 *   marks       feature numbers shown as small pips
 *   compact     smaller text at every breakpoint (dense boards)
 */
export default function StickyNote({
  note,
  colorSlot = 1,
  colored = true,
  scattered = true,
  pile = null,
  hidden = false,
  dimmed = false,
  active = false,
  marks = [],
  delayMs = 0,
  onSelect,
  compact = false,
  id,
  class: classList = '',
}) {
  const interactive = Boolean(onSelect);
  const interactionProps = interactive
    ? {
        role: 'button',
        tabIndex: hidden ? -1 : 0,
        'aria-pressed': active ? 'true' : 'false',
        onClick: onSelect,
        onKeyDown: (event) => onKeySelect(event, onSelect),
      }
    : {};

  return (
    <article
      id={id}
      {...interactionProps}
      aria-hidden={hidden ? 'true' : undefined}
      style={noteStyle(note, pile, delayMs)}
      class={[
        'group relative rounded-sm p-3 text-left text-on-surface-default shadow-[0_1px_2px_rgb(0_0_0/10%),0_4px_12px_rgb(0_0_0/6%)]',
        'transition-[translate,rotate,scale,opacity,background-color,filter] duration-500 ease-out motion-reduce:transition-none',
        'md:[translate:var(--note-x)_var(--note-y)]',
        scattered ? 'md:[rotate:var(--note-rotate)]' : '',
        interactive
          ? 'cursor-pointer outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise hover:z-10 hover:scale-105 focus-visible:z-10 focus-visible:scale-105'
          : '',
        active ? 'z-10 scale-105 ring-2 ring-on-surface-raise' : '',
        visibilityClass(hidden, dimmed),
        colorClass(colorSlot, colored),
        classList,
      ].join(' ')}
    >
      <blockquote
        class={`text-sm leading-snug [overflow-wrap:break-word] ${compact ? '' : 'lg:text-base'}`}
      >
        <p class="whitespace-pre-line [text-wrap:pretty]">{note.quote}</p>
      </blockquote>
      <footer class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {note.user && <span class="font-medium">{note.user}</span>}
        {note.timestamp && (
          <time
            class={`tabular-nums text-on-surface-default/70 ${active ? '' : 'md:hidden md:group-hover:inline md:group-focus-visible:inline'}`}
          >
            {note.timestamp}
          </time>
        )}
        <span
          class={`max-w-full rounded-full border border-current/20 px-2 py-0.5 font-medium ${active ? 'whitespace-normal' : 'truncate group-hover:whitespace-normal group-focus-visible:whitespace-normal'}`}
        >
          {note.tag}
        </span>
        {marks.length > 0 && (
          <span class="ms-auto flex gap-1" aria-hidden="true">
            {marks.map((mark) => (
              <span class="grid size-5 place-items-center rounded-full bg-on-surface-default text-[10px] font-bold text-background tabular-nums">
                {mark}
              </span>
            ))}
          </span>
        )}
      </footer>
    </article>
  );
}
