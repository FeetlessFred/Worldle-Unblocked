let countries = [];
let targetCountry = null;
let currentMode = 'daily';
let guessCount = 0;

async function init() {
    try {
        // Using a more detailed dataset for hints
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
        const data = await response.json();
        countries = data.features.filter(d => d.properties.name);
        setMode('daily');
    } catch (err) {
        console.error(err);
    }
}

function setMode(mode) {
    currentMode = mode;
    guessCount = 0;
    document.getElementById('guess-history').innerHTML = "";
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('mode-title').innerText = mode === 'daily' ? "Daily Challenge" : "Practice Mode";
    
    if (mode === 'daily') {
        const today = new Date().toDateString();
        const seed = xmur3(today)();
        targetCountry = countries[seed % countries.length];
    } else {
        targetCountry = countries[Math.floor(Math.random() * countries.length)];
    }
    renderMap(targetCountry);
}

function renderMap(feature) {
    const container = d3.select("#map-container");
    container.selectAll("*").remove();
    const width = 300, height = 300;
    const svg = container.append("svg").attr("width", width).attr("height", height);
    const projection = d3.geoMercator().fitSize([width - 20, height - 20], feature);
    const path = d3.geoPath().projection(projection);
    svg.append("path").datum(feature).attr("d", path);
}

function checkGuess() {
    const input = document.getElementById('guess-input');
    const guessName = input.value.trim();
    const guessedCountry = countries.find(c => c.properties.name.toLowerCase() === guessName.toLowerCase());

    if (!guessedCountry) {
        alert("Country not found in database!");
        return;
    }

    guessCount++;
    const dist = calculateDistance(guessedCountry, targetCountry);
    const proximity = Math.max(0, 100 - Math.floor((dist / 20000) * 100)); // 20k km is max earth dist
    const angle = calculateAngle(guessedCountry, targetCountry);

    addGuessToHistory(guessName, Math.round(dist), proximity, angle);
    showHint();

    if (guessName.toLowerCase() === targetCountry.properties.name.toLowerCase()) {
        document.getElementById('message').innerText = "🎉 Success!";
        if (currentMode === 'practice') setTimeout(() => setMode('practice'), 3000);
    }
    input.value = "";
}

function addGuessToHistory(name, dist, pct, angle) {
    const history = document.getElementById('guess-history');
    const row = document.createElement('div');
    row.className = 'guess-row';
    const arrow = getArrow(angle);
    row.innerHTML = `<span>${name}</span> <span>${dist}km</span> <span>${arrow}</span> <span class="proximity-pct">${pct}%</span>`;
    history.prepend(row);
}

function showHint() {
    const hintBox = document.getElementById('hint-box');
    const hintText = document.getElementById('hint-text');
    hintBox.classList.remove('hidden');

    const props = targetCountry.properties;
    // Sequential hints based on guess count
    if (guessCount === 1) hintText.innerText = `Hint: It's in the continent of ${props.continent || "Unknown"}`;
    if (guessCount === 2) hintText.innerText = `Hint: Formal name is ${props.formal_en || "similar to guess"}`;
    if (guessCount >= 3) hintText.innerText = `Hint: Look for it near ${props.subregion || "this region"}`;
}

// MATH UTILITIES
function calculateDistance(c1, c2) {
    const p1 = d3.geoCentroid(c1);
    const p2 = d3.geoCentroid(c2);
    return d3.geoDistance(p1, p2) * 6371; // Earth radius in km
}

function calculateAngle(c1, c2) {
    const p1 = d3.geoCentroid(c1);
    const p2 = d3.geoCentroid(c2);
    return (Math.atan2(p2[0] - p1[0], p2[1] - p1[1]) * 180) / Math.PI;
}

function getArrow(angle) {
    const arrows = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return arrows[index];
}

function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 345227121), h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

init();
