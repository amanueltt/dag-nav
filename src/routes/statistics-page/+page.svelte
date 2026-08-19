<!-- statistics-page/+page.svelte -->
<script>
    import PathList from '$lib/components/PathList.svelte';
    import VertexList from '$lib/components/VertexList.svelte';
    import PathStats from '$lib/components/PathStats.svelte';
    
    let { data } = $props();
        
    let graphmlData = data.graphmlData;
    
    // Max paths to display
    const maxPaths = 10000;
    let trainPaths = $state(data.trainPaths?.slice(0, maxPaths) || []);
    let testPaths = $state(data.testPaths?.slice(0, maxPaths) || []);
    let predictedPaths = $state(data.predictedPaths?.slice(0, maxPaths) || []);
    
    // Track current path type
    let currentPathType = $state('train');
    
    // Compute displayPaths based on currentPathType
    let displayPaths = $derived(
        currentPathType === 'train' ? trainPaths :
        currentPathType === 'test' ? testPaths :
        currentPathType === 'predicted' ? predictedPaths : 
        []
    );
 
    let hoveredPath = $state(null);
    let selectedVertex = $state(null);
    
    // Container dimensions for responsive layout
    let statsWidth = $state(0);
    let statsHeight = $state(0);
    
    function handlePathHover(path) {
        hoveredPath = path;
    }

    function handleVertexSelect(vertex) {
        selectedVertex = vertex;
    }

    // Handle path type changes
    function handlePathTypeChange(type) {
        currentPathType = type;
    }
    
</script>

<div class="main-container">
    <div class="vertex-list">
        <VertexList 
            paths={displayPaths}
            onSelect={handleVertexSelect}
        />
    </div>
    <div class="path-stats" bind:clientWidth={statsWidth} bind:clientHeight={statsHeight}>
        <PathStats 
            graphmlData={graphmlData}
            trainPaths={trainPaths}
            testPaths={testPaths}
            predictedPaths={predictedPaths}
            {currentPathType}
            selectedVertex={selectedVertex}
            width={statsWidth}
            height={statsHeight}
            hoveredPath={hoveredPath}
        />
    </div>
    <div class="path-list">
        <PathList 
            paths={displayPaths} 
            onhover={handlePathHover}
            {currentPathType}
            onPathTypeChange={handlePathTypeChange}
        />
    </div>
</div>


<style>
    /* Grid rather than fixed flex bases: with `flex: 0 0 10/70/20%` the three
       columns summed to 100% and could not shrink, so the column gap overflowed
       the container and clipped the vertex list. Grid subtracts the gaps from
       the tracks for us. */
    .main-container {
        display: grid;
        grid-template-columns:
            minmax(150px, 10fr)
            minmax(0, 70fr)
            minmax(200px, 20fr);
        /* the row must be bounded by the container, not by its content */
        grid-template-rows: minmax(0, 1fr);
        gap: 0.75em;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }
    
    .vertex-list {
        min-width: 0;
        min-height: 0;
        height: 100%;
        box-sizing: border-box;
    }
    
    .path-stats {
        min-width: 0;
        min-height: 0;
        height: 100%;
        box-sizing: border-box;
    }
    
    .path-list {
        min-width: 0;
        min-height: 0;
        height: 100%;
        box-sizing: border-box;
    }
    
    /* Responsive layout for smaller screens */
    @media (max-width: 768px) {
        .main-container {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: 200px minmax(400px, 1fr) 300px;
            overflow: auto;
        }
        
        .vertex-list,
        .path-stats,
        .path-list {
            width: 100%;
            max-width: 100%;
            height: 100%;
        }
    }
</style>