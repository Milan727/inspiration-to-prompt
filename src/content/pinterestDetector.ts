import { getBestImageSource, extractPinterestMetadata } from '../modules/image-selection/pinterestEnhancer';
import { SelectedImage } from '../types';

let currentHoveredImg: HTMLImageElement | null = null;
let actionBadge: HTMLDivElement | null = null;

// Create floating overlay badge
function createActionBadge(): HTMLDivElement {
  const badge = document.createElement('div');
  badge.id = 'promptforge-hover-badge';
  badge.setAttribute('data-promptforge-ui', 'true');
  badge.style.cssText = `
    position: absolute;
    z-index: 2147483647;
    display: none;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    user-select: none;
    transition: transform 0.15s ease, opacity 0.15s ease;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  badge.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
    <span>Forge Prompt</span>
  `;

  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.06)';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
  });

  badge.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentHoveredImg) {
      handleImageSelection(currentHoveredImg);
    }
  });

  document.body.appendChild(badge);
  return badge;
}

// Position badge relative to image
function updateBadgePosition(img: HTMLImageElement) {
  if (!actionBadge) actionBadge = createActionBadge();

  const rect = img.getBoundingClientRect();
  if (rect.width < 80 || rect.height < 80) {
    actionBadge.style.display = 'none';
    return;
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  const top = rect.top + scrollTop + 8;
  const left = rect.right + scrollLeft - 120; // Align to top right corner

  actionBadge.style.top = `${top}px`;
  actionBadge.style.left = `${Math.max(8, left)}px`;
  actionBadge.style.display = 'flex';
}

// Handle image selection dispatch
function handleImageSelection(img: HTMLImageElement) {
  const { url, highResUrl } = getBestImageSource(img);
  const metadata = extractPinterestMetadata(img);

  const naturalWidth = img.naturalWidth || img.clientWidth || 0;
  const naturalHeight = img.naturalHeight || img.clientHeight || 0;
  let ratio = '1:1';
  if (naturalWidth > 0 && naturalHeight > 0) {
    const calc = naturalWidth / naturalHeight;
    if (calc < 0.85) ratio = '4:5';
    else if (calc < 0.6) ratio = '9:16';
    else if (calc > 1.4) ratio = '16:9';
    else if (calc > 1.15) ratio = '3:2';
  }

  const selectedImage: SelectedImage = {
    url,
    highResUrl,
    alt: metadata.alt,
    title: metadata.title,
    sourceUrl: metadata.sourceUrl,
    timestamp: Date.now(),
    width: naturalWidth,
    height: naturalHeight,
    aspectRatio: ratio,
  };

  // Visual feedback overlay
  showSuccessToast('Selected! Opening PromptForge Side Panel...');

  // Send message to Service Worker
  chrome.runtime.sendMessage(
    {
      type: 'SELECT_IMAGE',
      payload: { image: selectedImage },
    },
    (response) => {
      // Also request opening sidepanel
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
    }
  );
}

// Toast notification
function showSuccessToast(message: string) {
  const toast = document.createElement('div');
  toast.setAttribute('data-promptforge-ui', 'true');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #0f172a;
    color: #f8fafc;
    padding: 12px 18px;
    border-radius: 8px;
    border: 1px solid #4f46e5;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: promptforge-slide-in 0.2s ease-out forwards;
  `;
  toast.innerHTML = `
    <span style="color: #6366f1; font-size: 16px;">✓</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Event Listeners for Delegation
document.addEventListener('mouseover', (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  // Ignore PromptForge UI elements
  if (target.closest('[data-promptforge-ui="true"]')) return;

  let img: HTMLImageElement | null = null;
  if (target instanceof HTMLImageElement) {
    img = target;
  } else {
    img = target.querySelector('img');
  }

  if (img && img.src && (img.width >= 100 || img.naturalWidth >= 100)) {
    currentHoveredImg = img;
    img.style.outline = '2px solid #6366f1';
    img.style.outlineOffset = '-2px';
    img.style.transition = 'outline 0.15s ease';
    updateBadgePosition(img);
  }
});

document.addEventListener('mouseout', (e) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  if (target.closest('[data-promptforge-ui="true"]')) return;

  let img: HTMLImageElement | null = null;
  if (target instanceof HTMLImageElement) {
    img = target;
  } else {
    img = target.querySelector('img');
  }

  if (img) {
    img.style.outline = 'none';
  }

  // Hide badge if mouse moves away from image and badge
  const related = e.relatedTarget as HTMLElement;
  if (!related || (!related.closest('img') && !related.closest('#promptforge-hover-badge'))) {
    if (actionBadge) actionBadge.style.display = 'none';
    currentHoveredImg = null;
  }
});

// Window resize update
window.addEventListener('resize', () => {
  if (currentHoveredImg && actionBadge && actionBadge.style.display !== 'none') {
    updateBadgePosition(currentHoveredImg);
  }
});

console.log('[PromptForge] Pinterest & Web Image Detector initialized.');
