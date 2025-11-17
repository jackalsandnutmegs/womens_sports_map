// main.js

// --- Map setup ---

const map = L.map("map").setView([54.5, -3.0], 6); // roughly UK centre

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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

  const marker = L.marker([team.lat, team.lng], { icon }).addTo(map);

  marker.teamData = team; // attach the data to the marker for filtering/stats

  const sportClass =
    team.sport === "rugby" ? "popup-sport-rugby" : "popup-sport-football";

  const popupHtml = `
    <div class="popup">
      <div class="popup-header ${sportClass}">
        ${team.name}
      </div>
      <div class="popup-division">
        ${team.division ? team.division : ""}
      </div>
      <div><strong>Ground:</strong> ${team.ground || "TBC"}</div>
      <div><strong>Region:</strong> ${team.region || "TBC"}</div>
      ${
        team.founded
          ? `<div><strong>Founded:</strong> ${team.founded}</div>`
          : ""
      }
      ${
        team.social
          ? `<div><strong>Social:</strong> ${team.social}</div>`
          : ""
      }
      ${
        team.streaming
          ? `<div><strong>Streaming:</strong> ${team.streaming}</div>`
          : ""
      }
      <div style="margin-top:0.4rem; font-size:0.8rem; opacity:0.8;">
        Sport: ${team.sport === "football" ? "Football" : "Rugby"} · Tier: ${
    team.tier || "N/A"
  }
      </div>
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
      if (!map.hasLayer(marker)) {
        marker.addTo(map);
      }
    } else {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
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
    if (map.hasLayer(marker)) {
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
