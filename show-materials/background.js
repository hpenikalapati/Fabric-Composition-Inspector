// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Service Worker installed.');
});

// Cache HTML fetches in background memory to avoid redundant requests
const fetchCache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. Badge indicator updates
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

  // 2. Network delegation for hover fetches (bypasses Content Script CORS and sandboxing)
  if (message.type === 'FETCH_HOVER_HTML') {
    const targetUrl = message.url;

    if (fetchCache.has(targetUrl)) {
      sendResponse({ success: true, html: fetchCache.get(targetUrl) });
      return true;
    }

    fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.text();
      })
      .then(html => {
        fetchCache.set(targetUrl, html);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.error('[Fabric Inspector] Background fetch failed:', err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep channel open for async response
  }
});
