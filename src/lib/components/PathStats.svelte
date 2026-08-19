<!-- PathStats.svelte -->
<script>
    import * as d3 from 'd3';
    import Histogram from './Histogram.svelte';
	import ScatterPlot from './ScatterPlot.svelte';
    
    let { 
        graphmlData = null,
        trainPaths = [], 
        testPaths = [],
        predictedPaths = [],
        currentPathType = 'predicted',
        selectedVertex = null,
        width = 600,
        height = 400,
        hoveredPath
    } = $props();

    // Parse GraphML and calculate (Outgoing) degrees
    function calculateNodeOutDegrees(graphmlData) {
        // Parse the GraphML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(graphmlData, "text/xml");
        
        // Initialize out-degree trackers
        const outDegrees = {};
        
        // Extract nodes and initialize all with 0
        const nodes = xmlDoc.getElementsByTagName('node');
        for (let i = 0; i < nodes.length; i++) {
            const id = nodes[i].getAttribute('id');
            outDegrees[id] = 0;
        }
        
        // Count only outgoing edges
        const edges = xmlDoc.getElementsByTagName('edge');
        for (let i = 0; i < edges.length; i++) {
            const source = edges[i].getAttribute('source');
            outDegrees[source] = (outDegrees[source] || 0) + 1; // Only count out-degree
        }

        return outDegrees;
    }

    // Store processed flags
    let processedGraphML = $state(false);
    let nodeOutDegrees = $state({});
    let updatedtrainPaths = $state([]);
    let updatedtestPaths = $state([]);
    let updatedpredictedPaths = $state([]);
    let pathsProcessed = $state(false);

    // Process GraphML only once
    $effect(() => {
        if (graphmlData && !processedGraphML) {
            console.log("Processing GraphML data for out-degrees...");
            nodeOutDegrees = calculateNodeOutDegrees(graphmlData);
            processedGraphML = true;
            console.log(`Calculated out-degrees for ${Object.keys(nodeOutDegrees).length} nodes`);
        }
    });

    // Function to calculate sum of degrees for any path
    function calculateSumDegrees(pathObj) {
        let sum = 0;
        // For all path types, use the same logic as for correct predicted paths
        const endIndex = pathObj.correct === false && pathObj.errorIndexStart !== undefined ? 
                        pathObj.errorIndexStart : 
                        pathObj.path.length - 2;
            
        // Sum out-degrees from index 2 to endIndex
        for (let i = 2; i <= endIndex; i++) {
            if (i < pathObj.path.length) {
                const nodeId = pathObj.path[i].toString();
                sum += nodeOutDegrees[nodeId] || 0;
            }
        }
        
        return sum;
    }

    // Update all path types with degree information
    $effect(() => {
        if (Object.keys(nodeOutDegrees).length > 0 && !pathsProcessed) {
            console.log("Updating all path types with degree information...");
            
            // Update train paths
            updatedtrainPaths = trainPaths.map(pathObj => ({
                ...pathObj,
                sumDegrees: calculateSumDegrees(pathObj)
            }));
            
            // Update test paths
            updatedtestPaths = testPaths.map(pathObj => ({
                ...pathObj,
                sumDegrees: calculateSumDegrees(pathObj)
            }));
            
            // Update predicted paths
            updatedpredictedPaths = predictedPaths.map(pathObj => ({
                ...pathObj,
                sumDegrees: calculateSumDegrees(pathObj)
            }));
            
            pathsProcessed = true;
            console.log(`Updated paths with degree information: ${updatedtrainPaths.length} train, ${updatedtestPaths.length} test, ${updatedpredictedPaths.length} predicted`);
            

            // Log full details of a single path
            if (updatedtrainPaths.length > 0) {
                console.log('Detailed view of first path:', JSON.stringify(updatedpredictedPaths[0], null, 2));
            }
        }
    });

    // Use updated paths in the paths variable
    const paths = $derived(
        currentPathType === 'train' ? updatedtrainPaths :
        currentPathType === 'test' ? updatedtestPaths :
        currentPathType === 'predicted' ? updatedpredictedPaths : 
        []
    );

    // Debug
    // $effect(() => {
    //     if (predictedPaths.length > 0) {
    //         const p = predictedPaths[44]; // first path
    //         console.log({
    //         path: `Array(${p.path.length})`,
    //         length: p.length,
    //         start: p.start,
    //         end: p.end,
    //         type: p.type,
    //         raw: p.raw?.substring(0, 20) + (p.raw?.length > 20 ? '...' : ''),
    //         correct: p.correct,
    //         errorType: p.errorType
    //         });
    //     }
    // });

    // Computed statistics
    let pathStats = $derived(computePathStats(paths));
    let vertexUsage = $derived(computeVertexUsage(paths));

    function computePathStats(pathsData) {
        if (!pathsData || pathsData.length === 0) {
            return {
                count: 0,
                lengthDistribution: [],
                avgLength: 0,
                minLength: 0,
                maxLength: 0
            };
        }

        const lengthCounts = {};
        let totalLength = 0;
        let minLength = Infinity;
        let maxLength = 0;

        pathsData.forEach(pathObj => {
            const length = pathObj.length;
            lengthCounts[length] = (lengthCounts[length] || 0) + 1;
            totalLength += length;
            if (length < minLength) minLength = length;
            if (length > maxLength) maxLength = length;
        });

        const lengthDistribution = Object.entries(lengthCounts)
            .map(([length, count]) => ({
                length: parseInt(length),
                count
            }))
            .sort((a, b) => a.length - b.length);

        return {
            count: pathsData.length,
            lengthDistribution,
            avgLength: pathsData.length > 0 ? totalLength / pathsData.length : 0,
            minLength: minLength !== Infinity ? minLength : 0,
            maxLength
        };
    }

    function computeVertexUsage(pathsData) {
        const vertexCounts = {};
        pathsData.forEach(pathObj => {
            const uniqueVertices = new Set(pathObj.path);
            uniqueVertices.forEach(vertex => {
                const vertexId = vertex.toString();
                vertexCounts[vertexId] = (vertexCounts[vertexId] || 0) + 1;
            });
        });

        return Object.entries(vertexCounts)
            .map(([vertexId, count]) => ({
                vertexId,
                count,
                frequency: pathsData.length > 0 ? count / pathsData.length * 100 : 0
            }))
            .sort((a, b) => b.count - a.count);
    }

    function getPathsWithVertex(pathsData, vertexId) {
        if (!vertexId) return [];
        return pathsData.filter(pathObj => pathObj.path.includes(parseInt(vertexId)));
    }

    let filteredPaths = $derived(
        selectedVertex ? getPathsWithVertex(paths, selectedVertex.id) : []
    );

    let vertexStats = $derived(
        selectedVertex ? {
            id: selectedVertex.id,
            totalAppearances: selectedVertex.count,
            pathsIncluding: filteredPaths.length,
            percentOfPaths: paths.length > 0 ? (filteredPaths.length / paths.length * 100).toFixed(2) : 0,
            asStart: selectedVertex.asStart,
            asEnd: selectedVertex.asEnd,
            asIntermediate: selectedVertex.asIntermediate
        } : null
    );
    

    // Data Processing for Histogram
    // Get unique path lengths for color coding without sorting
    const uniquePathLengths = $derived(
    Array.from(new Set(paths.map(path => path.length)))
        .sort((a, b) => a - b)  // Sort numerically in ascending order
    );

    // Create color scale for path lengths
    // const color = $derived(
    //     d3.scaleOrdinal()
    //     .domain(uniquePathLengths)
    //     .range(d3.schemeTableau10)
    // );

    // Log the color assignments with counts
    // $effect(() => {
    //     // Create a count map for quick lookup
    //     const lengthCounts = {};
    //     paths.forEach(path => {
    //         lengthCounts[path.length] = (lengthCounts[path.length] || 0) + 1;
    //     });
        
    //     console.log(`Path lengths with counts for ${currentPathType}:`);
    //     uniquePathLengths.forEach(length => {
    //         const count = lengthCounts[length] || 0;
    //         const percentage = (count / paths.length * 100).toFixed(1);
    //         console.log(
    //             `%c  Length ${length}: %c${count} paths (${percentage}%)`,
    //             `color: ${color(length)}; font-weight: bold;`,
    //             `color: black; font-weight: normal;`
    //         );
    //     });
    // });

    // --- Chart sizing -------------------------------------------------------
    // The charts used to be hard-coded to 800x700 inside a 70% column, which
    // overflowed and forced a nested scrollbar. Measure the slot instead and let
    // each chart render at the width it actually has.
    let histSlotWidth = $state(0);
    let scatterSlotWidth = $state(0);

    const MIN_CHART_WIDTH = 320;

    const histWidth = $derived(Math.max(MIN_CHART_WIDTH, histSlotWidth));
    const scatterWidth = $derived(Math.max(MIN_CHART_WIDTH, scatterSlotWidth));

    // Height comes from the panel rather than the slot: measuring the slot would
    // loop, because the slot also holds the table-twin disclosure below the svg.
    // The allowance covers the header, the stat row and the card chrome.
    const chartBoxHeight = $derived.by(() => {
        const chrome = selectedVertex ? 348 : 256;
        return Math.round(Math.min(620, Math.max(320, (height || 0) - chrome)));
    });
</script>

<div class="path-stats-container">
    <div class="path-stats-header">
        <h2>Path Statistics</h2>
        {#if currentPathType}
            <span class="chip">{currentPathType}</span>
        {/if}
    </div>

    <div class="path-stats-wrapper">
        <div class="path-stats-content">
            <div class="stats-summary">
                <div class="stat-card">
                    <div class="stat-title">Total paths</div>
                    <div class="stat-value">{pathStats.count.toLocaleString()}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Avg. length</div>
                    <div class="stat-value">{Number.isNaN(pathStats.avgLength) ? "0.00" : pathStats.avgLength.toFixed(2)}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Min length</div>
                    <div class="stat-value">{pathStats.minLength}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Max length</div>
                    <div class="stat-value">{pathStats.maxLength}</div>
                </div>

                {#if currentPathType === 'predicted'}
                <div class="stat-card">
                    <div class="stat-title">Correct paths</div>
                    <div class="stat-value">{paths.filter(p => p.correct).length.toLocaleString()}</div>
                </div>

                <div class="stat-card">
                    <div class="stat-title">Error rate</div>
                    <div class="stat-value">{(paths.length > 0 ? (paths.filter(p => !p.correct).length / paths.length * 100).toFixed(2) : "0.00")}%</div>
                </div>
                {/if}
            </div>

            {#if selectedVertex}
            <div class="selected-vertex-stats">
                <h3>Vertex {selectedVertex.id}</h3>
                <div class="vertex-stats-grid">
                    <div class="vertex-stat">
                        <span class="vertex-stat-label">Paths including vertex</span>
                        <span class="vertex-stat-value tabular">{vertexStats.pathsIncluding} ({vertexStats.percentOfPaths}%)</span>
                    </div>
                    <div class="vertex-stat">
                        <span class="vertex-stat-label">As start node</span>
                        <span class="vertex-stat-value tabular">{vertexStats.asStart}</span>
                    </div>
                    <div class="vertex-stat">
                        <span class="vertex-stat-label">As end node</span>
                        <span class="vertex-stat-value tabular">{vertexStats.asEnd}</span>
                    </div>
                    <div class="vertex-stat">
                        <span class="vertex-stat-label">As intermediate node</span>
                        <span class="vertex-stat-value tabular">{vertexStats.asIntermediate}</span>
                    </div>
                </div>
            </div>
            {/if}

            <div class="charts-container">
                <!-- Histogram container -->
                <div class="chart-card">
                    <h3>Path Length Distribution</h3>
                    <div class="chart-slot" bind:clientWidth={histSlotWidth}>
                        <Histogram 
                            {paths} 
                            uniquePathLengths={uniquePathLengths}
                            width={histWidth}
                            height={chartBoxHeight} 
                            marginLeft={54}
                            marginTop={24}
                            marginRight={20} 
                            marginBottom={52} 
                        />
                    </div>
                </div>
                
                <!-- Scatter plot container -->
                <div class="chart-card">
                    <h3>Path Length vs Average Degree</h3>
                    <div class="chart-slot" bind:clientWidth={scatterSlotWidth}>
                        <ScatterPlot 
                            paths={paths}
                            width={scatterWidth}
                            height={chartBoxHeight} 
                            marginLeft={54}
                            marginTop={24}
                            marginRight={20} 
                            marginBottom={52}
                            highlightedPath={hoveredPath}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .path-stats-container {
        height: 100%;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    .path-stats-header {
        margin-bottom: 0.75em;
        padding: 0 0.25em 0.5em;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 0.6em;
        flex: 0 0 auto;
        border-bottom: 1px solid var(--border);
    }

    .path-stats-header h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        text-align: left;
        color: var(--text-1);
    }

    /* The path type is metadata about the view, not part of its name */
    .chip {
        font-size: 0.6875rem;
        font-weight: 550;
        color: var(--text-2);
        background-color: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.15em 0.55em;
    }

    .path-stats-wrapper {
        flex: 1;
        display: flex;
        width: 100%;
        overflow: hidden;
        position: relative;
    }

    /* A hairline ring reads cleaner than the old double inset shadow, and it
       survives the switch to a dark surface */
    .path-stats-content {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: auto;
        padding: 1em;
        box-sizing: border-box;
    }

    .stats-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: 0.6em;
        margin-bottom: 1.25em;
        flex: 0 0 auto;
    }

    .stat-card {
        background-color: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 0.7em 0.8em;
    }

    .stat-title {
        font-size: 0.75rem;
        color: var(--text-3);
        margin-bottom: 0.35em;
    }

    /* Ink, not accent: the accent is reserved for data and selection. Proportional
       figures -- tabular-nums makes a display-size number look loose. */
    .stat-value {
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--text-1);
        line-height: 1.1;
    }

    .selected-vertex-stats {
        background-color: var(--accent-wash);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 0.85em 1em;
        margin-bottom: 1.25em;
        flex: 0 0 auto;
    }

    .selected-vertex-stats h3 {
        margin: 0 0 0.7em;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-1);
    }

    .vertex-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 0.4em 1.5em;
    }

    .vertex-stat {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        font-size: 0.8125rem;
    }

    .vertex-stat-label {
        color: var(--text-2);
    }

    .vertex-stat-value {
        font-weight: 600;
        color: var(--text-1);
    }
    
    /* Grid rather than flex-wrap with hard 50% caps: the cards reflow to one
       column on their own when the panel gets narrow */
    .charts-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 0.75em;
        width: 100%;
        flex: 0 0 auto;
    }

    .chart-card {
        background-color: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 0.85em;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .chart-card h3 {
        margin: 0 0 0.85em;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-1);
        flex: 0 0 auto;
    }

    /* The measured box the chart renders into */
    .chart-slot {
        width: 100%;
        min-width: 0;
    }
</style>
