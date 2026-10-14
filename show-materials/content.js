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

  const STRICT_PREFIXES = [
    'body and lining', 'shell', 'body', 'lining', 'fill', 'padding', 'trim',
    'pocket', 'pocketing', 'rib', 'cuff', 'collar', 'main',
    'piece 1', 'piece 2', 'piece 3'
  ];

  const SITE_ADAPTERS = {
    'amazon.com': {
      selectors: [
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable',
        '#productOverview_feature_div table',
        '#technicalSpecifications_section_1',
        '#detailBullets_feature_div',
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

  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
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

  function extractFromAdapter(context = document) {
    const host = window.location.hostname.replace(/^www\./, '');
    
    // Sort keys descending so longer subdomains match before top domains
    const sortedKeys = Object.keys(SITE_ADAPTERS).sort((a, b) => b.length - a.length);
    const adapterKey = sortedKeys.find(domain => host.endsWith(domain));

    if (!adapterKey) return '';
    const adapter = SITE_ADAPTERS[adapterKey];

    if (adapter.preAction) {
      try { adapter.preAction(); } catch (e) {}
    }

    const matches = [];
    for (const sel of adapter.selectors) {
      const elements = context.querySelectorAll(sel);
      for (const el of elements) {
        if (el && el.innerText) {
          matches.push(el.innerText);
        }
      }
    }

    return matches.join(' \n ');
  }

  function extractFromGenericDOM(context = document) {
    const candidateNodes = context.querySelectorAll('li, p, tr, dd, [class*="spec"], [class*="detail"]');
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

  function parseComposition(rawText) {
    if (!rawText) return null;

    const fiberPattern = FIBER_LIST.join('|');
    const lines = rawText.split(/\r?\n|;|\u2022|·|<br\s*\/?>/).map(l => l.trim()).filter(Boolean);
    const sections = [];

    for (const line of lines) {
      const isSleeveDescription = /long sleeve|short sleeve|sleeveless|cuff sleeve/i.test(line);

      let currentSection = 'General';
      if (!isSleeveDescription) {
        const partMatch = line.match(new RegExp(`^(${STRICT_PREFIXES.join('|')})\\s*[:\\-]`, 'i'));
        if (partMatch) {
          currentSection = partMatch[1].charAt(0).toUpperCase() + partMatch[1].slice(1).toLowerCase();
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

    return sections.length > 0 ? sections : null;
  }

  function renderBadge(sections) {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      document.body.appendChild(host);
    }

    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '';

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
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        width: 280px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
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
    `;
    shadow.appendChild(style);

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

    const closeBtn = shadow.getElementById('close-card');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        host.remove();
      });
    }

    const primaryPct = sections[0]?.composition[0]?.percentage || 0;
    try {
      chrome.runtime.sendMessage({ type: 'FABRIC_DETECTED', count: primaryPct });
    } catch (e) {}
  }

  function extractAmazonDirect() {
    const drawerRows = document.querySelectorAll(
      '#voyager-ns-desktop-side-sheet-content table.prodDetTable tr, #productOverview_feature_div table tr'[cite: 1]
    );
    for (const row of drawerRows) {
      const text = row.innerText.toLowerCase();
      if (text.includes('fabric') || text.includes('material')) {
        return row.innerText;
      }
    }
    const techTable = document.querySelector('#technicalSpecifications_section_1, #detailBullets_feature_div');
    if (techTable) return techTable.innerText;
    return null;
  }

  function inspectPage(context = document) {
    let parsed = null;

    if (window.location.hostname.includes('amazon.com')) {
      const amazonText = extractAmazonDirect();
      if (amazonText) {
        parsed = parseComposition(amazonText);
        if (parsed) console.log('[Fabric Inspector] Found via Amazon direct table:', parsed);
      }
    }

    if (!parsed) {
      const rawText = extractFromJsonLd();
      parsed = parseComposition(rawText);
      if (parsed) console.log('[Fabric Inspector] Found via JSON-LD:', parsed);
    }

    if (!parsed) {
      const rawText = extractFromAdapter(context);
      parsed = parseComposition(rawText);
      if (parsed) console.log('[Fabric Inspector] Found via Site Adapter:', parsed);
    }

    if (!parsed) {
      const rawText = extractFromGenericDOM(context);
      parsed = parseComposition(rawText);
      if (parsed) console.log('[Fabric Inspector] Found via Generic DOM:', parsed);
    }

    if (parsed) {
      renderBadge(parsed);
    }
  }

  // --- AMAZON ASIN HOVER FETCH (For Search / Grid Pages) ---
  const asinCache = new Map();

  function getAmazonAsin(el) {
    const card = el.closest('[data-asin]');
    if (card && card.dataset.asin && card.dataset.asin.trim().length === 10) {
      return card.dataset.asin.trim();
    }
    const anchor = el.closest('a[href*="/dp/"]');
    if (anchor) {
      const match = anchor.href.match(/\/dp\/([A-Z0-9]{10})/i);
      if (match) return match[1];
    }
    return null;
  }

  async function fetchAndParseAsin(asin) {
    if (asinCache.has(asin)) {
      const cachedData = asinCache.get(asin);
      if (cachedData) renderBadge(cachedData);
      return;
    }

    try {
      const res = await fetch(`https://www.amazon.com/dp/${asin}`, {
        headers: { 'Accept': 'text/html' }
      });
      if (!res.ok) return;
      const htmlText = await res.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      let rawText = '';
      const tables = doc.querySelectorAll('#voyager-ns-desktop-side-sheet-content table.prodDetTable, #productOverview_feature_div, #detailBullets_feature_div');
      for (const t of tables) {
        rawText += t.innerText + ' \n ';
      }

      if (!rawText) {
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
          rawText += s.textContent + ' \n ';
        }
      }

      const parsed = parseComposition(rawText);
      asinCache.set(asin, parsed);
      if (parsed) {
        renderBadge(parsed);
      }
    } catch (err) {
      console.debug('[Fabric Inspector] ASIN fetch failed:', err);
    }
  }

  // --- MOUSEOVER / HOVER LISTENER ---
  let hoverTimer = null;
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('#fabric-detector-root')) return;

    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const target = e.target;
      if (!target) return;

      const hostname = window.location.hostname;

      // Amazon Search / Category Grids
      if (hostname.includes('amazon.com')) {
        const asin = getAmazonAsin(target);
        const currentUrlAsin = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1];
        if (asin && asin !== currentUrlAsin) {
          fetchAndParseAsin(asin);
          return;
        }
      }

      // Swatches across retail detail pages
      const swatch = target.closest('button, a, label, li, div[class*="swatch"]');
      if (swatch) {
        inspectPage(document);
      }
    }, 200);
  });

  // --- SPA ROUTE & DOM OBSERVER ---
  let lastHref = location.href;
  let debounceTimeout = null;

  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => inspectPage(document), 600);
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (!document.getElementById('fabric-detector-root')) {
        inspectPage(document);
      }
    }, 1500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial staged checks to accommodate modern SPA hydration
  inspectPage(document);
  setTimeout(() => inspectPage(document), 1000);
  setTimeout(() => inspectPage(document), 2500);
})();
