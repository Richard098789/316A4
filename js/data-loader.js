// Data Loading and Filtering
// Handles Pokemon data loading and filtering operations

const DataLoader = (function() {
    let pokemonData = [];
    let filteredData = null;

    function loadData() {
        return d3.csv('data/pokedex.csv').then(data => {
            console.log('Data loaded:', data.length, 'Pokemon');
            pokemonData = data;
            return data;
        }).catch(error => {
            console.error('Error loading Pokemon data:', error);
            throw error;
        });
    }

    function getPokemonData() {
        return pokemonData;
    }

    function setFilteredData(data) {
        filteredData = data;
    }

    function getFilteredData() {
        return filteredData;
    }

    function filterBySubLegendary() {
        filteredData = pokemonData.filter(p => 
            p.is_sub_legendary === 'True' || 
            p.is_sub_legendary === 'true' || 
            p.is_sub_legendary === '1'
        );
        return filteredData;
    }

    function filterByLegendary() {
        filteredData = pokemonData.filter(p => 
            p.is_legendary === 'True' || 
            p.is_legendary === 'true' || 
            p.is_legendary === '1'
        );
        return filteredData;
    }

    function filterByMythical() {
        filteredData = pokemonData.filter(p => 
            p.is_mythical === 'True' || 
            p.is_mythical === 'true' || 
            p.is_mythical === '1'
        );
        return filteredData;
    }

    function filterByNormal() {
        // Filter for Pokemon that are NOT legendary, sub-legendary, or mythical
        filteredData = pokemonData.filter(p => {
            const isMythical = p.is_mythical === 'True' || p.is_mythical === 'true' || p.is_mythical === '1';
            const isLegendary = p.is_legendary === 'True' || p.is_legendary === 'true' || p.is_legendary === '1';
            const isSubLegendary = p.is_sub_legendary === 'True' || p.is_sub_legendary === 'true' || p.is_sub_legendary === '1';
            return !isMythical && !isLegendary && !isSubLegendary;
        });
        return filteredData;
    }

    function clearFilter() {
        filteredData = null;
    }

    function filterByPokemonIds(pokemonIds) {
        // Filter Pokemon data by array of pokedex_number IDs
        // Convert both to strings for comparison since CSV data might be strings
        const idStrings = pokemonIds.map(id => String(id));
        filteredData = pokemonData.filter(p => {
            const pokemonId = String(p.pokedex_number);
            return idStrings.includes(pokemonId);
        });
        return filteredData;
    }

    function checkDataLoaded(callback) {
        if (pokemonData && pokemonData.length > 0) {
            console.log('Pokemon data loaded successfully');
            if (callback) callback();
        } else {
            console.log('Waiting for Pokemon data to load...');
            setTimeout(() => checkDataLoaded(callback), 1000);
        }
    }

    return {
        loadData,
        getPokemonData,
        setFilteredData,
        getFilteredData,
        filterBySubLegendary,
        filterByLegendary,
        filterByMythical,
        filterByNormal,
        filterByPokemonIds,
        clearFilter,
        checkDataLoaded
    };
})();

