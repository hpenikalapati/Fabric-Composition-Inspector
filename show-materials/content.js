// --- ROBUST AMAZON ASIN DETECTOR ---
  function getAmazonAsin(el) {
    if (!el) return null;

    // 1. Look up to the root search result tile
    const card = el.closest('[data-asin], [data-csa-c-item-id], div[data-component-type="s-search-result"]');
    if (card && card.dataset.asin && card.dataset.asin.trim().length === 10) {
      return card.dataset.asin.trim();
    }

    // 2. Look for any anchor wrapping or inside this element
    const anchor = el.closest('a') || el.querySelector('a');
    if (anchor && anchor.href) {
      // Handles regular URLs (/dp/B00DW8DPHGJ)
      const directMatch = anchor.href.match(/\/dp\/([A-Z0-9]{10})/i);
      if (directMatch) return directMatch[1];

      // Handles Amazon search redirect URLs (/slredirect?url=%2Fdp%2FB00DW8DPHGJ)
      const redirectMatch = decodeURIComponent(anchor.href).match(/\/dp\/([A-Z0-9]{10})/i);
      if (redirectMatch) return redirectMatch[1];
    }

    // 3. Check data-csa-c-item-id or asin attributes on ancestors
    const csaElem = el.closest('[data-csa-c-item-id]');
    if (csaElem) {
      const csaId = csaElem.getAttribute('data-csa-c-item-id');
      if (csaId && /^[A-Z0-9]{10}$/i.test(csaId)) return csaId;
    }

    return null;
  }

  // --- FETCH WITH COOKIES & BROWSER HEADERS ---
  const asinCache = new Map();

  async function fetchAndParseAsin(asin) {
    if (asinCache.has(asin)) {
      const cachedData = asinCache.get(asin);
      if (cachedData) renderBadge(cachedData);
      return;
    }

    try {
      console.log('[Fabric Inspector] Hover detected ASIN:', asin, '-> Fetching details...');
      
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        method: 'GET',
        credentials: 'include', // Includes Amazon session cookies to avoid bot captchas
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!res.ok) {
        console.warn('[Fabric Inspector] Fetch failed with status:', res.status);
        return;
      }

      const htmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      let rawText = '';

      // Check Voyager drawer table or product overview table in fetched page
      const tables = doc.querySelectorAll(
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable, #productOverview_feature_div, #detailBullets_feature_div, #technicalSpecifications_section_1'
      );
      for (const t of tables) {
        rawText += (t.innerText || t.textContent) + ' \n ';
      }

      // Check feature bullets if table is missing
      if (!rawText.trim()) {
        const bullets = doc.querySelector('#featurebullets_feature_div');
        if (bullets) rawText += bullets.innerText + ' \n ';
      }

      // Fallback: Check JSON-LD
      if (!rawText.trim()) {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
          rawText += s.textContent + ' \n ';
        }
      }

      const parsed = parseComposition(rawText);
      asinCache.set(asin, parsed);

      if (parsed) {
        console.log('[Fabric Inspector] Successfully parsed hover ASIN:', parsed);
        renderBadge(parsed);
      } else {
        console.log('[Fabric Inspector] No fabric composition found in ASIN page.');
      }
    } catch (err) {
      console.error('[Fabric Inspector] ASIN fetch error:', err);
    }
  }

  // --- HOVER LISTENER ---
  let hoverTimer = null;
  document.addEventListener('mouseover', (e) => {
    // Ignore hovering over our own floating card
    if (e.target && e.target.closest('#fabric-detector-root')) return;

    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const target = e.target;
      if (!target) return;

      const hostname = window.location.hostname;

      // Amazon Search & Category Grids
      if (hostname.includes('amazon.com')) {
        const asin = getAmazonAsin(target);
        const currentUrlAsin = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1];

        // Trigger fetch if we found an ASIN and it's not the page we are already on
        if (asin && asin !== currentUrlAsin) {
          fetchAndParseAsin(asin);
          return;
        }
      }

      // Swatches across product detail pages
      const swatch = target.closest('button, a, label, li, div[class*="swatch"]');
      if (swatch) {
        inspectPage(document);
      }
    }, 150); // 150ms hover delay for responsive feel
  });
