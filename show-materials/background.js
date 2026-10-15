// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Fabric Inspector] Universal 18-Store Service Worker Ready.');
});

const cache = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Update extension toolbar badge
  if (message.type === 'FABRIC_DETECTED' && sender.tab) {
    const count = message.count || 0;
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#10b981' });
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: count > 0 ? `${count}%` : '' });
    sendResponse({ ok: true });
    return false;
  }

  // --- 1. TARGET REDSKY JSON API ---
  if (message.type === 'FETCH_TARGET_HOVER') {
    const { tcin } = message;
    const cacheKey = `TARGET_${tcin}`;

    if (cache.has(cacheKey)) {
      sendResponse({ success: true, specText: cache.get(cacheKey) });
      return false;
    }

    const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=9f36aeafbe60771e321a7cc95a78140772ab3e96&tcin=${tcin}&pricing_store_id=3991`;

    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(res => res.json())
      .then(json => {
        const desc = json?.data?.product?.item?.product_description || {};
        const softGoods = desc.soft_goods_specifications || '';
        const bullets = Array.isArray(desc.bullet_descriptions) ? desc.bullet_descriptions.join('\n') : '';
        const combined = `${softGoods}\n${bullets}`;
        cache.set(cacheKey, combined);
        sendResponse({ success: true, specText: combined });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

  // --- 2. ZARA EXTRA-DETAIL API + HTML FALLBACK ---
  if (message.type === 'FETCH_ZARA_HOVER') {
    const { id, v1, url } = message;
    const cacheKey = `ZARA_${id}`;

    if (cache.has(cacheKey)) {
      sendResponse({ success: true, ...cache.get(cacheKey) });
      return false;
    }

    const lookupId = v1 || id;
    const apiUrl = `https://www.zara.com/itxrest/2/catalog/store/11719/product/${lookupId}/extra-detail?languageId=-1`;

    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Zara API fallback to HTML');
        return res.json();
      })
      .then(data => {
        let rawParts = [];
        if (Array.isArray(data)) {
          data.forEach(section => {
            if (section.sectionType === 'materials' && Array.isArray(section.components)) {
              section.components.forEach(c => {
                if (c.text && c.text.value) rawParts.push(c.text.value);
              });
            }
          });
        }
        const specText = rawParts.join('\n');
        if (specText) {
          const payload = { specText };
          cache.set(cacheKey, payload);
          sendResponse({ success: true, ...payload });
        } else {
          throw new Error('Empty Zara JSON');
        }
      })
      .catch(() => {
        // Fallback to fetching Zara HTML
        fetch(url, { credentials: 'include' })
          .then(r => r.text())
          .then(html => {
            const payload = { html };
            cache.set(cacheKey, payload);
            sendResponse({ success: true, ...payload });
          })
          .catch(err => sendResponse({ success: false, error: err.message }));
      });

    return true;
  }

  // --- 3. UNIVERSAL RETAIL HTML & STATE FETCHER ---
  if (message.type === 'FETCH_RETAIL_HTML') {
    const { url, storeKey, id } = message;
    const cacheKey = `${storeKey}_${id}`;

    if (cache.has(cacheKey)) {
      sendResponse({ success: true, html: cache.get(cacheKey) });
      return false;
    }

    fetch(url, {
      method: 'GET',
      credentials: storeKey === 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(html => {
        if (html.includes('api-services-support@amazon.com') || html.includes('validateCaptcha')) {
          sendResponse({ success: false, error: 'Amazon CAPTCHA block' });
          return;
        }
        cache.set(cacheKey, html);
        sendResponse({ success: true, html });
      })
      .catch(err => {
        console.warn(`[Fabric Inspector] Fetch failed for ${storeKey}:`, err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});
