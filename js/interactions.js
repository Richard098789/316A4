// User Interactions
// Handles hover and click events using D3 and Matter.js

const Interactions = (function() {
    let world, render, Composite, Query, Body;
    let hoveredBody = null;
    let canvas, canvasNode;
    let resetBodyColor, darkenBodyColor;
    let showTooltip, hideTooltip;
    let onPokemonClick = null; // Callback for Pokemon click
    let enlargedBody = null; // Track which body is currently enlarged
    let currentScale = 1.0; // Track current scale of enlarged body

    function initialize(physicsWorld, renderer, matterComposite, matterQuery, matterBody, colorFunctions, tooltipFunctions, clickCallback) {
        world = physicsWorld;
        render = renderer;
        Composite = matterComposite;
        Query = matterQuery;
        Body = matterBody;
        
        resetBodyColor = colorFunctions.resetBodyColor;
        darkenBodyColor = colorFunctions.darkenBodyColor;
        showTooltip = tooltipFunctions.showTooltip;
        hideTooltip = tooltipFunctions.hideTooltip;
        onPokemonClick = clickCallback;

        // Use D3 to select canvas
        canvas = d3.select(render.canvas);
        canvasNode = canvas.node();

        setupHover();
        setupClick();
    }

    // Function to darken color using D3 color manipulation
    function darkenColorD3(colorString, factor = 0.3) {
        const color = d3.rgb(colorString);
        return d3.rgb(
            Math.max(0, color.r - (color.r * factor)),
            Math.max(0, color.g - (color.g * factor)),
            Math.max(0, color.b - (color.b * factor))
        ).toString();
    }

    function setupHover() {
        canvas
            .on('mousemove', function(event) {
                // Get mouse position using D3
                const [mouseX, mouseY] = d3.pointer(event, canvasNode);
                
                // Convert canvas coordinates to Matter.js world coordinates
                const mousePos = { x: mouseX, y: mouseY };
                
                // Use Matter.js Query to find bodies at mouse position
                const allBodies = Composite.allBodies(world);
                const pokemonBodiesList = allBodies.filter(b => !b.isStatic && b.pokemon);
                const bodiesAtPoint = Query.point(pokemonBodiesList, mousePos);
                
                const found = bodiesAtPoint.length > 0 ? bodiesAtPoint[0] : null;
                
                // Handle hover state changes using D3 data pattern
                if (hoveredBody && hoveredBody !== found) {
                    resetBodyColor(hoveredBody);
                    hoveredBody = null;
                    hideTooltip();
                }
                
                if (found && found.pokemon) {
                    if (hoveredBody !== found) {
                        hoveredBody = found;
                        darkenBodyColor(found);
                    }
                    
                    // Get screen coordinates for tooltip using D3 pointer
                    const canvasRect = canvasNode.getBoundingClientRect();
                    const evt = {
                        clientX: canvasRect.left + mouseX,
                        clientY: canvasRect.top + mouseY
                    };
                    showTooltip(evt, found.pokemon);
                } else {
                    if (hoveredBody) {
                        resetBodyColor(hoveredBody);
                        hoveredBody = null;
                    }
                    hideTooltip();
                }
            })
            .on('mouseleave', function() {
                // Reset hover state when mouse leaves canvas using D3
                if (hoveredBody) {
                    resetBodyColor(hoveredBody);
                    hoveredBody = null;
                }
                hideTooltip();
            });
    }

    function setupClick() {
        canvas.on('click', function(event) {
            // Get mouse position using D3
            const [mouseX, mouseY] = d3.pointer(event, canvasNode);
            const mousePos = { x: mouseX, y: mouseY };
            
            // Use Matter.js Query to find bodies at click position
            const allBodies = Composite.allBodies(world);
            const pokemonBodiesList = allBodies.filter(b => !b.isStatic && b.pokemon);
            const bodiesAtPoint = Query.point(pokemonBodiesList, mousePos);
            
            const found = bodiesAtPoint.length > 0 ? bodiesAtPoint[0] : null;
            
            if (found && found.pokemon) {
                // Prevent default dragging behavior for Pokemon balls
                event.preventDefault();
                
                // Get screen coordinates for tooltip using D3
                const canvasRect = canvasNode.getBoundingClientRect();
                const evt = {
                    clientX: canvasRect.left + mouseX,
                    clientY: canvasRect.top + mouseY
                };
                
                // Show tooltip on click (in case hover didn't catch it)
                showTooltip(evt, found.pokemon);
                
                // Call the click callback to update left panel
                if (onPokemonClick) {
                    onPokemonClick(found.pokemon);
                }
                
                console.log('Clicked on:', found.pokemon.name);
            }
        });
    }

    function getHoveredBody() {
        return hoveredBody;
    }

    function setHoveredBody(body) {
        hoveredBody = body;
    }

    function resetHover() {
        if (hoveredBody) {
            resetBodyColor(hoveredBody);
            hoveredBody = null;
        }
        hideTooltip();
    }

    function enlargePokemon(pokemonId) {
        // Restore previous enlarged body if exists
        if (enlargedBody && currentScale !== 1.0) {
            // Scale back by inverse to restore to original size
            Body.scale(enlargedBody, 1.0 / currentScale, 1.0 / currentScale);
            enlargedBody = null;
            currentScale = 1.0;
        }

        if (!pokemonId || !Body) return;

        // Find the Pokemon ball in the world
        const allBodies = Composite.allBodies(world);
        const pokemonBodiesList = allBodies.filter(b => !b.isStatic && b.pokemon);
        const found = pokemonBodiesList.find(b => 
            b.pokemon && String(b.pokemon.pokedex_number) === String(pokemonId)
        );

        if (found && found.originalRadius) {
            enlargedBody = found;
            // Triple the radius by scaling 3x
            Body.scale(found, 3.0, 3.0);
            currentScale = 3.0;
        }
    }

    function restorePokemonSize() {
        if (enlargedBody && currentScale !== 1.0) {
            // Scale back by inverse to restore to original size
            Body.scale(enlargedBody, 1.0 / currentScale, 1.0 / currentScale);
            enlargedBody = null;
            currentScale = 1.0;
        }
    }

    function checkAndEnlargeCurrentPokemon() {
        // Check if there's a currently displayed Pokemon and enlarge it
        if (PokemonInfo && PokemonInfo.getCurrentPokemon) {
            const currentPokemon = PokemonInfo.getCurrentPokemon();
            if (currentPokemon) {
                enlargePokemon(currentPokemon.pokedex_number);
            } else {
                // No Pokemon displayed, restore size
                restorePokemonSize();
            }
        }
    }

    function resetEnlargement() {
        // Reset enlargement state (called when visualization resets)
        enlargedBody = null;
        currentScale = 1.0;
    }

    return {
        initialize,
        getHoveredBody,
        setHoveredBody,
        resetHover,
        darkenColorD3,
        enlargePokemon,
        restorePokemonSize,
        checkAndEnlargeCurrentPokemon,
        resetEnlargement
    };
})();

