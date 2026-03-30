let countries = [];
let targetCountry = null;
let currentMode = 'daily';

// 1. Initial Load
async function init() {
    try {
        // Fetching low-res GeoJSON for fast loading
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
        const data = await response.json();
        // Filter out tiny islands or broken data
        countries = data.features.filter(d => d.properties.name);
        setMode('daily');
    } catch (err) {
        document.getElementById('message').innerText = "Error loading map data.";
    }
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('mode-title').innerText = mode === 'daily' ? "Daily Challenge" : "Practice Mode";
    document.getElementById('message').innerText = "";
    document.getElementById('guess-input').value = "";

    if (mode === 'daily') {
        // Use current date as a seed so everyone gets the same country
        const today = new Date().toDateString();
        const seed = xmur3(today)();
        targetCountry = countries[seed % countries.length];
    } else {
        // Random country for practice
        targetCountry = countries[Math.floor(Math.random() * countries.length)];
    }
    renderMap(targetCountry);
}

function renderMap(feature) {
    const container = d3.select("#map-container");
    container.selectAll("*").remove();

    const width = 300;
    const height = 300;
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // This centers and scales the country outline automatically
    const projection = d3.geoMercator().fitSize([width - 20, height - 20], feature);
    const path = d3.geoPath().projection(projection);

    svg.append("path")
        .datum(feature)
        .attr("d", path);
}

function checkGuess() {
    const input = document.getElementById('guess-input');
    const guess = input.value.trim().toLowerCase();
    const actual = targetCountry.properties.name.toLowerCase();

    if (guess === actual) {
        document.getElementById('message').innerText = `✅ Correct! It's ${targetCountry.properties.name}!`;
        document.getElementById('message').style.color = "#538d4e";
        
        if (currentMode === 'practice') {
            setTimeout(() => setMode('practice'), 2000);
        }
    } else {
        document.getElementById('message').innerText = "❌ Not quite, try again!";
        document.getElementById('message').style.color = "#e10303";
    }
}

// Simple hashing function to create a consistent number from a string (date)
function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 345227121), h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

// Allow "Enter" key to submit
document.getElementById('guess-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkGuess();
});

init();
