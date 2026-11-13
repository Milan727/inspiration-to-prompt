import { Copy, ImageIcon, Trash2 } from 'lucide-react';
import { PromptHistoryItem } from '../../types';
import { RULE_PACKS } from '../../modules/prompt-builder/rulePacks';
import { TARGETS } from '../../lib/targets';
import { FallbackImage } from './FallbackImage';

interface GalleryProps {
  items: PromptHistoryItem[];
  onCopy: (item: PromptHistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function Gallery({ items, onCopy, onDelete, onClear }: GalleryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-16 text-center animate-fade-in">
        <ImageIcon size={28} className="text-ink-300" aria-hidden="true" />
        <span className="text-sm font-medium">Nothing saved yet</span>
        <span className="text-[13px] text-ink-300">Every look you send or copy is kept here, on this device.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4 animate-fade-in">
      <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-ink-800 bg-ink-900">
            <FallbackImage sources={[item.imageUrl]} alt="" loading="lazy" className="block aspect-[4/5] w-full bg-ink-850 object-cover" />
            <div className="flex flex-col gap-0.5 px-2.5 pb-1 pt-2">
              <span className="truncate text-[13px] font-semibold">{item.title}</span>
              <span className="truncate text-[11px] text-ink-300">
                {RULE_PACKS[item.intent]?.title ?? item.intent} · {TARGETS[item.target]?.label ?? item.target}
              </span>
            </div>
            <div className="flex justify-end gap-0.5 px-1 pb-1">
              <button
                type="button"
                onClick={() => onCopy(item)}
                aria-label={`Copy prompt for ${item.title}`}
                className="press focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-300 hover:text-ink-100"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label={`Delete ${item.title}`}
                className="press focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-ink-300 hover:text-ink-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-ink-800 pt-3">
        <span className="text-xs text-ink-300">
          {items.length} {items.length === 1 ? 'look' : 'looks'} · stored on this device
        </span>
        <button type="button" onClick={onClear} className="press focus-ring min-h-9 rounded-lg text-[13px] font-medium text-ink-300 hover:text-ink-100">
          Clear all
        </button>
      </div>
    </div>
  );
}
