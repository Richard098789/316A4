// Pokemon Info Display
// Handles displaying Pokemon information in the left panel

const PokemonInfo = (function() {
    let rarityScale;
    let rarityFor;
    let panelElement;
    let onFilterCallback = null; // Callback for filtering
    let onVisualizeCallback = null; // Callback for showing battle visualization
    let currentPokemon = null; // Store current Pokemon

    function initialize(colorScale, rarityFunction, filterCallback, visualizeCallback) {
        rarityScale = colorScale;
        rarityFor = rarityFunction;
        panelElement = d3.select('#left-panel-content');
        onFilterCallback = filterCallback;
        onVisualizeCallback = visualizeCallback;
        
        // Show initial message
        showEmptyState();
    }

    function showEmptyState() {
        panelElement.html(`
            <div style="text-align: center; padding: 40px 20px; color: #999;">
                <svg width="64" height="64" style="margin: 0 auto 20px; opacity: 0.5;">
                    <circle cx="32" cy="32" r="30" fill="none" stroke="#999" stroke-width="2"/>
                    <circle cx="32" cy="32" r="15" fill="#999"/>
                </svg>
                <p style="font-size: 16px; margin: 0;">Click on a Pokemon ball</p>
                <p style="font-size: 14px; margin: 10px 0 0 0;">to view details</p>
            </div>
        `);
    }

    function displayPokemon(pokemon) {
        if (!pokemon) {
            showEmptyState();
            currentPokemon = null;
            // Restore size when panel is cleared
            if (Interactions && Interactions.restorePokemonSize) {
                Interactions.restorePokemonSize();
            }
            return;
        }

        currentPokemon = pokemon;
        
        // Enlarge the Pokemon ball on the right side
        if (Interactions && Interactions.enlargePokemon) {
            Interactions.enlargePokemon(pokemon.pokedex_number);
        }

        // Get rarity information
        const rarity = rarityFor(pokemon);
        const rarityColor = rarityScale(rarity);
        const rarityStatus = pokemon.is_mythical === 'True' || pokemon.is_mythical === 'true' || pokemon.is_mythical === '1' ? 'Mythical' :
            pokemon.is_legendary === 'True' || pokemon.is_legendary === 'true' || pokemon.is_legendary === '1' ? 'Legendary' :
            pokemon.is_sub_legendary === 'True' || pokemon.is_sub_legendary === 'true' || pokemon.is_sub_legendary === '1' ? 'Sub-Legendary' : 'Normal';

        // Format index number (pokedex_number)
        // Handle both the CSV column name and potential variations
        const indexNumber = pokemon.pokedex_number !== undefined && pokemon.pokedex_number !== '' 
            ? pokemon.pokedex_number 
            : (pokemon.pokedex_number === '0' ? '0' : 'N/A');

        // Get battle statistics (handle case where combat data might not be loaded)
        let battleStats = { wins: 0, losses: 0, total: 0 };
        let canBeatCount = 0;
        let beatenByCount = 0;
        let combatDataLoaded = false;
        
        try {
            combatDataLoaded = BattleAnalyzer.isCombatDataLoaded && BattleAnalyzer.isCombatDataLoaded();
            battleStats = BattleAnalyzer.getBattleStats(pokemon);
            canBeatCount = BattleAnalyzer.getPokemonThatLoseTo(pokemon).length;
            beatenByCount = BattleAnalyzer.getPokemonThatBeat(pokemon).length;
        } catch (error) {
            console.warn('Error getting battle stats:', error);
        }

        // Use D3 to create and update the info display with smooth transitions
        panelElement
            .style('opacity', 0)
            .html(`
                <div class="pokemon-header" style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e0e0e0;">
                    <h3 style="margin: 0 0 5px 0; font-size: 24px; color: #333;">${pokemon.name || 'Unknown'}</h3>
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                        <span style="padding: 4px 12px; background: ${rarityColor}; color: white; border-radius: 12px; font-size: 12px; font-weight: bold;">
                            ${rarityStatus}
                        </span>
                        <span style="color: #666; font-size: 14px;">Gen ${pokemon.generation || 'N/A'}</span>
                    </div>
                </div>

                <div class="pokemon-details">
                    <div class="info-section" style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Basic Info</h4>
                        <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Index Number:</span>
                            <span style="color: #333; font-weight: bold;">#${indexNumber}</span>
                        </div>
                        <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Generation:</span>
                            <span style="color: #333; font-weight: bold;">${pokemon.generation || 'N/A'}</span>
                        </div>
                        <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Species:</span>
                            <span style="color: #333; font-weight: bold;">${pokemon.species || 'N/A'}</span>
                        </div>
                    </div>

                    <div class="info-section" style="margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Abilities</h4>
                        <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Ability 1:</span>
                            <span style="color: #333; font-weight: bold;">${pokemon.ability_1 || 'N/A'}</span>
                        </div>
                        ${pokemon.ability_2 ? `
                        <div class="info-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Ability 2:</span>
                            <span style="color: #333; font-weight: bold;">${pokemon.ability_2}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="info-section">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Base Stats</h4>
                        <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">HP:</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(parseInt(pokemon.hp || 0) / 150) * 100}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #333; font-weight: bold; min-width: 30px; text-align: right;">${pokemon.hp || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Attack:</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(parseInt(pokemon.attack || 0) / 150) * 100}%; height: 100%; background: #F44336; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #333; font-weight: bold; min-width: 30px; text-align: right;">${pokemon.attack || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Defense:</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(parseInt(pokemon.defense || 0) / 150) * 100}%; height: 100%; background: #2196F3; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #333; font-weight: bold; min-width: 30px; text-align: right;">${pokemon.defense || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                            <span style="color: #666; font-weight: 500;">Sp. Attack:</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(parseInt(pokemon.sp_attack || 0) / 150) * 100}%; height: 100%; background: #9C27B0; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #333; font-weight: bold; min-width: 30px; text-align: right;">${pokemon.sp_attack || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="stat-row" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                            <span style="color: #666; font-weight: 500;">Sp. Defense:</span>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 100px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${(parseInt(pokemon.sp_defense || 0) / 150) * 100}%; height: 100%; background: #FF9800; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #333; font-weight: bold; min-width: 30px; text-align: right;">${pokemon.sp_defense || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="info-section" style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                        <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Battle Analysis</h4>
                        <div style="margin-bottom: 15px; padding: 12px; background: #f5f5f5; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-around; text-align: center;">
                                <div>
                                    <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${battleStats.wins}</div>
                                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Wins</div>
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: bold; color: #F44336;">${battleStats.losses}</div>
                                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Losses</div>
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: bold; color: #333;">${battleStats.total}</div>
                                    <div style="font-size: 12px; color: #666; margin-top: 4px;">Total</div>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button id="show-beaten-by" class="battle-filter-btn beaten-by-btn" ${battleStats.total === 0 ? 'disabled' : ''}>
                                Show Pokemon That Beat It (${beatenByCount})
                            </button>
                            <button id="show-can-beat" class="battle-filter-btn can-beat-btn" ${battleStats.total === 0 ? 'disabled' : ''}>
                                Show Pokemon It Can Beat (${canBeatCount})
                            </button>
                            <button id="show-winrate-by-type" class="battle-filter-btn" style="
                                background: #9C27B0;
                            " ${battleStats.total === 0 ? 'disabled' : ''} onmouseover="if(!this.disabled) this.style.background='#7B1FA2';" 
                            onmouseout="if(!this.disabled) this.style.background='#9C27B0';">
                                View Win Rate by Type
                            </button>
                            ${battleStats.total === 0 ? `<p style="font-size: 12px; color: #999; text-align: center; margin-top: 5px;">${combatDataLoaded ? 'No combat data found for this Pokemon' : 'Combat data loading...'}</p>` : ''}
                        </div>
                    </div>
                </div>
            `)
            .transition()
            .duration(300)
            .style('opacity', 1)
            .on('end', function() {
                // Attach event listeners after content is rendered
                setupBattleButtons();
                
                // Re-enlarge after a short delay to ensure balls are in the world
                if (currentPokemon && Interactions && Interactions.enlargePokemon) {
                    setTimeout(() => {
                        Interactions.enlargePokemon(currentPokemon.pokedex_number);
                    }, 200);
                }
            });
    }

    function setupBattleButtons() {
        // Remove existing listeners to prevent duplicates
        const beatenByBtn = document.getElementById('show-beaten-by');
        const canBeatBtn = document.getElementById('show-can-beat');

        if (beatenByBtn) {
            // Remove all existing event listeners by cloning the button
            const newBeatenByBtn = beatenByBtn.cloneNode(true);
            beatenByBtn.parentNode.replaceChild(newBeatenByBtn, beatenByBtn);
            
            newBeatenByBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentPokemon && onFilterCallback) {
                    const beatenByIds = BattleAnalyzer.getPokemonThatBeat(currentPokemon);
                    onFilterCallback(beatenByIds, 'beatenBy');
                }
            });
        }

        if (canBeatBtn) {
            // Remove all existing event listeners by cloning the button
            const newCanBeatBtn = canBeatBtn.cloneNode(true);
            canBeatBtn.parentNode.replaceChild(newCanBeatBtn, canBeatBtn);
            
            newCanBeatBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentPokemon && onFilterCallback) {
                    const canBeatIds = BattleAnalyzer.getPokemonThatLoseTo(currentPokemon);
                    onFilterCallback(canBeatIds, 'canBeat');
                }
            });
        }

        const winRateBtn = document.getElementById('show-winrate-by-type');
        if (winRateBtn) {
            const newWinRateBtn = winRateBtn.cloneNode(true);
            winRateBtn.parentNode.replaceChild(newWinRateBtn, winRateBtn);
            
            newWinRateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentPokemon && onVisualizeCallback) {
                    onVisualizeCallback(currentPokemon);
                }
            });
        }
    }

    function clear() {
        showEmptyState();
        currentPokemon = null;
        // Restore size when panel is cleared
        if (Interactions && Interactions.restorePokemonSize) {
            Interactions.restorePokemonSize();
        }
    }
    
    function getCurrentPokemon() {
        return currentPokemon;
    }

    return {
        initialize,
        displayPokemon,
        clear,
        getCurrentPokemon
    };
})();

