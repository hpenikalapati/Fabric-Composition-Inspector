(() => {
  // Prevent duplicate script execution
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  // Comprehensive fiber registry
  const FIBER_LIST = [
    'cotton', 'polyester', 'spandex', 'elastane', 'rayon', 'viscose',
    'modal', 'nylon', 'polyamide', 'acrylic', 'linen', 'flax', 'wool',
    'merino wool', 'cashmere', 'silk', 'lyocell', 'tencel', 'polyurethane',
    'leather', 'suede', 'down', 'feather', 'alpaca', 'mohair', 'hemp', 'jute'
  ];

  const PART_PREFIXES = [
    'shell', 'body', 'lining', 'fill', 'padding', 'trim',
    'pocket', 'pocketing', 'rib', 'collar', 'sleeve', 'cuff', 'hood'
  ];

  // Retailer-specific DOM targets
  const SITE_ADAPTERS = {
    'amazon.com': {
      selectors: [
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable', //[cite: 1]
        '#productOverview_feature_div',
        '#featurebullets_feature_div',
        '#detailBullets_feature_div'
      ]
    },
    'macys.com': {
      selectors: [
        '[data-auto="product-description-bullets"]',
        '.accordion-body-details',
        '.pdp-details'
      ],
      preAction: () => {
        const accordion = document.querySelector('[data-auto="accordion-materials"], [aria-controls*="details"]');
        if (accordion && accordion.getAttribute('aria-expanded') === 'false') {
          accordion.click();
        }
      }
    },
    'target.com': {
      selectors: [
        '[data-test="item-details-specifications"]',
        'div[data-test="item-details-description"]',
        '#specAndDescript'
      ]
    },
    'walmart.com': {
      selectors: [
        '[data-testid="product-description-content"]',
        'section[data-testid="specifications-section"]',
        '#specifications'
      ]
    },
    'ae.com': {
      selectors: [
        '.pdp-details-materials',
        '.product-details-content',
        '.pdp-desc-materials'
      ]
    },
    'aeropostale.com': {
      selectors: [
        '.product-details',
        '.pdp-tab-content',
        '.details-text'
      ]
    },
    'hottopic.com': {
      selectors: [
        '.product-details-section',
        '.product-description',
        '.details-content'
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

    // Pattern A: "80% Cotton, 20% Polyester"
    // Pattern B: "Cotton: 80%, Polyester: 20%"
    const regex = new RegExp(`(\\d{1,3})%\\s*(?:of\\s+)?(${fiberPattern})|(${fiberPattern})\\s*[:\\-]?\\s*(\\d{1,3})%`, 'gi');

    for (const line of lines) {
      // Detect if line sets a section context (e.g. "Shell:", "Lining:")
      let currentSection = 'General';
      const partRegex = new RegExp(`(${PART_PREFIXES.join('|')})\\s*:?`, 'i');
      const partMatch = line.match(partRegex);
      if (partMatch) {
        currentSection = partMatch[1].charAt(0).toUpperCase() + partMatch[1].slice(1).toLowerCase();
      }

      let match;
      const findings = [];
      while ((match = regex.exec(line)) !== null) {
        const percentage = parseInt(match[1] || match[4], 10);
        const fiber = (match[2] || match[3]).toLowerCase();

        if (percentage > 0 && percentage <= 100) {
          findings.push({ fiber, percentage });
        }
      }

      if (findings.length > 0) {
        // Consolidate into section blocks
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
   * 5. Shadow DOM UI Injection (Encapsulated Styles)
   */
  function renderBadge(sections) {
    let host = document.getElementById('fabric-detector-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'fabric-detector-root';
      document.body.appendChild(host);
    }

    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = ''; // Clear previous

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
      }
      .fabric-card {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #ffffff;
        color: #569481;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        width: 280px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        transition: all 0.2s ease;
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

    shadow.getElementById('close-card').addEventListener('click', () => {
      host.remove();
    });

    // Notify background script of primary detected fiber percentage
    const primaryPct = sections[0]?.composition[0]?.percentage || 0;
    chrome.runtime.sendMessage({ type: 'FABRIC_DETECTED', count: primaryPct });
  }

  /**
   * 6. Pipeline Coordinator
   */
  function inspectPage() {
    // 1. Try structured data first
    let rawText = extractFromJsonLd();
    let parsed = parseComposition(rawText);

    // 2. Try site-specific adapter if JSON-LD missing or lacked composition
    if (!parsed) {
      rawText = extractFromAdapter();
      parsed = parseComposition(rawText);
    }

    // 3. Try global generic search
    if (!parsed) {
      rawText = extractFromGenericDOM();
      parsed = parseComposition(rawText);
    }

    if (parsed) {
      renderBadge(parsed);
    } else {
      const root = document.getElementById('fabric-detector-root');
      if (root) root.remove();
      chrome.runtime.sendMessage({ type: 'FABRIC_NOT_FOUND' });
    }
  }

  /**
   * 7. SPA Navigation and Swatch Watcher
   */
  let lastHref = location.href;
  let debounceTimeout = null;

  const observer = new MutationObserver(() => {
    // Trigger on client-side route changes
    if (location.href !== lastHref) {
      lastHref = location.href;
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(inspectPage, 800);
      return;
    }

    // Debounce DOM updates (swatch selections or asynchronous hydration)
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      // Only re-inspect if our UI isn't currently mounted or if URL changed
      if (!document.getElementById('fabric-detector-root')) {
        inspectPage();
      }
    }, 1500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial execution
  inspectPage();
})();
