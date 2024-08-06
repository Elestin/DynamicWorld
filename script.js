const regions = {
    'Region 1': { factions: [], authority: 0 },
    'Region 2': { factions: [], authority: 0 },
    'Region 3': { factions: [], authority: 0 },
    'Region 4': { factions: [], authority: 0 },
    'Region 5': { factions: [], authority: 0 }
};

const interactions = {
    war: { powerEffect: -10, description: 'is at war with' },
    alliance: { powerEffect: 5, description: 'is allied with' },
    trade: { powerEffect: 3, description: 'has a trade agreement with' }
};

function displayFactions() {
    const regionsDiv = document.getElementById('regions');
    regionsDiv.innerHTML = '';
    for (const region in regions) {
        const regionDiv = document.createElement('div');
        regionDiv.className = 'region';
        regionDiv.innerHTML = `
            <h3>${region}</h3>
            <input type="number" min="0" max="100" value="${regions[region].authority}" 
                onchange="setAuthority('${region}', this.value)" placeholder="Authority">
        `;
        regions[region].factions.forEach(faction => {
            const factionDiv = document.createElement('div');
            factionDiv.className = 'faction';
            factionDiv.innerHTML = `
                <h2>${faction.name}</h2>
                <p>Power: ${faction.power}</p>
                <button onclick="removeFaction('${region}', '${faction.name}')">Remove</button>
                <div>
                    Interactions:
                    <ul>
                        ${faction.interactions.map(interaction => `
                            <li>
                                ${interaction.type} with ${interaction.target} 
                                <button onclick="removeInteraction('${region}', '${faction.name}', '${interaction.target}', '${interaction.type}')">Remove</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            regionDiv.appendChild(factionDiv);
        });
        regionsDiv.appendChild(regionDiv);
    }
    populateInteractionOptions();
}

function setAuthority(region, value) {
    regions[region].authority = parseInt(value);
    balancePower();
    displayFactions();
}

function rollDice() {
    const logEntries = [];
    for (const region in regions) {
        regions[region].factions.forEach(faction => {
            // Fluctuate power by a random value between -10 and 10
            const powerChange = Math.floor(Math.random() * 21) - 10;
            faction.power += powerChange;

            // Ensure power stays within reasonable bounds
            if (faction.power < 0) faction.power = 0;

            logEntries.push(`${faction.name} power changed by ${powerChange}.`);

            // Apply interactions
            faction.interactions.forEach(interaction => {
                const effect = interactions[interaction.type];
                const targetFaction = regions[interaction.region].factions.find(f => f.name === interaction.target);
                if (targetFaction) {
                    faction.power += effect.powerEffect;
                    logEntries.push(`${faction.name} ${effect.description} ${targetFaction.name}.`);
                }
            });
        });
    }
    document.getElementById('log').innerHTML += logEntries.join('<br>') + '<br>';
    balancePower();
    displayFactions();
}

function addFaction(name, region) {
    const faction = { name, power: 0, interactions: [] };
    regions[region].factions.push(faction);
    balancePower();
    displayFactions();
}

function removeFaction(region, name) {
    const index = regions[region].factions.findIndex(faction => faction.name === name);
    if (index !== -1) {
        regions[region].factions.splice(index, 1);
        balancePower();
        displayFactions();
    }
}

function removeInteraction(region, factionName, targetName, type) {
    const faction = regions[region].factions.find(f => f.name === factionName);
    const targetFaction = regions[region].factions.find(f => f.name === targetName);
    if (faction && targetFaction) {
        faction.interactions = faction.interactions.filter(interaction => !(interaction.type === type && interaction.target === targetName));
        targetFaction.interactions = targetFaction.interactions.filter(interaction => !(interaction.type === type && interaction.target === factionName));
    }
    displayFactions();
}

function populateInteractionOptions() {
    const factionASelect = document.getElementById('factionA');
    const factionBSelect = document.getElementById('factionB');
    factionASelect.innerHTML = '';
    factionBSelect.innerHTML = '';
    for (const region in regions) {
        regions[region].factions.forEach(faction => {
            const optionA = document.createElement('option');
            optionA.value = `${region}:${faction.name}`;
            optionA.textContent = `${faction.name} (${region})`;
            factionASelect.appendChild(optionA);

            const optionB = document.createElement('option');
            optionB.value = `${region}:${faction.name}`;
            optionB.textContent = `${faction.name} (${region})`;
            factionBSelect.appendChild(optionB);
        });
    }
}

function setInteraction() {
    const factionAValue = document.getElementById('factionA').value.split(':');
    const interactionType = document.getElementById('interactionType').value;
    const factionBValue = document.getElementById('factionB').value.split(':');

    if (interactionType === 'none') return;

    const [regionA, factionAName] = factionAValue;
    const [regionB, factionBName] = factionBValue;

    const factionA = regions[regionA].factions.find(f => f.name === factionAName);
    const factionB = regions[regionB].factions.find(f => f.name === factionBName);

    if (factionA && factionB) {
        factionA.interactions.push({ type: interactionType, target: factionBName, region: regionB });
        factionB.interactions.push({ type: interactionType, target: factionAName, region: regionA });
    }

    displayFactions();
}

function balancePower() {
    for (const region in regions) {
        const totalFactions = regions[region].factions.length;
        const availablePower = 100 - regions[region].authority;
        if (totalFactions > 0 && availablePower >= 0) {
            const powerPerFaction = availablePower / totalFactions;
            regions[region].factions.forEach(faction => faction.power = powerPerFaction);
        }
    }
}

document.getElementById('addFactionForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const name = document.getElementById('factionName').value;
    const region = document.getElementById('factionRegion').value;
    addFaction(name, region);
});

function saveConfiguration() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(regions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dndFactions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadConfiguration(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const loadedRegions = JSON.parse(event.target.result);
        Object.assign(regions, loadedRegions);
        balancePower();
        displayFactions();
        alert('Configuration loaded.');
    };
    reader.readAsText(file);
}

window.onload = displayFactions;
