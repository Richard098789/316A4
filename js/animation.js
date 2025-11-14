// Animation Control
// Handles Pokemon ball animation, creation, and cleanup

const Animation = (function() {
    let world, Composite, Body;
    let pokemonBodies = [];
    let animationTimeouts = [];
    let createPokemonBall;
    let dividerWidth;
    let showTooltip;

    function initialize(physicsWorld, matterComposite, matterBody, ballCreator, width, tooltipFunction) {
        world = physicsWorld;
        Composite = matterComposite;
        Body = matterBody;
        createPokemonBall = ballCreator;
        dividerWidth = width;
        showTooltip = tooltipFunction;
    }

    function startAnimation(pokemonData, filteredData, getLegendaryLevel) {
        // If filteredData is null, use all data. If not, use filtered.
        const dataToUse = filteredData === null ? pokemonData : filteredData;
        if (!dataToUse || dataToUse.length === 0) {
            return;
        }

        // Clear existing pokemon bodies (this will cancel any ongoing animation)
        reset();

        // Sort by legendary level so same-colored balls drop together (mythical -> legendary -> sub -> normal)
        const sortedData = [...dataToUse].sort((a, b) => {
            const la = getLegendaryLevel(a);
            const lb = getLegendaryLevel(b);
            if (lb !== la) return lb - la; // descending: higher level (rarer) first
            // tie-breaker: by generation
            return (parseInt(a.generation) || 0) - (parseInt(b.generation) || 0);
        });

        // Create and add pokemon balls grouped by rarity
        sortedData.forEach((pokemon, i) => {
            const timeoutID = setTimeout(() => {
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
                    x: (Math.random() - 0.5) * 3,
                    y: 3 + Math.random() * 2
                });
            }, i * 20);
            animationTimeouts.push(timeoutID);
        });
        
        // Re-enlarge current Pokemon after all balls are created
        if (sortedData.length > 0) {
            const lastTimeout = sortedData.length * 20;
            setTimeout(() => {
                // Check and enlarge the currently displayed Pokemon
                if (Interactions && Interactions.checkAndEnlargeCurrentPokemon) {
                    Interactions.checkAndEnlargeCurrentPokemon();
                }
            }, lastTimeout + 100);
        }
    }

    function reset(resetHoverFunction) {
        // Reset hover state
        if (resetHoverFunction) {
            resetHoverFunction();
        }
        
        // Cancel all pending timeouts (allows immediate switching)
        animationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        animationTimeouts = [];
        
        // Remove all pokemon bodies
        pokemonBodies.forEach(body => {
            Composite.remove(world, body);
        });
        pokemonBodies = [];
    }
    
    function getPokemonBodies() {
        return pokemonBodies;
    }

    return {
        initialize,
        startAnimation,
        reset,
        getPokemonBodies
    };
})();

