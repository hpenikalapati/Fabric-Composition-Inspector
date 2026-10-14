(() => {
  if (window.__fabric_detector_injected) return;
  window.__fabric_detector_injected = true;

  const FIBER_LIST = [
    'cotton', 'polyester', 'spandex', 'elastane', 'rayon', 'viscose',
    'modal', 'nylon', 'polyamide', 'acrylic', 'linen', 'flax', 'wool',
    'merino wool', 'cashmere', 'silk', 'lyocell', 'tencel', 'polyurethane',
    'leather', 'suede', 'down', 'feather', 'alpaca', 'mohair', 'hemp', 
    'jute', 'metallic'
  ];

  const DESCRIPTORS = '(?:recycled|organic|pima|supima|raw)?\\s*';

  const PART_PREFIXES = [
    'body and lining', 'shell', 'body', 'lining', 'fill', 'padding', 'trim',
    'pocket', 'pocketing', 'rib', 'collar', 'sleeve', 'cuff', 'hood', 'main',
    'piece 1', 'piece 2', 'piece 3'
  ];

  const SITE_ADAPTERS = {
    'amazon.com': {
      selectors: [
        '#voyager-ns-desktop-side-sheet-content table.prodDetTable',
        '#productOverview_feature_div',
        '#featurebullets_feature_div',
        '#detailBullets_feature_div'
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
        '#pdp-
