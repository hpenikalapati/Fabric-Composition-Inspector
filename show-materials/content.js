// --- Cache to store fetched fabric info so we don't fetch twice ---
const fabricCache = new Map();

// --- 1. Parser to extract fabric info from Amazon HTML ---
function parseFabricFromHTML(doc) {
  const materialsFound = [];

  // Look in the Product Specs table
  const rows = doc.querySelectorAll("#productOverview_feature_div tr, #poContainer tr");
  rows.forEach((row) => {
    const label = row.querySelector("td:first-child")?.innerText.trim().toLowerCase();
    const value = row.querySelector("td:last-child")?.innerText.trim();
    if (label && (label.includes("fabric") || label.includes("material") || label.includes("care"))) {
      materialsFound.push(value);
    }
  });

  // Fallback: Search bullet points for fabric percentages (e.g., 95% Rayon, 5% Spandex)
  if (materialsFound.length === 0) {
    const bullets = doc.querySelectorAll("#feature-bullets li, #detailBullets_feature_div li");
    const fabricRegex = /(\d{1,3}%\s*[A-Za-z]+)/gi;

    bullets.forEach((bullet) => {
      const matches = bullet.innerText.match(fabricRegex);
      if (matches) {
        materialsFound.push(...matches);
      }
    });
  }

  return materialsFound.length > 0 ? Array.from(new Set(materialsFound)).join(" • ") : "Fabric info not found";
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
