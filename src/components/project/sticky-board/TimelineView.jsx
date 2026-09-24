import { useState } from 'preact/hooks';

import BoardGrid from './BoardGrid.jsx';
import Screen from './Screen.jsx';
import TagFilter from './TagFilter.jsx';
import { useSharedTag } from './useSequence.js';
import { ALL_TAGS, noteColorSlot } from './stickyBoardModel.js';

function NoteDetail({ note, board }) {
  const { ui } = board;
  return (
    <div
      aria-live="polite"
      class="min-h-24 rounded-lg border border-surface-default p-4"
    >
      {note ? (
        <ActiveNote note={note} board={board} />
      ) : (
        <p class="text-sm text-on-surface-subdue">{ui.noteDetailsHint}</p>
      )}
    </div>
  );
}

function ActiveNote({ note, board }) {
  const { ui } = board;
  const screens = (note.screenIds ?? [])
    .map((id) => board.screensById[id])
    .filter(Boolean);
  return (
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt class="text-on-surface-subdue">{ui.tag}</dt>
        <dd class="font-medium text-on-surface-default">{note.tag}</dd>
        {note.timestamp && (
          <>
            <dt class="text-on-surface-subdue">{ui.timestamp}</dt>
            <dd class="font-medium tabular-nums text-on-surface-default">
              {note.timestamp}
            </dd>
          </>
        )}
      </dl>
      <div class="flex flex-col gap-2">
        <span class="text-sm text-on-surface-subdue">{ui.linkedScreens}</span>
        <div class="flex flex-wrap gap-4">
          {screens.map((screen) => (
            <Screen screen={screen} size="sm" highlighted />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Timeline mode: the sorted board, with tag filter (shared with the summary
 * through `boardId`) and a selected note revealing its linked screens.
 */
export default function TimelineView({ board, boardId, idPrefix }) {
  const [tag, setTag] = useSharedTag(boardId, ALL_TAGS);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const activeNote = board.notesById[activeNoteId];

  const noteProps = (note) => ({
    colorSlot: noteColorSlot(note, board.tags),
    dimmed: tag !== ALL_TAGS && note.tag !== tag,
    active: note.id === activeNoteId,
    onSelect: () => setActiveNoteId(note.id === activeNoteId ? null : note.id),
  });

  return (
    <section aria-label={board.ui.boardLabel} class="flex flex-col gap-8">
      <TagFilter
        tags={board.tags}
        colorForTag={board.colorForTag}
        activeTag={tag}
        onChange={setTag}
        ui={board.ui}
      />
      <BoardGrid
        steps={board.steps}
        notesByStep={board.notesByStep}
        noteProps={noteProps}
        idPrefix={idPrefix}
        ui={board.ui}
      />
      <NoteDetail note={activeNote} board={board} />
    </section>
  );
}
