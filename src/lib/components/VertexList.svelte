<!-- VertexList.svelte -->
<script>
    import * as d3 from 'd3';
    
    // Props with default values
    let { 
        paths = [], 
        onSelect = () => {} 
    } = $props();
    
    // Extract unique vertices from paths and count occurrences
    let vertexStats = $derived(computeVertexStats(paths));
    
    // Selected vertex for highlighting
    let selectedVertexId = $state(null);
    
    function computeVertexStats(pathsData) {
        // Object to store vertex statistics
        const stats = {};
        
        // Process each path
        pathsData.forEach(pathObj => {
            // For each vertex in the path
            pathObj.path.forEach(vertex => {
                // Convert to string to use as key
                const vertexId = vertex.toString();
                
                // Initialize if first occurrence
                if (!stats[vertexId]) {
                    stats[vertexId] = {
                        id: vertexId,
                        count: 0,
                        asStart: 0,
                        asEnd: 0,
                        asIntermediate: 0
                    };
                }
                
                // Increment total count
                stats[vertexId].count++;
                
                // Check if start vertex
                if (vertex === pathObj.path[0]) {
                    stats[vertexId].asStart++;
                }
                
                // Check if end vertex
                if (vertex === pathObj.path[pathObj.path.length - 1]) {
                    stats[vertexId].asEnd++;
                }
                
                // Check if intermediate vertex (not start or end)
                if (vertex !== pathObj.path[0] && vertex !== pathObj.path[pathObj.path.length - 1]) {
                    stats[vertexId].asIntermediate++;
                }
            });
        });
        
        // Convert to array and sort by vertex ID numerically
        return Object.values(stats).sort((a, b) => parseInt(a.id) - parseInt(b.id));
    }
    
    // Handle vertex selection
    function handleVertexClick(vertex) {
        // Toggle selection
        if (selectedVertexId === vertex.id) {
            selectedVertexId = null;
            onSelect(null);
        } else {
            selectedVertexId = vertex.id;
            onSelect(vertex);
        }
    }
</script>

<div class="vertex-list-container">
    <div class="vertex-list-header">
        <h2>Vertices</h2>
        <span class="count tabular">{vertexStats.length}</span>
    </div>
    
    <div class="vertex-list-wrapper">
        <div class="vertex-list-content">
            <div class="vertex-list-legend">
                <div class="vertex-id">ID</div>
                <div class="vertex-count">Count</div>
            </div>
            
            <ul>
                {#each vertexStats as vertex}
                    <li>
                        <button 
                            class="vertex-list-item"
                            class:selected={selectedVertexId === vertex.id}
                            aria-pressed={selectedVertexId === vertex.id}
                            onclick={() => handleVertexClick(vertex)}
                        >
                            <div class="vertex-id tabular">{vertex.id}</div>
                            <div class="vertex-count tabular">{vertex.count}</div>
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>

<style>
    .vertex-list-container {
        height: 100%;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    
    .vertex-list-header {
        margin-bottom: 0.75em;
        padding: 0 0.25em 0.5em;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 0.5em;
        flex: 0 0 auto;
        border-bottom: 1px solid var(--border);
    }
    
    .vertex-list-header h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--text-1);
    }

    .count {
        font-size: 0.75rem;
        color: var(--text-3);
    }
    
    .vertex-list-wrapper {
        flex: 1;
        display: flex;
        width: 100%;
        overflow: hidden;
        position: relative;
    }
    
    .vertex-list-content {
        flex: 1;
        width: 100%;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: auto;
    }
    
    .vertex-list-legend {
        display: flex;
        justify-content: space-between;
        padding: 0.5em 0.85em;
        background-color: var(--surface-1);
        border-bottom: 1px solid var(--border);
        font-size: 0.6875rem;
        font-weight: 550;
        color: var(--text-3);
        position: sticky;
        top: 0;
        z-index: 1;
    }
    
    ul {
        padding: 0.4em;
        margin: 0;
        list-style-type: none;
    }

    li {
        list-style: none;
    }
    
    .vertex-list-item {
        display: flex;
        justify-content: space-between;
        gap: 0.5em;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 0.35em 0.5em;
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--text-2);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background-color var(--speed) ease, color var(--speed) ease;
    }
    
    .vertex-list-item:hover {
        background-color: var(--surface-3);
        color: var(--text-1);
    }
    
    .vertex-list-item.selected {
        background-color: var(--accent-wash);
        color: var(--accent);
        font-weight: 600;
    }
    
    .vertex-id {
        flex: 1;
    }
    
    .vertex-count {
        flex: 1;
        text-align: right;
    }
</style>
