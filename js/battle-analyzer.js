// Battle Analyzer
// Loads and analyzes combat data to determine battle outcomes

const BattleAnalyzer = (function() {
    let combatData = [];
    let pokemonData = [];

    function initialize(pokemonDataArray) {
        pokemonData = pokemonDataArray;
    }

    function loadCombatData() {
        return d3.csv('data/combats.csv').then(data => {
            console.log('Combat data loaded:', data.length, 'battles');
            combatData = data;
            return data;
        }).catch(error => {
            console.error('Error loading combat data:', error);
            throw error;
        });
    }

    /**
     * Get Pokemon IDs that beat the selected Pokemon
     * @param {Object} selectedPokemon - The selected Pokemon object
     * @returns {Array} Array of pokedex_number IDs that beat the selected Pokemon
     */
    function getPokemonThatBeat(selectedPokemon) {
        if (!combatData || combatData.length === 0) {
            console.warn('Combat data not loaded');
            return [];
        }

        const selectedId = String(selectedPokemon.pokedex_number);
        if (!selectedId || selectedId === 'undefined' || selectedId === '') {
            console.warn('Selected Pokemon has no pokedex_number');
            return [];
        }

        // Find all battles where selected Pokemon participated and lost
        const losses = combatData.filter(combat => {
            const firstId = String(combat.First_pokemon);
            const secondId = String(combat.Second_pokemon);
            const winnerId = String(combat.Winner);
            
            // Selected Pokemon was in the battle but didn't win
            return (firstId === selectedId || secondId === selectedId) && winnerId !== selectedId;
        });

        // Get unique IDs of Pokemon that beat the selected Pokemon
        const winners = new Set();
        losses.forEach(combat => {
            if (combat.Winner) {
                winners.add(String(combat.Winner));
            }
        });

        return Array.from(winners);
    }

    /**
     * Get Pokemon IDs that the selected Pokemon beats
     * @param {Object} selectedPokemon - The selected Pokemon object
     * @returns {Array} Array of pokedex_number IDs that the selected Pokemon beats
     */
    function getPokemonThatLoseTo(selectedPokemon) {
        if (!combatData || combatData.length === 0) {
            console.warn('Combat data not loaded');
            return [];
        }

        const selectedId = String(selectedPokemon.pokedex_number);
        if (!selectedId || selectedId === 'undefined' || selectedId === '') {
            console.warn('Selected Pokemon has no pokedex_number');
            return [];
        }

        // Find all battles where selected Pokemon won
        const wins = combatData.filter(combat => {
            const winnerId = String(combat.Winner);
            return winnerId === selectedId;
        });

        // Get unique IDs of Pokemon that lost to the selected Pokemon
        const losers = new Set();
        wins.forEach(combat => {
            const firstId = String(combat.First_pokemon);
            const secondId = String(combat.Second_pokemon);
            
            // Add the opponent (the one that's not the selected Pokemon)
            if (firstId === selectedId && secondId) {
                losers.add(secondId);
            } else if (secondId === selectedId && firstId) {
                losers.add(firstId);
            }
        });

        return Array.from(losers);
    }

    /**
     * Get Pokemon objects that beat the selected Pokemon
     * @param {Object} selectedPokemon - The selected Pokemon object
     * @returns {Array} Array of Pokemon objects
     */
    function getPokemonObjectsThatBeat(selectedPokemon) {
        const winnerIds = getPokemonThatBeat(selectedPokemon);
        const winnerIdStrings = winnerIds.map(id => String(id));
        return pokemonData.filter(p => winnerIdStrings.includes(String(p.pokedex_number)));
    }

    /**
     * Get Pokemon objects that the selected Pokemon beats
     * @param {Object} selectedPokemon - The selected Pokemon object
     * @returns {Array} Array of Pokemon objects
     */
    function getPokemonObjectsThatLoseTo(selectedPokemon) {
        const loserIds = getPokemonThatLoseTo(selectedPokemon);
        const loserIdStrings = loserIds.map(id => String(id));
        return pokemonData.filter(p => loserIdStrings.includes(String(p.pokedex_number)));
    }

    /**
     * Get battle statistics for a Pokemon
     * @param {Object} selectedPokemon - The selected Pokemon object
     * @returns {Object} Stats object with wins, losses, total
     */
    function getBattleStats(selectedPokemon) {
        const selectedId = String(selectedPokemon.pokedex_number);
        if (!selectedId || selectedId === 'undefined' || selectedId === '' || !combatData || combatData.length === 0) {
            return { wins: 0, losses: 0, total: 0 };
        }

        const battles = combatData.filter(combat => {
            const firstId = String(combat.First_pokemon);
            const secondId = String(combat.Second_pokemon);
            return firstId === selectedId || secondId === selectedId;
        });

        const wins = battles.filter(combat => String(combat.Winner) === selectedId).length;
        const losses = battles.length - wins;

        return {
            wins,
            losses,
            total: battles.length
        };
    }

    function isCombatDataLoaded() {
        return combatData && combatData.length > 0;
    }

    return {
        initialize,
        loadCombatData,
        getPokemonThatBeat,
        getPokemonThatLoseTo,
        getPokemonObjectsThatBeat,
        getPokemonObjectsThatLoseTo,
        getBattleStats,
        isCombatDataLoaded
    };
})();

