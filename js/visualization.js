// Initialize Matter.js modules
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite;

// Create engine and world
const engine = Engine.create({
    positionIterations: 6,
    velocityIterations: 4
});
const world = engine.world;

// Adjust gravity
engine.gravity.y = 0.5;

// Get container dimensions
const container = document.getElementById('canvas-container');
const width = container.clientWidth;
const height = container.clientHeight;

// Create renderer
const render = Render.create({
    element: container,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#ffffff'
    }
});

// Create walls with extended height and thickness
const wallThickness = 100;
const walls = [
    Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
        isStatic: true,
        render: {
            fillStyle: '#666666'
        }
    }), // bottom
    Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + 200, {
        isStatic: true,
        render: {
            fillStyle: '#666666'
        }
    }), // left
    Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + 200, {
        isStatic: true,
        render: {
            fillStyle: '#666666'
        }
    }), // right
];

// Add walls to world
World.add(world, walls);

// Add mouse control for tooltips
const mouse = Matter.Mouse.create(render.canvas);
const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);

// Listen for mouse clicks on bodies
Matter.Events.on(mouseConstraint, 'mousedown', function (event) {
    const mousePos = event.mouse.position;
    const bodies = Composite.allBodies(world);
    const found = bodies.find(b => Matter.Bounds.contains(b.bounds, mousePos) && !b.isStatic && b.pokemon);
    if (found && found.pokemon) {
        // Use event.mouse.sourceEvents.mousemove for coords if available
        const evt = { clientX: event.mouse.absolute.x, clientY: event.mouse.absolute.y };
        showTooltip(evt, found.pokemon);
    } else {
        hideTooltip();
    }
});

// Create generation dividers (vertical lines)
const numGenerations = 8; // Pokemon has generations 1-8
const dividerWidth = width / numGenerations;
const dividers = [];

// Make dividers taller by extending beyond the visible area
const dividerHeight = height + 200; // Added extra height

for (let i = 1; i < numGenerations; i++) {
    const divider = Bodies.rectangle(
        i * dividerWidth,
        height / 2,
        4, // Made slightly thicker
        dividerHeight,
        {
            isStatic: true,
            render: {
                fillStyle: '#cccccc'
            }
        }
    );
    dividers.push(divider);
}

// Add generation labels
const labels = [];
for (let i = 0; i < numGenerations; i++) {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.left = `${i * dividerWidth + dividerWidth / 2 - 20}px`;
    label.style.bottom = '10px';
    label.style.textAlign = 'center';
    label.innerHTML = `Gen ${i + 1}`;
    container.appendChild(label);
}

World.add(world, dividers);

// Load Pokemon data
let pokemonData = [];
let pokemonBodies = [];
let filteredData = null;

// Create a runner
const runner = Runner.create();
Runner.run(runner, engine);

// Load the Pokemon data
d3.csv('data/pokedex.csv').then(data => {
    console.log('Data loaded:', data.length, 'Pokemon');
    pokemonData = data;
    // build legend using d3
    buildLegend();
}).catch(error => {
    console.error('Error loading Pokemon data:', error);
});

function createPokemonBall(pokemon, x, y) {
    const radius = 15; // larger for visibility
    // Use only four colors representing rarity level (mythical, legendary, sub-legendary, normal)
    let color;
    if (pokemon.is_mythical === 'True' || pokemon.is_mythical === 'true' || pokemon.is_mythical === '1') {
        color = '#FF0066'; // Mythical (bright pink)
    } else if (pokemon.is_legendary === 'True' || pokemon.is_legendary === 'true' || pokemon.is_legendary === '1') {
        color = '#FFD700'; // Legendary (gold)
    } else if (pokemon.is_sub_legendary === 'True' || pokemon.is_sub_legendary === 'true' || pokemon.is_sub_legendary === '1') {
        color = '#00BFFF'; // Sub-Legendary (deep sky blue)
    } else {
        color = '#808080'; // Normal (gray)
    }
    const ball = Bodies.circle(x, y, radius, {
        restitution: 0.5,
        friction: 0.1,
        render: {
            fillStyle: color,
            strokeStyle: '#000000',
            lineWidth: 1
        },
        pokemon: pokemon
    });
    return ball;
}

// D3 color scale for rarity
const rarityScale = d3.scaleOrdinal()
    .domain(['mythical', 'legendary', 'sub', 'normal'])
    .range(['#FF0066', '#FFD700', '#00BFFF', '#808080']);

function rarityFor(p) {
    if (!p) return 'normal';
    if (p.is_mythical === 'True' || p.is_mythical === 'true' || p.is_mythical === '1') return 'mythical';
    if (p.is_legendary === 'True' || p.is_legendary === 'true' || p.is_legendary === '1') return 'legendary';
    if (p.is_sub_legendary === 'True' || p.is_sub_legendary === 'true' || p.is_sub_legendary === '1') return 'sub';
    return 'normal';
}

function buildLegend() {
    const legend = d3.select('#legend');
    const items = ['mythical', 'legendary', 'sub', 'normal'];
    legend.html('');
    const list = legend.selectAll('.legend-item')
        .data(items)
        .enter()
        .append('div')
        .attr('class', 'legend-item')
        .style('display', 'inline-block')
        .style('margin-right', '12px')
        .style('font-size', '14px');

    list.append('span')
        .attr('class', 'legend-color')
        .style('display', 'inline-block')
        .style('width', '14px')
        .style('height', '14px')
        .style('background', d => rarityScale(d))
        .style('border-radius', '50%')
        .style('margin-right', '6px')
        .style('vertical-align', 'middle');

    list.append('span')
        .text(d => d.charAt(0).toUpperCase() + d.slice(1));
}

// Tooltip handling using D3
const tooltip = d3.select('#tooltip');
function showTooltip(evt, p) {
    tooltip.style('display', 'block')
        .html(`<strong>${p.name}</strong><br/>Gen ${p.generation}`)
        .style('left', (evt.clientX + 10) + 'px')
        .style('top', (evt.clientY + 10) + 'px');
}
function hideTooltip() {
    tooltip.style('display', 'none');
}

function getTypeColor(type) {
    const typeColors = {
        'Normal': '#A8A878',
        'Fire': '#F08030',
        'Water': '#6890F0',
        'Electric': '#F8D030',
        'Grass': '#78C850',
        'Ice': '#98D8D8',
        'Fighting': '#C03028',
        'Poison': '#A040A0',
        'Ground': '#E0C068',
        'Flying': '#A890F0',
        'Psychic': '#F85888',
        'Bug': '#A8B820',
        'Rock': '#B8A038',
        'Ghost': '#705898',
        'Dragon': '#7038F8',
        'Dark': '#705848',
        'Steel': '#B8B8D0',
        'Fairy': '#EE99AC'
    };
    return typeColors[type] || '#999999';
}

// Return numeric rarity level for sorting/grouping: 4=mythical, 3=legendary, 2=sub-legendary, 1=normal
function getLegendaryLevel(pokemon) {
    if (!pokemon) return 1;
    if (pokemon.is_mythical === 'True' || pokemon.is_mythical === 'true' || pokemon.is_mythical === '1') {
        return 4;
    }
    if (pokemon.is_legendary === 'True' || pokemon.is_legendary === 'true' || pokemon.is_legendary === '1') {
        return 3;
    }
    if (pokemon.is_sub_legendary === 'True' || pokemon.is_sub_legendary === 'true' || pokemon.is_sub_legendary === '1') {
        return 2;
    }
    return 1;
}

function startAnimation() {
    // If filteredData is null, use all data. If not, use filtered.
    const dataToUse = filteredData === null ? pokemonData : filteredData;
    if (!dataToUse || dataToUse.length === 0) {
        console.log('No Pokemon data loaded yet');
        return;
    }

    // Clear existing pokemon bodies
    pokemonBodies.forEach(body => {
        Composite.remove(world, body);
    });
    pokemonBodies = [];

    // Sort by legendary level so same-colored balls drop together (mythical -> legendary -> sub -> normal)
    const sortedData = [...dataToUse].sort((a, b) => {
        const la = getLegendaryLevel(a);
        const lb = getLegendaryLevel(b);
        if (lb !== la) return lb - la; // descending: higher level (rarer) first
        // tie-breaker: by generation
        return (parseInt(a.generation) || 0) - (parseInt(b.generation) || 0);
    });

    console.log('Starting animation with', sortedData.length, 'Pokemon (grouped by rarity)');

    // Create and add pokemon balls grouped by rarity
    sortedData.forEach((pokemon, i) => {
        setTimeout(() => {
            // Parse generation number (1-8) from correct field
            let generation = 1;
            try {
                generation = Math.max(1, Math.min(8, parseInt(pokemon.generation)));
                generation = generation - 1; // Convert to 0-based index for position calculation
            } catch (e) {
                console.warn(`Invalid generation for ${pokemon.name}, defaulting to Gen 1`);
                generation = 0;
            }

            // Calculate x position based on generation
            const x = (generation * dividerWidth) + (dividerWidth / 2);
            const ball = createPokemonBall(pokemon, x, 20); // Start higher up
            pokemonBodies.push(ball);
            Composite.add(world, ball);

            // attach simple mouse click to show tooltip (use Matter events)
            ball.mouse = { pokemon };
            ball.onClick = function (evt) {
                showTooltip(evt, pokemon);
            };

            // Apply random initial velocity
            Body.setVelocity(ball, {
                x: (Math.random() - 0.5) * 3,
                y: 3 + Math.random() * 2
            });

            console.log(`Added Pokemon ${pokemon.name} at generation ${generation + 1}`);
        }, i * 20);
    });
}

function reset() {
    // Remove all pokemon bodies
    pokemonBodies.forEach(body => {
        Composite.remove(world, body);
    });
    pokemonBodies = [];
    console.log('Reset completed - all Pokemon removed');
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startAnimation);
document.getElementById('resetBtn').addEventListener('click', reset);

// Filter buttons
document.getElementById('filterSubLegendary').addEventListener('click', function () {
    filteredData = pokemonData.filter(p => p.is_sub_legendary === 'True' || p.is_sub_legendary === 'true' || p.is_sub_legendary === '1');
    reset();
    startAnimation();
});
document.getElementById('filterLegendary').addEventListener('click', function () {
    filteredData = pokemonData.filter(p => p.is_legendary === 'True' || p.is_legendary === 'true' || p.is_legendary === '1');
    reset();
    startAnimation();
});
document.getElementById('filterMythical').addEventListener('click', function () {
    filteredData = pokemonData.filter(p => p.is_mythical === 'True' || p.is_mythical === 'true' || p.is_mythical === '1');
    reset();
    startAnimation();
});

// Start the renderer
Render.run(render);

// Log when everything is initialized
console.log('Visualization initialized');

// Function to check if data is loaded
function checkDataLoaded() {
    if (pokemonData && pokemonData.length > 0) {
        console.log('Pokemon data loaded successfully');
        document.getElementById('startBtn').disabled = false;
    } else {
        console.log('Waiting for Pokemon data to load...');
        setTimeout(checkDataLoaded, 1000);
    }
}

// Start checking for data
checkDataLoaded();