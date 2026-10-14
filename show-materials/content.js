(() => {
  // Prevent duplicate script execution
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  // Comprehensive fiber registry
  const FIBER_LIST = [
    'cotton', 'polyester', 'spandex', 'elastane', 'rayon', 'viscose',
    'modal', 'nylon', 'polyamide', 'acrylic', 'linen', 'flax', 'wool',
    'merino wool', 'cashmere', 'silk', 'lyocell', 'tencel', 'polyurethane',
    'leather', 'suede', 'down', 'feather', 'alpaca', 'mohair', 'hemp', 
    'jute', 'metallic'
  ];
  
  // Allows optional descriptors like "organic", "recycled", or "raw"
  const DESCRIPTORS = '(?:recycled|organic|pima|supima|raw)?\\s*';

  const PART_PREFIXES = [
    'shell', 'body', 'lining', 'fill', 'padding', 'trim',
    'pocket', 'pocketing', 'rib', 'collar', 'sleeve', 'cuff', 'hood', 'main', 'piece 1', 'piece 2', 'piece 3'
  ];

  // Retailer-specific DOM targets
  const SITE_ADAPTERS = {
    // Amazon (including Voyager drawer)
    'amazon.com': {
      selectors: [
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable',
        '#productOverview_feature_div',
        '#featurebullets_feature_div',
        '#detailBullets_feature_div'
      ]
    },
  
    // Macy's: Targets data-auto="materials-care-section" and data-testid="itemTypeText"
    'macys.com': {
      selectors: [
        'li[data-auto="materials-care-section"] [data-testid="itemTypeText"]',
        'li[data-auto="materials-care-section"]',
        '[data-testid="product-details-section"]'
      ]
    },
  
    // American Eagle / Aerie: Uses dynamic hash classes, so we rely on stable data attributes
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
  
    // Aéropostale: Inside #product-description-info container
    'aeropostale.com': {
      selectors: [
        '#product-description-info .long-description ul li',
        '#product-description-info .long-description',
        '.product-details-container'
      ]
    },
  
    // Hot Topic: Inside accordion item #collapsible-details-1
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
  
    // Target: In item-details-specifications (handles multi-piece pajama/suit sets)
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
  
    // Walmart: Inside specifications-wrapper under "Fabric content"
    'walmart.com': {
      selectors: [
        'div[data-testid="specifications"] h4:has-text("Fabric content") + div span',
        'div[data-testid="ui-collapse-panel"] div.nt1 span',
        'section#specifications-wrapper',
        'div[data-testid="specifications"]'
      ],
      preAction: () => {
        const expandBtn = document.querySelector('button[data-testid="ui-collapse-panel-header"][aria-expanded="false"], section#specifications-wrapper button');
        if (expandBtn) expandBtn.click();
      }
    },
  
    // Gap Inc. Ecosystem (Gap, Old Navy, Banana Republic, Athleta)
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
  
    // Nordstrom & Nordstrom Rack
    'nordstrom.com': {
      selectors: [
        'ul li[class*="dls-ihm"]',
        'div:has(> h2) ul li',
        'section[aria-labelledby="pdp-prompts-heading"] + div ul li'
      ]
    },
    
    // Zara: Materials are placed in structured-component-text-block-paragraph spans
    'zara.com': {
      selectors: [
        'div[class*="structured-component-text-block-paragraph"] span[class*="zds-body-m"]',
        'div[class*="structured-component-text-block-paragraph"] span',
        'div[class*="structured-component-text-block-paragraph"]'
      ]
    },
  
    // Shein: Stored under description-content_val-content with attribute name "Composition"
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
  
    // ASOS: Inside the product description accordion details container
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
  
    // J.Crew: List items inside .ProductDetails_tech-list
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
  
    // Uniqlo: Inside p[data-testid="ITOTypography"] under #productMaterialDescription-content
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
  
    // H&M: Inside sectionMaterialsAndCareAccordion in a list item span
    'hm.com': {
      selectors: [
        'div#sectionMaterialsAndCareAccordion ul li span',
        'div#sectionMaterialsAndCareAccordion ul li',
        'div#sectionMaterialsAndCareAccordion'
      ],
      preAction: () => {
        const toggle = document.querySelector('#toggle-materialsAndCareAccordion[aria-expanded="false"]');
        if (toggle) toggle.click();
      }
    },
  
    // Urban Outfitters: Content + Care paragraph inside the CMS markdown block
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
  
    // Hollister: Inside fabric-care-mfe h4 label (also works across Abercrombie & Fitch)
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
    // Abercrombie & Fitch shares Hollister's exact A&F Co platform
    'abercrombie.com': {
      selectors: [
        'h4.fabric-care-mfe__label',
        'div[data-testid="fabric-care-mfe"]',
        '#details-accordion-panel-id'
      ]
    }
  };

  /**
   * 1. Schema / JSON-LD Extraction
   */
  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    const texts = [];

    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        const nodes = Array.isArray(json) ? json : (json['@graph'] || [json]);

        for (const item of nodes) {
          if (item['@type'] === 'Product' || item['@type'] === 'IndividualProduct') {
            if (item.material) {
              texts.push(typeof item.material === 'string' ? item.material : JSON.stringify(item.material));
            }
            if (item.description) texts.push(item.description);
          }
        }
      } catch (e) {
        // Suppress JSON parse errors on malformed vendor tags
      }
    }
    return texts.join(' \n ');
  }

  /**
   * 2. Adapter-Specific DOM Extraction
   */
  function extractFromAdapter() {
    const host = window.location.hostname.replace(/^www\./, '');
    const adapterKey = Object.keys(SITE_ADAPTERS).find(domain => host.endsWith(domain));

    if (!adapterKey) return '';
    const adapter = SITE_ADAPTERS[adapterKey];

    if (adapter.preAction) {
      try { adapter.preAction(); } catch (e) {}
    }

    const matches = [];
    for (const sel of adapter.selectors) {
      const el = document.querySelector(sel);
      if (el) matches.push(el.innerText);
    }

    return matches.join(' \n ');
  }

  /**
   * 3. Generic DOM Crawler
   */
  function extractFromGenericDOM() {
    const candidateNodes = document.querySelectorAll('li, p, tr, dd, [class*="spec"], [class*="detail"]');
    const relevant = [];

    for (const node of candidateNodes) {
      if (node.children.length <= 1) {
        const text = node.innerText || '';
        if (text.length < 300 && FIBER_LIST.some(fiber => text.toLowerCase().includes(fiber))) {
          relevant.push(text);
        }
      }
    }
    return relevant.join(' \n ');
  }

  /**
   * 4. Multi-Part Composition Parsing Engine
   */
  function parseComposition(rawText) {
    if (!rawText) return null;

    const fiberPattern = FIBER_LIST.join('|');
    const lines = rawText.split(/\r?\n|;/).map(l => l.trim()).filter(Boolean);
    const sections = [];

    for (const line of lines) {
      const lineRegex = new RegExp(
        `(\\d{1,3})%\\s*(?:of\\s+)?${DESCRIPTORS}(${fiberPattern})|${DESCRIPTORS}(${fiberPattern})\\s*[:\\-]?\\s*(\\d{1,3})%`,
        'gi'
      );

      let currentSection = 'General';
      const partRegex = new RegExp(`(${PART_PREFIXES.join('|')})\\s*:?`, 'i');
      const partMatch = line.match(partRegex);
      if (partMatch) {
        currentSection = partMatch[1].charAt(0).toUpperCase() + partMatch[1].slice(1).toLowerCase();
      }

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

  /**
   * 5. Shadow DOM UI Injection
   */
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

  /**
   * 6. Pipeline Coordinator
   */
  function inspectPage() {
    let rawText = extractFromJsonLd();
    let parsed = parseComposition(rawText);

    if (!parsed) {
      rawText = extractFromAdapter();
      parsed = parseComposition(rawText);
    }

    if (!parsed) {
      rawText = extractFromGenericDOM();
      parsed = parseComposition(rawText);
    }

    if (parsed) {
      renderBadge(parsed);
    } else {
      const root = document.getElementById('fabric-detector-root');
      if (root) root.remove();
      try {
        chrome.runtime.sendMessage({ type: 'FABRIC_NOT_FOUND' });
      } catch (e) {}
    }
  }

  /**
   * 7. SPA Navigation and Swatch Watcher
   */
  let lastHref = location.href;
  let debounceTimeout = null;

  const observer = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(inspectPage, 800);
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (!document.getElementById('fabric-detector-root')) {
        inspectPage();
      }
    }, 1500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial runs
  inspectPage();
  setTimeout(inspectPage, 1500);
})();
