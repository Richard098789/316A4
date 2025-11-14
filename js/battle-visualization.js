// Battle Visualization
// Creates win rate by type visualization

const BattleVisualization = (function() {
    let containerElement;
    let currentPokemon = null;
    let pokemonData = [];
    let combatData = [];

    function initialize(containerId, pokemonDataArray, combatDataArray) {
        containerElement = d3.select(containerId);
        pokemonData = pokemonDataArray;
        combatData = combatDataArray;
    }

    /**
     * Calculate win rate by type for a Pokemon
     */
    function calculateWinRateByType(pokemon) {
        const pokemonId = String(pokemon.pokedex_number);
        if (!pokemonId || !combatData || combatData.length === 0) {
            return [];
        }

        // Get all battles involving this Pokemon
        const battles = combatData.filter(combat => {
            const firstId = String(combat.First_pokemon);
            const secondId = String(combat.Second_pokemon);
            return firstId === pokemonId || secondId === pokemonId;
        });

        // Group battles by opponent type
        const typeStats = {};
        
        battles.forEach(combat => {
            const firstId = String(combat.First_pokemon);
            const secondId = String(combat.Second_pokemon);
            const winnerId = String(combat.Winner);
            
            // Find opponent
            const opponentId = firstId === pokemonId ? secondId : firstId;
            const opponent = pokemonData.find(p => String(p.pokedex_number) === opponentId);
            
            if (!opponent) return;
            
            // Get opponent's types
            const types = [opponent.type_1];
            if (opponent.type_2 && opponent.type_2.trim() !== '') {
                types.push(opponent.type_2);
            }
            
            const won = winnerId === pokemonId;
            
            // Update stats for each opponent type
            types.forEach(type => {
                if (!type || type.trim() === '') return;
                
                if (!typeStats[type]) {
                    typeStats[type] = { wins: 0, total: 0 };
                }
                
                typeStats[type].total++;
                if (won) {
                    typeStats[type].wins++;
                }
            });
        });

        // Convert to array and calculate win rates
        const result = Object.keys(typeStats).map(type => ({
            type: type,
            wins: typeStats[type].wins,
            total: typeStats[type].total,
            winRate: typeStats[type].total > 0 ? (typeStats[type].wins / typeStats[type].total) * 100 : 0
        })).sort((a, b) => b.winRate - a.winRate);

        return result;
    }

    /**
     * Display the battle visualization
     */
    function display(pokemon) {
        currentPokemon = pokemon;
        
        if (!pokemon) {
            containerElement.html('<p>No Pokemon selected</p>');
            return;
        }

        const winRateData = calculateWinRateByType(pokemon);
        
        if (winRateData.length === 0) {
            containerElement.html(`
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p>No battle data available for ${pokemon.name}</p>
                </div>
            `);
            return;
        }

        // Clear container
        containerElement.html('');

        // Add header
        const header = containerElement.append('div')
            .style('margin-bottom', '30px')
            .style('border-bottom', '2px solid #4CAF50')
            .style('padding-bottom', '15px');

        header.append('h2')
            .text(`${pokemon.name} - Win Rate by Type`)
            .style('margin', '0 0 10px 0')
            .style('color', '#333');

        header.append('p')
            .text(`Total battles: ${winRateData.reduce((sum, d) => sum + d.total, 0)}`)
            .style('margin', '0')
            .style('color', '#666')
            .style('font-size', '14px');

        // Create SVG for chart
        const margin = { top: 20, right: 30, bottom: 60, left: 80 };
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = containerElement.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleBand()
            .domain(winRateData.map(d => d.type))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Color scale - green for high win rate, red for low
        const colorScale = d3.scaleSequential(d3.interpolateRdYlGn)
            .domain([0, 100]);

        // Add bars
        const bars = g.selectAll('.bar')
            .data(winRateData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.type))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', d => colorScale(d.winRate))
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

        // Animate bars
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('y', d => yScale(d.winRate))
            .attr('height', d => height - yScale(d.winRate));

        // Add value labels on bars
        g.selectAll('.value-label')
            .data(winRateData)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.type) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.winRate) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#333')
            .text(d => `${d.winRate.toFixed(1)}%`)
            .style('opacity', 0)
            .transition()
            .duration(800)
            .delay((d, i) => i * 50 + 400)
            .style('opacity', 1);

        // Add X axis
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em');

        // Add Y axis
        g.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d => d + '%'));

        // Add axis labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Win Rate (%)');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .text('Opponent Type');

        // Add fun recommendation message
        const bestType = winRateData[0];
        containerElement.append('div')
            .style('margin-top', '40px')
            .style('text-align', 'center')
            .style('font-size', '28px')
            .style('font-weight', 'bold')
            .style('font-family', 'Arial, sans-serif')
            .html(`USE THIS POKEMON AGAINST <span style="color: #FF6B6B; text-transform: uppercase; font-size: 32px; font-weight: 900;">${bestType.type}</span> !`);
    }

    function getCurrentPokemon() {
        return currentPokemon;
    }

    return {
        initialize,
        display,
        getCurrentPokemon
    };
})();

