import { useRef } from 'preact/hooks';

import SequenceControls from './SequenceControls.jsx';
import StickyNote from './StickyNote.jsx';
import { useMediaQuery, useSequence } from './useSequence.js';
import {
  indexById,
  noteColorSlot,
  resolveKeyframe,
} from './stickyBoardModel.js';

const EASE = 'cubic-bezier(.65,0,.35,1)';

/** @pure - bg-layer: fades in with a slight de-zoom and de-blur, never scaled with the screen */
function backgroundStyle(bgOpacity) {
  return {
    opacity: bgOpacity,
    transform: `scale(${1.08 - 0.08 * bgOpacity})`,
    filter: `blur(${(1 - bgOpacity) * 4}px)`,
    transition: `opacity 700ms ${EASE}, transform 900ms ${EASE}, filter 900ms ${EASE}`,
  };
}

/** @pure */
function frameStyle(keyframe) {
  return {
    transform: `translate(${keyframe.x}%, ${keyframe.y}%) scale(${keyframe.scale})`,
    transition: `transform 900ms ${EASE}`,
  };
}

/** @pure */
function targetStyle(target) {
  return {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.w}%`,
    height: `${target.h}%`,
  };
}

function ZoomTarget({ target, active }) {
  return (
    <div
      data-zoom-target={target.id}
      aria-hidden="true"
      style={targetStyle(target)}
      class={[
        'pointer-events-none absolute rounded-full outline outline-1 outline-offset-2 outline-on-dark',
        'shadow-[0_0_0_6px_rgb(255_255_255/18%),0_0_24px_6px_rgb(255_255_255/35%)]',
        'transition-opacity duration-500 motion-reduce:transition-none',
        active ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    />
  );
}

/**
 * Detail mode: a zoom into one screen, driven by a single `step` state that
 * indexes `zoom.keyframes` ({ scale, x, y | focusId, bgOpacity, highlightId }).
 * Layers: bg-layer (context backdrop) → screen-frame (mockup) → zoom-target
 * (halo). Driven by previous/next controls from tablet up; on phones and
 * with reduced motion the final framing is shown statically.
 */
export default function ZoomSequence({ board }) {
  const { zoom, ui } = board;
  const wrapperRef = useRef(null);
  const stickyRef = useRef(null);
  const isTablet = useMediaQuery('(min-width: 768px)');

  const targetsById = indexById(zoom.targets);
  const keyframes = zoom.keyframes.map((keyframe) =>
    resolveKeyframe(keyframe, targetsById)
  );
  const sequence = useSequence({
    count: keyframes.length,
    wrapperRef,
    stickyRef,
    scrollWhen: false,
    staticWhen: !isTablet,
  });
  const keyframe = keyframes[sequence.step];
  const screen = board.screensById[zoom.screenId];
  const note = board.notesById[zoom.noteId];
  const isLast = sequence.step === keyframes.length - 1;
  const ratio =
    screen.width && screen.height
      ? `${screen.width} / ${screen.height}`
      : '9 / 19';

  return (
    <section ref={wrapperRef} aria-label={ui.zoomLabel}>
      <div
        ref={stickyRef}
        style={sequence.stickyStyle}
        class="flex flex-col gap-6"
      >
        <div class="relative isolate grid h-[560px] place-items-center overflow-hidden rounded-2xl bg-surface-subdue md:h-[620px] lg:h-[min(80vh,720px)]">
          <div
            data-bg-layer
            class="sticky-board-sky absolute inset-0 -z-10"
            style={backgroundStyle(keyframe.bgOpacity)}
          />
          <div
            data-screen-viewport
            class="relative h-[86%] overflow-hidden rounded-[8%/4%] shadow-2xl"
            style={{ aspectRatio: ratio }}
          >
            <div
              data-screen-frame
              class="relative size-full"
              style={frameStyle(keyframe)}
            >
              <img
                src={screen.imageSrc}
                alt={screen.imageAlt}
                width={screen.width}
                height={screen.height}
                loading="lazy"
                decoding="async"
                class="size-full bg-surface-default object-cover"
              />
              {zoom.targets.map((target) => (
                <ZoomTarget
                  target={target}
                  active={keyframe.highlightId === target.id}
                />
              ))}
            </div>
          </div>
          {note && (
            <div class="absolute bottom-6 end-6 hidden w-64 md:block">
              <StickyNote
                note={note}
                colorSlot={noteColorSlot(note, board.tags)}
                hidden={!isLast}
              />
            </div>
          )}
        </div>
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p
            aria-live="polite"
            class="min-h-12 max-w-prose text-lg text-on-surface-default [text-wrap:pretty]"
          >
            {keyframe.caption}
          </p>
          {sequence.mode !== 'static' && (
            <SequenceControls
              step={sequence.step}
              count={keyframes.length}
              goTo={sequence.goTo}
              ui={ui}
            />
          )}
        </div>
        {note && (
          <StickyNote
            note={note}
            colorSlot={noteColorSlot(note, board.tags)}
            scattered={false}
            class="md:hidden"
          />
        )}
      </div>
      {sequence.spacerStyle && (
        <div aria-hidden="true" style={sequence.spacerStyle} />
      )}
    </section>
  );
}
