// Helper to extract fabric text from Amazon's product detail DOM
function extractFabricMakeup() {
  const materialsFound = [];

  // 1. Look in Amazon's "Product Specs" table (Fabric Type row)
  const rows = document.querySelectorAll("#productOverview_feature_div tr");
  rows.forEach((row) => {
    const label = row.querySelector("td:first-child")?.innerText.trim().toLowerCase();
    const value = row.querySelector("td:last-child")?.innerText.trim();
    if (label && (label.includes("fabric") || label.includes("material") || label.includes("care"))) {
      materialsFound.push(value);
    }
  });

  // 2. Fallback: Search bullet points for percentages (e.g., "100% Cotton", "80% Polyester, 20% Elastane")
  if (materialsFound.length === 0) {
    const bullets = document.querySelectorAll("#feature-bullets li, #detailBullets_feature_div li");
    const fabricRegex = /(\d{1,3}%\s*[A-Za-z]+)/gi;

    bullets.forEach((bullet) => {
      const matches = bullet.innerText.match(fabricRegex);
      if (matches) {
        materialsFound.push(...matches);
      }
    });
  }

  return materialsFound.length > 0 ? Array.from(new Set(materialsFound)).join(" • ") : null;
}

// Hover Tooltip logic
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
  tooltipEl.style.left = `${e.pageX + 15}px`;
  tooltipEl.style.top = `${e.pageY + 15}px`;
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = "none";
}

// Attach hover listener to the Product Title on Amazon product pages
function init() {
  const titleEl = document.getElementById("productTitle");
  if (!titleEl) return;

  const fabricInfo = extractFabricMakeup();
  if (!fabricInfo) return;

  titleEl.style.cursor = "help";
  titleEl.title = ""; // prevent default browser tooltip

  titleEl.addEventListener("mousemove", (e) => showTooltip(e, fabricInfo));
  titleEl.addEventListener("mouseleave", hideTooltip);
}

// Run after page settles
setTimeout(init, 1500);
