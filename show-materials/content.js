// content.js

(() => {
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  console.log('[Fabric Inspector] Injected on:', window.location.hostname);

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
    'pocketing', 'pockets', 'pocket', 'pocket bag', 'rib', 'cuff', 'collar', 'hood', 'main',
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
      ]
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
      ]
    },
    'target.com': {
      selectors: [
        'div[data-test="item-details-specifications"] div:has(> b)',
        'div[data-test="item-details-specifications"]',
        '#specAndDescript'
      ]
    },
    'walmart.com': {
      selectors: [
        'div[data-testid="ui-collapse-panel"] div.nt1 span',
        'div[data-testid="specifications"]',
        'section#specifications-wrapper'
      ]
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
      ]
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
      ]
    },
    'asos.com': {
      selectors: [
        '#productDescriptionDetails div[class*="F_yff"]',
        'div[data-testid="productDescriptionDetails"]',
        '#productDescriptionDetails'
      ]
    },
    'jcrew.com': {
      selectors: [
        'ul[class*="ProductDetails_tech-list"] li[class*="ProductDetails_tech-item"]',
        'ul[class*="ProductDetails_tech-list"]',
        'div[class*="ProductDetails_product-details-content"]'
      ]
    },
    'uniqlo.com': {
      selectors: [
        '#productMaterialDescription-content p[data-testid="ITOTypography"]',
        'div[id="productMaterialDescription-content"]',
        'div[data-testid="ITOTypography"]'
      ]
    },
    'hm.com': {
      selectors: [
        'div#sectionMaterialsAndCareAccordion ul li span',
        'div#sectionMaterialsAndCareAccordion ul li',
        'div#sectionMaterialsAndCareAccordion',
        'dl[class*="materials"] dd',
        'section[class*="MaterialsAndCare"]'
      ]
    },
    'urbanoutfitters.com': {
      selectors: [
        'div.s-pwa-cms.c-pwa-markdown p',
        'div[class*="c-pwa-product-details__details"] p',
        'div[class*="c-pwa-product-details__details"]'
      ]
    },
    'hollisterco.com': {
      selectors: [
        'h4.fabric-care-mfe__label',
        'div[data-testid="fabric-care-mfe"]',
        '#details-accordion-panel-id'
      ]
    },
    'abercrombie.com': {
      selectors: [
        'h4.fabric-care-mfe__label',
        'div[data-testid="fabric-care-mfe"]',
        '#details-accordion-panel-id'
      ]
    }
  };

  // --- PARSER ENGINE ---

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

  function extractFromJsonLd(contextDoc) {
    if (!contextDoc) return '';
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

  function extractFromAdapter(contextDoc, targetHost = window.location.hostname) {
    if (!contextDoc) return '';
    const host = targetHost.replace(/^www\./, '');
    const sortedKeys = Object.keys(SITE_ADAPTERS).sort((a, b) => b.length - a.length);
    const adapterKey = sortedKeys.find(domain => host.endsWith(domain));

    if (!adapterKey) return '';
    const adapter = SITE_ADAPTERS[adapterKey];
    const matches = [];

    for (const sel of adapter.selectors) {
      const elements = contextDoc.querySelectorAll(sel);
      for (const el of elements) {
        if (el && el.innerText) matches.push(el.innerText);
      }
    }
    return matches.join(' \n ');
  }

  function extractFromGenericDOM(contextDoc) {
    if (!contextDoc) return '';
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

  function extractAmazonDirect(contextDoc) {
    if (!contextDoc) return null;
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

  function inspectDocument(doc, targetUrl = window.location.href) {
    if (!doc) return null;
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

  // --- MOUNT SHADOW DOM CONTAINER ---

  function getShadowRoot() {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      host.style.cssText = 'position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 2147483647 !important; pointer-events: auto !important; display: block !important;';
      (document.body || document.documentElement).appendChild(host);
    }

    let shadow = host.shadowRoot;
    if (!shadow) {
      shadow = host.attachShadow({ mode: 'open' });
    }

    if (!shadow.querySelector('style')) {
      const style = document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fabric-card {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #569481;
          border-radius: 12px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
          width: 290px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
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
        }
        .close-btn {
          background: none;
          border: none;
          color: #569481;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }
        .close-btn:hover { color: #ffffff; }
        .card-body {
          padding: 12px 14px;
          max-height: 320px;
          overflow-y: auto;
        }
        .section-group { margin-bottom: 10px; }
        .section-group:last-child { margin-bottom: 0; }
        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          color: #569481;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .comp-item { margin-bottom: 6px; }
        .comp-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 3px;
          color: #569481;
        }
        .fiber-name { text-transform: capitalize; }
        .bar-track {
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill { height: 100%; border-radius: 3px; }
        .fill-natural { background: #1ce8a9; }
        .fill-semi-synthetic { background: #F5CF27; }
        .fill-synthetic { background: #f7391b; }
        .loading-container {
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .loading-label {
          font-size: 13px;
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
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
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
    const shadow = getShadowRoot();
    shadow.querySelector('.fabric-card')?.remove();

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
    const shadow = getShadowRoot();
    shadow.querySelector('.fabric-card')?.remove();

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

  // --- PATH-TRAVERSING URL RESOLVER ---

  function getProductUrlFromEvent(e) {
    const path = e.composedPath ? e.composedPath() : [];

    for (const el of path) {
      if (!el || !el.getAttribute) continue;

      // 1. Amazon Direct ASIN
      if (el.hasAttribute('data-asin') && el.getAttribute('data-asin').length === 10) {
        return `https://www.amazon.com/dp/${el.getAttribute('data-asin')}`;
      }

      // 2. Product link anchor
      if (el.tagName === 'A' && el.href) {
        const href = el.href;

        // Amazon redirect or direct
        if (href.includes('amazon.com')) {
          const match = href.match(/\/dp\/([A-Z0-9]{10})/i) || decodeURIComponent(href).match(/\/dp\/([A-Z0-9]{10})/i);
          if (match) return `https://www.amazon.com/dp/${match[1]}`;
        }

        // Generic retail link filter
        const badPatterns = ['#', 'javascript:', '/cart', '/checkout', '/account', '/signin', '/login', '/stores', '/help', '/bag'];
        if (!badPatterns.some(p => href.toLowerCase().includes(p))) {
          // If the link has an ID or points to an HTML product detail page
          if (href.includes('.html') || href.includes('/p/') || href.includes('/product/') || href.includes('/dp/')) {
            return href;
          }
          // Accept any clean product link
          if (href.split('?')[0] !== window.location.href.split('?')[0]) {
            return href;
          }
        }
      }
    }

    return null;
  }

  // --- HOVER DISPATCHER ---

  const hoverCache = new Map();
  let activeHoverUrl = null;

  function handleHover(url) {
    if (!url || url === activeHoverUrl) return;
    activeHoverUrl = url;

    console.log('[Fabric Inspector] Target Hover URL:', url);

    if (hoverCache.has(url)) {
      const cached = hoverCache.get(url);
      if (cached) renderBadge(cached);
      return;
    }

    renderLoading('Analyzing composition...');

    chrome.runtime.sendMessage({ type: 'FETCH_HOVER_HTML', url }, (res) => {
      if (activeHoverUrl !== url) return;

      if (!res || !res.success || !res.html) {
        console.warn('[Fabric Inspector] Background fetch failed for:', url, res?.error);
        renderLoading('No material breakdown found');
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.html, 'text/html');
      const parsed = inspectDocument(doc, url);

      hoverCache.set(url, parsed);

      if (parsed) {
        renderBadge(parsed);
      } else {
        renderLoading('No material breakdown found');
        setTimeout(() => {
          if (activeHoverUrl === url) {
            getShadowRoot().querySelector('.fabric-card')?.remove();
          }
        }, 1800);
      }
    });
  }

  // Mousemove listener with composedPath evaluation
  let throttle = null;
  window.addEventListener('mousemove', (e) => {
    if (throttle) return;
    throttle = setTimeout(() => { throttle = null; }, 50);

    const path = e.composedPath ? e.composedPath() : [];
    if (path.some(el => el.id === 'fabric-detector-root')) return;

    // Check swatches on detail page
    const swatch = path.find(el => el.matches && el.matches('button, a, label, li, div[class*="swatch"]'));
    if (swatch) {
      const parsed = inspectDocument(document, window.location.href);
      if (parsed) renderBadge(parsed);
      return;
    }

    const url = getProductUrlFromEvent(e);
    if (url) {
      handleHover(url);
    }
  }, { passive: true });

  // Initial runs for product detail pages
  const initialData = inspectDocument(document, window.location.href);
  if (initialData) renderBadge(initialData);

  setTimeout(() => {
    const retryData = inspectDocument(document, window.location.href);
    if (retryData) renderBadge(retryData);
  }, 1200);
})();
