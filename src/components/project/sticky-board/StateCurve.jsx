import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'preact/hooks';

import { curvePath, scoreDelta, subActionCurvePoints } from './stickyBoardModel.js';

/** @pure - x positions (0..100) of the boundary between each pair of consecutive steps */
function stepBoundaries(steps, totalCount) {
  let count = 0;
  return steps.slice(0, -1).map((step) => {
    count += (step.subActions ?? []).length;
    return (count / totalCount) * 100;
  });
}

/** @pure - [{ id, label, xStart }] for each step, xStart = its column's left edge */
function stepGroups(steps, totalCount) {
  let index = 0;
  return steps.map((step) => {
    const xStart = (index / totalCount) * 100;
    index += (step.subActions ?? []).length;
    return { id: step.id, label: step.label, xStart };
  });
}

/** @pure - indices of the `count` points with the best before→after point gain */
function topImprovedIndices(before, after, count) {
  return before
    .map((point, index) => ({
      index,
      delta: scoreDelta({ scoreBefore: point.score, scoreAfter: after[index].score }),
    }))
    .filter((entry) => entry.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, count)
    .map((entry) => entry.index);
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

function CurveLegend({ drawn, showAfter, ui }) {
  return (
    <div class="absolute end-0 top-0 flex gap-4 text-xs text-on-surface-subdue">
      <span
        class={`inline-flex items-center gap-2 transition-opacity duration-500 ${drawn ? 'opacity-100' : 'opacity-0'}`}
      >
        <span class="w-5 border-t border-dashed border-on-surface-subdue" />
        {ui.curveBefore}
      </span>
      <span class="inline-flex items-center gap-2">
        <span class="w-5 border-t-2 border-on-surface-raise" />
        {showAfter ? ui.curveAfter : ui.curveBefore}
      </span>
    </div>
  );
}

/**
 * The emotional-state curve, before vs. after, over every sub-action across
 * the sorted steps (`scoreBefore`/`scoreAfter` on each sub-action) — finer
 * grained than one point per step. Standalone: fully drawn, showing the
 * "after" curve, unless driven from an outer sequence via `drawn`/`showAfter`
 * (as StorySequence does for its curve phase).
 */
export default function StateCurve({
  steps,
  ui,
  drawn = true,
  showAfter = true,
  reducedMotion = false,
}) {
  const pathRef = useRef(null);
  const before = subActionCurvePoints(steps, 'scoreBefore');
  const after = subActionCurvePoints(steps, 'scoreAfter');
  const paths = { before: curvePath(before), after: curvePath(after) };
  // The rendered `d` never changes after mount: GSAP owns it from then on.
  const [initialPath] = useState(() => (showAfter ? paths.after : paths.before));
  useCurveMorph(pathRef, showAfter, paths, reducedMotion);

  const points = showAfter ? after : before;
  const best = new Set(topImprovedIndices(before, after, 2));
  const groups = stepGroups(steps, points.length);
  const boundaries = stepBoundaries(steps, points.length);

  return (
    <div aria-hidden="true" class="relative mb-16 hidden h-[200px] md:block">
      <CurveLegend drawn={drawn} showAfter={showAfter} ui={ui} />
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
          class={`stroke-on-surface-subdue transition-opacity duration-500 ${drawn ? 'opacity-100' : 'opacity-0'}`}
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
      {boundaries.map((x) => (
        <span
          class={`absolute top-0 h-full w-px bg-surface-raise transition-opacity duration-500 motion-reduce:transition-none ${drawn ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: `${x}%` }}
        />
      ))}
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
      {points.map((point, index) => (
        <span
          class={`absolute top-full max-w-[80px] -translate-x-1/2 truncate text-center text-[10px] text-on-surface-subdue transition-opacity duration-500 motion-reduce:transition-none ${drawn ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: `${point.x}%`, marginTop: '8px' }}
          title={point.label}
        >
          {point.label}
        </span>
      ))}
      {groups.map((group) => (
        <span
          class={`absolute top-full max-w-[120px] truncate text-left text-xs font-medium text-on-surface-default transition-opacity duration-500 motion-reduce:transition-none ${drawn ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: `${group.xStart}%`, marginTop: '28px', paddingLeft: '4px' }}
          title={group.label}
        >
          {group.label}
        </span>
      ))}
      {after.map((point, index) =>
        best.has(index) ? (
          <span
            class={`absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-on-surface-success px-2 py-0.5 text-xs font-bold tabular-nums text-background transition-opacity duration-500 motion-reduce:transition-none ${showAfter ? 'opacity-100 delay-700' : 'opacity-0'}`}
            style={{
              left: `${point.x}%`,
              top: `calc(${point.y}% - 32px)`,
            }}
          >
            {`+${scoreDelta({ scoreBefore: before[index].score, scoreAfter: point.score })}`}
          </span>
        ) : null
      )}
    </div>
  );
}
