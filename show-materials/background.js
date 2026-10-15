// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Universal service worker ready.');
});

const cache = new Map();

// Router for pure SPAs that require public API hits instead of HTML scraping
function getApiEndpoint(url) {
  try {
    const u = new URL(url);

    // Zara SPA API
    if (u.hostname.includes('zara.com')) {
      const match = u.pathname.match(/-p(\d+)\.html/i);
      if (match) {
        return {
          type: 'ZARA_JSON',
          apiUrl: `https://www.zara.com/itxrest/2/catalog/store/11719/product/${match[1]}/extra-detail?languageId=-1`
        };
      }
    }

    // Target RedSky API
    if (u.hostname.includes('target.com')) {
      const match = u.pathname.match(/\/A-(\d{8})/i);
      if (match) {
        return {
          type: 'TARGET_JSON',
          apiUrl: `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${match[1]}&pricing_store_id=3991`
        };
      }
    }
  } catch (e) {}

  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const count = message.count || 0;
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#10b981' });
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: count > 0 ? `${count}%` : '' });
  } else if (message.type === 'FABRIC_NOT_FOUND' && sender.tab) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
  }

  if (message.type === 'FETCH_HOVER_DATA') {
    const { url } = message;

    if (cache.has(url)) {
      sendResponse({ success: true, ...cache.get(url) });
      return true;
    }

    const apiRoute = getApiEndpoint(url);

    if (apiRoute) {
      // Direct Store API Fetch (For SPAs)
      fetch(apiRoute.apiUrl, {
        headers: { 'Accept': 'application/json' }
      })
        .then(res => res.json())
        .then(jsonData => {
          const result = { isJson: true, jsonType: apiRoute.type, data: jsonData };
          cache.set(url, result);
          sendResponse({ success: true, ...result });
        })
        .catch(err => {
          console.warn('[Fabric Inspector] SPA API fetch error:', err);
          sendResponse({ success: false, error: err.message });
        });
    } else {
      // Standard Document Fetch (For SSR / Amazon / Aéropostale)
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
          const result = { isJson: false, html };
          cache.set(url, result);
          sendResponse({ success: true, ...result });
        })
        .catch(err => {
          console.warn('[Fabric Inspector] Document fetch error:', err);
          sendResponse({ success: false, error: err.message });
        });
    }

    return true; // Keep channel open
  }
});
