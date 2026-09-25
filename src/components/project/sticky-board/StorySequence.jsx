import { useEffect, useRef, useState } from 'preact/hooks';

import BoardGrid from './BoardGrid.jsx';
import SequenceControls from './SequenceControls.jsx';
import StateCurve from './StateCurve.jsx';
import { useMediaQuery, useSequence } from './useSequence.js';
import {
  linkedNoteIds,
  noteColorSlot,
  notePileOffset,
} from './stickyBoardModel.js';

// The five narrative steps, all on the same timeline referential.
const PHASE = { STEPS: 0, SORT: 1, CURVE: 2, FEATURES: 3, BEFORE_AFTER: 4 };
const PHASE_COUNT = 5;
const STAGGER_MS = 100;
const PILE_HOLD_MS = 450;

/** @pure */
function visibleClass(visible) {
  return visible ? 'visible opacity-100' : 'invisible opacity-0';
}

/** @pure */
function formatScore(template, before, after) {
  return template.replace('{before}', before).replace('{after}', after);
}

/**
 * @impure - timer. True once the notes have left the pile: entering the sort
 * phase from before holds them in the pile briefly, then releases them.
 */
function useSortDone(phase) {
  const [done, setDone] = useState(true);
  const previous = useRef(phase);
  useEffect(() => {
    const entering = phase === PHASE.SORT && previous.current < PHASE.SORT;
    previous.current = phase;
    setDone(!entering);
    if (!entering) return undefined;
    const timer = setTimeout(() => setDone(true), PILE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);
  return done;
}

function FeatureRow({ features, visible, activeFeatureId, onActivate, ui }) {
  return (
    <div
      class={`mt-6 transition-[opacity,visibility] duration-500 motion-reduce:transition-none ${visibleClass(visible)}`}
    >
      <ul aria-label={ui.features} class="flex flex-wrap items-center gap-2">
        {features.map((feature, index) => (
          <li>
            <button
              type="button"
              aria-pressed={activeFeatureId === feature.id ? 'true' : 'false'}
              onClick={() =>
                onActivate(activeFeatureId === feature.id ? null : feature.id)
              }
              class={[
                'inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition-transform duration-200 ease-out active:scale-[0.97] motion-reduce:transition-none',
                'outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise',
                activeFeatureId === feature.id
                  ? 'border-on-surface-default text-on-surface-default'
                  : 'border-surface-raise text-on-surface-default hover:border-on-surface-subdue',
              ].join(' ')}
            >
              <span class="grid size-5 place-items-center rounded-full bg-on-surface-default text-[10px] font-bold tabular-nums text-background">
                {index + 1}
              </span>
              {feature.label}
              <span class="tabular-nums text-on-surface-subdue">{`×${feature.noteIds.length}`}</span>
            </button>
          </li>
        ))}
        <li class="inline-flex items-center gap-2 px-3 text-sm text-on-surface-subdue">
          <span
            aria-hidden="true"
            class="size-3 rounded-sm bg-surface-raise opacity-50"
          />
          {ui.noFeature}
        </li>
      </ul>
    </div>
  );
}

/** @pure - per-note StickyNote props for a phase */
function storyNoteProps(note, position, state) {
  const { phase, pile, board, linked, activeFeature, featureMarks } = state;
  const inFeaturePhase = phase >= PHASE.FEATURES;
  return {
    colorSlot: noteColorSlot(note, board.tags),
    compact: true,
    colored: !pile,
    hidden: phase < PHASE.SORT,
    pile: pile
      ? notePileOffset(
          note.id,
          position.columnIndex,
          position.columnCount,
          position.rowIndex
        )
      : null,
    delayMs: Math.min(position.orderIndex * STAGGER_MS, 1200),
    dimmed: inFeaturePhase && isDimmedByFeature(note, linked, activeFeature),
    marks: inFeaturePhase ? (featureMarks[note.id] ?? []) : [],
  };
}

/** @pure */
function isDimmedByFeature(note, linked, activeFeature) {
  if (activeFeature) return !activeFeature.noteIds.includes(note.id);
  return !linked.has(note.id);
}

/** @pure - { noteId: [feature numbers] } */
function featureMarksByNote(features) {
  return features.reduce((marks, feature, index) => {
    feature.noteIds.forEach((noteId) => {
      marks[noteId] = [...(marks[noteId] ?? []), index + 1];
    });
    return marks;
  }, {});
}

/**
 * Story mode: the UX reasoning in five steps on one referential — steps &
 * sub-actions → notes sorted from a pile onto their step → state curve →
 * notes linked to features → before/after curve, ending on a link to the
 * summary. Scroll-driven from lg up, previous/next below. Without JS or with
 * reduced motion the final state is shown directly.
 */
export default function StorySequence({ board, summaryHref }) {
  const { ui } = board;
  const wrapperRef = useRef(null);
  const stickyRef = useRef(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const sequence = useSequence({
    count: PHASE_COUNT,
    wrapperRef,
    stickyRef,
    scrollWhen: isDesktop,
    staticWhen: false,
  });
  const phase = sequence.step;
  const sortDone = useSortDone(phase);
  const [activeFeatureId, setActiveFeatureId] = useState(null);

  const state = {
    phase,
    pile: phase < PHASE.SORT || !sortDone,
    board,
    linked: linkedNoteIds(board.features),
    activeFeature: board.features.find(
      (feature) => feature.id === activeFeatureId
    ),
    featureMarks: featureMarksByNote(board.features),
  };
  const copy = ui.story[phase];

  const scoreText = (step) =>
    phase >= PHASE.CURVE ? (
      <p class="text-sm tabular-nums text-on-surface-subdue md:sr-only">
        {phase >= PHASE.BEFORE_AFTER
          ? formatScore(ui.score, step.scoreBefore, step.scoreAfter)
          : formatScore(ui.score, step.scoreBefore, '…')}
      </p>
    ) : null;

  return (
    <section ref={wrapperRef} aria-label={ui.boardLabel}>
      <div
        ref={stickyRef}
        style={sequence.stickyStyle}
        class="flex flex-col gap-6 bg-background"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div aria-live="polite" class="flex max-w-xl flex-col gap-1">
            <h3 class="text-2xl font-medium text-on-surface-default [text-wrap:balance]">
              <span class="me-2 tabular-nums text-on-surface-subdue">{`${phase + 1}.`}</span>
              {copy.title}
            </h3>
            <p class="text-on-surface-subdue [text-wrap:pretty]">{copy.text}</p>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            {summaryHref && (
              <a
                href={summaryHref}
                class={`inline-flex min-h-10 items-center gap-2 rounded-full bg-on-surface-default px-5 text-sm font-medium text-background transition-[opacity,visibility] duration-500 outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface-raise motion-reduce:transition-none ${visibleClass(phase >= PHASE.BEFORE_AFTER)}`}
              >
                {ui.summaryCta}
                <span aria-hidden="true">→</span>
              </a>
            )}
            {sequence.mode !== 'static' && (
              <SequenceControls
                step={phase}
                count={PHASE_COUNT}
                goTo={sequence.goTo}
                ui={ui}
              />
            )}
          </div>
        </div>
        <BoardGrid
          steps={board.steps}
          notesByStep={board.notesByStep}
          ui={ui}
          noteProps={(note, position) => storyNoteProps(note, position, state)}
          stepExtra={scoreText}
          above={
            <StateCurve
              steps={board.steps}
              drawn={phase >= PHASE.CURVE}
              showAfter={phase >= PHASE.BEFORE_AFTER}
              ui={ui}
              reducedMotion={sequence.reducedMotion}
            />
          }
          below={
            <FeatureRow
              features={board.features}
              visible={phase >= PHASE.FEATURES}
              activeFeatureId={activeFeatureId}
              onActivate={setActiveFeatureId}
              ui={ui}
            />
          }
        />
      </div>
      {sequence.spacerStyle && (
        <div aria-hidden="true" style={sequence.spacerStyle} />
      )}
    </section>
  );
}
