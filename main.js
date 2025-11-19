// main.js
// REMEMBER: markers live in markerLayer so we can later swap it for a cluster layer.

// --- Map setup ---

const map = L.map("map").setView([54.5, -3.0], 6); // roughly UK centre

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 🔹 Add this line for future-proofing (cluster-ready layer)
const markerLayer = L.layerGroup().addTo(map); // Later: const markerLayer = L.markerClusterGroup().addTo(map);

// --- Icons ---

const footballIcon = L.divIcon({
  className: "football-icon",
  html: "⚽",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const rugbyIcon = L.divIcon({
  className: "rugby-icon",
  html: "🏉",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Optional: basic icon styling via JS (or add to CSS instead)
const style = document.createElement("style");
style.innerHTML = `
  .football-icon, .rugby-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border-radius: 999px;
    background: rgba(5, 8, 20, 0.85);
    border: 2px solid rgba(255, 255, 255, 0.7);
    color: #fff;
  }
`;
document.head.appendChild(style);

// --- Markers & state ---

const markers = []; // keep references to all markers so we can filter them

let activeSport = "all"; // "all" | "football" | "rugby"
let activeTier = "all";  // "all" | "tier1" | "tier2" | ...

// Create markers from teams array
teams.forEach((team) => {
  const icon = team.sport === "rugby" ? rugbyIcon : footballIcon;

  // add marker to markerLayer (not directly to map)
  const marker = L.marker([team.lat, team.lng], { icon }).addTo(markerLayer);

  marker.teamData = team; // attach the data to the marker for filtering/stats

  const sportClass =
    team.sport === "rugby" ? "popup-sport-rugby" : "popup-sport-football";

  const popupHtml = `
      <div class="popup">
        <div class="popup-header ${sportClass}">
          ${team.teamName || team.name || "Unknown team"}
        </div>

        <div class="popup-division">
          ${team.division ? team.division : ""}
        </div>

        <div style="margin: 0.15rem 0 0.35rem; font-size: 0.8rem; opacity: 0.85;">
          ${team.country || ""}${team.country && team.regionName ? " · " : ""}${team.regionName || ""}
        </div>

        <div><strong>Ground:</strong> ${team.groundName || "TBC"}</div>
        ${
          team.groundRole
            ? `<div style="font-size:0.8rem; margin-top:0.15rem; opacity:0.85;">
                 Role: ${team.groundRole === "primary" ? "Primary ground" : "Secondary venue"}
               </div>`
            : ""
        }

        ${
          team.notes
            ? `<div style="margin-top:0.5rem;">${team.notes}</div>`
            : ""
        }

        <div style="margin-top:0.5rem; font-size:0.8rem; opacity:0.8;">
          Sport: ${team.sport === "football" ? "Football" : "Rugby"} · Tier: ${team.tier || "N/A"}
        </div>

        ${
          team.website
            ? `<div style="margin-top:0.4rem; font-size:0.85rem;">
                 <strong>Website:</strong>
                 <a href="${team.website}" target="_blank" rel="noopener">Club site</a>
               </div>`
            : ""
        }
        ${
          team.instagram
            ? `<div style="font-size:0.85rem;">
                 <strong>Instagram:</strong>
                 <a href="${team.instagram}" target="_blank" rel="noopener">${team.instagram}</a>
               </div>`
            : ""
        }
        ${
          team.twitter
            ? `<div style="font-size:0.85rem;">
                 <strong>X (Twitter):</strong>
                 <a href="${team.twitter}" target="_blank" rel="noopener">${team.twitter}</a>
               </div>`
            : ""
        }
      </div>
    `;

  marker.bindPopup(popupHtml);
  markers.push(marker);
});

// --- Filtering & stats ---

function applyFilters() {
  markers.forEach((marker) => {
    const t = marker.teamData;

    const sportMatch =
      activeSport === "all" || t.sport === activeSport;

    const tierMatch =
      activeTier === "all" || t.tier === activeTier;

    const shouldShow = sportMatch && tierMatch;

    if (shouldShow) {
      if (!markerLayer.hasLayer(marker)) {
        markerLayer.addLayer(marker);
      }
    } else {
      if (markerLayer.hasLayer(marker)) {
        markerLayer.removeLayer(marker);
      }
    }
  });

  updateStats();
}

function updateStats() {
  let total = 0;
  let footballCount = 0;
  let rugbyCount = 0;

  markers.forEach((marker) => {
    if (markerLayer.hasLayer(marker)) {
      total++;
      if (marker.teamData.sport === "football") footballCount++;
      if (marker.teamData.sport === "rugby") rugbyCount++;
    }
  });

  document.getElementById("stats-total").textContent = total;
  document.getElementById("stats-football").textContent = footballCount;
  document.getElementById("stats-rugby").textContent = rugbyCount;
}

// --- UI wiring ---

const sportButtons = document.querySelectorAll(".filter-btn");
sportButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const newSport = btn.getAttribute("data-sport"); // all | football | rugby
    activeSport = newSport;

    // Toggle active class
    sportButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    applyFilters();
  });
});

const divisionSelect = document.getElementById("division-filter");
divisionSelect.addEventListener("change", () => {
  activeTier = divisionSelect.value; // "all" or "tierX"
  applyFilters();
});

// Initial stats
updateStats();
