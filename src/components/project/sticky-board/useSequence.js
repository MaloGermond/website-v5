import { useCallback, useEffect, useState } from 'preact/hooks';

import { clampStep } from './stickyBoardModel.js';

// Share of the viewport height scrolled per sequence step in scroll mode.
const SCROLL_PER_STEP_VH = 60;

// Room kept free for the fixed site header above a pinned block.
const HEADER_CLEARANCE_PX = 96;

/**
 * @pure - top offset for the pinned block: centered under the header when it
 * fits, bottom-aligned (possibly negative) when it is taller than that space.
 */
export function stickyTopFor(blockHeight, viewportHeight) {
  const available = viewportHeight - HEADER_CLEARANCE_PX;
  if (blockHeight <= available)
    return HEADER_CLEARANCE_PX + (available - blockHeight) / 2;
  return Math.min(0, viewportHeight - blockHeight);
}

/** @pure - scroll distance during which the block stays pinned */
export function pinnedDistance(count, viewportHeight) {
  return (count * SCROLL_PER_STEP_VH * viewportHeight) / 100;
}

/** @pure - step reached for a wrapper position while the block is pinned */
export function stepFromScroll(wrapperTop, stickyTop, distance, count) {
  if (distance <= 0) return count - 1;
  const progress = (stickyTop - wrapperTop) / distance;
  return clampStep(Math.floor(progress * count), count);
}

/** @pure - absolute scroll position that lands in the middle of a step */
export function scrollYForStep(
  step,
  count,
  wrapperPageTop,
  stickyTop,
  distance
) {
  return wrapperPageTop - stickyTop + ((step + 0.5) / count) * distance;
}

/** @impure - subscribes to window.matchMedia; `false` until mounted (SSR) */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** @impure - `true` once the component is hydrated in the browser */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** @impure - tracks an element's rendered height with a ResizeObserver */
function useElementHeight(ref, enabled) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return undefined;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);
  return height;
}

/** @impure - derives the step from the wrapper's scroll position */
function useScrollStep(wrapperRef, stickyTop, count, enabled) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const distance = pinnedDistance(count, window.innerHeight);
      const top = wrapper.getBoundingClientRect().top;
      setStep(stepFromScroll(top, stickyTop, distance, count));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled, stickyTop, count]);
  return step;
}

/**
 * @impure - drives a `step` (0..count-1) for a sequence in one of three modes:
 *   'static' — final step only (server render / no JS, reduced motion, or
 *              `staticWhen` true), so the end state is always readable;
 *   'click'  — previous/next controls;
 *   'scroll' — the block is pinned and the step follows the scroll
 *              (`scrollWhen` true); controls scroll to the matching step.
 * Render the sticky block inside the wrapper, followed by a spacer carrying
 * `spacerStyle` (null outside scroll mode) that provides the scroll distance.
 */
export function useSequence({
  count,
  wrapperRef,
  stickyRef,
  scrollWhen,
  staticWhen,
}) {
  const hydrated = useHydrated();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const mode = sequenceMode(hydrated, reducedMotion, staticWhen, scrollWhen);

  const [clickStep, setClickStep] = useState(0);
  const blockHeight = useElementHeight(stickyRef, mode === 'scroll');
  const viewportHeight = hydrated ? window.innerHeight : 0;
  const stickyTop = stickyTopFor(blockHeight, viewportHeight);
  const scrollStep = useScrollStep(
    wrapperRef,
    stickyTop,
    count,
    mode === 'scroll'
  );

  const goTo = useCallback(
    (next) => {
      const target = clampStep(next, count);
      if (mode !== 'scroll') return setClickStep(target);
      const wrapper = wrapperRef.current;
      const pageTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const distance = pinnedDistance(count, window.innerHeight);
      window.scrollTo({
        top: scrollYForStep(target, count, pageTop, stickyTop, distance),
        behavior: 'smooth',
      });
    },
    [mode, count, stickyTop]
  );

  const step = { static: count - 1, click: clickStep, scroll: scrollStep }[
    mode
  ];
  return {
    step,
    mode,
    reducedMotion,
    goTo,
    spacerStyle:
      mode === 'scroll' ? { height: `${count * SCROLL_PER_STEP_VH}vh` } : null,
    stickyStyle:
      mode === 'scroll'
        ? { position: 'sticky', top: `${stickyTop}px` }
        : undefined,
  };
}

/** @pure */
function sequenceMode(hydrated, reducedMotion, staticWhen, scrollWhen) {
  if (!hydrated || reducedMotion || staticWhen) return 'static';
  if (scrollWhen) return 'scroll';
  return 'click';
}

const TAG_EVENT = 'stickyboard:tag';

/**
 * @impure - tag filter state shared by every StickyBoard instance with the same
 * `boardId` (e.g. the timeline and the summary on a page), via a window event.
 */
export function useSharedTag(boardId, initialTag) {
  const [tag, setTag] = useState(initialTag);
  useEffect(() => {
    if (!boardId) return undefined;
    const onTag = (event) => {
      if (event.detail.boardId === boardId) setTag(event.detail.tag);
    };
    window.addEventListener(TAG_EVENT, onTag);
    return () => window.removeEventListener(TAG_EVENT, onTag);
  }, [boardId]);

  const update = useCallback(
    (next) => {
      setTag(next);
      if (!boardId) return;
      window.dispatchEvent(
        new CustomEvent(TAG_EVENT, { detail: { boardId, tag: next } })
      );
    },
    [boardId]
  );
  return [tag, update];
}
