// --- UNIVERSAL URL RESOLVER ---
  function resolveProductUrl(target) {
    if (!target) return null;

    // 1. Amazon Card or ASIN
    const amazonCard = target.closest('[data-asin], [data-csa-c-item-id], div[data-component-type="s-search-result"]');
    if (amazonCard && amazonCard.dataset.asin && amazonCard.dataset.asin.trim().length === 10) {
      return `https://www.amazon.com/dp/${amazonCard.dataset.asin.trim()}`;
    }

    // 2. Nearest product link
    const anchor = target.closest('a[href]');
    if (anchor && anchor.href) {
      const url = anchor.href;

      // Handle Amazon redirect links on search pages (/slredirect)
      if (url.includes('/slredirect')) {
        const decoded = decodeURIComponent(url);
        const match = decoded.match(/\/dp\/([A-Z0-9]{10})/i);
        if (match) return `https://www.amazon.com/dp/${match[1]}`;
      }

      // Handle direct /dp/ links
      const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
      if (dpMatch) return `https://www.amazon.com/dp/${dpMatch[1]}`;

      // Generic product links across retail grids
      if (
        !url.includes('#') &&
        !url.includes('/cart') &&
        !url.includes('/checkout') &&
        !url.includes('/account') &&
        !url.includes('/signin') &&
        !url.includes('javascript:') &&
        url !== window.location.href
      ) {
        return url;
      }
    }

    return null;
  }

  // --- HTML INSPECTOR FOR FETCHED PAGES ---
  function inspectHtmlDoc(doc, targetUrl) {
    let parsed = null;

    // If Amazon URL, check direct tables first
    if (targetUrl.includes('amazon.com')) {
      const amazonText = extractAmazonDirect(doc);
      if (amazonText) parsed = parseComposition(amazonText);
    }

    // Try Site Adapter based on the URL being inspected
    if (!parsed) {
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname.replace(/^www\./, '');
      const sortedKeys = Object.keys(SITE_ADAPTERS).sort((a, b) => b.length - a.length);
      const adapterKey = sortedKeys.find(domain => host.endsWith(domain));

      if (adapterKey) {
        const adapter = SITE_ADAPTERS[adapterKey];
        const matches = [];
        for (const sel of adapter.selectors) {
          const els = doc.querySelectorAll(sel);
          for (const el of els) {
            if (el && el.innerText) matches.push(el.innerText);
          }
        }
        if (matches.length > 0) {
          parsed = parseComposition(matches.join(' \n '));
        }
      }
    }

    // Try JSON-LD
    if (!parsed) {
      const rawText = extractFromJsonLd(doc);
      parsed = parseComposition(rawText);
    }

    // Generic fallback
    if (!parsed) {
      const rawText = extractFromGenericDOM(doc);
      parsed = parseComposition(rawText);
    }

    return parsed;
  }

  // --- DISPATCH FETCH TO BACKGROUND SERVICE WORKER ---
  const hoverCache = new Map();
  let activeHoverUrl = null;

  function handleProductHover(url) {
    if (!url || url === activeHoverUrl) return;
    activeHoverUrl = url;

    // Check client-side memory cache
    if (hoverCache.has(url)) {
      const cached = hoverCache.get(url);
      if (cached) renderBadge(cached);
      return;
    }

    chrome.runtime.sendMessage({ type: 'FETCH_HOVER_HTML', url }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.html, 'text/html');
      const parsed = inspectHtmlDoc(doc, url);

      hoverCache.set(url, parsed);
      if (parsed) {
        renderBadge(parsed);
      }
    });
  }

  // --- ATTACH HOVER LISTENERS VIA MOUSEENTER BUBBLING ---
  let hoverDebounce = null;

  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest('#fabric-detector-root')) return;

    clearTimeout(hoverDebounce);
    hoverDebounce = setTimeout(() => {
      const target = e.target;
      if (!target) return;

      // 1. Swatches on detail pages (trigger instant re-inspection of current page)
      const swatch = target.closest('button, a, label, li, div[class*="swatch"], [data-testid*="swatch"]');
      if (swatch) {
        inspectPage(document);
        return;
      }

      // 2. Product cards in search/catalog grids
      const productTile = target.closest(
        '[data-asin], [data-component-type="s-search-result"], article, .product-card, div[class*="product-grid"], li[class*="product"], .c-pwa-tile-grid__item'
      ) || target.closest('a');

      if (productTile) {
        // Check if the card DOM itself contains fabric text
        const cardText = productTile.innerText || '';
        const onCardParsed = parseComposition(cardText);
        if (onCardParsed) {
          renderBadge(onCardParsed);
          return;
        }

        // Fetch URL via background worker
        const url = resolveProductUrl(productTile);
        if (url) {
          handleProductHover(url);
        }
      }
    }, 120); // 120ms debounce triggers quickly without spamming
  });
