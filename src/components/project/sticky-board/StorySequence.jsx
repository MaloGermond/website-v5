import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'preact/hooks';

import BoardGrid from './BoardGrid.jsx';
import SequenceControls from './SequenceControls.jsx';
import { useMediaQuery, useSequence } from './useSequence.js';
import {
  curvePath,
  curvePoints,
  improvement,
  linkedNoteIds,
  noteColorSlot,
  notePileOffset,
  topImprovedStepIds,
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

/** @impure - GSAP tween of the curve path between the before/after shapes */
function useCurveMorph(pathRef, showAfter, paths, reducedMotion) {
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return undefined;
    const tween = gsap.to(path, {
      attr: { d: showAfter ? paths.after : paths.before },
      duration: reducedMotion ? 0 : 1.2,
      ease: 'power2.inOut',
    });
    return () => tween.kill();
  }, [showAfter, reducedMotion]);
}

function CurveLegend({ phase, ui }) {
  const morphed = phase >= PHASE.BEFORE_AFTER;
  return (
    <div class="absolute end-0 top-0 flex gap-4 text-xs text-on-surface-subdue">
      <span
        class={`inline-flex items-center gap-2 transition-opacity duration-500 ${morphed ? 'opacity-100' : 'opacity-0'}`}
      >
        <span class="w-5 border-t border-dashed border-on-surface-subdue" />
        {ui.curveBefore}
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="w-5 border-t-2 border-on-surface-raise" />
        {morphed ? ui.curveAfter : ui.curveBefore}
      </span>
    </div>
  );
}

function StateCurve({ steps, phase, ui, reducedMotion }) {
  const pathRef = useRef(null);
  const before = curvePoints(steps, 'scoreBefore');
  const after = curvePoints(steps, 'scoreAfter');
  const paths = { before: curvePath(before), after: curvePath(after) };
  const morphed = phase >= PHASE.BEFORE_AFTER;
  // The rendered `d` never changes after mount: GSAP owns it from then on.
  const [initialPath] = useState(() => (morphed ? paths.after : paths.before));
  useCurveMorph(pathRef, morphed, paths, reducedMotion);

  const drawn = phase >= PHASE.CURVE;
  const points = morphed ? after : before;
  const best = new Set(topImprovedStepIds(steps, 2));

  return (
    <div aria-hidden="true" class="relative mb-4 hidden h-20 md:block">
      <CurveLegend phase={phase} ui={ui} />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        class="absolute inset-0 size-full overflow-visible"
        style={{
          clipPath: drawn
            ? 'inset(-10% -10% -10% -10%)'
            : 'inset(-10% 100% -10% -10%)',
          transition: 'clip-path 1400ms cubic-bezier(.65,0,.35,1)',
        }}
      >
        <path
          d={paths.before}
          fill="none"
          stroke-width="1.5"
          stroke-dasharray="4 4"
          vector-effect="non-scaling-stroke"
          class={`stroke-on-surface-subdue transition-opacity duration-500 ${morphed ? 'opacity-100' : 'opacity-0'}`}
        />
        <path
          ref={pathRef}
          d={initialPath}
          fill="none"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
          class="stroke-on-surface-raise"
        />
      </svg>
      {points.map((point, index) => (
        <span
          class={`absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface-raise ring-4 ring-background motion-reduce:transition-none ${drawn ? 'opacity-100' : 'opacity-0'}`}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            transition: `top 1200ms cubic-bezier(.65,0,.35,1), opacity 300ms ease-out ${drawn ? index * 200 : 0}ms`,
          }}
        />
      ))}
      {steps.map((step, index) =>
        best.has(step.id) ? (
          <span
            class={`absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-on-surface-success px-2 py-0.5 text-xs font-bold tabular-nums text-background transition-opacity duration-500 motion-reduce:transition-none ${morphed ? 'opacity-100 delay-700' : 'opacity-0'}`}
            style={{
              left: `${after[index].x}%`,
              top: `calc(${after[index].y}% - 32px)`,
            }}
          >
            {`+${improvement(step)}%`}
          </span>
        ) : null
      )}
    </div>
  );
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
              phase={phase}
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
