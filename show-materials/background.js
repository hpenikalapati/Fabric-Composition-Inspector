// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Service worker installed.');
});

const cache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const count = message.count || 0;
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#10b981' });
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: count > 0 ? `${count}%` : '' });
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'FETCH_HOVER_HTML') {
    const { url } = message;

    if (cache.has(url)) {
      sendResponse({ success: true, html: cache.get(url) });
      return false;
    }

    fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.text();
      })
      .then(html => {
        cache.set(url, html);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.warn('[Fabric Inspector] Fetch failed for:', url, err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep channel open
  }
});
