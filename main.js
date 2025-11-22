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

const filterState = {
  sport: "all",       // "all" | "football" | "rugby"
  code: "all",         // "all" | "union"    | "league"
  tier: "all",        // "all" | "tier1" | "tier2"...
  region: "all",      // future: "all" | regionCode
  primaryOnly: false, // future: true/false
  search: ""          // future: free text
};


// Create markers from teams array
teams.forEach((team) => {
  const icon = team.sport === "rugby" ? rugbyIcon : footballIcon;

  // add marker to markerLayer (not directly to map)
  const marker = L.marker([team.lat, team.lng], { icon }).addTo(markerLayer);

  marker.teamData = team; // attach the data to the marker for filtering/stats

  const sportClass =
    team.sport === "rugby" ? "popup-sport-rugby" : "popup-sport-football";

  const sportLabel =
    team.sport === "rugby"
      ? (team.code === "league" ? "Rugby League" : "Rugby Union")
      : "Football";

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
          Sport: ${sportLabel} · Tier: ${team.tier || "N/A"}
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
         }
        ${
          team.streaming
            ? `<div><strong>Streaming:</strong> ${team.streaming}</div>`
            : ""
        }
        ${
          team.otherSocials
            ? `<div style="margin-top:0.25rem; font-size:0.8rem;">${team.otherSocials}</div>`
            : ""
        }
      </div>
    `;

  marker.bindPopup(popupHtml);
  markers.push(marker);
});


// --- Filtering & stats ---
// I need this later: filterState.region = regionSelect.value; // "all" or a regionCode and <input id="search-input"> and const searchInput = document.getElementById("search-input");searchInput.addEventListener("input", () => {  filterState.search = searchInput.value;  applyFilters();});

function applyFilters() {
  markers.forEach((marker) => {
    const t = marker.teamData;
    const sportMatch =
      filterState.sport === "all" || t.sport === filterState.sport;
      
    const codeMatch =
      filterState.code === "all" ||                       // no extra filter
      t.sport !== "rugby" ||                              // only restrict rugby teams
      (t.code && t.code === filterState.code);            // union/league match

    const tierMatch =
      filterState.tier === "all" || t.tier === filterState.tier;
      
    const regionMatch =
      filterState.region === "all" ||
      t.regionCode === filterState.region ||
      t.regionName === filterState.region; // lets you use either

    const roleMatch =
      !filterState.primaryOnly || t.groundRole === "primary";
      
    const q = filterState.search.trim().toLowerCase();

    const searchMatch =
      !q ||
      (t.teamName && t.teamName.toLowerCase().includes(q)) ||
      (t.club && t.club.toLowerCase().includes(q)) ||
      (t.groundName && t.groundName.toLowerCase().includes(q)) ||
      (t.regionName && t.regionName.toLowerCase().includes(q));

    const shouldShow = sportMatch && tierMatch && roleMatch && regionMatch && searchMatch && codeMatch;

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
  // Use sets so each club is only counted once
  const totalClubs = new Set();
  const footballClubs = new Set();
  const rugbyClubs = new Set();

  markers.forEach((marker) => {
    const t = marker.teamData;

    // Only consider markers that are currently visible
    if (!markerLayer.hasLayer(marker)) return;

    // Only count primary grounds (or treat missing as primary if you want)
    const role = t.groundRole || "primary";
    if (role !== "primary") return;

    // Decide what we use as the "club key"
    const clubKey = t.club || t.teamName || t.name;
    if (!clubKey) return;

    totalClubs.add(clubKey);

    if (t.sport === "football") {
      footballClubs.add(clubKey);
    } else if (t.sport === "rugby") {
      rugbyClubs.add(clubKey);
    }
  });

  document.getElementById("stats-total").textContent = totalClubs.size;
  document.getElementById("stats-football").textContent = footballClubs.size;
  document.getElementById("stats-rugby").textContent = rugbyClubs.size;
}


// --- UI wiring ---

const sportButtons = document.querySelectorAll(".filter-btn");
sportButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const newSport = btn.getAttribute("data-sport"); // all | football | rugby
    filterState.sport = newSport;

    // Toggle active class
    sportButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    applyFilters();
  });
});

const codeButtons = document.querySelectorAll(".code-filter");
codeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Visual active state
    codeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update filter state and reapply filters
    filterState.code = btn.dataset.code || "all"; // "all", "union", "league"
    applyFilters();
  });
});

const divisionSelect = document.getElementById("division-filter");
divisionSelect.addEventListener("change", () => {
  filterState.tier = divisionSelect.value; // "all" or "tierX"
  applyFilters();
});

const primaryCheckbox = document.getElementById("primary-only-checkbox");
if (primaryCheckbox) {
  primaryCheckbox.addEventListener("change", () => {
    filterState.primaryOnly = primaryCheckbox.checked;
    applyFilters();
  });
}


// Initial stats
updateStats();
