import { useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { CompiledPrompt, PromptHistoryItem } from '../types';
import { RULE_PACKS } from '../modules/prompt-builder/rulePacks';
import { buildPrompt } from '../modules/prompt-builder/builder';
import { SELFIE_FILENAME, extraFaceFilename } from '../modules/prompt-builder/attachments';
import { copyTextToClipboard, triggerImageDownload } from '../modules/llm-injector/clipboardPaste';
import { requestImageHostAccess } from '../lib/imageAccess';
import { appendHistory, createHistoryItem } from '../lib/storage';
import { TARGETS } from '../lib/targets';
import { LOG_PREFIX } from '../brand';
import { usePanelState } from './usePanelState';
import { Header } from './components/Header';
import { Welcome } from './components/Welcome';
import { ImageHero } from './components/ImageHero';
import { StylePicker } from './components/StylePicker';
import { YourPhoto } from './components/YourPhoto';
import { AdvancedSettings } from './components/AdvancedSettings';
import { SendBar } from './components/SendBar';
import { Gallery } from './components/Gallery';

interface SendResult {
  success: boolean;
  fallbackTriggered?: boolean;
  error?: string;
  attached?: number;
  expected?: number;
}

export default function App() {
  const { state, setIntent, setTarget, setFaceConsent, setPhotos, clearImage, updateSettings, setHistory } = usePanelState();
  const { image, intent, selfie, extraFaces, faceConsent, target, settings, history } = state;

  const [view, setView] = useState<'main' | 'gallery'>('main');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = (text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const prompt = useMemo(
    () => buildPrompt({ selectedImage: image, intent, target, settings, referenceSelfie: selfie, extraFaces }),
    [image, intent, target, settings, selfie, extraFaces],
  );
  const needsSelfie = Boolean(RULE_PACKS[intent].needsSelfie);
  const targetInfo = TARGETS[target];

  const copyPrompt = async (p: CompiledPrompt = prompt): Promise<boolean> => {
    const ok = await copyTextToClipboard(p.promptText);
    if (ok) await appendHistory(createHistoryItem(p, image));
    else flash('Could not copy the prompt');
    return ok;
  };

  const downloadImages = () => {
    prompt.imageUrls.forEach((url, i) => triggerImageDownload(url, `inspiration-${i + 1}.jpg`));
    if (selfie) triggerImageDownload(selfie.dataUrl, SELFIE_FILENAME);
    prompt.extraFaceDataUrls?.forEach((url, i) => triggerImageDownload(url, extraFaceFilename(i)));
    flash('Downloading. Drag the files into the chat.');
  };

  const send = async () => {
    if (needsSelfie && !selfie) {
      flash('Add a photo of yourself first');
      return;
    }

    if (targetInfo.delivery === 'copy') {
      if (await copyPrompt()) flash(`Copied. Paste it into ${targetInfo.label}.`);
      return;
    }

    // Must be the first await so the permission prompt still counts as part of the click.
    const imageUrl = prompt.imageUrls[0];
    const imageAccess = imageUrl ? await requestImageHostAccess(imageUrl) : true;
    const toSend = imageAccess ? prompt : { ...prompt, imageUrls: [] };

    setSending(true);
    setSentTo(null);
    setShowDownload(false);
    try {
      const res: SendResult | undefined = await chrome.runtime.sendMessage({ type: 'SEND_TO_AI', payload: { prompt: toSend, image } });
      if (!res?.success) throw new Error(res?.error || 'No response from the extension');
      setSentTo(targetInfo.label);
      if (res.fallbackTriggered || !imageAccess) {
        console.warn(`${LOG_PREFIX} Images not fully attached:`, res);
        setShowDownload(true);
        const partial = res.attached && res.expected ? `${res.attached} of ${res.expected} images attached. ` : 'Images could not be attached. ';
        flash(`Text is in. ${partial}Download them below.`);
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} Send failed:`, err);
      const copied = await copyTextToClipboard(prompt.promptText);
      setShowDownload(true);
      flash(copied ? `Could not fill in ${targetInfo.label}. Prompt copied, so paste it there.` : `Could not reach ${targetInfo.label}.`);
    } finally {
      setSending(false);
    }
  };

  const copyHistoryItem = async (item: PromptHistoryItem) => {
    flash((await copyTextToClipboard(item.promptText)) ? 'Prompt copied' : 'Could not copy the prompt');
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-ink-100">
      <Header view={view} galleryCount={history.length} onOpenGallery={() => setView('gallery')} onBack={() => setView('main')} />

      {view === 'gallery' ? (
        <Gallery
          items={history}
          onCopy={copyHistoryItem}
          onDelete={(id) => setHistory(history.filter((h) => h.id !== id))}
          onClear={() => setHistory([])}
        />
      ) : !state.loaded ? null : !image ? (
        <Welcome />
      ) : (
        <>
          <main className="flex flex-grow flex-col gap-5 px-5 py-4 animate-fade-in">
            {sentTo && (
              <div role="status" className="flex items-center gap-3 rounded-2xl border border-ink-800 bg-ink-900 p-3.5 animate-fade-in">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-safelight text-ink-950">
                  <Check size={16} strokeWidth={2.6} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Ready in {sentTo}</span>
                  <span className="text-xs text-ink-300">Check it there and press send. It's saved in your gallery.</span>
                </div>
              </div>
            )}

            <ImageHero image={image} onClear={clearImage} />

            <StylePicker
              intent={intent}
              onChange={setIntent}
              directive={settings.customDirective}
              onDirectiveChange={(customDirective) => updateSettings({ customDirective })}
            />

            <YourPhoto
              selfie={selfie}
              extraFaces={extraFaces}
              required={needsSelfie}
              role={intent === 'apply_effect' ? 'base' : 'face'}
              consent={faceConsent}
              onConsentChange={setFaceConsent}
              onPhotosChange={(next, extras, message) => {
                setPhotos(next, extras);
                if (message) flash(message);
              }}
              onError={flash}
            />

            <AdvancedSettings
              settings={settings}
              onChange={updateSettings}
              showDirective={intent !== 'directed_edit'}
              promptText={prompt.promptText}
              onCopyPrompt={() => copyPrompt()}
            />
          </main>

          <SendBar
            target={target}
            onTargetChange={setTarget}
            onSend={send}
            onCopy={async () => {
              if (await copyPrompt()) flash('Prompt copied');
            }}
            onDownloadImages={downloadImages}
            sending={sending}
            showDownload={showDownload}
          />
        </>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-5 bottom-28 z-50 rounded-xl bg-ink-100 px-4 py-3 text-center text-[13px] font-medium text-ink-950 shadow-2xl animate-fade-in"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
