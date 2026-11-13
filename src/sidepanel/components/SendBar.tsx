import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, Download, Loader2 } from 'lucide-react';
import { TargetLLM } from '../../types';
import { TARGETS, TARGET_ORDER } from '../../lib/targets';

interface SendBarProps {
  target: TargetLLM;
  onTargetChange: (target: TargetLLM) => void;
  onSend: () => void;
  onCopy: () => void;
  onDownloadImages: () => void;
  sending: boolean;
  showDownload: boolean;
}

export function SendBar({ target, onTargetChange, onSend, onCopy, onDownloadImages, sending, showDownload }: SendBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const info = TARGETS[target];

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  return (
    <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-ink-800 bg-ink-950 px-5 pb-4 pt-3.5">
      <div ref={menuRef} className="relative flex gap-2">
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="press focus-ring flex min-h-[50px] flex-grow items-center justify-center gap-2 rounded-2xl bg-safelight text-[15px] font-semibold text-ink-950 hover:bg-safelight-dim disabled:opacity-70"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : null}
          {info.delivery === 'inject' ? `Send to ${info.label}` : `Copy for ${info.label}`}
          {!sending && <ArrowRight size={16} strokeWidth={2.2} />}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Choose AI"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="press focus-ring flex w-[50px] items-center justify-center rounded-2xl border border-ink-600 bg-ink-900 text-ink-100"
        >
          <ChevronDown size={16} />
        </button>

        {menuOpen && (
          <div role="menu" className="absolute bottom-[58px] right-0 flex w-56 flex-col rounded-2xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl animate-fade-in">
            {TARGET_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={id === target}
                onClick={() => {
                  onTargetChange(id);
                  setMenuOpen(false);
                }}
                className="focus-ring flex min-h-11 items-center justify-between rounded-xl px-3 text-left text-sm text-ink-100 hover:bg-ink-850"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{TARGETS[id].label}</span>
                  <span className="text-xs text-ink-300">{TARGETS[id].delivery === 'inject' ? 'Fills it in for you' : 'Copies the prompt'}</span>
                </span>
                {id === target && <Check size={15} className="text-safelight" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {info.delivery === 'inject' && (
          <button type="button" onClick={onCopy} className="press focus-ring min-h-9 rounded-lg text-[13px] font-medium text-ink-300 hover:text-ink-100">
            Copy prompt instead
          </button>
        )}
        {showDownload && (
          <button
            type="button"
            onClick={onDownloadImages}
            className="press focus-ring flex min-h-9 items-center gap-1.5 rounded-lg text-[13px] font-medium text-safelight"
          >
            <Download size={14} /> Download images
          </button>
        )}
      </div>
    </footer>
  );
}
