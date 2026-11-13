import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { pinimgCandidates } from '../../modules/image-selection/pinterestEnhancer';

interface FallbackImageProps {
  /** Preferred URLs in order; Pinterest size fallbacks are added automatically. */
  sources: (string | undefined)[];
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/** An <img> that moves to the next source when one fails, and shows a placeholder if none load. */
export function FallbackImage({ sources, alt, className, loading }: FallbackImageProps) {
  const candidates = [...new Set(sources.flatMap((s) => (s ? pinimgCandidates(s) : [])))];
  const key = candidates.join('|');
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [key]);

  if (index >= candidates.length) {
    return (
      <div role="img" aria-label={alt} className={`flex min-h-32 items-center justify-center bg-ink-850 text-ink-500 ${className ?? ''}`}>
        <ImageIcon size={28} aria-hidden="true" />
      </div>
    );
  }

  return <img src={candidates[index]} alt={alt} loading={loading} onError={() => setIndex((i) => i + 1)} className={className} />;
}
