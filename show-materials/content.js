// --- Cache to store fetched fabric info so we don't fetch twice ---
const fabricCache = new Map();

// --- 1. Parser to extract fabric info from Amazon HTML ---
function parseFabricFromHTML(doc) {
  const materialsFound = [];

  // --- Strategy 1: Modern Slide-Out & Standard Product Tables (.prodDetTable, #productOverview_feature_div) ---
  const tableRows = doc.querySelectorAll("table.prodDetTable tr, #productOverview_feature_div tr, #poContainer tr");
  
  tableRows.forEach((row) => {
    // Label can be <th> or <td> depending on the layout variant
    const labelEl = row.querySelector("th, td:first-child");
    const valEl = row.querySelector("td.prodDetAttrValue, td:last-child");

    if (labelEl && valEl) {
      const labelText = labelEl.innerText.trim().toLowerCase();
      const valText = valEl.innerText.trim();

      // Check for key material terms
      if (
        labelText.includes("material") || 
        labelText.includes("fabric") || 
        labelText.includes("fabric type")
      ) {
        if (valText && !materialsFound.includes(valText)) {
          materialsFound.push(valText);
        }
      }
    }
  });

  // --- Strategy 2: "Top Highlights" div under title ---
  if (materialsFound.length === 0) {
    const highlights = doc.querySelectorAll("#productOverview_feature_div .a-row, div[data-feature-name='productOverview'] .a-row");
    highlights.forEach((row) => {
      const text = row.innerText.toLowerCase();
      if (text.includes("fabric") || text.includes("material")) {
        const val = row.querySelector(".a-span7, span:last-child")?.innerText.trim();
        if (val) materialsFound.push(val);
      }
    });
  }

  // --- Strategy 3: Bullet points fallback (looking for "95% Cotton" or "Material: ...") ---
  if (materialsFound.length === 0) {
    const bullets = doc.querySelectorAll("#feature-bullets li, #detailBullets_feature_div li");
    
    bullets.forEach((bullet) => {
      const text = bullet.innerText;

      // Regex for percentages: e.g. "95% Cotton", "80% Polyester, 20% Elastane"
      const percentMatches = text.match(/(\d{1,3}%\s*[A-Za-z\s]+)/gi);
      if (percentMatches) {
        materialsFound.push(...percentMatches.map(m => m.trim()));
      } else if (text.toLowerCase().includes("material:")) {
        // e.g. "Material: Made from ultra-soft..." -> extract first sentence
        const matSentence = text.split(":")[1]?.split(".")[0]?.trim();
        if (matSentence) materialsFound.push(matSentence);
      }
    });
  }

  // Deduplicate and join results
  if (materialsFound.length > 0) {
    const uniqueMaterials = [...new Set(materialsFound)];
    return uniqueMaterials.join(" • ");
  }

  return "Fabric info not found";
}

// --- 2. Tooltip UI Logic ---
let tooltipEl = null;

function createTooltip() {
  tooltipEl = document.createElement("div");
  tooltipEl.className = "fabric-tooltip-card";
  tooltipEl.style.display = "none";
  document.body.appendChild(tooltipEl);
}

function showTooltip(e, text) {
  if (!tooltipEl) createTooltip();
  tooltipEl.innerHTML = `<div class="fabric-tooltip-header">🧵 Textile Breakdown</div><div>${text}</div>`;
  tooltipEl.style.display = "block";
  
  // Position near cursor
  tooltipEl.style.left = `${e.pageX + 15}px`;
  tooltipEl.style.top = `${e.pageY + 15}px`;
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = "none";
}

// --- 3. Fetcher for Search Result Cards ---
async function handleCardHover(e, cardLink) {
  const url = cardLink.href;
  if (!url) return;

  if (fabricCache.has(url)) {
    showTooltip(e, fabricCache.get(url));
    return;
  }

  showTooltip(e, "Loading fabric details...");

  try {
    const res = await fetch(url);
    const htmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const fabricInfo = parseFabricFromHTML(doc);
    fabricCache.set(url, fabricInfo);
    
    // Update tooltip text if user is still hovering
    if (tooltipEl && tooltipEl.style.display === "block") {
      showTooltip(e, fabricInfo);
    }
  } catch (err) {
    showTooltip(e, "Could not fetch fabric details.");
  }
}

// --- 4. Main Event Listener Setup ---
function init() {
  // A. If on a main Product Page
  const mainTitle = document.getElementById("productTitle");
  if (mainTitle) {
    const fabricInfo = parseFabricFromHTML(document);
    if (fabricInfo !== "Fabric info not found") {
      mainTitle.addEventListener("mousemove", (e) => showTooltip(e, fabricInfo));
      mainTitle.addEventListener("mouseleave", hideTooltip);
    }
  }

  // B. Search Cards & Recommendation Grids
  document.addEventListener("mouseover", (e) => {
    // Find closest link tag on hovered item
    const link = e.target.closest("a.a-link-normal, a[href*='/dp/']");
    if (link && !link.dataset.fabricListener) {
      link.dataset.fabricListener = "true"; // prevent duplicate binding

      link.addEventListener("mousemove", (evt) => handleCardHover(evt, link));
      link.addEventListener("mouseleave", hideTooltip);
    }
  });
}

// Run after DOM loads
setTimeout(init, 1000);
