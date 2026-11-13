import { ExternalLink, X } from 'lucide-react';
import { SelectedImage } from '../../types';
import { FallbackImage } from './FallbackImage';

export function ImageHero({ image, onClear }: { image: SelectedImage; onClear: () => void }) {
  const title = image.title || image.alt || 'Your inspiration';
  return (
    <figure className="relative m-0 overflow-hidden rounded-2xl border border-ink-800 bg-ink-850">
      <FallbackImage sources={[image.highResUrl, image.url]} alt={image.alt || title} className="block max-h-[300px] w-full object-cover" />
      <figcaption className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate rounded-lg bg-ink-950/85 px-2.5 py-1.5 text-xs font-medium">{title}</span>
        <span className="flex shrink-0 gap-1.5">
          {image.sourceUrl && (
            <a
              href={image.sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the original"
              className="press focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950/85 text-ink-100"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label="Remove this photo"
            className="press focus-ring flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950/85 text-ink-100"
          >
            <X size={14} />
          </button>
        </span>
      </figcaption>
    </figure>
  );
}
