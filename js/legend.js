// Legend Building
// Creates and manages the rarity legend using D3

const Legend = (function() {
    let rarityScale;

    function initialize(colorScale) {
        rarityScale = colorScale;
    }

    function buildLegend() {
        const legend = d3.select('#legend');
        const items = ['mythical', 'legendary', 'sub', 'normal'];
        legend.html('');
        const list = legend.selectAll('.legend-item')
            .data(items)
            .enter()
            .append('div')
            .attr('class', 'legend-item')
            .style('display', 'inline-block')
            .style('margin-right', '12px')
            .style('font-size', '14px');

        list.append('span')
            .attr('class', 'legend-color')
            .style('display', 'inline-block')
            .style('width', '14px')
            .style('height', '14px')
            .style('background', d => rarityScale(d))
            .style('border-radius', '50%')
            .style('margin-right', '6px')
            .style('vertical-align', 'middle');

        list.append('span')
            .text(d => d.charAt(0).toUpperCase() + d.slice(1));
    }

    return {
        initialize,
        buildLegend
    };
})();

