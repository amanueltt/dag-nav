<!-- ScatterPlot.svelte -->
<script>
    import * as d3 from 'd3';
    let {
        paths = [],
        width = 600,
        height = 400,
        marginLeft = 50,
        marginTop = 20,
        marginRight = 20,
        marginBottom = 50,
        highlightedPath = null,
        xJitterRange = 0.4,
        yJitterRange = 0.02
    } = $props();

    // Jitter has to be stable: derived from the path itself rather than
    // Math.random(), so the cloud doesn't reshuffle on every re-render and so
    // the highlight marker lands exactly on its own dot.
    function hashUnit(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0) / 4294967295;
    }
    
    const dataset = $derived(
        paths.map(path => {
            const xFeature = path.length;
            let yFeature;
            if (path.correct) {
                yFeature = path.sumDegrees / path.length;
            } else {
                const divisor = path.errorIndexStart ? path.errorIndexStart - 1 : path.length;
                yFeature = path.sumDegrees / (divisor || 1);
            }
            const key = path.path.toString();
            const seed = hashUnit(key);
            const seed2 = hashUnit(key + '#y');
            return {
                ...path,
                key,
                xFeature,
                yFeature,
                xJittered: xFeature + (seed - 0.5) * 2 * xJitterRange,
                yJittered: yFeature + (seed2 - 0.5) * 2 * yJitterRange * yFeature
            };
        })
    );
    
    const x = $derived(
        d3.scaleLinear()
          .domain([0, d3.max(dataset, d => d.xFeature) || 10])
          .nice()
          .range([marginLeft, width - marginRight])
    );
    
    const y = $derived(
        d3.scaleLinear()
          .domain([0, d3.max(dataset, d => d.yFeature) * 1.1 || 5])
          .nice()
          .range([height - marginBottom, marginTop])
    );

    // Correct/incorrect is a status distinction, and green-vs-red is the classic
    // colour-vision trap -- so shape carries it too: correct is a dot, incorrect
    // is a cross. Colour is never the only channel.
    function markClass(d) {
        if (d.type === 'train' || d.type === 'test') return 'neutral';
        return d.correct ? 'good' : 'critical';
    }

    const isIncorrect = (d) => d.type !== 'train' && d.type !== 'test' && !d.correct;

    // A legend only when there is more than one series on screen
    const hasPredicted = $derived(dataset.some(d => d.type !== 'train' && d.type !== 'test'));

    function crossPath(cx, cy, r) {
        const a = r * 0.8;
        return `M${cx - a},${cy - a}L${cx + a},${cy + a}M${cx - a},${cy + a}L${cx + a},${cy - a}`;
    }

    const predicted_REFERENCE = 5;
    const train_test_REFERENCE = 6;

    // Nearest-point hover: a dense scatter can't rely on landing on a 3px dot
    const HOVER_RADIUS = 26;
    let hovered = $state(null);

    function handleMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;

        let best = null;
        let bestDist = HOVER_RADIUS * HOVER_RADIUS;
        for (const d of dataset) {
            const dx = x(d.xJittered) - px;
            const dy = y(d.yJittered) - py;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
                bestDist = dist;
                best = d;
            }
        }
        hovered = best;
    }

    const tooltip = $derived.by(() => {
        if (!hovered) return null;
        const left = x(hovered.xJittered);
        return {
            left,
            top: y(hovered.yJittered),
            flip: left > width - 150,
            d: hovered
        };
    });

    // Only the marks are clipped -- jitter can nudge a point past the plot edge
    const clipId = `scatter-clip-${Math.random().toString(36).slice(2, 9)}`;

    const highlighted = $derived(
        highlightedPath
            ? dataset.filter(d => d.key === highlightedPath.toString())
            : []
    );
</script>

<div class="chart" style:width={`${width}px`}>
    <svg {height} {width} role="img" aria-label="Path length against average out-degree, one mark per path">
        <defs>
            <clipPath id={clipId}>
                <rect
                    x={marginLeft}
                    y={marginTop}
                    width={Math.max(0, width - marginRight - marginLeft)}
                    height={Math.max(0, height - marginBottom - marginTop)}
                />
            </clipPath>
        </defs>

        <!-- Gridlines behind everything: hairline, solid -->
        <g class="grid" aria-hidden="true">
            {#each y.ticks(6) as tick}
                <line x1={marginLeft} x2={width - marginRight} y1={y(tick)} y2={y(tick)} />
            {/each}
        </g>

        <!-- Reference thresholds. Dashed here is meaningful (a target line), which
             is why the gridlines above stay solid. -->
        <g class="reference-lines">
            <line 
                x1={marginLeft}
                y1={y(predicted_REFERENCE)}
                x2={width - marginRight}
                y2={y(predicted_REFERENCE)}
            />
            <text 
                class="reference-label"
                x={width - marginRight - 4}
                y={y(predicted_REFERENCE) + 12}
                text-anchor="end"
            >
                y={predicted_REFERENCE}
            </text>
            <line 
                x1={marginLeft}
                y1={y(train_test_REFERENCE)}
                x2={width - marginRight}
                y2={y(train_test_REFERENCE)}
            />
            <text 
                class="reference-label"
                x={width - marginRight - 4}
                y={y(train_test_REFERENCE) - 5}
                text-anchor="end"
            >
                y={train_test_REFERENCE}
            </text>
        </g>

        <g clip-path={`url(#${clipId})`}>
            {#each dataset as d}
                {#if isIncorrect(d)}
                    <path class="mark cross critical" d={crossPath(x(d.xJittered), y(d.yJittered), 3.5)} />
                {:else}
                    <circle class={`mark dot ${markClass(d)}`} cx={x(d.xJittered)} cy={y(d.yJittered)} r="3" />
                {/if}
            {/each}

            <!-- Hovered / externally highlighted path: 2px surface ring so it
                 stays legible wherever it lands in the cloud -->
            {#each highlighted as d}
                <circle class="halo" cx={x(d.xJittered)} cy={y(d.yJittered)} r="6.5" />
                <circle class={`selected ${markClass(d)}`} cx={x(d.xJittered)} cy={y(d.yJittered)} r="5" />
            {/each}

            {#if hovered}
                <circle class="halo" cx={x(hovered.xJittered)} cy={y(hovered.yJittered)} r="6.5" />
                <circle class={`selected ${markClass(hovered)}`} cx={x(hovered.xJittered)} cy={y(hovered.yJittered)} r="5" />
            {/if}
        </g>

        <!-- X-axis -->
        <g transform={`translate(0,${height - marginBottom})`}>
            <path class="axis-line" d={`M${marginLeft},0H${width - marginRight}`}></path>
            {#each x.ticks() as tick}
                <g transform={`translate(${x(tick)},0)`}>
                    <line class="axis-line" y2="5"></line>
                    <text class="tick" y="8" dy="0.71em" text-anchor="middle">{tick}</text>
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

        <!-- Y-axis -->
        <g transform={`translate(${marginLeft},0)`}>
            <path class="axis-line" d={`M0,${marginTop}V${height - marginBottom}`}></path>
            {#each y.ticks(6) as tick}
                <g transform={`translate(0,${y(tick)})`}>
                    <line class="axis-line" x2="-5"></line>
                    <text class="tick" x="-8" dy="0.32em" text-anchor="end">{tick.toFixed(1)}</text>
                </g>
            {/each}
            <text 
                class="axis-title"
                transform={`translate(-42,${(height - marginBottom + marginTop) / 2}) rotate(-90)`} 
                text-anchor="middle"
            >
                Average Degree
            </text>
        </g>

        <!-- Nearest-point hit layer on top -->
        <rect
            class="hit"
            x={marginLeft}
            y={marginTop}
            width={Math.max(0, width - marginRight - marginLeft)}
            height={Math.max(0, height - marginBottom - marginTop)}
            onmousemove={handleMove}
            onmouseleave={() => (hovered = null)}
            role="presentation"
        />
    </svg>

    {#if hasPredicted}
        <!-- Identity never rests on colour alone: swatch shape + text label -->
        <div class="legend">
            <span class="legend-item">
                <svg class="swatch" viewBox="0 0 12 12" aria-hidden="true">
                    <circle class="dot good" cx="6" cy="6" r="3" />
                </svg>
                Correct
            </span>
            <span class="legend-item">
                <svg class="swatch" viewBox="0 0 12 12" aria-hidden="true">
                    <path class="cross critical" d="M3.2,3.2L8.8,8.8M3.2,8.8L8.8,3.2" />
                </svg>
                Incorrect
            </span>
        </div>
    {/if}

    {#if tooltip}
        <div
            class="tooltip"
            class:flip={tooltip.flip}
            style:left={`${tooltip.left}px`}
            style:top={`${tooltip.top}px`}
        >
            <div class="tt-title">
                {#if tooltip.d.type === 'train' || tooltip.d.type === 'test'}
                    {tooltip.d.type} path
                {:else if tooltip.d.correct}
                    Correct
                {:else}
                    Incorrect{tooltip.d.errorType ? ` · ${tooltip.d.errorType}` : ''}
                {/if}
            </div>
            <div class="tt-row">
                <span>Length</span>
                <span class="tabular">{tooltip.d.xFeature}</span>
            </div>
            <div class="tt-row">
                <span>Avg. degree</span>
                <span class="tabular">{tooltip.d.yFeature.toFixed(2)}</span>
            </div>
            <div class="tt-path">{tooltip.d.path.join(' → ')}</div>
        </div>
    {/if}
</div>

<style>
    .chart {
        position: relative;
    }

    svg {
        display: block;
        overflow: visible;
    }

    text {
        font-family: var(--font-sans);
    }

    /* Marks carry the colour; the low opacity is what makes density readable */
    .mark {
        transition: opacity var(--speed) ease;
    }

    .dot.neutral {
        fill: var(--mark-neutral);
        opacity: 0.3;
    }

    .dot.good {
        fill: var(--status-good);
        opacity: 0.32;
    }

    .cross.critical {
        stroke: var(--status-critical);
        stroke-width: 1.6;
        stroke-linecap: round;
        fill: none;
        opacity: 0.8;
    }

    /* Surface ring, so a picked mark reads on top of the cloud */
    .halo {
        fill: none;
        stroke: var(--surface-2);
        stroke-width: 2.5;
    }

    .selected.neutral {
        fill: var(--mark-neutral);
    }

    .selected.good {
        fill: var(--status-good);
    }

    .selected.critical {
        fill: var(--status-critical);
    }

    .grid line {
        stroke: var(--grid);
        stroke-width: 1;
    }

    .reference-lines line {
        stroke: var(--axis);
        stroke-width: 1.5;
        stroke-dasharray: 5 4;
    }

    .reference-label {
        fill: var(--text-3);
        font-size: 10.5px;
        font-variant-numeric: tabular-nums;
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

    .axis-title {
        fill: var(--text-2);
        font-size: 11.5px;
        font-weight: 550;
    }

    .hit {
        fill: transparent;
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1em;
        margin-top: 0.5em;
        padding-left: 0.25em;
        font-size: 0.75rem;
        color: var(--text-2);
    }

    .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 0.35em;
    }

    .swatch {
        width: 12px;
        height: 12px;
        flex: 0 0 auto;
        overflow: visible;
    }

    .swatch .dot.good {
        opacity: 1;
    }

    .swatch .cross.critical {
        opacity: 1;
        stroke-width: 1.8;
    }

    .tooltip {
        position: absolute;
        transform: translate(10px, -100%);
        pointer-events: none;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-menu);
        padding: 0.5em 0.6em;
        font-size: 0.75rem;
        max-width: 200px;
        z-index: 10;
    }

    .tooltip.flip {
        transform: translate(calc(-100% - 10px), -100%);
    }

    .tt-title {
        font-weight: 600;
        color: var(--text-1);
        margin-bottom: 0.3em;
        text-transform: capitalize;
    }

    .tt-row {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        color: var(--text-2);
    }

    .tt-path {
        margin-top: 0.4em;
        padding-top: 0.4em;
        border-top: 1px solid var(--border);
        color: var(--text-3);
        font-size: 0.6875rem;
        line-height: 1.4;
        word-break: break-word;
    }
</style>
