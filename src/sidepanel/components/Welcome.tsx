import { ImageIcon } from 'lucide-react';

const STEPS = [
  { title: 'Capture a photo', body: 'Hover any Pinterest pin and tap the ring, or right-click any image on the web.' },
  { title: 'Choose a style', body: 'Recreate the look, put yourself in it, or try the outfit.' },
  { title: 'Send', body: 'We fill in ChatGPT or Gemini for you. You press send.' },
];

export function Welcome() {
  return (
    <div className="flex flex-col gap-7 px-5 pb-5 pt-7 animate-fade-in">
      <div className="flex flex-col gap-2.5">
        <h2 className="m-0 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em]">
          See a look you love?
          <br />
          Put yourself in it.
        </h2>
        <p className="m-0 text-sm text-ink-300">Pick any photo, choose a style, and send it to ChatGPT or Gemini in one tap.</p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-0.5 overflow-hidden rounded-2xl border border-ink-800 p-0">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3.5 bg-ink-900 p-4">
            <span
              className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                i === 0 ? 'bg-safelight text-ink-950' : 'bg-ink-700 text-ink-100'
              }`}
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">{step.title}</span>
              <span className="text-[13px] leading-snug text-ink-300">{step.body}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-600 p-5 text-center">
        <ImageIcon size={28} className="text-ink-300" aria-hidden="true" />
        <span className="text-sm font-medium">No photo yet</span>
        <a
          href="https://www.pinterest.com"
          target="_blank"
          rel="noreferrer"
          className="press focus-ring inline-flex min-h-11 items-center rounded-full border border-ink-600 px-[18px] text-sm font-medium text-ink-100 no-underline hover:border-ink-500"
        >
          Open Pinterest
        </a>
      </div>
    </div>
  );
}
