<!-- Histogram.svelte -->
<script>
    import * as d3 from 'd3';
    
    // Props with default values
    let { 
        paths, 
        uniquePathLengths,
        width, 
        height,
        marginLeft,
        marginTop,
        marginRight,
        marginBottom
    } = $props();
    
    // Mark specs: cap the bar so the band's leftover reads as air rather than
    // letting a wide band grow a slab
    const MAX_BAR = 24;
    const CAP_RADIUS = 4;
    
    // If uniquePathLengths is not provided, calculate it
    const pathLengths = $derived(
        (uniquePathLengths || Array.from(new Set(paths.map(path => path.length))))
        .sort((a, b) => a - b)
    );
    
    // Get the counts for the filtered dataset
    const counts = $derived(
        d3.rollup(
            paths,
            (g) => g.length,  // Count how many paths in each group
            (d) => d.length   // Group by the 'length' property
        )
    );
    
    // Convert to array for easier use in rendering
    const countArray = $derived(
        Array.from(counts, ([length, count]) => ({ 
            length, 
            count,
            percentage: paths.length > 0 ? (count / paths.length) * 100 : 0
        }))
        .sort((a, b) => a.length - b.length)
    );

    // The one bar that gets a direct label -- everything else is on the axis and
    // in the tooltip, because a number over every bar goes unread
    const peak = $derived(
        countArray.reduce(
            (best, d) => (best === null || d.percentage > best.percentage ? d : best),
            null
        )
    );
    
    // X axis represents path length categories (vertical bars)
    const x = $derived(
        d3
            .scaleBand()
            .domain(pathLengths)
            .range([marginLeft, width - marginRight])
            .padding(0.1)
    );
    
    // Y axis represents percentages (heights of bars)
    const y = $derived(
        d3
            .scaleLinear()
            .domain([0, Math.min(100, Math.ceil((d3.max(countArray, d => d.percentage) || 0) * 1.1)) || 10])
            .nice()
            .range([height - marginBottom, marginTop])
    );

    const baseline = $derived(height - marginBottom);
    const barWidth = $derived(Math.min(x.bandwidth(), MAX_BAR));

    // Rounded data-end at the top, square where it meets the baseline
    function barPath(centre, top, w, base) {
        const half = w / 2;
        const x0 = centre - half;
        const x1 = centre + half;
        const r = Math.min(CAP_RADIUS, half, Math.max(0, base - top));
        return `M${x0},${base}V${top + r}A${r},${r} 0 0 1 ${x0 + r},${top}` +
               `H${x1 - r}A${r},${r} 0 0 1 ${x1},${top + r}V${base}Z`;
    }

    // Hover layer: the hit target is the whole band column, not the 24px bar
    let hovered = $state(null);

    const tooltip = $derived.by(() => {
        if (!hovered) return null;
        const centre = x(hovered.length) + x.bandwidth() / 2;
        return {
            left: centre,
            top: y(hovered.percentage),
            // flip the label to the left of the cursor near the right edge
            flip: centre > width - 110,
            ...hovered
        };
    });
</script>

<div class="chart" style:width={`${width}px`}>
    <svg {width} {height} role="img" aria-label="Distribution of path lengths, as a percentage of all paths">
        <!-- Gridlines: hairline, solid, one step off the surface -->
        <g class="grid" aria-hidden="true">
            {#each y.ticks(5) as tick}
                <line x1={marginLeft} x2={width - marginRight} y1={y(tick)} y2={y(tick)} />
            {/each}
        </g>

        <!-- Bars -->
        <g>
            {#each countArray as d (d.length)}
                <path
                    class="bar"
                    class:dim={hovered !== null && hovered.length !== d.length}
                    d={barPath(x(d.length) + x.bandwidth() / 2, y(d.percentage), barWidth, baseline)}
                />
            {/each}
        </g>

        <!-- One direct label, on the tallest bar -->
        {#if peak && peak.percentage > 0}
            <text
                class="peak-label"
                x={x(peak.length) + x.bandwidth() / 2}
                y={y(peak.percentage) - 8}
                text-anchor="middle"
            >
                {peak.percentage.toFixed(1)}%
            </text>
        {/if}
        
        <!-- X Axis (Path Length) -->
        <g transform={`translate(0,${baseline})`}>
            <path class="axis-line" d={`M${marginLeft},0H${width - marginRight}`}></path>
            {#each pathLengths as length}
                <g transform={`translate(${x(length) + x.bandwidth() / 2},0)`}>
                    <line class="axis-line" y2="5"></line>
                    <text class="tick" y="8" dy="0.71em" text-anchor="middle">{length}</text>
                </g>
            {/each}
            <text 
                class="axis-title"
                x={(width - marginRight + marginLeft) / 2} 
                y="38" 
                text-anchor="middle"
            >
                Path Length
            </text>
        </g>
        
        <!-- Y Axis (Percentage) -->
        <g transform={`translate(${marginLeft},0)`}>
            <path class="axis-line" d={`M0,${marginTop}V${height - marginBottom}`}></path>
            {#each y.ticks(5) as tick}
                <g transform={`translate(0,${y(tick)})`}>
                    <line class="axis-line" x2="-5"></line>
                    <text class="tick" x="-8" dy="0.32em" text-anchor="end">{tick}%</text>
                </g>
            {/each}
            <text 
                class="axis-title"
                transform={`translate(-42,${(height - marginBottom + marginTop) / 2}) rotate(-90)`} 
                text-anchor="middle"
            >
                Percentage
            </text>
        </g>

        <!-- Hit areas last so they sit on top of the marks -->
        <g>
            {#each countArray as d (d.length)}
                <rect
                    class="hit"
                    x={x(d.length)}
                    y={marginTop}
                    width={x.bandwidth()}
                    height={Math.max(0, baseline - marginTop)}
                    onmouseenter={() => (hovered = d)}
                    onmouseleave={() => (hovered = null)}
                    onfocus={() => (hovered = d)}
                    onblur={() => (hovered = null)}
                    tabindex="-1"
                    role="presentation"
                />
            {/each}
        </g>
    </svg>

    {#if tooltip}
        <div
            class="tooltip"
            class:flip={tooltip.flip}
            style:left={`${tooltip.left}px`}
            style:top={`${tooltip.top}px`}
        >
            <div class="tt-title">Length {tooltip.length}</div>
            <div class="tt-row">
                <span>Paths</span>
                <span class="tabular">{tooltip.count.toLocaleString()}</span>
            </div>
            <div class="tt-row">
                <span>Share</span>
                <span class="tabular">{tooltip.percentage.toFixed(1)}%</span>
            </div>
        </div>
    {/if}

    <!-- Table twin: every value the chart shows is readable without hovering -->
    <details class="table-twin">
        <summary>Show data table</summary>
        <table>
            <thead>
                <tr>
                    <th scope="col">Path length</th>
                    <th scope="col">Paths</th>
                    <th scope="col">Share</th>
                </tr>
            </thead>
            <tbody>
                {#each countArray as d (d.length)}
                    <tr>
                        <td class="tabular">{d.length}</td>
                        <td class="tabular">{d.count.toLocaleString()}</td>
                        <td class="tabular">{d.percentage.toFixed(1)}%</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </details>
</div>

<style>
    .chart {
        position: relative;
    }

    svg {
        display: block;
        overflow: visible;
    }

    .bar {
        fill: var(--series-1);
        transition: d 250ms, opacity var(--speed) ease;
    }

    /* Hovering one bar recedes the others rather than recolouring anything */
    .bar.dim {
        opacity: 0.45;
    }

    .grid line {
        stroke: var(--grid);
        stroke-width: 1;
    }

    .axis-line {
        stroke: var(--axis);
        stroke-width: 1;
        fill: none;
    }

    .tick {
        fill: var(--text-3);
        font-size: 11px;
        font-variant-numeric: tabular-nums;
    }

    /* Recessive axis titles -- they label, they don't shout */
    .axis-title {
        fill: var(--text-2);
        font-size: 11.5px;
        font-weight: 550;
    }

    .peak-label {
        fill: var(--text-2);
        font-size: 11px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    text {
        font-family: var(--font-sans);
    }

    .hit {
        fill: transparent;
        cursor: default;
    }

    .tooltip {
        position: absolute;
        transform: translate(8px, -100%);
        pointer-events: none;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-menu);
        padding: 0.5em 0.6em;
        font-size: 0.75rem;
        min-width: 108px;
        z-index: 10;
    }

    .tooltip.flip {
        transform: translate(calc(-100% - 8px), -100%);
    }

    .tt-title {
        font-weight: 600;
        color: var(--text-1);
        margin-bottom: 0.3em;
    }

    .tt-row {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        color: var(--text-2);
    }

    .table-twin {
        margin-top: 0.75em;
        font-size: 0.75rem;
        color: var(--text-2);
    }

    .table-twin summary {
        cursor: pointer;
        color: var(--text-3);
        padding: 0.2em 0;
        width: fit-content;
    }

    .table-twin summary:hover {
        color: var(--text-1);
    }

    table {
        margin-top: 0.5em;
        border-collapse: collapse;
        width: 100%;
    }

    th,
    td {
        text-align: right;
        padding: 0.3em 0.6em;
        border-bottom: 1px solid var(--border);
    }

    th:first-child,
    td:first-child {
        text-align: left;
    }

    th {
        color: var(--text-3);
        font-weight: 550;
    }
</style>
