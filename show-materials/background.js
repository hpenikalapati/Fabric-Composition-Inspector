// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Service Worker installed.');
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
      return true;
    }

    fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
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
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep channel open
  }
});
