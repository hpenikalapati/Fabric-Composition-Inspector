// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Background service worker ready.');
});

const cache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' });
      chrome.action.setBadgeText({ tabId, text: `${count}%` });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  } else if (message.type === 'FABRIC_NOT_FOUND' && sender.tab) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
  }

  if (message.type === 'FETCH_HOVER_HTML') {
    const { url } = message;

    if (cache.has(url)) {
      sendResponse({ success: true, html: cache.get(url) });
      return false;
    }

    fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(html => {
        cache.set(url, html);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.warn('[Fabric Inspector] Fetch failed:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keeps message channel open
  }
});
