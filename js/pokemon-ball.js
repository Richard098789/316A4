// Pokemon Ball Creation and Color Logic
// Handles ball creation, color scales, and rarity functions

const PokemonBall = (function() {
    let Bodies, rarityScale;

    function initialize(matterBodies, colorScale) {
        if (!matterBodies || typeof matterBodies.circle !== 'function') {
            console.error('Invalid Bodies object passed to PokemonBall.initialize(). Bodies must be Matter.Bodies.');
            return;
        }
        Bodies = matterBodies;
        rarityScale = colorScale;
    }

    // D3 color scale for rarity
    function createRarityScale() {
        return d3.scaleOrdinal()
            .domain(['mythical', 'legendary', 'sub', 'normal'])
            .range(['#FF0066', '#FFD700', '#00BFFF', '#808080']);
    }

    function rarityFor(p) {
        if (!p) return 'normal';
        if (p.is_mythical === 'True' || p.is_mythical === 'true' || p.is_mythical === '1') return 'mythical';
        if (p.is_legendary === 'True' || p.is_legendary === 'true' || p.is_legendary === '1') return 'legendary';
        if (p.is_sub_legendary === 'True' || p.is_sub_legendary === 'true' || p.is_sub_legendary === '1') return 'sub';
        return 'normal';
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

    function createPokemonBall(pokemon, x, y) {
        if (!Bodies) {
            console.error('PokemonBall not initialized. Call initialize() first.');
            return null;
        }
        
        // Calculate dynamic radius based on viewport size
        // Base size for 4K (3840px width) = 15px
        // Scale proportionally for other screen sizes
        const baseWidth = 3840; // 4K reference width
        const baseRadius = 15; // Base radius for 4K
        const viewportWidth = window.innerWidth || 1920;
        // Use square root scaling for more gradual size changes
        const scaleFactor = Math.sqrt(viewportWidth / baseWidth);
        const radius = Math.max(10, Math.min(20, baseRadius * scaleFactor));
        
        // Use D3 scale for color assignment (use stored rarityScale from closure)
        const rarity = rarityFor(pokemon);
        const color = rarityScale(rarity);
        
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
        
        // Store original color as D3 color string for hover effect
        ball.originalColor = color;
        // Store original radius for resizing
        ball.originalRadius = radius;
        
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

    return {
        initialize,
        createRarityScale,
        rarityFor,
        getLegendaryLevel,
        createPokemonBall,
        getTypeColor
    };
})();

