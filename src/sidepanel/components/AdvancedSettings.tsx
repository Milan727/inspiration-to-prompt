import { useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { AspectRatio, PhotographySettings } from '../../types';

const ASPECT_RATIOS: AspectRatio[] = ['4:5', '9:16', '1:1', '3:2', '16:9'];
const LENSES = [
  { value: '35mm wide', label: '35mm · wide' },
  { value: '50mm prime', label: '50mm · natural' },
  { value: '85mm portrait', label: '85mm · portrait' },
  { value: '135mm portrait', label: '135mm · close-up' },
];
const TEXT_MODES: { value: PhotographySettings['textOverlayMode']; label: string }[] = [
  { value: 'none', label: 'No text' },
  { value: 'original', label: 'Keep text' },
  { value: 'custom', label: 'My text' },
];

interface AdvancedSettingsProps {
  settings: PhotographySettings;
  onChange: (patch: Partial<PhotographySettings>) => void;
  showDirective: boolean;
  promptText: string;
  onCopyPrompt: () => Promise<boolean>;
}

export function AdvancedSettings({ settings, onChange, showDirective, promptText, onCopyPrompt }: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lensShort = settings.cameraLens.split(' ')[0];
  const textLabel = TEXT_MODES.find((m) => m.value === settings.textOverlayMode)?.label.toLowerCase();

  return (
    <section className="border-t border-ink-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="focus-ring flex min-h-11 w-full items-center justify-between rounded-lg px-0.5 text-[13px] font-medium text-ink-300 hover:text-ink-100"
      >
        <span>
          Advanced · {settings.aspectRatio} · {lensShort} · {textLabel}
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="flex flex-col gap-5 pb-2 pt-3 animate-fade-in">
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="section-label mb-2 p-0">Shape</legend>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  aria-pressed={settings.aspectRatio === ratio}
                  onClick={() => onChange({ aspectRatio: ratio })}
                  className={`chip ${settings.aspectRatio === ratio ? 'chip-on' : ''}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-2">
            <span className="section-label">Lens</span>
            <select value={settings.cameraLens} onChange={(e) => onChange({ cameraLens: e.target.value })} className="field">
              {LENSES.map((lens) => (
                <option key={lens.value} value={lens.value}>
                  {lens.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="section-label mb-2 p-0">Text in the image</legend>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  aria-pressed={settings.textOverlayMode === mode.value}
                  onClick={() => onChange({ textOverlayMode: mode.value })}
                  className={`chip ${settings.textOverlayMode === mode.value ? 'chip-on' : ''}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            {settings.textOverlayMode === 'custom' && (
              <input
                type="text"
                aria-label="Text to add"
                value={settings.customOverlayText}
                onChange={(e) => onChange({ customOverlayText: e.target.value })}
                placeholder="e.g. Summer '26"
                className="field"
              />
            )}
          </fieldset>

          {showDirective && (
            <label className="flex flex-col gap-2">
              <span className="section-label">Extra direction</span>
              <textarea
                value={settings.customDirective}
                onChange={(e) => onChange({ customDirective: e.target.value })}
                placeholder="e.g. golden hour, softer smile"
                rows={2}
                className="field resize-none"
              />
            </label>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="section-label">Prompt</span>
              <button
                type="button"
                onClick={async () => {
                  if (await onCopyPrompt()) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
                className="press focus-ring flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-300 hover:text-ink-100"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="m-0 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-800 bg-ink-900 p-3 font-sans text-xs leading-relaxed text-ink-300">
              {promptText}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
