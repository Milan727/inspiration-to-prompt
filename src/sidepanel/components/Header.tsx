import { ChevronLeft, LayoutGrid } from 'lucide-react';
import { BRAND_NAME } from '../../brand';

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

interface HeaderProps {
  view: 'main' | 'gallery';
  galleryCount: number;
  onOpenGallery: () => void;
  onBack: () => void;
}

export function Header({ view, galleryCount, onOpenGallery, onBack }: HeaderProps) {
  if (view === 'gallery') {
    return (
      <header className="flex items-center gap-1.5 border-b border-ink-800 py-3 pl-2 pr-3">
        <button type="button" onClick={onBack} aria-label="Back" className="press focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-ink-100 hover:bg-ink-900">
          <ChevronLeft size={18} />
        </button>
        <h1 className="m-0 text-[15px] font-semibold">Your gallery</h1>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between border-b border-ink-800 py-2.5 pl-5 pr-3">
      <div className="flex items-center gap-2.5 text-ink-100">
        <LogoMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">{BRAND_NAME}</span>
      </div>
      <button
        type="button"
        onClick={onOpenGallery}
        aria-label={`Gallery, ${galleryCount} saved`}
        className="press focus-ring relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-300 hover:bg-ink-900 hover:text-ink-100"
      >
        <LayoutGrid size={18} />
        {galleryCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-safelight" aria-hidden="true" />}
      </button>
    </header>
  );
}
