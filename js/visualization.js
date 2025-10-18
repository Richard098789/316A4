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

// Create a runner
const runner = Runner.create();
Runner.run(runner, engine);

// Load the Pokemon data
d3.csv('data/pokedex.csv').then(data => {
    console.log('Data loaded:', data.length, 'Pokemon');
    pokemonData = data;
}).catch(error => {
    console.error('Error loading Pokemon data:', error);
});

function createPokemonBall(pokemon, x, y) {
    const radius = 10;
    const ball = Bodies.circle(x, y, radius, {
        restitution: 0.5,
        friction: 0.1,
        render: {
            fillStyle: getTypeColor(pokemon.Type_1),
            strokeStyle: '#000000',
            lineWidth: 1
        },
        pokemon: pokemon
    });
    return ball;
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

function startAnimation() {
    if (!pokemonData || pokemonData.length === 0) {
        console.log('No Pokemon data loaded yet');
        return;
    }

    // Clear existing pokemon bodies
    pokemonBodies.forEach(body => {
        Composite.remove(world, body);
    });
    pokemonBodies = [];

    console.log('Starting animation with', pokemonData.length, 'Pokemon');

    // Create and add pokemon balls
    pokemonData.forEach((pokemon, i) => {
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

            // Apply random initial velocity
            Body.setVelocity(ball, {
                x: (Math.random() - 0.5) * 3, // Slightly more horizontal spread
                y: 3 + Math.random() * 2 // More consistent downward velocity
            });

            console.log(`Added Pokemon ${pokemon.name} at generation ${generation + 1}`);
        }, i * 20); // Much faster firing rate (20ms instead of 100ms)
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