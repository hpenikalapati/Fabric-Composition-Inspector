// Add inside content.js under the parsers section:

  // --- SPA JSON PAYLOAD INTERPRETERS ---
  function parseSpaJsonPayload(jsonType, data) {
    if (!data) return null;

    try {
      // 1. Zara extra-detail JSON
      if (jsonType === 'ZARA_JSON' && data.components) {
        let rawParts = [];
        for (const comp of data.components) {
          if (comp.datatype === 'composition' && Array.isArray(comp.materials)) {
            for (const mat of comp.materials) {
              const partName = mat.description || 'General';
              const fibers = (mat.lines || []).map(l => `${l.percentage}% ${l.name}`).join(', ');
              if (fibers) rawParts.push(`${partName}: ${fibers}`);
            }
          }
        }
        if (rawParts.length > 0) return parseComposition(rawParts.join('\n'));
      }

      // 2. Target RedSky JSON
      if (jsonType === 'TARGET_JSON') {
        const specs = data?.data?.product?.item?.product_description?.bullet_descriptions;
        if (Array.isArray(specs)) {
          const raw = specs.join('\n');
          return parseComposition(raw);
        }
      }
    } catch (e) {
      console.warn('[Fabric Inspector] SPA JSON unpack failed:', e);
    }

    return null;
  }

  // --- TIER 1: ON-PAGE CARD DOM SCRAPER ---
  function inspectHoveredTileDOM(cardElement) {
    if (!cardElement) return null;

    // Check hidden accessible descriptions or tooltips already inside the tile
    const ariaLabels = cardElement.getAttribute('aria-label') || '';
    const descNodes = cardElement.querySelectorAll('[class*="description"], [class*="detail"], [data-test*="spec"], p, span');
    
    let combinedText = ariaLabels + ' \n ';
    for (const node of descNodes) {
      if (node.children.length === 0 && node.innerText && node.innerText.includes('%')) {
        combinedText += node.innerText + ' \n ';
      }
    }

    return parseComposition(combinedText);
  }

  // --- REVISED UNIVERSAL HOVER DISPATCHER ---
  function executeHoverFetch(url, sourceElement) {
    if (!url || url === currentTargetUrl) return;
    currentTargetUrl = url;

    // Fast Path: Check memory cache
    if (hoverCache.has(url)) {
      const cached = hoverCache.get(url);
      if (cached) renderBadge(cached);
      return;
    }

    // Tier 1: Check if the card itself already contains composition text
    const localTile = sourceElement ? sourceElement.closest('article, .product-card, [data-component-type="s-search-result"], div[class*="product-grid"], li[class*="product"]') : null;
    const tileComposition = inspectHoveredTileDOM(localTile);
    if (tileComposition) {
      hoverCache.set(url, tileComposition);
      renderBadge(tileComposition);
      return;
    }

    // Show loading skeleton while network pipeline runs
    renderLoading('Analyzing composition...');

    chrome.runtime.sendMessage({ type: 'FETCH_HOVER_DATA', url }, (res) => {
      if (currentTargetUrl !== url) return;

      if (!res || !res.success) {
        renderLoading('No material breakdown found');
        setTimeout(() => {
          if (currentTargetUrl === url) ensureShadowRoot().querySelector('.fabric-card')?.remove();
        }, 1500);
        return;
      }

      let parsed = null;

      // Tier 2: SPA JSON payload response
      if (res.isJson) {
        parsed = parseSpaJsonPayload(res.jsonType, res.data);
      } 
      // Tier 3: Server-rendered HTML document response
      else if (res.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.html, 'text/html');
        parsed = parseHtmlDoc(doc, url);
      }

      hoverCache.set(url, parsed);

      if (parsed) {
        renderBadge(parsed);
      } else {
        renderLoading('No material breakdown found');
        setTimeout(() => {
          if (currentTargetUrl === url) ensureShadowRoot().querySelector('.fabric-card')?.remove();
        }, 1500);
      }
    });
  }
