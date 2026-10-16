// content.js

(() => {
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  const currentHost = window.location.hostname;
  console.log('[Fabric Inspector] Active on:', currentHost);

  // --- 3-TIER FIBER CLASSIFICATION ---
  const NATURAL_FIBERS = [
    'cotton', 'wool', 'merino wool', 'cashmere', 'silk',
    'linen', 'flax', 'hemp', 'jute', 'alpaca', 'mohair', 
    'down', 'feather', 'leather', 'suede'
  ];

  const SEMI_SYNTHETIC_FIBERS = [
    'viscose', 'rayon', 'modal', 'lyocell', 'tencel'
  ];

  const SYNTHETIC_FIBERS = [
    'polyester', 'spandex', 'elastane', 'nylon', 'polyamide', 
    'acrylic', 'polyurethane', 'metallic'
  ];

  const FIBER_LIST = [...NATURAL_FIBERS, ...SEMI_SYNTHETIC_FIBERS, ...SYNTHETIC_FIBERS];

  const DESCRIPTOR_WORDS = 'recycled|organic|pima|supima|raw|virgin';

  const SECTION_HEADERS = [
    'outer shell', 'shell', 'upper', 'body and lining', 'lining', 'body', 
    'sleeves', 'sleeve', 'filling', 'fill', 'padding', 'trim', 
    'pocketing', 'pockets', 'pocket', 'pocket bag', 'rib', 'cuff', 'collar', 
    'hood', 'main', 'piece 1', 'piece 2', 'piece 3', 'yoke', 'face', 'back',
    'faux fur hood trim', 'fur hood trim', 'hood trim'
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
        '[data-testid="product-details-section"]',
        '.accordion-item-content',
        '#details-content'
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
        '.product-details-container',
        '.value.content'
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
        '#details-accordion-panel-id',
        'div[class*="fabric-care"]'
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
        '#details-accordion-panel-id',
        'div[class*="fabric-care"]'
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

      // Captures optional descriptor + fiber name (e.g., "recycled cotton" or "cotton")
      const lineRegex = new RegExp(
        `(\\d{1,3})%\\s*(?:of\\s+)?((?:(?:${DESCRIPTOR_WORDS})\\s+)?(?:${fiberPattern}))|((?:(?:${DESCRIPTOR_WORDS})\\s+)?(?:${fiberPattern}))\\s*[:\\-]?\\s*(\\d{1,3})%`,
        'gi'
      );

      let match;
      const findings = [];
      while ((match = lineRegex.exec(line)) !== null) {
        const percentage = parseInt(match[1] || match[4], 10);
        const fiber = (match[2] || match[3]).replace(/\s+/g, ' ').trim().toLowerCase();

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

        // Prevent duplicate scraping of the exact same block on the page
        // by only adding if the section total is currently < 100%
        const currentTotal = targetSection.composition.reduce((sum, item) => sum + item.percentage, 0);
        if (currentTotal < 100) {
          for (const item of findings) {
            const existing = targetSection.composition.find(c => c.fiber === item.fiber);
            if (!existing) {
              targetSection.composition.push(item);
            } else if (currentTotal + item.percentage <= 100) {
              existing.percentage += item.percentage;
            }
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


  // --- 4-LAYER EXTRACTION ENGINE ---

  function extractFromJsonLd(doc) {
    if (!doc) return '';
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
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

  function extractFromAdapter(doc, targetHost = window.location.hostname) {
    if (!doc) return '';
    const host = targetHost.replace(/^www\./, '').replace(/^www2\./, '').replace(/^m\./, '');
    const sortedKeys = Object.keys(SITE_ADAPTERS).sort((a, b) => b.length - a.length);
    const adapterKey = sortedKeys.find(domain => host.endsWith(domain));

    if (!adapterKey) return '';
    const adapter = SITE_ADAPTERS[adapterKey];

    if (adapter.preAction && doc === document) {
      try { adapter.preAction(); } catch (e) {}
    }

    const matches = [];
    for (const sel of adapter.selectors) {
      const elements = doc.querySelectorAll(sel);
      for (const el of elements) {
        const text = el.innerText || el.textContent;
        if (text) matches.push(text.trim());
      }
    }
    return matches.join(' \n ');
  }

  function extractFromGenericDOM(doc) {
    if (!doc) return '';
    const candidateNodes = doc.querySelectorAll('li, p, tr, dd, [class*="spec"], [class*="detail"], [class*="material"]');
    const relevant = [];
    for (const node of candidateNodes) {
      if (node.children.length <= 2) {
        const text = (node.innerText || node.textContent || '').trim();
        if (text.length < 300 && text.includes('%') && FIBER_LIST.some(fiber => text.toLowerCase().includes(fiber))) {
          relevant.push(text);
        }
      }
    }
    return relevant.join(' \n ');
  }

  // Layer 4: Extracts fabric strings directly from Next.js (__NEXT_DATA__), Redux, and embedded hydration scripts
  function extractFromScriptState(doc) {
    if (!doc) return '';
    const scripts = doc.querySelectorAll('script#__NEXT_DATA__, script:not([src])');
    const fiberPattern = FIBER_LIST.join('|');
    const stateRegex = new RegExp(`"([^"]{0,120}\\b\\d{1,3}%\\s*(?:${DESCRIPTORS})?(?:${fiberPattern})[^"]{0,120})"`, 'gi');
    const matches = [];

    for (const script of scripts) {
      const content = script.textContent || '';
      if (!content.includes('%')) continue;
      let m;
      while ((m = stateRegex.exec(content)) !== null) {
        matches.push(m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
      }
    }
    return matches.join(' \n ');
  }

  function extractAmazonDirect(doc) {
    if (!doc) return null;

    const collected = [];

    // 1. Broad text scan of all rows, table cells, and list items in the fetched Amazon doc
    const nodes = doc.querySelectorAll('tr, li, div.a-row, span.a-list-item, div.po-row');
    for (const node of nodes) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 250 && /fabric|material|composition|care instructions|shell|lining|cotton|polyester|viscose|rayon|spandex|nylon|wool|linen|modal|tencel|acrylic/i.test(text)) {
        if (text.includes('%') || text.includes(':')) {
          collected.push(text);
        }
      }
    }

    return collected.length > 0 ? collected.join(' \n ') : null;
  }

  function inspectDocument(doc = document, targetUrl = window.location.href) {
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

    // Fallback to Hydration State Scripts (Walmart, AE, Gap, Uniqlo, H&M, J.Crew)
    if (!parsed && doc !== document) {
      const stateText = extractFromScriptState(doc);
      parsed = parseComposition(stateText);
    }

    return parsed;
  }

  // --- SETTLED BOTTOM-RIGHT SHADOW DOM CONTAINER ---

  function getShadowRoot() {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      host.style.cssText = 'position: fixed !important; bottom: 24px !important; right: 24px !important; z-index: 2147483647 !important; pointer-events: auto !important; display: block !important;';
      document.body.appendChild(host);
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
    shadow.getElementById('close-card')?.addEventListener('click', () => {
      document.getElementById('fabric-detector-root')?.remove();
    });
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
    shadow.getElementById('close-card')?.addEventListener('click', () => {
      document.getElementById('fabric-detector-root')?.remove();
    });

    const primaryPct = sections[0]?.composition[0]?.percentage || 0;
    try {
      chrome.runtime.sendMessage({ type: 'FABRIC_DETECTED', count: primaryPct });
    } catch (e) {}
  }

  // --- COMPLETE 18-RETAILER PRODUCT ID & URL ROUTER ---

  function resolveHoverTarget(path) {
    if (!Array.isArray(path)) return null;

    for (const el of path) {
      if (!el || !el.getAttribute) continue;

      // 1. Amazon direct ASIN card attribute (data-asin / data-csa-c-item-id)
      const asin = el.getAttribute('data-asin') || el.getAttribute('data-csa-c-item-id');
      if (asin && /^[A-Z0-9]{10}$/i.test(asin.trim())) {
        return { type: 'AMAZON', asin: asin.trim(), id: asin.trim() };
      }

      if (el.tagName === 'A' && el.href) {
        const href = el.href;
        const cleanUrl = href.split('#')[0];

        // 1. Amazon URL (/dp/B0DCW38YR7)
        if (href.includes('amazon.com')) {
          const m = href.match(/\/dp\/([A-Z0-9]{10})/i) || decodeURIComponent(href).match(/\/dp\/([A-Z0-9]{10})/i);
          if (m) return { type: 'AMAZON', asin: m[1], id: m[1] };
        }

        // 2. Target (/-/A-1010825429)
        if (href.includes('target.com')) {
          const m = href.match(/\/A-(\d{8,10})/i);
          if (m) return { type: 'TARGET', tcin: m[1], id: m[1] };
        }

        // 3. Macy's (?ID=27030246)
        if (href.includes('macys.com')) {
          const m = href.match(/[?&]ID=(\d{5,10})/i);
          if (m) return { type: 'MACYS', url: cleanUrl, id: m[1] };
        }

        // 4. Hollister & Abercrombie (-63729328? or -63879319?)
        if (href.includes('hollisterco.com') || href.includes('abercrombie.com')) {
          const m = href.match(/-(\d{7,10})(?:\?|$|#)/);
          if (m) {
            const store = href.includes('hollisterco.com') ? 'HOLLISTER' : 'ABERCROMBIE';
            return { type: store, url: cleanUrl, id: m[1] };
          }
        }

        // 5. Aéropostale (/81994117.html)
        if (href.includes('aeropostale.com')) {
          const m = href.match(/\/(\d{7,10})\.html/i);
          if (m) return { type: 'AEROPOSTALE', url: cleanUrl, id: m[1] };
        }

        // 6. American Eagle (/0437_6418_914)
        if (href.includes('ae.com')) {
          const m = href.match(/\/(\d{4}_\d{4}_\d{3})(?:\?|$|#)/);
          if (m) return { type: 'AE', url: cleanUrl, id: m[1] };
        }

        // 7. Hot Topic (/36366784.html)
        if (href.includes('hottopic.com')) {
          const m = href.match(/\/(\d{7,10})\.html/i);
          if (m) return { type: 'HOTTOPIC', url: cleanUrl, id: m[1] };
        }

        // 8. Walmart (/ip/slug/1428470482)
        if (href.includes('walmart.com')) {
          const m = href.match(/\/ip\/(?:[^\/?#]+\/)?(\d{7,12})(?:\?|$|#)/i);
          if (m) return { type: 'WALMART', url: cleanUrl, id: m[1] };
        }

        // 9. Gap / Old Navy / Banana Republic (product.do?pid=1180111122)
        if (href.includes('gap.com')) {
          const m = href.match(/[?&]pid=(\d{7,12})/i);
          if (m) return { type: 'GAP_GROUP', url: cleanUrl, id: m[1] };
        }

        // 10. Nordstrom (/s/slug/6414710)
        if (href.includes('nordstrom.com')) {
          const m = href.match(/\/s\/(?:[^\/?#]+\/)?(\d{6,10})(?:\?|$|#)/i);
          if (m) return { type: 'NORDSTROM', url: cleanUrl, id: m[1] };
        }

        // 11. Zara (-p07033754.html?v1=564526051)
        if (href.includes('zara.com')) {
          const m = href.match(/-p(\d{8})\.html/i);
          if (m) {
            const v1Match = href.match(/[?&]v1=(\d+)/i);
            return { type: 'ZARA', url: cleanUrl, id: m[1], v1: v1Match ? v1Match[1] : null };
          }
        }

        // 12. Shein (-p-566774071.html)
        if (href.includes('shein.com')) {
          const m = href.match(/-p-(\d{6,12})\.html/i);
          if (m) return { type: 'SHEIN', url: cleanUrl, id: m[1] };
        }

        // 13. ASOS (/prd/210988084)
        if (href.includes('asos.com')) {
          const m = href.match(/\/prd\/(\d{6,12})(?:\?|$|#)/i);
          if (m) return { type: 'ASOS', url: cleanUrl, id: m[1] };
        }

        // 14. J.Crew (/p/.../CZ297)
        if (href.includes('jcrew.com')) {
          const m = href.match(/\/p\/(?:[^?#]+\/)?([A-Z0-9]{4,8})(?:\?|$|#)/i);
          if (m) return { type: 'JCREW', url: cleanUrl, id: m[1] };
        }

        // 15. Uniqlo (/products/E424873-000)
        if (href.includes('uniqlo.com')) {
          const m = href.match(/\/products\/(E\d{6}-\d{3})/i);
          if (m) return { type: 'UNIQLO', url: cleanUrl, id: m[1] };
        }

        // 16. H&M (productpage.1359463001.html)
        if (href.includes('hm.com')) {
          const m = href.match(/productpage\.(\d{7,12})\.html/i);
          if (m) return { type: 'HM', url: cleanUrl, id: m[1] };
        }

        // 17. Urban Outfitters (/shop/lioness-rhode-...)
        if (href.includes('urbanoutfitters.com')) {
          const m = href.match(/\/shop\/([a-z0-9\-]{8,})(?:\?|$|#)/i);
          if (m && !m[1].includes('/')) return { type: 'URBANOUTFITTERS', url: cleanUrl, id: m[1] };
        }
      }
    }

    return null;
  }

  // --- HOVER DISPATCHER ---

  const memoryCache = new Map();
  let currentHoverId = null;
  let hoverTimer = null;

  function safeSendMessage(payload, callback) {
    if (!chrome.runtime?.id) return;
    try {
      chrome.runtime.sendMessage(payload, (res) => {
        if (chrome.runtime.lastError) return;
        if (callback) callback(res);
      });
    } catch (e) {}
  }

  function dispatchHover(targetInfo) {
    if (!targetInfo || targetInfo.id === currentHoverId) return;
    if (!chrome.runtime?.id) return;

    currentHoverId = targetInfo.id;
    console.log('[Fabric Inspector] Product Hovered:', targetInfo);

    if (memoryCache.has(targetInfo.id)) {
      const cached = memoryCache.get(targetInfo.id);
      if (cached) renderBadge(cached);
      return;
    }

    renderLoading('Analyzing composition...');

    // Route 1: Amazon ASIN Fetcher
    if (targetInfo.type === 'AMAZON') {
      safeSendMessage({ type: 'FETCH_AMAZON_HOVER', asin: targetInfo.asin }, (res) => {
        if (currentHoverId !== targetInfo.id) return;
        if (res && res.success && res.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(res.html, 'text/html');
          const parsed = inspectDocument(doc, `https://www.amazon.com/dp/${targetInfo.asin}`);
          memoryCache.set(targetInfo.id, parsed);
          if (parsed) {
            renderBadge(parsed);
            return;
          }
        }
        handleHoverFallback(targetInfo.id);
      });
      return;
    }

    // Route 2: Target RedSky API
    if (targetInfo.type === 'TARGET') {
      safeSendMessage({ type: 'FETCH_TARGET_HOVER', tcin: targetInfo.tcin }, (res) => {
        if (currentHoverId !== targetInfo.id) return;
        if (res && res.success && res.specText) {
          const parsed = parseComposition(res.specText);
          memoryCache.set(targetInfo.id, parsed);
          if (parsed) {
            renderBadge(parsed);
            return;
          }
        }
        handleHoverFallback(targetInfo.id);
      });
      return;
    }

    // Route 3: Zara Catalog API + HTML Fallback
    if (targetInfo.type === 'ZARA') {
      safeSendMessage({ type: 'FETCH_ZARA_HOVER', id: targetInfo.id, v1: targetInfo.v1, url: targetInfo.url }, (res) => {
        if (currentHoverId !== targetInfo.id) return;
        let parsed = null;
        if (res && res.success) {
          if (res.specText) {
            parsed = parseComposition(res.specText);
          } else if (res.html) {
            const doc = new DOMParser().parseFromString(res.html, 'text/html');
            parsed = inspectDocument(doc, targetInfo.url);
          }
        }
        memoryCache.set(targetInfo.id, parsed);
        if (parsed) renderBadge(parsed);
        else handleHoverFallback(targetInfo.id);
      });
      return;
    }

    // Route 4: Universal Retail HTML Fetcher
    safeSendMessage({
      type: 'FETCH_RETAIL_HTML',
      url: targetInfo.url,
      storeKey: targetInfo.type,
      id: targetInfo.id
    }, (res) => {
      if (currentHoverId !== targetInfo.id) return;

      if (!res || !res.success || !res.html) {
        handleHoverFallback(targetInfo.id);
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.html, 'text/html');
      const parsed = inspectDocument(doc, targetInfo.url);

      memoryCache.set(targetInfo.id, parsed);

      if (parsed) {
        renderBadge(parsed);
      } else {
        handleHoverFallback(targetInfo.id);
      }
    });
  }

  function handleHoverFallback(id) {
    renderLoading('Click item to view details');
    setTimeout(() => {
      if (currentHoverId === id) {
        document.getElementById('fabric-detector-root')?.remove();
      }
    }, 1200);
  }

  // Capture-phase hover listener across all supported grids
  document.addEventListener('mouseover', (e) => {
    const path = e.composedPath ? e.composedPath() : [];
    if (path.some(el => el.id === 'fabric-detector-root')) return;

    const targetInfo = resolveHoverTarget(path);
    if (targetInfo) {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => dispatchHover(targetInfo), 90);
    }
  }, { capture: true, passive: true });

  // --- PRODUCT DETAIL PAGE (PDP) AUTO-INSPECTION ---
  // Ensures 100% of websites work when clicked into a product page
  function isCurrentUrlPdp() {
    const href = window.location.href;
    const path = window.location.pathname;
    if (
      href.includes('/dp/') ||
      href.includes('/gp/product/') ||
      /\/A-\d{8,10}/i.test(href) ||
      /[?&]ID=\d{5,10}/i.test(href) ||
      /-\d{7,10}(?:\?|$|#)/.test(href) ||
      /\/\d{7,10}\.html/i.test(path) ||
      /\/\d{4}_\d{4}_\d{3}/.test(path) ||
      /\/ip\/(?:[^\/]+\/)?\d{7,12}/.test(path) ||
      /[?&]pid=\d{7,12}/i.test(href) ||
      /\/s\/(?:[^\/]+\/)?\d{6,10}/.test(path) ||
      /-p\d{8}\.html/i.test(path) ||
      /-p-\d{6,12}\.html/i.test(path) ||
      /\/prd\/\d{6,12}/i.test(path) ||
      /\/p\/(?:[^?#]+\/)?[A-Z0-9]{4,8}(?:\?|$|#)/i.test(href) ||
      /\/products\/E\d{6}-\d{3}/i.test(path) ||
      /productpage\.\d{7,12}\.html/i.test(path) ||
      /\/shop\/[a-z0-9\-]{8,}/i.test(path)
    ) {
      return true;
    }

    return !!document.querySelector(
      'button[data-testid*="add-to-bag"], button[class*="add-to-bag"], button[id*="add-to-cart"], input#add-to-cart-button, [data-testid="pdp-buy-box"]'
    );
  }

  function runPdpInspection() {
    if (!isCurrentUrlPdp()) return;
    const parsed = inspectDocument(document, window.location.href);
    if (parsed) {
      renderBadge(parsed);
    }
  }

  // Run on initial PDP load + delayed hydration retries
  runPdpInspection();
  setTimeout(runPdpInspection, 1000);
  setTimeout(runPdpInspection, 2400);

  // Re-run when clicking color/fit swatches on a PDP
  document.addEventListener('click', (e) => {
    const swatch = e.target.closest('button, a, label, li, div[class*="swatch"], [data-testid*="swatch"]');
    if (swatch && isCurrentUrlPdp()) {
      setTimeout(runPdpInspection, 600);
    }
  }, { capture: true, passive: true });

  // SPA navigation observer (when clicking from a catalog grid into a PDP without a full reload)
  let lastHref = location.href;
  new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      currentHoverId = null;
      document.getElementById('fabric-detector-root')?.remove();
      setTimeout(runPdpInspection, 800);
      setTimeout(runPdpInspection, 2000);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
