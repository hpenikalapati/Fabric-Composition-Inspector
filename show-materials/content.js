// content.js

(() => {
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  console.log('[Fabric Inspector] Injected into:', window.location.hostname);

  // Fiber Classification
  const NATURAL_FIBERS = [
    'cotton', 'wool', 'merino wool', 'cashmere', 'silk', 
    'linen', 'flax', 'hemp', 'jute', 'alpaca', 'mohair', 'down', 'feather', 'leather', 'suede'
  ];

  const SEMI_SYNTHETIC_FIBERS = [
    'viscose', 'rayon', 'modal', 'lyocell', 'tencel'
  ];

  const SYNTHETIC_FIBERS = [
    'polyester', 'spandex', 'elastane', 'nylon', 'polyamide', 
    'acrylic', 'polyurethane', 'metallic'
  ];

  const FIBER_LIST = [...NATURAL_FIBERS, ...SEMI_SYNTHETIC_FIBERS, ...SYNTHETIC_FIBERS];
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
            if (item.material) texts.push(typeof item.material === 'string' ? item.material : JSON.stringify(item.material));
            if (item.description) texts.push(item.description);
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
        if (el && el.innerText) matches.push(el.innerText);
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

  // --- SHADOW DOM UI ROOT ---

  function ensureShadowRoot() {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      (document.documentElement || document.body).appendChild(host);
    }

    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });
    }

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
          background: #ffffff !important;
          color: #569481 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
          width: 290px !important;
          overflow: hidden !important;
          border: 1px solid #e5e7eb !important;
          box-sizing: border-box !important;
          pointer-events: auto !important;
        }
        .fabric-card *, .fabric-card *::before, .fabric-card *::after {
          box-sizing: border-box !important;
        }
        .card-header {
          background: #000000 !important;
          color: #ffffff !important;
          padding: 10px 14px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          letter-spacing: 0.02em !important;
        }
        .close-btn {
          background: none !important;
          border: none !important;
          color: #569481 !important;
          font-size: 18px !important;
          cursor: pointer !important;
          line-height: 1 !important;
          padding: 0 !important;
        }
        .close-btn:hover {
          color: #ffffff !important;
        }
        .card-body {
          padding: 12px 14px !important;
          max-height: 320px !important;
          overflow-y: auto !important;
        }
        .section-group {
          margin-bottom: 10px !important;
        }
        .section-group:last-child {
          margin-bottom: 0 !important;
        }
        .section-title {
          font-size: 11px !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
          color: #569481 !important;
          margin-bottom: 6px !important;
          letter-spacing: 0.05em !important;
        }
        .comp-item {
          margin-bottom: 6px !important;
        }
        .comp-meta {
          display: flex !important;
          justify-content: space-between !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          margin-bottom: 3px !important;
          color: #569481 !important;
        }
        .fiber-name {
          text-transform: capitalize !important;
        }
        .bar-track {
          height: 6px !important;
          background: #f1f5f9 !important;
          border-radius: 3px !important;
          overflow: hidden !important;
        }
        .bar-fill {
          height: 100% !important;
          border-radius: 3px !important;
          transition: width 0.3s ease !important;
        }

        /* Color Hierarchy */
        .fill-natural { background: #1ce8a9 !important; }
        .fill-semi-synthetic { background: #F5CF27 !important; }
        .fill-synthetic { background: #f7391b !important; }

        /* Loading Skeleton */
        .loading-container {
          padding: 16px 14px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 12px !important;
        }
        .loading-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #569481 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .spinner {
          width: 14px !important;
          height: 14px !important;
          border: 2px solid #e5e7eb !important;
          border-top-color: #1ce8a9 !important;
          border-radius: 50% !important;
          animation: spin 0.8s linear infinite !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .skeleton-bar {
          height: 8px !important;
          background: #e2e8f0 !important;
          border-radius: 4px !important;
        }
      `;
      shadow.appendChild(style);
    }

    return shadow;
  }

  function getFiberFillClass(fiberName) {
    const f = fiberName.toLowerCase();
    if (SEMI_SYNTHETIC_FIBERS.includes(f)) return 'fill-semi-synthetic';
    if (NATURAL_FIBERS.includes(f)) return 'fill-natural';
    return 'fill-synthetic';
  }

  function renderLoading(title = 'Analyzing composition...') {
    const shadow = ensureShadowRoot();
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
        <div class="skeleton-bar" style="width: 55%;"></div>
      </div>
    `;

    shadow.appendChild(card);
    shadow.getElementById('close-card')?.addEventListener('click', () => card.remove());
  }

  function renderBadge(sections) {
    const shadow = ensureShadowRoot();
    const existingCard = shadow.querySelector('.fabric-card');
    if (existingCard) existingCard.remove();

    const card = document.createElement('div');
    card.className = 'fabric-card';

    let bodyContent = '';

    sections.forEach(sec => {
      bodyContent += `<div class="section-group">`;
      if (sections.length > 1 || sec.name !== 'General') {
        bodyContent += `<div class="section-title">${sec.name}</div>`;
      }

      sec.composition.forEach(item => {
        const fillClass = getFiberFillClass(item.fiber);
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
    shadow.getElementById('close-card')?.addEventListener('click', () => card.remove());

    const primaryPct = sections[0]?.composition[0]?.percentage || 0;
    try {
      chrome.runtime.sendMessage({ type: 'FABRIC_DETECTED', count: primaryPct });
    } catch (e) {}
  }

  // --- CURRENT PAGE INSPECTION ---

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

  // --- UNIVERSAL URL RESOLUTION FOR HOVER ---

  function findProductUrl(element) {
    if (!element) return null;

    // 1. Amazon direct tile ASIN
    const amazonCard = element.closest('[data-asin]');
    if (amazonCard && amazonCard.dataset.asin && amazonCard.dataset.asin.length === 10) {
      return `https://www.amazon.com/dp/${amazonCard.dataset.asin}`;
    }

    // 2. Climb tree for product anchor
    const anchor = element.closest('a[href]');
    if (!anchor) return null;

    const href = anchor.href;

    // Check Amazon URL
    if (href.includes('amazon.com')) {
      const match = href.match(/\/dp\/([A-Z0-9]{10})/i) || decodeURIComponent(href).match(/\/dp\/([A-Z0-9]{10})/i);
      if (match) return `https://www.amazon.com/dp/${match[1]}`;
    }

    // Universal Retail Link Filtering
    const excludedPatterns = [
      '#', 'javascript:', '/cart', '/checkout', '/account', '/signin', '/login',
      '/bag', '/stores', '/help', '/wishlist', '/category', '/search'
    ];
    if (excludedPatterns.some(p => href.toLowerCase().includes(p))) return null;

    // Discard identical page or pure query swaps on current item
    const cleanCurrent = window.location.href.split('?')[0].split('#')[0];
    const cleanTarget = href.split('?')[0].split('#')[0];
    if (cleanTarget === cleanCurrent) return null;

    return href;
  }

  // --- HTML INSPECTION FOR FETCHED DOCUMENTS ---

  function parseHtmlDoc(doc, url) {
    let parsed = null;

    if (url.includes('amazon.com')) {
      const amazonText = extractAmazonDirect(doc);
      if (amazonText) parsed = parseComposition(amazonText);
    }

    if (!parsed) {
      try {
        const parsedUrl = new URL(url);
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

  // --- HOVER PIPELINE & CACHE ---

  const hoverCache = new Map();
  let currentTargetUrl = null;

  function onProductHover(url, targetElement) {
    if (!url || url === currentTargetUrl) return;
    currentTargetUrl = url;

    console.log('[Fabric Inspector] Target Hover URL:', url);

    if (hoverCache.has(url)) {
      const cached = hoverCache.get(url);
      if (cached) renderBadge(cached);
      return;
    }

    // Check if the card itself on the current page already contains the fabric percentage
    const tile = targetElement ? targetElement.closest('article, .product-card, [data-component-type="s-search-result"], div[class*="product-grid"], li[class*="product"]') : null;
    if (tile) {
      const tileComposition = parseComposition(tile.innerText || '');
      if (tileComposition) {
        hoverCache.set(url, tileComposition);
        renderBadge(tileComposition);
        return;
      }
    }

    renderLoading('Analyzing composition...');

    chrome.runtime.sendMessage({ type: 'FETCH_HOVER_HTML', url }, (res) => {
      if (currentTargetUrl !== url) return;

      if (!res || !res.success) {
        console.warn('[Fabric Inspector] Fetch failed for:', url, res?.error);
        renderLoading('No material breakdown found');
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.html, 'text/html');
      const parsed = parseHtmlDoc(doc, url);

      hoverCache.set(url, parsed);

      if (parsed) {
        renderBadge(parsed);
      } else {
        renderLoading('No material breakdown found');
        setTimeout(() => {
          if (currentTargetUrl === url) {
            const shadow = ensureShadowRoot();
            shadow.querySelector('.fabric-card')?.remove();
          }
        }, 1800);
      }
    });
  }

  // Window-level mousemove tracking throttled to 60ms for immediate event capture
  let moveThrottle = null;

  window.addEventListener('mousemove', (e) => {
    if (moveThrottle) return;
    moveThrottle = setTimeout(() => { moveThrottle = null; }, 60);

    const target = e.target;
    if (!target) return;

    if (target.id === 'fabric-detector-root' || target.closest('#fabric-detector-root')) return;

    // Swatches on active page
    const swatch = target.closest('button, a, label, li, div[class*="swatch"], [data-testid*="swatch"]');
    if (swatch) {
      inspectPage(document);
      return;
    }

    // Product Title Links or Product Cards
    const url = findProductUrl(target);
    if (url) {
      onProductHover(url, target);
    }
  }, { passive: true });

  // SPA Route Watcher
  let lastHref = location.href;
  let debounceTimeout = null;

  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      currentTargetUrl = null;
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => inspectPage(document), 500);
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (!currentTargetUrl) {
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
