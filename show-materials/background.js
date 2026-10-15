// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Background service worker ready.');
});

const cache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Action icon badge count
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const tabId = sender.tab.id;
    const count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' });
      chrome.action.setBadgeText({ tabId, text: `${count}%` });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
    sendResponse({ ok: true });
    return false;
  }

  // In background.js message listener:
  if (message.type === 'FETCH_TARGET_HOVER') {
    const tcin = message.tcin;
    const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&pricing_store_id=3991`;
  
    if (cache.has(tcin)) {
      sendResponse({ success: true, specs: cache.get(tcin) });
      return false;
    }
  
    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(data => {
        const bullets = data?.data?.product?.item?.product_description?.bullet_descriptions || [];
        const specText = bullets.join('\n');
        cache.set(tcin, specText);
        sendResponse({ success: true, specs: specText });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
  
    return true;
  }
  // Amazon-exclusive hover fetcher
  if (message.type === 'FETCH_AMAZON_HOVER') {
    const asin = message.asin;
    const targetUrl = `https://www.amazon.com/dp/${asin}`;

    if (cache.has(asin)) {
      sendResponse({ success: true, html: cache.get(asin) });
      return false;
    }

    fetch(targetUrl, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(html => {
        cache.set(asin, html);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.warn('[Fabric Inspector] Amazon fetch failed for ASIN:', asin, err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep channel open
  }
});
