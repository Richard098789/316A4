// Tooltip Management
// Handles tooltip display and hiding with D3 transitions

const Tooltip = (function() {
    let tooltip;
    let rarityScale;
    let rarityFor;

    function initialize(colorScale, rarityFunction) {
        tooltip = d3.select('#tooltip');
        rarityScale = colorScale;
        rarityFor = rarityFunction;
    }

    function showTooltip(evt, p) {
        // Get coordinates - handle both native events and custom event objects
        const clientX = evt.clientX !== undefined ? evt.clientX : (evt.pageX !== undefined ? evt.pageX : 0);
        const clientY = evt.clientY !== undefined ? evt.clientY : (evt.pageY !== undefined ? evt.pageY : 0);
        
        // Use D3 to create tooltip content with transitions
        tooltip
            .style('opacity', 0)
            .style('display', 'block')
            .html(`
                <div style="border-bottom: 1px solid #555; margin-bottom: 8px; padding-bottom: 5px;">
                    <strong style="font-size: 16px;">${p.name}</strong>
                    <div style="color: #aaa;">Generation ${p.generation}</div>
                </div>
                <div class="tooltip-row">
                    <span>Species:</span>
                    <span>${p.species}</span>
                </div>
                <div class="tooltip-row">
                    <span>Type:</span>
                    <span>${p.type_1}${p.type_2 ? ' / ' + p.type_2 : ''}</span>
                </div>
            `)
            .style('left', clientX + 10 + 'px')
            .style('top', clientY + 10 + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1);
    }

    function hideTooltip() {
        // Use D3 transition for smooth fade out
        tooltip
            .transition()
            .duration(150)
            .style('opacity', 0)
            .on('end', function() {
                d3.select(this).style('display', 'none');
            });
    }

    return {
        initialize,
        showTooltip,
        hideTooltip
    };
})();

