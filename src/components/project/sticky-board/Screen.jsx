/** @pure */
function imageRatio(screen) {
  if (!screen.width || !screen.height) return '9 / 19';
  return `${screen.width} / ${screen.height}`;
}

/**
 * An app screen referenced by sticky notes. The image is lazy-loaded over a
 * skeleton background, so the slot keeps its size before the image arrives.
 *   highlighted  linked to the active note / impacted (vs. neutral)
 *   ratio        frame aspect ratio (defaults to the image's own); the
 *                image is contained, so mixed formats line up in a grid
 *   children     extra content under the label (badges, actions…)
 */
export default function Screen({
  screen,
  highlighted = false,
  size = 'md',
  ratio,
  children,
  class: classList = '',
}) {
  const frameRatio = ratio ?? imageRatio(screen);
  return (
    <figure class={`flex flex-col gap-2 ${classList}`}>
      <div
        class={[
          'media-outline overflow-hidden rounded-lg bg-surface-default transition-[box-shadow,opacity] duration-300 motion-reduce:transition-none',
          highlighted
            ? 'ring-2 ring-on-surface-raise ring-offset-2 ring-offset-background'
            : '',
          size === 'sm' ? 'w-20' : 'w-full',
        ].join(' ')}
        style={{ aspectRatio: frameRatio }}
      >
        {screen.imageSrc && (
          <img
            src={screen.imageSrc}
            alt={screen.imageAlt}
            width={screen.width}
            height={screen.height}
            loading="lazy"
            decoding="async"
            class="size-full object-contain"
          />
        )}
      </div>
      <figcaption class="flex flex-col gap-2">
        <span class="text-sm font-medium text-on-surface-default">
          {screen.label}
        </span>
        {children}
      </figcaption>
    </figure>
  );
}
