import { useState } from 'preact/hooks';

import Screen from './Screen.jsx';
import StickyNote from './StickyNote.jsx';
import TagFilter from './TagFilter.jsx';
import { useHydrated, useSharedTag } from './useSequence.js';
import {
  ALL_TAGS,
  countTags,
  deriveImpactedScreens,
  filterNotesByTag,
  noteColorSlot,
  notesForScreen,
} from './stickyBoardModel.js';

const SWATCH_CLASSES = {
  1: 'bg-note-1',
  2: 'bg-note-2',
  3: 'bg-note-3',
  4: 'bg-note-4',
  5: 'bg-note-5',
};

function TagBadges({ notes, board }) {
  return (
    <ul class="flex flex-wrap gap-1">
      {countTags(notes).map(({ tag, count }) => (
        <li class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-surface-raise px-2 py-0.5 text-xs text-on-surface-default">
          <span
            aria-hidden="true"
            class={`size-2 rounded-full ${SWATCH_CLASSES[board.colorForTag(tag)]}`}
          />
          {tag}{' '}
          <span class="tabular-nums text-on-surface-subdue">{`×${count}`}</span>
        </li>
      ))}
    </ul>
  );
}

// Without JS every screen shows its verbatims; once hydrated they collapse
// behind a toggle.
function ScreenCard({ screen, notes, board, open, onToggle, idPrefix }) {
  const hydrated = useHydrated();
  const panelId = `${idPrefix}-${screen.id}-notes`;
  return (
    <li class="flex flex-col gap-3">
      <Screen screen={screen} highlighted={open} ratio="4 / 5">
        <TagBadges notes={notes} board={board} />
        {hydrated && (
          <button
            type="button"
            aria-expanded={open ? 'true' : 'false'}
            aria-controls={panelId}
            onClick={onToggle}
            class="min-h-10 self-start rounded-full border border-surface-raise px-4 text-sm text-on-surface-default transition-transform duration-200 ease-out outline-offset-2 hover:border-on-surface-subdue focus-visible:outline-2 focus-visible:outline-on-surface-raise active:scale-[0.97] motion-reduce:transition-none"
          >
            {open ? board.ui.hideNotes : board.ui.showNotes}
          </button>
        )}
      </Screen>
      <div id={panelId} hidden={hydrated && !open} class="flex flex-col gap-3">
        {notes.map((note) => (
          <StickyNote
            note={note}
            colorSlot={noteColorSlot(note, board.tags)}
            scattered={false}
          />
        ))}
      </div>
    </li>
  );
}

/**
 * Summary mode: the impacted screens, derived from the (filtered) notes —
 * a new screenId on a note shows up here with no other change. Each screen
 * lists its tags and opens the verbatims that justify it.
 */
export default function SummaryView({ board, boardId, idPrefix, anchorId }) {
  const [tag, setTag] = useSharedTag(boardId, ALL_TAGS);
  const [openScreenId, setOpenScreenId] = useState(null);
  const visibleNotes = filterNotesByTag(board.notes, tag);
  const screens = deriveImpactedScreens(visibleNotes, board.screens);

  return (
    <section
      id={anchorId}
      aria-labelledby={`${idPrefix}-title`}
      class="flex scroll-mt-24 flex-col gap-8"
    >
      <h3
        id={`${idPrefix}-title`}
        class="font-avara text-2xl text-on-surface-default [text-wrap:balance]"
      >
        {board.ui.impactedScreens}
      </h3>
      <TagFilter
        tags={board.tags}
        colorForTag={board.colorForTag}
        activeTag={tag}
        onChange={setTag}
        ui={board.ui}
      />
      {screens.length === 0 ? (
        <div class="flex flex-col items-start gap-3">
          <p class="text-on-surface-subdue">{board.ui.emptyFilter}</p>
          <button
            type="button"
            onClick={() => setTag(ALL_TAGS)}
            class="min-h-10 rounded-full border border-surface-raise px-4 text-sm text-on-surface-default outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise"
          >
            {board.ui.allTags}
          </button>
        </div>
      ) : (
        <ul class="grid grid-cols-2 items-start gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {screens.map((screen) => (
            <ScreenCard
              screen={screen}
              notes={notesForScreen(visibleNotes, screen.id)}
              board={board}
              idPrefix={idPrefix}
              open={openScreenId === screen.id}
              onToggle={() =>
                setOpenScreenId(openScreenId === screen.id ? null : screen.id)
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
