import React, { useState, useEffect, useMemo } from 'react';
import {
  Copy,
  Download,
  ExternalLink,
  Upload,
  Check,
  X,
  Image as ImageIcon,
  Key,
  Wand2,
  Type,
  History,
  ChevronDown,
  Send,
  Plus,
  Sun,
  Moon,
} from 'lucide-react';
import { SelectedImage, IntentType, TargetLLM, AspectRatio, PhotographySettings, ReferencePhoto, PromptHistoryItem } from '../types';
import { RULE_PACKS } from '../modules/prompt-builder/rulePacks';
import { buildPrompt } from '../modules/prompt-builder/builder';
import { copyTextToClipboard, triggerImageDownload } from '../modules/llm-injector/clipboardPaste';
import { analyzeImageWithGeminiApi } from '../lib/geminiApi';

/* ── tiny intent label map ── */
const INTENT_LABELS: Record<IntentType, string> = {
  recreate_scene: 'Recreate Scene',
  place_my_face: 'Place My Face',
  fashion_transfer: 'Fashion Transfer',
  pro_portrait: 'Pro Portrait',
  travel_lifestyle: 'Travel Lifestyle',
  directed_edit: 'Directed Edit',
};

const TARGET_MODELS: { id: TargetLLM; label: string }[] = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'midjourney', label: 'MJ' },
  { id: 'flux', label: 'Flux' },
];

export default function App() {
  /* ── state ── */
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [referenceSelfie, setReferenceSelfie] = useState<ReferencePhoto | null>(null);
  const [intent, setIntent] = useState<IntentType>('recreate_scene');
  const [target, setTarget] = useState<TargetLLM>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<PromptHistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const [settings, setSettings] = useState<PhotographySettings>({
    aspectRatio: '4:5',
    cameraLens: '85mm portrait',
    lightingStyle: 'natural ambient lighting',
    customDirective: '',
    textOverlayMode: 'none',
    customOverlayText: '',
  });

  /* ── lifecycle ── */
  useEffect(() => {
    chrome.storage.local.get(
      ['activeSelectedImage', 'userReferenceSelfie', 'targetLLM', 'geminiApiKey', 'promptHistory', 'darkMode'],
      (res) => {
        if (res.activeSelectedImage) setSelectedImage(res.activeSelectedImage);
        if (res.userReferenceSelfie) setReferenceSelfie(res.userReferenceSelfie);
        if (res.targetLLM) setTarget(res.targetLLM);
        if (res.geminiApiKey) setGeminiApiKey(res.geminiApiKey);
        if (res.promptHistory) setHistoryItems(res.promptHistory);
        if (res.darkMode !== undefined) setDarkMode(res.darkMode);
      },
    );

    const onMessage = (msg: any) => {
      if (msg.type === 'SELECT_IMAGE' && msg.payload?.image) {
        setSelectedImage(msg.payload.image);
        flash('Image captured');
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  /* ── dark mode effect ── */
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    chrome.storage.local.set({ darkMode: next });
    flash(next ? 'Dark mode enabled' : 'Light mode enabled');
  };

  /* ── helpers ── */
  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  };

  const handleTargetChange = (t: TargetLLM) => {
    setTarget(t);
    chrome.storage.local.set({ targetLLM: t });
  };

  const saveApiKey = (k: string) => {
    setGeminiApiKey(k);
    chrome.storage.local.set({ geminiApiKey: k });
    flash('API key saved');
  };

  const saveToHistory = (text: string) => {
    const item: PromptHistoryItem = {
      id: `p_${Date.now()}`,
      intent,
      target,
      title: selectedImage?.title || 'Prompt',
      promptText: text,
      imageUrl: selectedImage?.highResUrl || selectedImage?.url,
      timestamp: Date.now(),
    };
    const updated = [item, ...historyItems.slice(0, 19)];
    setHistoryItems(updated);
    chrome.storage.local.set({ promptHistory: updated });
  };

  const prompt = useMemo(
    () => buildPrompt({ selectedImage, intent, target, settings, referenceSelfie }),
    [selectedImage, intent, target, settings, referenceSelfie],
  );

  /* ── actions ── */
  const analyzeFeatures = async () => {
    if (!selectedImage) return;
    if (!geminiApiKey) {
      setShowApiKey(true);
      flash('Enter Gemini API key first');
      return;
    }
    setAnalyzing(true);
    try {
      const url = selectedImage.highResUrl || selectedImage.url;
      const f = await analyzeImageWithGeminiApi(url, geminiApiKey);
      setSettings((s) => ({
        ...s,
        lightingStyle: f.lightingStyle || s.lightingStyle,
        cameraLens: f.cameraLens || s.cameraLens,
        customDirective: f.suggestedDirective || s.customDirective,
      }));
      flash('Features extracted');
    } catch (e: any) {
      flash(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const selfie: ReferencePhoto = {
        id: `s_${Date.now()}`,
        name: file.name,
        dataUrl: ev.target?.result as string,
        timestamp: Date.now(),
      };
      setReferenceSelfie(selfie);
      chrome.storage.local.set({ userReferenceSelfie: selfie });
      flash('Photo added');
    };
    reader.readAsDataURL(file);
  };

  const removeSelfie = () => {
    setReferenceSelfie(null);
    chrome.storage.local.remove('userReferenceSelfie');
  };

  const copyPrompt = async () => {
    const ok = await copyTextToClipboard(prompt.promptText);
    if (ok) {
      setCopied(true);
      saveToHistory(prompt.promptText);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const downloadImages = () => {
    if (selectedImage?.highResUrl || selectedImage?.url) {
      triggerImageDownload(selectedImage.highResUrl || selectedImage.url, 'reference.jpg');
    }
    if (referenceSelfie?.dataUrl) {
      triggerImageDownload(referenceSelfie.dataUrl, 'selfie.jpg');
    }
    flash('Downloading');
  };

  const inject = async () => {
    setInjecting(true);
    saveToHistory(prompt.promptText);

    if (target === 'midjourney' || target === 'flux') {
      await copyTextToClipboard(prompt.promptText);
      setInjecting(false);
      flash(`${target} prompt copied`);
      return;
    }

    const url = target === 'chatgpt' ? 'https://chatgpt.com/' : 'https://gemini.google.com/app';
    try {
      const domain = target === 'chatgpt' ? 'chatgpt.com' : 'gemini.google.com';
      const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });
      let tab: chrome.tabs.Tab | null = null;

      if (tabs.length && tabs[0].id !== undefined) {
        tab = tabs[0];
        await chrome.tabs.update(tabs[0].id, { active: true });
      } else {
        tab = await chrome.tabs.create({ url, active: true });
        await new Promise((r) => setTimeout(r, 2500));
      }

      if (!tab?.id) throw new Error('No tab');

      chrome.runtime.sendMessage(
        { type: 'INJECT_PROMPT', payload: { tabId: tab.id, prompt } },
        async (res) => {
          setInjecting(false);
          if (chrome.runtime.lastError || !res?.success) {
            await copyTextToClipboard(prompt.promptText);
            flash('Prompt copied — paste manually');
          } else {
            flash('Sent');
          }
        },
      );
    } catch {
      setInjecting(false);
      await copyTextToClipboard(prompt.promptText);
      flash('Prompt copied');
    }
  };

  const targetIndex = TARGET_MODELS.findIndex((m) => m.id === target);

  /* ── render ── */
  return (
    <div style={{ padding: '20px 16px', maxWidth: 420, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div
          className="animate-toast"
          style={{
            position: 'fixed',
            top: 12,
            left: 16,
            right: 16,
            zIndex: 100,
            background: '#FFE66A',
            border: '2px solid #211D16',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#211D16',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '4px 4px 0px #211D16',
          }}
        >
          <Check style={{ width: 16, height: 16, strokeWidth: 3, color: '#211D16' }} />
          {toast}
        </div>
      )}

      {/* ─── Header ─── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1
              className="font-heading"
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              PromptForge
            </h1>
            <span
              style={{
                background: '#FFE66A',
                border: '1.5px solid #211D16',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: 10,
                fontWeight: 800,
                color: '#211D16',
                letterSpacing: '0.05em',
              }}
            >
              ATELIER v1.0
            </span>
          </div>
          <p style={{ fontSize: 11, margin: '3px 0 0', fontWeight: 500, opacity: 0.8 }}>
            Multimodal Photoshoot Prompt Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <IconBtn
            onClick={toggleDarkMode}
            active={darkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun style={{ width: 15, height: 15 }} /> : <Moon style={{ width: 15, height: 15 }} />}
          </IconBtn>
          <IconBtn
            onClick={() => setShowHistory(!showHistory)}
            active={showHistory}
            title="History"
          >
            <History style={{ width: 15, height: 15 }} />
          </IconBtn>
          <IconBtn onClick={() => setShowApiKey(!showApiKey)} title="API Key">
            <Key style={{ width: 15, height: 15 }} />
          </IconBtn>
        </div>
      </header>


      {/* ─── History panel ─── */}
      {showHistory && (
        <Panel style={{ marginBottom: 16 }} className="animate-fade-in">
          <PanelHeader>
            <span>PROMPT HISTORY</span>
            {historyItems.length > 0 && (
              <button
                onClick={() => {
                  setHistoryItems([]);
                  chrome.storage.local.remove('promptHistory');
                }}
                style={linkBtnStyle}
              >
                Clear
              </button>
            )}
          </PanelHeader>
          {historyItems.length > 0 ? (
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {historyItems.map((h) => (
                <div key={h.id} style={historyRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#211D16', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                    <div style={{ fontSize: 10, color: '#584140', marginTop: 2, fontWeight: 500 }}>
                      {INTENT_LABELS[h.intent] || h.intent} · {h.target.toUpperCase()}
                    </div>
                  </div>
                  <SmallBtn
                    onClick={async () => {
                      await copyTextToClipboard(h.promptText);
                      flash('Copied');
                    }}
                  >
                    <Copy style={{ width: 12, height: 12 }} />
                  </SmallBtn>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: '#8C706F', textAlign: 'center', padding: '12px 0', fontWeight: 500 }}>
              No prompt history yet
            </p>
          )}
        </Panel>
      )}

      {/* ─── API Key panel ─── */}
      {showApiKey && (
        <Panel style={{ marginBottom: 16 }} className="animate-fade-in">
          <PanelHeader>
            <span>GEMINI VISION API KEY</span>
            <span style={{ fontSize: 10, color: '#8C706F', fontWeight: 600 }}>OPTIONAL</span>
          </PanelHeader>
          <input
            type="password"
            placeholder="Paste key from aistudio.google.com"
            value={geminiApiKey}
            onChange={(e) => saveApiKey(e.target.value)}
            className="neo-input"
            style={{...inputStyle, background: darkMode ? '#121212' : '#FFF', color: darkMode ? '#F2F2F7' : '#211D16', border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16'}}
          />
          <p style={{ fontSize: 10, color: darkMode ? '#8E8E93' : '#584140', margin: '6px 0 0', fontWeight: 500 }}>
            Enables automatic feature extraction from reference photos.
          </p>
        </Panel>
      )}

      {/* ─── Neo-Brutalist Model Selector Track ─── */}
      <div style={{ marginBottom: 20 }}>
        <Label>TARGET AI GENERATOR</Label>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            background: darkMode ? '#161618' : '#F6ECE1',
            border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16',
            boxShadow: darkMode ? '3px 3px 0px #080808' : '3px 3px 0px #211D16',
            borderRadius: 8,
            padding: 4,
            width: '100%',
          }}
        >
          {/* Sliding Pill Highlight */}
          <div
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: 'calc(25% - 2px)',
              background: darkMode ? '#FF5252' : '#FF6B6B',
              border: darkMode ? '1.5px solid #FF5252' : '2px solid #211D16',
              boxShadow: darkMode ? '2px 2px 0px #080808' : '2px 2px 0px #211D16',
              borderRadius: 6,
              transform: `translateX(${targetIndex * 100}%)`,
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
            }}
          />

          {/* Model Buttons */}
          {TARGET_MODELS.map((m) => {
            const isActive = target === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleTargetChange(m.id)}
                className="interactive-btn"
                style={{
                  position: 'relative',
                  zIndex: 1,
                  flex: 1,
                  padding: '7px 0',
                  fontSize: 11,
                  fontWeight: 800,
                  color: isActive ? (darkMode ? '#121212' : '#211D16') : (darkMode ? '#8E8E93' : '#584140'),
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 150ms ease',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Reference image ─── */}
      <Panel style={{ marginBottom: 14 }}>
        <PanelHeader>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: darkMode ? '#F2F2F7' : '#211D16' }}>
            <ImageIcon style={{ width: 14, height: 14, color: darkMode ? '#FFD60A' : '#211D16' }} />
            REFERENCE INSPIRATION
          </span>
          {selectedImage && (
            <button onClick={() => setSelectedImage(null)} style={{...linkBtnStyle, color: darkMode ? '#8E8E93' : '#211D16'}} className="interactive-btn">
              <X style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
            </button>
          )}
        </PanelHeader>

        {selectedImage ? (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <img
                src={selectedImage.highResUrl || selectedImage.url}
                alt={selectedImage.title}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 6,
                  border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16',
                  boxShadow: darkMode ? '2px 2px 0px #080808' : '2px 2px 0px #211D16',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'inline-block', background: darkMode ? '#FFD60A' : '#FFE66A', border: darkMode ? '1px solid #FFD60A' : '1.5px solid #211D16', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800, color: '#121212', marginBottom: 4 }}>
                  📌 PIN DETECTED
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: darkMode ? '#F2F2F7' : '#211D16',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedImage.title}
                </div>
                {selectedImage.sourceUrl && (
                  <a
                    href={selectedImage.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 10,
                      color: darkMode ? '#8E8E93' : '#584140',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      marginTop: 2,
                      textDecoration: 'underline',
                    }}
                  >
                    Source Pin <ExternalLink style={{ width: 10, height: 10 }} />
                  </a>
                )}
              </div>
            </div>

            {/* Analyze button */}
            <button onClick={analyzeFeatures} disabled={analyzing} style={{...secondaryBtnStyle, color: darkMode ? '#F2F2F7' : '#211D16', background: darkMode ? '#161618' : '#F6ECE1'}} className="interactive-btn neo-btn-secondary">
              <Wand2 style={{ width: 14, height: 14 }} />
              {analyzing ? 'ANALYZING...' : '✦ EXTRACT VISUAL FEATURES'}
            </button>
          </div>
        ) : (
          <div
            style={{
              border: darkMode ? '1.5px dashed #2C2C2E' : '2px dashed #211D16',
              borderRadius: 6,
              padding: '20px 12px',
              textAlign: 'center',
              background: darkMode ? '#161618' : '#FFF8F2',
            }}
          >
            <p style={{ fontSize: 12, color: darkMode ? '#F2F2F7' : '#211D16', fontWeight: 700, margin: 0 }}>No Pinterest Pin Selected</p>
            <p style={{ fontSize: 10, color: darkMode ? '#8E8E93' : '#584140', margin: '4px 0 0', fontWeight: 500 }}>
              Hover any Pinterest photo → click <b style={{ color: darkMode ? '#FF5252' : '#FF6B6B' }}>Forge Prompt</b>
            </p>
          </div>
        )}
      </Panel>

      {/* ─── Face reference ─── */}
      <Panel style={{ marginBottom: 20 }}>
        <PanelHeader>
          <span style={{ color: darkMode ? '#F2F2F7' : '#211D16' }}>FACE SWAP REFERENCE</span>
          {referenceSelfie && (
            <button onClick={removeSelfie} style={{...linkBtnStyle, color: darkMode ? '#8E8E93' : '#211D16'}} className="interactive-btn">
              Remove
            </button>
          )}
        </PanelHeader>

        {referenceSelfie ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={referenceSelfie.dataUrl}
              alt="Selfie"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16',
                boxShadow: darkMode ? '2px 2px 0px #080808' : '2px 2px 0px #211D16',
              }}
            />
            <div>
              <div style={{ fontSize: 12, color: darkMode ? '#F2F2F7' : '#211D16', fontWeight: 700 }}>{referenceSelfie.name}</div>
              <div style={{ fontSize: 10, color: '#121212', background: darkMode ? '#FFD60A' : '#FFE66A', display: 'inline-block', padding: '1px 5px', borderRadius: 4, border: '1px solid #121212', fontWeight: 800, marginTop: 2 }}>Ready for Face Compositing</div>
            </div>
          </div>
        ) : (
          <label style={{...uploadLabelStyle, border: darkMode ? '1.5px dashed #2C2C2E' : '2px dashed #211D16'}} className="interactive-btn neo-btn-secondary">
            <Plus style={{ width: 15, height: 15, color: darkMode ? '#F2F2F7' : '#211D16', strokeWidth: 2.5 }} />
            <span style={{ fontWeight: 700, color: darkMode ? '#F2F2F7' : '#211D16' }}>ADD SELFIE / FACE PHOTO</span>
            <input type="file" accept="image/*" onChange={handleSelfie} style={{ display: 'none' }} />
          </label>
        )}
      </Panel>

      {/* ─── Intent ─── */}
      <div style={{ marginBottom: 20 }}>
        <Label>PHOTOGRAPHY INTENT RULE PACK</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(RULE_PACKS) as IntentType[]).map((key) => {
            const isActive = intent === key;
            return (
              <button
                key={key}
                onClick={() => setIntent(key)}
                className={`interactive-btn chip-item ${isActive ? 'chip-item-active' : ''}`}
                style={{
                  padding: '7px 12px',
                  fontSize: 11,
                  borderRadius: 6,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {INTENT_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Settings toggle ─── */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="interactive-btn neo-btn-secondary"
        style={{
          ...secondaryBtnStyle,
          marginBottom: showSettings ? 8 : 20,
          justifyContent: 'space-between',
          width: '100%',
          color: darkMode ? '#F2F2F7' : '#211D16',
          background: darkMode ? '#161618' : '#F6ECE1'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          FINE-TUNING CONTROLS
        </span>
        <ChevronDown
          style={{
            width: 15,
            height: 15,
            strokeWidth: 2.5,
            transform: showSettings ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>

      {/* Smooth Collapsible Settings Drawer */}
      <div
        style={{
          maxHeight: showSettings ? 500 : 0,
          opacity: showSettings ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
          marginBottom: showSettings ? 20 : 0,
        }}
      >
        <Panel>
          {/* Text overlay */}
          <div style={{ marginBottom: 14 }}>
            <Label>TEXT OVERLAY CONTROL</Label>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['none', 'original', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSettings({ ...settings, textOverlayMode: mode })}
                  className={`interactive-btn chip-item ${settings.textOverlayMode === mode ? 'chip-item-active' : ''}`}
                  style={{
                    padding: '6px 10px',
                    fontSize: 10,
                    borderRadius: 6,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mode === 'none' ? 'None' : mode === 'original' ? 'Keep original' : 'Custom'}
                </button>
              ))}
            </div>
            {settings.textOverlayMode === 'custom' && (
              <input
                type="text"
                placeholder="e.g. VOGUE, PARIS 2026"
                value={settings.customOverlayText}
                onChange={(e) => setSettings({ ...settings, customOverlayText: e.target.value })}
                className="neo-input"
                style={{ ...inputStyle, marginTop: 8, background: darkMode ? '#121212' : '#FFF', color: darkMode ? '#F2F2F7' : '#211D16', border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16' }}
              />
            )}
          </div>

          {/* Aspect ratio */}
          <div style={{ marginBottom: 14 }}>
            <Label>ASPECT RATIO</Label>
            <div style={{ display: 'flex', gap: 5 }}>
              {(['4:5', '9:16', '1:1', '16:9', '3:2'] as AspectRatio[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => setSettings({ ...settings, aspectRatio: ar })}
                  className={`interactive-btn chip-item ${settings.aspectRatio === ar ? 'chip-item-active' : ''}`}
                  style={{
                    padding: '6px 0',
                    fontSize: 11,
                    borderRadius: 6,
                    cursor: 'pointer',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Lens */}
          <div style={{ marginBottom: 14 }}>
            <Label>CAMERA LENS</Label>
            <div style={{ position: 'relative' }}>
              <select
                value={settings.cameraLens}
                onChange={(e) => setSettings({ ...settings, cameraLens: e.target.value })}
                className="neo-input"
                style={{...selectStyle, background: darkMode ? '#121212' : '#FFF', color: darkMode ? '#F2F2F7' : '#211D16', border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16'}}
              >
                <option value="35mm wide">35mm Wide Angle</option>
                <option value="50mm prime">50mm Standard Prime</option>
                <option value="85mm portrait">85mm Studio Portrait</option>
                <option value="135mm portrait">135mm Telephoto Focus</option>
              </select>
              <ChevronDown
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  color: darkMode ? '#F2F2F7' : '#211D16',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Directive */}
          <div>
            <Label>CUSTOM STYLE DIRECTIVE</Label>
            <input
              type="text"
              placeholder="e.g. sunset beach lighting in Bali"
              value={settings.customDirective}
              onChange={(e) => setSettings({ ...settings, customDirective: e.target.value })}
              className="neo-input"
              style={{...inputStyle, background: darkMode ? '#121212' : '#FFF', color: darkMode ? '#F2F2F7' : '#211D16', border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16'}}
            />
          </div>
        </Panel>
      </div>

      {/* ─── Prompt preview ─── */}
      <Panel style={{ marginBottom: 16 }}>
        <PanelHeader>
          <span style={{ color: darkMode ? '#F2F2F7' : '#211D16' }}>COMPILED PROMPT OUTPUT</span>
          <button
            onClick={copyPrompt}
            className="interactive-btn"
            style={{ ...linkBtnStyle, display: 'flex', alignItems: 'center', gap: 4, color: darkMode ? '#8E8E93' : '#211D16' }}
          >
            {copied ? <Check style={{ width: 13, height: 13, color: darkMode ? '#FFD60A' : '#211D16' }} /> : <Copy style={{ width: 13, height: 13 }} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </PanelHeader>
        <pre
          className="font-mono"
          style={{
            fontSize: 11,
            lineHeight: 1.6,
            color: darkMode ? '#F2F2F7' : '#211D16',
            background: darkMode ? '#161618' : '#FFF8F2',
            border: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16',
            boxShadow: darkMode ? '2px 2px 0px #080808' : '2px 2px 0px #211D16',
            borderRadius: 6,
            padding: 12,
            maxHeight: 160,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {prompt.promptText}
        </pre>
      </Panel>

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Primary */}
        <button onClick={inject} disabled={injecting} style={primaryBtnStyle} className="interactive-btn">
          <Send style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
          {injecting
            ? 'SENDING...'
            : target === 'midjourney' || target === 'flux'
            ? `COPY ${target.toUpperCase()} PROMPT`
            : `✦ INJECT INTO ${target === 'chatgpt' ? 'CHATGPT' : 'GEMINI ADVANCED'}`}
        </button>

        {/* Secondary row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyPrompt} style={{ ...yellowBtnStyle, flex: 1 }} className="interactive-btn">
            <Copy style={{ width: 14, height: 14 }} />
            Copy Prompt
          </button>
          <button onClick={downloadImages} style={{ ...secondaryBtnStyle, flex: 1, color: darkMode ? '#F2F2F7' : '#211D16', background: darkMode ? '#161618' : '#F6ECE1' }} className="interactive-btn neo-btn-secondary">
            <Download style={{ width: 14, height: 14 }} />
            Images
          </button>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer style={{ textAlign: 'center', marginTop: 24, paddingTop: 16, borderTop: darkMode ? '1.5px solid #2C2C2E' : '2px solid #211D16' }}>
        <p style={{ fontSize: 10, color: darkMode ? '#8E8E93' : '#584140', fontWeight: 600, margin: 0 }}>
          PromptForge Atelier · {selectedImage ? '1 ref' : '0 ref'}{referenceSelfie ? ' + 1 face' : ''} · {target.toUpperCase()}
        </p>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Neo-Brutalist sub-components & shared style objects
   ══════════════════════════════════════════════ */

function Panel({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={`neo-card ${className || ''}`}
      style={{
        padding: '12px 14px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="section-header-label"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-header-label" style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, letterSpacing: '0.05em' }}>
      {children}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="interactive-btn"
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid',
        borderColor: active ? '#FF5252' : 'inherit',
        boxShadow: active ? '1px 1px 0px #000000' : '2px 2px 0px #000000',
        borderRadius: 6,
        background: active ? '#FF5252' : 'inherit',
        color: active ? '#121212' : 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="interactive-btn"
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #2C2C2E',
        boxShadow: '2px 2px 0px #080808',
        borderRadius: 6,
        background: '#FFE66A',
        color: '#121212',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ── shared style objects ── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 500,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
  paddingRight: 28,
};

const linkBtnStyle: React.CSSProperties = {
  fontSize: 11,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontWeight: 800,
  textDecoration: 'underline',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  border: '2px solid #211D16',
  boxShadow: '3px 3px 0px #211D16',
  borderRadius: 6,
  cursor: 'pointer',
};

const yellowBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 800,
  color: '#121212',
  background: '#FFE66A',
  border: '1.5px solid #211D16',
  boxShadow: '3px 3px 0px #211D16',
  borderRadius: 6,
  cursor: 'pointer',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '13px 16px',
  fontSize: 13,
  fontWeight: 800,
  color: '#121212',
  background: '#FF5252',
  border: '1.5px solid #121212',
  boxShadow: '4px 4px 0px #000000',
  borderRadius: 8,
  cursor: 'pointer',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const uploadLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 12px',
  fontSize: 12,
  border: '1.5px dashed #2C2C2E',
  borderRadius: 6,
  cursor: 'pointer',
};

const historyRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 0',
  borderBottom: '1.5px solid #211D16',
};

