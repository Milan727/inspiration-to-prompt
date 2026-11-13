import { useState } from 'react';
import { IntentType } from '../../types';
import { MAIN_INTENTS, MORE_INTENTS, RULE_PACKS } from '../../modules/prompt-builder/rulePacks';

interface StylePickerProps {
  intent: IntentType;
  onChange: (intent: IntentType) => void;
  directive: string;
  onDirectiveChange: (directive: string) => void;
}

function StyleOption({ id, checked, onChange }: { id: IntentType; checked: boolean; onChange: () => void }) {
  const pack = RULE_PACKS[id];
  return (
    <label
      className={`press flex min-h-[60px] cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-safelight ${
        checked ? 'border-safelight bg-ink-850' : 'border-ink-800 bg-ink-900 hover:border-ink-600'
      }`}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-ink-100">{pack.title}</span>
        <span className="text-xs text-ink-300">{pack.shortDesc}</span>
      </span>
      <input type="radio" name="style" value={id} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={`h-[18px] w-[18px] shrink-0 rounded-full ${checked ? 'border-[5px] border-safelight' : 'border-[1.5px] border-ink-500'}`}
      />
    </label>
  );
}

export function StylePicker({ intent, onChange, directive, onDirectiveChange }: StylePickerProps) {
  const [showMore, setShowMore] = useState(MORE_INTENTS.includes(intent));
  const visible = showMore ? [...MAIN_INTENTS, ...MORE_INTENTS] : MAIN_INTENTS;

  return (
    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
      <legend className="section-label mb-2.5 p-0">Style</legend>
      <div className="flex flex-col gap-2">
        {visible.map((id) => (
          <StyleOption key={id} id={id} checked={intent === id} onChange={() => onChange(id)} />
        ))}
      </div>

      {intent === 'directed_edit' && (
        <label className="flex flex-col gap-1.5 animate-fade-in">
          <span className="text-[13px] font-medium text-ink-100">What should change?</span>
          <textarea
            value={directive}
            onChange={(e) => onDirectiveChange(e.target.value)}
            placeholder="e.g. make it a rainy night in Tokyo"
            rows={2}
            className="field resize-none"
          />
        </label>
      )}

      {!showMore && (
        <button
          type="button"
          onClick={() => setShowMore(true)}
          className="press focus-ring min-h-9 self-start rounded-lg text-left text-[13px] font-medium text-ink-300 hover:text-ink-100"
        >
          More styles: {MORE_INTENTS.map((id) => RULE_PACKS[id].title).join(', ')} →
        </button>
      )}
    </fieldset>
  );
}
