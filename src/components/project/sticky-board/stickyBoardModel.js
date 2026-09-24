// Pure data helpers for the StickyBoard component.
//
// The board is driven by a single JSON source of truth (see the `stickyBoard`
// key of a project's locale file):
//   steps:    UserStoryStep { id, order, label, subActions[], scoreBefore, scoreAfter }
//   notes:    StickyNote    { id, stepId, quote, user?, timestamp?, tag, color?, screenIds[] }
//   screens:  Screen        { id, label, image }  (image = asset name, resolved to imageSrc)
//   features: Feature       { id, label, screenIds[], noteIds[] }
//   zoom:     detail-mode sequence { screenId, noteId?, targets[], keyframes[] }
// Everything else the board shows (tag list, colors, impacted screens, badges,
// curve) is derived here, never re-entered in the data.

export const NOTE_COLOR_COUNT = 5;
export const ALL_TAGS = null;

/** @pure */
export function sortSteps(steps) {
  return [...steps].sort((a, b) => a.order - b.order);
}

/** @pure */
export function indexById(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/** @pure - notes grouped under their step id, keeping data order inside a step */
export function groupNotesByStep(notes) {
  return notes.reduce((groups, note) => {
    groups[note.stepId] = [...(groups[note.stepId] ?? []), note];
    return groups;
  }, {});
}

/** @pure - unique tags, in order of first appearance */
export function deriveTags(notes) {
  return [...new Set(notes.map((note) => note.tag))];
}

/**
 * @pure - color slot (1..NOTE_COLOR_COUNT) for a note: its explicit `color`
 * when set, otherwise the slot of its tag, so a tag keeps one color everywhere.
 */
export function noteColorSlot(note, tags) {
  if (note.color) return note.color;
  const index = tags.indexOf(note.tag);
  if (index < 0) return 1;
  return (index % NOTE_COLOR_COUNT) + 1;
}

/** @pure - `tag` is ALL_TAGS (null) to keep every note */
export function filterNotesByTag(notes, tag) {
  if (tag === ALL_TAGS) return notes;
  return notes.filter((note) => note.tag === tag);
}

/** @pure - FNV-1a hash of a string, as an unsigned 32-bit int */
export function hashString(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** @pure - deterministic value in [0, 1) for a seed and a channel */
export function seededUnit(seed, channel) {
  return hashString(`${seed}:${channel}`) / 4294967296;
}

/**
 * @pure - stable "hand-placed" look for a note: rotation of ±2–4° and a small
 * offset, seeded by the note id so a re-render never reshuffles the board.
 */
export function noteScatter(noteId) {
  const sign = seededUnit(noteId, 'sign') < 0.5 ? -1 : 1;
  const rotate = sign * (2 + seededUnit(noteId, 'rotate') * 2);
  const offsetX = (seededUnit(noteId, 'x') - 0.5) * 16;
  return { rotate, offsetX };
}

/**
 * @pure - where a note sits in the "unsorted pile" before the sort animation,
 * expressed in multiples of its own size relative to its sorted slot.
 */
export function notePileOffset(noteId, columnIndex, columnCount, rowIndex) {
  const pileColumn = (columnCount - 1) / 2;
  const jitterX = (seededUnit(noteId, 'pile-x') - 0.5) * 0.6;
  const jitterY = (seededUnit(noteId, 'pile-y') - 0.5) * 0.4;
  return {
    x: (pileColumn - columnIndex) * 1.1 + jitterX,
    y: -rowIndex * 0.85 + jitterY,
    rotate: (seededUnit(noteId, 'pile-r') - 0.5) * 24,
  };
}

/** @pure - unique screen ids referenced by the given notes, in order */
export function deriveScreenIds(notes) {
  return [...new Set(notes.flatMap((note) => note.screenIds ?? []))];
}

/** @pure - screens impacted by the given notes (no re-entered list) */
export function deriveImpactedScreens(notes, screens) {
  const byId = indexById(screens);
  return deriveScreenIds(notes)
    .map((id) => byId[id])
    .filter(Boolean);
}

/** @pure */
export function notesForScreen(notes, screenId) {
  return notes.filter((note) => (note.screenIds ?? []).includes(screenId));
}

/** @pure - [{ tag, count }] for a list of notes, most frequent first */
export function countTags(notes) {
  const counts = notes.reduce((acc, note) => {
    acc[note.tag] = (acc[note.tag] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** @pure - features that reference a note */
export function featuresForNote(features, noteId) {
  return features.filter((feature) => feature.noteIds.includes(noteId));
}

/** @pure - ids of every note linked to at least one feature */
export function linkedNoteIds(features) {
  return new Set(features.flatMap((feature) => feature.noteIds));
}

/** @pure - x center (0..100) of a timeline column */
export function columnCenter(index, count) {
  return ((index + 0.5) / count) * 100;
}

/** @pure - y (0..100, top = 0) for a 0..100 score, with vertical padding */
export function scoreToY(score) {
  const padding = 12;
  return padding + (1 - score / 100) * (100 - padding * 2);
}

/** @pure - curve points [{ x, y, score }] for a score key over sorted steps */
export function curvePoints(steps, scoreKey) {
  return steps.map((step, index) => ({
    x: columnCenter(index, steps.length),
    y: scoreToY(step[scoreKey]),
    score: step[scoreKey],
  }));
}

/**
 * @pure - SVG path through the points. Always the same command structure for
 * the same step count, so the before/after paths can be morphed number by
 * number.
 */
export function curvePath(points) {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const start = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  const segments = rest.map((point, index) => {
    const previous = points[index];
    const midX = ((previous.x + point.x) / 2).toFixed(2);
    return `C ${midX} ${previous.y.toFixed(2)} ${midX} ${point.y.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  });
  return [start, ...segments].join(' ');
}

/** @pure - relative improvement in % between before and after, rounded */
export function improvement(step) {
  if (!step.scoreBefore) return 0;
  return Math.round(
    ((step.scoreAfter - step.scoreBefore) / step.scoreBefore) * 100
  );
}

/** @pure - ids of the `count` steps with the best improvement */
export function topImprovedStepIds(steps, count) {
  return [...steps]
    .filter((step) => improvement(step) > 0)
    .sort((a, b) => improvement(b) - improvement(a))
    .slice(0, count)
    .map((step) => step.id);
}

/**
 * @pure - translation (in % of the frame) that brings a target's center to the
 * middle of the viewport at the given scale, with transform-origin: center.
 */
export function focusTranslation(target, scale) {
  const centerX = target.x + target.w / 2;
  const centerY = target.y + target.h / 2;
  return { x: (50 - centerX) * scale, y: (50 - centerY) * scale };
}

/** @pure - normalizes a zoom keyframe into { scale, x, y, bgOpacity, highlightId } */
export function resolveKeyframe(keyframe, targetsById) {
  const scale = keyframe.scale ?? 1;
  const base = {
    scale,
    x: keyframe.x ?? 0,
    y: keyframe.y ?? 0,
    bgOpacity: keyframe.bgOpacity ?? 0,
    highlightId: keyframe.highlightId ?? null,
    caption: keyframe.caption ?? '',
  };
  const target = targetsById[keyframe.focusId];
  if (!target) return base;
  return { ...base, ...focusTranslation(target, scale) };
}

/** @pure - clamps a step index into [0, count - 1] */
export function clampStep(step, count) {
  if (count <= 0) return 0;
  return Math.min(Math.max(step, 0), count - 1);
}

/**
 * @pure - resolves each screen's `image` asset name against the loaded
 * project images (see utils/useScreens.js) into imageSrc/alt/size.
 */
export function resolveScreens(screens, images, lang) {
  return screens.map((screen) => {
    const image = images[screen.image];
    return {
      ...screen,
      imageSrc: image?.src ?? '',
      imageAlt: image?.alt?.[lang] ?? '',
      width: image?.width,
      height: image?.height,
    };
  });
}

/** @pure - board data ready for the component (screens resolved) */
export function prepareBoardData(boardContent, images, lang) {
  return {
    ...boardContent,
    screens: resolveScreens(boardContent.screens, images, lang),
  };
}
