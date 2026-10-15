// content.js

(() => {
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  console.log('[Fabric Inspector] Injected into:', window.location.hostname);

  const FIBER_LIST = [
    'cotton', 'polyester', 'spandex', 'elastane', 'rayon', 'viscose',
    'modal', 'nylon', 'polyamide', 'acrylic', 'linen', 'flax', 'wool',
    'merino wool', 'cashmere', 'silk', 'lyocell', 'tencel', 'polyurethane',
    'leather', 'suede', 'down', 'feather', 'alpaca', 'mohair', 'hemp', 
    'jute', 'metallic'
  ];

  const DESCRIPTORS = '(?:recycled|organic|pima|supima|raw)?\\s*';

  const SECTION_HEADERS = [
    'outer shell', 'shell', 'upper', 'body and lining', 'lining', 'body', 
    'sleeves', 'sleeve', 'filling', 'fill', 'padding', 'trim', 
    'pocketing', 'pockets', 'rib', 'cuff', 'collar', 'hood', 'main',
    'piece 1', 'piece 2', 'piece 3'
  ];

  const SITE_ADAPTERS = {
    'amazon.com': {
      selectors: [
        '#productOverview_feature_div',
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable',
        '#detailBullets_feature_div',
        '#technicalSpecifications_section_1',
        '#featurebullets_feature_div'
      ]
    },
    'macys.com': {
      selectors: [
        'li[data-auto="materials-care-section"] [data-testid="itemTypeText"]',
        'li[data-auto="materials-care-section"]',
        '[data-testid="product-details-section"]'
      ]
    },
    'ae.com': {
      selectors: [
        'div[data-testid="equity-group"] ul[class*="list"] li',
        'div[data-testid="equity-group"]',
        '.accordion-body-visible'
      ],
      preAction: () => {
        const btn = document.querySelector('button[data-test-panel-link][aria-expanded="false"]');
        if (btn) btn.click();
      }
    },
    'aeropostale.com': {
      selectors: [
        '#product-description-info .long-description ul li',
        '#product-description-info .long-description',
        '.product-details-container'
      ]
    },
    'hottopic.com': {
      selectors: [
        '#collapsible-details-1 ul li',
        '#collapsible-details-1',
        '#product_detail_accordion_content-1'
      ],
      preAction: () => {
        const header = document.querySelector('#product_detail_accordion .accordion-header, h2[class*="accordion-header"]');
        const content = document.querySelector('#product_detail_accordion_content-1');
        if (header && content && !content.classList.contains('show')) {
          header.click();
        }
      }
    },
    'target.com': {
      selectors: [
        'div[data-test="item-details-specifications"] div:has(> b)',
        'div[data-test="item-details-specifications"]',
        '#specAndDescript'
      ],
      preAction: () => {
        const specButton = document.querySelector('button[id*="specifications-accordion"][aria-expanded="false"]');
        if (specButton) specButton.click();
      }
    },
    'walmart.com': {
      selectors: [
        'div[data-testid="ui-collapse-panel"] div.nt1 span',
        'div[data-testid="specifications"]',
        'section#specifications-wrapper'
      ],
      preAction: () => {
        const expandBtn = document.querySelector('button[data-testid="ui-collapse-panel-header"][aria-expanded="false"], section#specifications-wrapper button');
        if (expandBtn) expandBtn.click();
      }
    },
    'oldnavy.gap.com': {
      selectors: [
        'div[class*="fds_panel_details-content"] ul[class*="product-information-item__list"] li',
        'div[class*="fds_panel_details-content"]',
        '#pdp-product-info-container'
      ]
    },
    'bananarepublic.gap.com': {
      selectors: [
        'div[class*="fds_panel_details-content"] ul[class*="product-information-item__list"] li',
        'div[class*="fds_panel_details-content"]',
        '#pdp-product-info-container'
      ]
    },
    'gap.com': {
      selectors: [
        'div[class*="fds_panel_details-content"] ul[class*="product-information-item__list"] li',
        'div[class*="fds_panel_details-content"]',
        '#pdp-product-info-container'
      ],
      preAction: () => {
        const panel = document.querySelector('.productInformationItem button[aria-expanded="false"]');
        if (panel) panel.click();
      }
    },
    'nordstrom.com': {
      selectors: [
        'ul li[class*="dls-ihm"]',
        'div:has(> h2) ul li',
        'section[aria-labelledby="pdp-prompts-heading"] + div ul li'
      ]
    },
    'zara.com': {
      selectors: [
        'div[class*="structured-component-text-block-paragraph"] span[class*="zds-body-m"]',
        'div[class*="structured-component-text-block-paragraph"] span',
        'div[class*="structured-component-text-block-paragraph"]'
      ]
    },
    'shein.com': {
      selectors: [
        'span.description-content__val-content',
        'div[class*="description-content__list-text-val"]',
        'div.description-content'
      ],
      preAction: () => {
        const viewMoreBtn = document.querySelector('button.new-goods-attr__view-more');
        if (viewMoreBtn) viewMoreBtn.click();
      }
    },
    'asos.com': {
      selectors: [
        '#productDescriptionDetails div[class*="F_yff"]',
        'div[data-testid="productDescriptionDetails"]',
        '#productDescriptionDetails'
      ],
      preAction: () => {
        const btn = document.querySelector('#productDescriptionDetails h2[data-testid="heading"]');
        const wrapper = document.querySelector('#productDescriptionDetails');
        if (btn && wrapper && wrapper.style.visibility === 'hidden') {
          btn.click();
        }
      }
    },
    'jcrew.com': {
      selectors: [
        'ul[class*="ProductDetails_tech-list"] li[class*="ProductDetails_tech-item"]',
        'ul[class*="ProductDetails_tech-list"]',
        'div[class*="ProductDetails_product-details-content"]'
      ],
      preAction: () => {
        const accordionBtn = document.querySelector('button[aria-controls="accordion-panel--r2"][aria-expanded="false"]');
        if (accordionBtn) accordionBtn.click();
      }
    },
    'uniqlo.com': {
      selectors: [
        '#productMaterialDescription-content p[data-testid="ITOTypography"]',
        'div[id="productMaterialDescription-content"]',
        'div[data-testid="ITOTypography"]'
      ],
      preAction: () => {
        const accordionBtn = document.querySelector('button[aria-controls*="productMaterialDescription"][aria-expanded="false"]');
        if (accordionBtn) accordionBtn.click();
      }
    },
    'hm.com': {
      selectors: [
        'div#sectionMaterialsAndCareAccordion ul li span',
        'div#sectionMaterialsAndCareAccordion ul li',
        'div#sectionMaterialsAndCareAccordion',
        'dl[class*="materials"] dd',
        'section[class*="MaterialsAndCare"]'
      ],
      preAction: () => {
        const toggle = document.querySelector('#toggle-materialsAndCareAccordion[aria-expanded="false"], button[aria-controls*="materialsAndCare"]');
        if (toggle) toggle.click();
      }
    },
    'urbanoutfitters.com': {
      selectors: [
        'div.s-pwa-cms.c-pwa-markdown p',
        'div[class*="c-pwa-product-details__details"] p',
        'div[class*="c-pwa-product-details__details"]'
      ],
      preAction: () => {
        const accordion = document.querySelector('div[class*="c-pwa-product-details__details"] h2');
        const panel = document.querySelector('.o-pwa-accordion__panel');
        if (accordion && panel && (panel.style.display === 'none' || panel.hidden)) {
          accordion.click();
        }
      }
    },
    'hollisterco.com': {
      selectors: [
        'h4.fabric-care-mfe__label',
        'div[data-testid="fabric-care-mfe"]',
        '#details-accordion-panel-id'
      ],
      preAction: () => {
        const btn = document.querySelector('div[data-testid="accordion-header"][aria-expanded="false"]');
        if (btn) btn.click();
      }
    },
    'abercrombie.com': {
      selectors: [
        'h4.fabric-care-mfe__label',
        'div[data-testid="fabric-care-mfe"]',
        '#details-accordion-panel-id'
      ]
    }
  };

  // --- STATE-MACHINE COMPOSITION PARSER ---

  function parseComposition(rawText) {
    if (!rawText) return null;

    const fiberPattern = FIBER_LIST.join('|');
    const lines = rawText.split(/\r?\n|;|\u2022|·|\/|<br\s*\/?>/).map(l => l.trim()).filter(Boolean);
    const sections = [];

    let currentSection = 'General';

    for (const line of lines) {
      const cleanLine = line.toLowerCase().replace(/[:\-]/g, '').trim();
      const isSleeveDescription = /long sleeve|short sleeve|sleeveless|cuff sleeve/i.test(line);

      const matchedHeader = SECTION_HEADERS.find(h => cleanLine === h || cleanLine.startsWith(h + ' '));
      const hasPercentages = /\d{1,3}%/.test(line);

      if (matchedHeader && !hasPercentages && !isSleeveDescription) {
        currentSection = matchedHeader.replace(/\b\w/g, c => c.toUpperCase());
        continue;
      }

      if (!isSleeveDescription) {
        const inlinePrefix = line.match(new RegExp(`^\\s*(${SECTION_HEADERS.join('|')})\\s*[:\\-]`, 'i'));
        if (inlinePrefix) {
          currentSection = inlinePrefix[1].replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      const lineRegex = new RegExp(
        `(\\d{1,3})%\\s*(?:of\\s+)?${DESCRIPTORS}(${fiberPattern})|${DESCRIPTORS}(${fiberPattern})\\s*[:\\-]?\\s*(\\d{1,3})%`,
        'gi'
      );

      let match;
      const findings = [];
      while ((match = lineRegex.exec(line)) !== null) {
        const percentage = parseInt(match[1] || match[4], 10);
        const fiber = (match[2] || match[3]).toLowerCase();

        if (percentage > 0 && percentage <= 100) {
          findings.push({ fiber, percentage });
        }
      }

      if (findings.length > 0) {
        let targetSection = sections.find(s => s.name === currentSection);
        if (!targetSection) {
          targetSection = { name: currentSection, composition: [] };
          sections.push(targetSection);
        }

        for (const item of findings) {
          if (!targetSection.composition.some(c => c.fiber === item.fiber)) {
            targetSection.composition.push(item);
          }
        }
      }
    }

    if (sections.length > 1) {
      const generalIndex = sections.findIndex(s => s.name === 'General' && s.composition.length === 0);
      if (generalIndex > -1) sections.splice(generalIndex, 1);
    }

    return sections.length > 0 ? sections : null;
  }

  // --- EXTRACTION LAYERS ---

  function extractFromJsonLd(contextDoc = document) {
    const scripts = contextDoc.querySelectorAll('script[type="application/ld+json"]');
    const texts = [];

    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        const nodes = Array.isArray(json) ? json : (json['@graph'] || [json]);

        for (const item of nodes) {
          if (item && (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct')) {
            if (item.material) {
              texts.push(typeof item.material === 'string' ? item.material : JSON.stringify(item.material));
            }
            if (item.description) {
              texts.push(item.description);
            }
          }
        }
      } catch (e) {}
    }
    return texts.join(' \n ');
  }

  function extractFromAdapter(contextDoc = document, targetHost = window.location.hostname) {
    const host = targetHost.replace(/^www\./, '');
    const sortedKeys = Object.keys(SITE_ADAPTERS).sort((a, b) => b.length - a.length);
    const adapterKey = sortedKeys.find(domain => host.endsWith(domain));

    if (!adapterKey) return '';
    const adapter = SITE_ADAPTERS[adapterKey];

    if (adapter.preAction && contextDoc === document) {
      try { adapter.preAction(); } catch (e) {}
    }

    const matches = [];
    for (const sel of adapter.selectors) {
      const elements = contextDoc.querySelectorAll(sel);
      for (const el of elements) {
        if (el && el.innerText) {
          matches.push(el.innerText);
        }
      }
    }

    return matches.join(' \n ');
  }

  function extractFromGenericDOM(contextDoc = document) {
    const candidateNodes = contextDoc.querySelectorAll('li, p, tr, dd, [class*="spec"], [class*="detail"]');
    const relevant = [];

    for (const node of candidateNodes) {
      if (node.children.length <= 1) {
        const text = node.innerText || '';
        if (text.length < 300 && text.includes('%') && FIBER_LIST.some(fiber => text.toLowerCase().includes(fiber))) {
          relevant.push(text);
        }
      }
    }
    return relevant.join(' \n ');
  }

  function extractAmazonDirect(contextDoc = document) {
    const rows = contextDoc.querySelectorAll(
      '#productOverview_feature_div tr, #voyager-ns-desktop-side-sheet-content table.prodDetTable tr, #detailBullets_feature_div li'
    );
    for (const row of rows) {
      const text = (row.innerText || '').toLowerCase();
      if (text.includes('fabric') || text.includes('material')) {
        return row.innerText;
      }
    }
    return null;
  }

  // --- SHADOW DOM UI CONTAINER ---

  function getOrCreateShadowRoot() {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      document.body.appendChild(host);
    }

    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });

    if (!shadow.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        :host {
          all: initial;
        }
        .fabric-card {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #569481;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          width: 280px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease, opacity 0.2s ease;
          box-sizing: border-box;
        }
        .fabric-card *, .fabric-card *::before, .fabric-card *::after {
          box-sizing: border-box;
        }
        .card-header {
          background: #000000;
          color: #ffffff;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .close-btn {
          background: none;
          border: none;
          color: #569481;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.15s ease;
        }
        .close-btn:hover {
          color: #ffffff;
        }
        .card-body {
          padding: 12px 14px;
          max-height: 320px;
          overflow-y: auto;
        }
        .section-group {
          margin-bottom: 10px;
        }
        .section-group:last-child {
          margin-bottom: 0;
        }
        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          color: #569481;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .comp-item {
          margin-bottom: 6px;
        }
        .comp-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 3px;
          color: #569481;
        }
        .fiber-name {
          text-transform: capitalize;
        }
        .bar-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        .fill-natural { background: #1ce8a9; }
        .fill-synthetic { background: #f7391b; }
        .fill-delicate { background: #4facf7; }

        /* Loading Skeleton Animation */
        .loading-container {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .loading-label {
          font-size: 12px;
          font-weight: 600;
          color: #569481;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #e5e7eb;
          border-top-color: #1ce8a9;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .skeleton-bar {
          height: 8px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      shadow.appendChild(style);
    }

    return shadow;
  }

  // --- RENDER FUNCTIONS ---

  function renderLoading(title = 'Inspecting product...') {
    const shadow = getOrCreateShadowRoot();
    const existingCard = shadow.querySelector('.fabric-card');
    if (existingCard) existingCard.remove();

    const card = document.createElement('div');
    card.className = 'fabric-card';
    card.innerHTML = `
      <div class="card-header">
        <span>Fabric Composition</span>
        <button class="close-btn" id="close-card">&times;</button>
      </div>
      <div class="loading-container">
        <div class="loading-label">
          <div class="spinner"></div>
          <span>${title}</span>
        </div>
        <div class="skeleton-bar" style="width: 80%;"></div>
        <div class="skeleton-bar" style="width: 60%;"></div>
      </div>
    `;

    shadow.appendChild(card);
    shadow.getElementById('close-card')?.addEventListener('click', () => {
      document.getElementById('fabric-detector-root')?.remove();
    });
  }

  function renderBadge(sections) {
    const shadow = getOrCreateShadowRoot();
    const existingCard = shadow.querySelector('.fabric-card');
    if (existingCard) existingCard.remove();

    const card = document.createElement('div');
    card.className = 'fabric-card';

    let bodyContent = '';
    const naturalFibers = ['cotton', 'wool', 'silk', 'linen', 'cashmere', 'merino wool', 'hemp'];

    sections.forEach(sec => {
      bodyContent += `<div class="section-group">`;
      if (sections.length > 1 || sec.name !== 'General') {
        bodyContent += `<div class="section-title">${sec.name}</div>`;
      }

      sec.composition.forEach(item => {
        const fillClass = naturalFibers.includes(item.fiber) ? 'fill-natural' : 'fill-synthetic';
        bodyContent += `
          <div class="comp-item">
            <div class="comp-meta">
              <span class="fiber-name">${item.fiber}</span>
              <span>${item.percentage}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill ${fillClass}" style="width: ${item.percentage}%"></div>
            </div>
          </div>
        `;
      });
      bodyContent += `</div>`;
    });

    card.innerHTML = `
      <div class="card-header">
        <span>Fabric Composition</span>
        <button class="close-btn" id="close-card">&times;</button>
      </div>
      <div class="card-body">
        ${bodyContent}
      </div>
    `;

    shadow.appendChild(card);
    shadow.getElementById('close-card')?.addEventListener('click', () => {
      document.getElementById('fabric-detector-root')?.remove();
    });

    const primaryPct = sections[0]?.composition[0]?.percentage || 0;
    try {
      chrome.runtime.sendMessage({ type: 'FABRIC_DETECTED', count: primaryPct });
    } catch (e) {}
  }

  // --- INSPECTION PIPELINE FOR ACTIVE PAGE ---

  function inspectPage(context = document) {
    let parsed = null;

    if (window.location.hostname.includes('amazon.com')) {
      const amazonText = extractAmazonDirect(context);
      if (amazonText) parsed = parseComposition(amazonText);
    }

    if (!parsed) {
      const rawText = extractFromAdapter(context);
      parsed = parseComposition(rawText);
    }

    if (!parsed) {
      const rawText = extractFromJsonLd(context);
      parsed = parseComposition(rawText);
    }

    if (!parsed) {
      const rawText = extractFromGenericDOM(context);
      parsed = parseComposition(rawText);
    }

    if (parsed) {
      renderBadge(parsed);
    }
  }

  // --- HOVER URL RESOLVER (MATCHES BROWSER STATUS BAR LINK) ---

  function resolveHoveredProductUrl(el) {
    if (!el) return null;

    // Direct anchor link or child of anchor link
    const anchor = el.closest('a[href]');
    if (!anchor || !anchor.href) return null;

    const url = anchor.href;

    // 1. Amazon: handles direct /dp/ URLs and search redirect links (/slredirect)
    if (url.includes('amazon.com')) {
      if (url.includes('/slredirect')) {
        const decoded = decodeURIComponent(url);
        const match = decoded.match(/\/dp\/([A-Z0-9]{10})/i);
        if (match) return `https://www.amazon.com/dp/${match[1]}`;
      }
      const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
      if (dpMatch) return `https://www.amazon.com/dp/${dpMatch[1]}`;
    }

    // 2. Generic Product Retail links
    // Ignore internal page anchors, account links, cart, checkout, or identical current URL
    if (
      !url.includes('#') &&
      !url.includes('javascript:') &&
      !url.includes('/cart') &&
      !url.includes('/checkout') &&
      !url.includes('/account') &&
      !url.includes('/signin') &&
      url !== window.location.href
    ) {
      return url;
    }

    return null;
  }

  function inspectParsedDoc(doc, targetUrl) {
    let parsed = null;

    if (targetUrl.includes('amazon.com')) {
      const amazonText = extractAmazonDirect(doc);
      if (amazonText) parsed = parseComposition(amazonText);
    }

    if (!parsed) {
      try {
        const parsedUrl = new URL(targetUrl);
        const rawText = extractFromAdapter(doc, parsedUrl.hostname);
        parsed = parseComposition(rawText);
      } catch (e) {}
    }

    if (!parsed) {
      const rawText = extractFromJsonLd(doc);
      parsed = parseComposition(rawText);
    }

    if (!parsed) {
      const rawText = extractFromGenericDOM(doc);
      parsed = parseComposition(rawText);
    }

    return parsed;
  }

  const hoverCache = new Map();
  let currentHoverUrl = null;

  function executeHoverFetch(url) {
    if (!url || url === currentHoverUrl) return;
    currentHoverUrl = url;

    // Check memory cache for instant render
    if (hoverCache.has(url)) {
      const cached = hoverCache.get(url);
      if (cached) renderBadge(cached);
      return;
    }

    // Display loading state with spinner
    renderLoading('Analyzing composition...');

    chrome.runtime.sendMessage({ type: 'FETCH_HOVER_HTML', url }, (res) => {
      // Discard response if user has already moved cursor to a different link
      if (currentHoverUrl !== url) return;

      if (chrome.runtime.lastError || !res || !res.success) {
        console.warn('[Fabric Inspector] Hover request error:', chrome.runtime.lastError?.message || res?.error);
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.html, 'text/html');
      const parsed = inspectParsedDoc(doc, url);

      hoverCache.set(url, parsed);

      if (parsed) {
        renderBadge(parsed);
      } else {
        // Fallback info if the hovered product has no materials listed
        renderLoading('No material breakdown found');
        setTimeout(() => {
          if (currentHoverUrl === url) {
            document.getElementById('fabric-detector-root')?.remove();
          }
        }, 1800);
      }
    });
  }

  // --- MOUSEOVER HOVER LISTENER ---

  let hoverTimer = null;
  document.addEventListener('mouseover', (e) => {
    // Ignore hovering over the inspector's own badge
    if (e.target && e.target.closest('#fabric-detector-root')) return;

    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const target = e.target;
      if (!target) return;

      // 1. Swatches on the active product page
      const swatch = target.closest('button, a, label, li, div[class*="swatch"], [data-testid*="swatch"]');
      if (swatch) {
        inspectPage(document);
        return;
      }

      // 2. Product title / image links that resolve to a product URL (as seen in browser status bar)
      const targetUrl = resolveHoveredProductUrl(target);
      if (targetUrl) {
        executeHoverFetch(targetUrl);
      }
    }, 150); // 150ms hover trigger provides immediate response
  });

  // --- ROUTE & HYDRATION OBSERVER ---

  let lastHref = location.href;
  let debounceTimeout = null;

  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      currentHoverUrl = null;
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => inspectPage(document), 500);
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      // Only re-inspect page if not actively displaying a hover result
      if (!currentHoverUrl) {
        inspectPage(document);
      }
    }, 1200);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial runs for the active page
  inspectPage(document);
  setTimeout(() => inspectPage(document), 1000);
  setTimeout(() => inspectPage(document), 2500);
})();
