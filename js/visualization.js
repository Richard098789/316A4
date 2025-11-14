// Main Visualization Orchestrator
// Coordinates all modules to create the Pokemon visualization

(function() {
    // Initialize Physics Engine
    const physics = PhysicsEngine.initialize();
    if (!physics) {
        console.error('Failed to initialize Physics Engine');
        return;
    }
    
    const { engine, world, render, width, dividerWidth } = physics;
    const { Bodies, Body, Composite, Query } = physics;

    // Verify Bodies is valid
    if (!Bodies || typeof Bodies.circle !== 'function') {
        console.error('Bodies object is invalid:', Bodies);
        return;
    }

    // Initialize Pokemon Ball module with color scale
    const rarityScale = PokemonBall.createRarityScale();
    PokemonBall.initialize(Bodies, rarityScale);

    // Initialize Legend
    Legend.initialize(rarityScale);

    // Initialize Tooltip
    Tooltip.initialize(rarityScale, PokemonBall.rarityFor);

    // Initialize Pokemon Info Display with filter callback
    // Note: BattleAnalyzer will be initialized after data loads
    PokemonInfo.initialize(rarityScale, PokemonBall.rarityFor, 
        function(pokemonIds, filterType) {
            // Callback when battle filter button is clicked
            DataLoader.filterByPokemonIds(pokemonIds);
            reset();
            startAnimation();
            console.log(`Filtered to show ${pokemonIds.length} Pokemon (${filterType})`);
        },
        function(pokemon) {
            // Callback when "View Win Rate by Type" button is clicked
            showBattleVisualization(pokemon);
        }
    );

    // Setup color manipulation functions for interactions
    // Note: Interactions module will handle its own color functions
    // We just need to provide the functions that interactions can use
    const colorFunctions = {
        resetBodyColor: function(body) {
            if (body && body.originalColor) {
                body.render.fillStyle = body.originalColor;
            }
        },
        darkenBodyColor: function(body) {
            if (body && body.originalColor) {
                // Use D3 to darken color
                const color = d3.rgb(body.originalColor);
                const darkened = d3.rgb(
                    Math.max(0, color.r - (color.r * 0.3)),
                    Math.max(0, color.g - (color.g * 0.3)),
                    Math.max(0, color.b - (color.b * 0.3))
                ).toString();
                body.render.fillStyle = darkened;
            }
        }
    };

    // Initialize Interactions
    Interactions.initialize(
        world,
        render,
        Composite,
        Query,
        Body,
        colorFunctions,
        {
            showTooltip: Tooltip.showTooltip,
            hideTooltip: Tooltip.hideTooltip
        },
        function(pokemon) {
            // Callback when Pokemon is clicked - update left panel
            PokemonInfo.displayPokemon(pokemon);
        }
    );

    // Initialize Animation
    Animation.initialize(
        world,
        Composite,
        Body,
        function(pokemon, x, y) {
            return PokemonBall.createPokemonBall(pokemon, x, y);
        },
        dividerWidth,
        Tooltip.showTooltip
    );

    // Load data and initialize
    DataLoader.loadData().then((pokemonData) => {
        // Initialize Battle Analyzer with loaded Pokemon data
        BattleAnalyzer.initialize(pokemonData);
        
        // Load combat data
        BattleAnalyzer.loadCombatData().then((combatData) => {
            console.log('Combat data loaded successfully');
            
            // Initialize Battle Visualization
            BattleVisualization.initialize('#battle-visualization-container', pokemonData, combatData);
        }).catch(error => {
            console.error('Failed to load combat data:', error);
        });

        Legend.buildLegend();
        DataLoader.checkDataLoaded(() => {
            document.getElementById('startBtn').disabled = false;
        });
    });

    // Navigation functions
    function showBattleVisualization(pokemon) {
        // Hide main view
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('legend').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
        document.querySelector('h1').style.display = 'none';
        
        // Show battle visualization view
        document.getElementById('battle-visualization-view').style.display = 'block';
        
        // Display the visualization
        BattleVisualization.display(pokemon);
    }

    function showMainView() {
        // Hide battle visualization view
        document.getElementById('battle-visualization-view').style.display = 'none';
        
        // Show main view
        document.getElementById('main-container').style.display = 'flex';
        document.getElementById('legend').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
        document.querySelector('h1').style.display = 'block';
    }

    // Back button event listener (set up after DOM is ready)
    setTimeout(() => {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', showMainView);
        }
    }, 100);

    // Animation control functions
    function startAnimation() {
        const pokemonData = DataLoader.getPokemonData();
        const filteredData = DataLoader.getFilteredData();
        Animation.startAnimation(pokemonData, filteredData, PokemonBall.getLegendaryLevel);
    }

    function reset() {
        Animation.reset(Interactions.resetHover);
        // Reset enlargement state when visualization resets
        if (Interactions && Interactions.resetEnlargement) {
            Interactions.resetEnlargement();
        }
        // Note: Left panel info is independent and should not be cleared on reset
    }

    // Event listeners for buttons
    document.getElementById('startBtn').addEventListener('click', function() {
        DataLoader.clearFilter();
        startAnimation();
    });

    document.getElementById('resetBtn').addEventListener('click', reset);

    // Filter buttons
    document.getElementById('filterNormal').addEventListener('click', function() {
        DataLoader.filterByNormal();
        reset();
        startAnimation();
    });

    document.getElementById('filterSubLegendary').addEventListener('click', function() {
        DataLoader.filterBySubLegendary();
        reset();
        startAnimation();
    });

    document.getElementById('filterLegendary').addEventListener('click', function() {
        DataLoader.filterByLegendary();
        reset();
        startAnimation();
    });

    document.getElementById('filterMythical').addEventListener('click', function() {
        DataLoader.filterByMythical();
        reset();
        startAnimation();
    });

    // Pokemon search functionality
    function searchPokemon(query) {
        if (!query || query.trim() === '') {
            return null;
        }

        const pokemonData = DataLoader.getPokemonData();
        if (!pokemonData || pokemonData.length === 0) {
            console.log('Pokemon data not loaded yet');
            return null;
        }

        const trimmedQuery = query.trim().toLowerCase();
        
        // Check if query is a number (ID search)
        const isNumeric = /^\d+$/.test(trimmedQuery);
        
        if (isNumeric) {
            // Search by ID
            const pokemon = pokemonData.find(p => 
                String(p.pokedex_number).toLowerCase() === trimmedQuery
            );
            return pokemon || null;
        } else {
            // Search by name (case-insensitive, partial match)
            const pokemon = pokemonData.find(p => 
                p.name && p.name.toLowerCase().includes(trimmedQuery)
            );
            return pokemon || null;
        }
    }

    // Search button click
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value;
        const pokemon = searchPokemon(query);
        
        if (pokemon) {
            PokemonInfo.displayPokemon(pokemon);
            searchInput.value = ''; // Clear input
        } else {
            alert('Pokemon not found! Please try a different name or ID.');
        }
    });

    // Search on Enter key press
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    // Log when everything is initialized
    console.log('Visualization initialized');
})();
