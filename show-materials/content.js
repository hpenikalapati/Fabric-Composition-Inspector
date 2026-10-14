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
  
  const FABRIC_REGEX = new RegExp(
    `(\\d{1,3})%?\\s*(?:of\\s+)?${DESCRIPTORS}(${FIBER_LIST.join('|')})|${DESCRIPTORS}(${FIBER_LIST.join('|')})\\s*[:\\-]?\\s*(\\d{1,3})%`,
    'gi'
  );

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
        const panel = document
