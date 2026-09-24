import { useMemo } from 'preact/hooks';

import StorySequence from './StorySequence.jsx';
import SummaryView from './SummaryView.jsx';
import TimelineView from './TimelineView.jsx';
import ZoomSequence from './ZoomSequence.jsx';
import {
  deriveTags,
  groupNotesByStep,
  indexById,
  noteColorSlot,
  sortSteps,
} from './stickyBoardModel.js';

/** @pure - everything the views need, derived once from the JSON data */
export function deriveBoard(data) {
  const tags = deriveTags(data.notes);
  return {
    ...data,
    features: data.features ?? [],
    steps: sortSteps(data.steps),
    tags,
    notesByStep: groupNotesByStep(data.notes),
    notesById: indexById(data.notes),
    screensById: indexById(data.screens),
    colorForTag: (tag) => noteColorSlot({ tag }, tags),
  };
}

const VIEWS = {
  timeline: TimelineView,
  summary: SummaryView,
  detail: ZoomSequence,
  story: StorySequence,
};

/**
 * One component, several occurrences on a case-study page, all driven by the
 * same JSON (see stickyBoardModel.js for the data model):
 *   mode="timeline" — the sorted board, filterable, notes reveal their screens
 *   mode="summary"  — impacted screens derived from the notes
 *   mode="detail"   — zoom sequence into one screen (data.zoom)
 *   mode="story"    — the 5-step narrative ending on the summary
 * Instances sharing a `boardId` share their tag filter.
 * Rendered on the server (readable without JS) and hydrated as an island.
 */
export default function StickyBoard({
  mode = 'timeline',
  data,
  boardId,
  idPrefix = boardId ? `${boardId}-${mode}` : `sticky-board-${mode}`,
  anchorId,
  summaryHref,
}) {
  const board = useMemo(() => deriveBoard(data), [data]);
  const View = VIEWS[mode];
  if (!View) return null;
  return (
    <View
      board={board}
      boardId={boardId}
      idPrefix={idPrefix}
      anchorId={anchorId}
      summaryHref={summaryHref}
    />
  );
}
