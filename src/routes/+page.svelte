<!-- src/routes/statistics-page/+page.svelte -->
<script>
    import './style.css';
    import GraphView from '$lib/components/GraphView.svelte';
    import MatrixView from '$lib/components/MatrixView.svelte';
    import PathList from '$lib/components/PathList.svelte';
    
    let { data } = $props();
    
    let graphmlData = data.graphmlData;
    
    // Make path variables reactive with $state
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
    
    function handlePathHover(path) {
        hoveredPath = path;
    }

    // Handle path type changes
    function handlePathTypeChange(type) {
        currentPathType = type;
    }
</script>

<div class="main-container">
    <div class="graph-view">
        <GraphView {graphmlData} highlightedPath={hoveredPath} />
    </div>
    <div class="path-list">
        <PathList 
            paths={displayPaths} 
            onhover={handlePathHover}
            currentPathType={currentPathType}
            onPathTypeChange={handlePathTypeChange}
        />
    </div>
</div>

<style>
    .main-container {
        display: grid;
        grid-template-columns: minmax(300px, 70fr) minmax(250px, 30fr);
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
    
    .graph-view {
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
            grid-template-rows: minmax(300px, 1fr) 300px;
        }
        
        .graph-view,
        .path-list {
            width: 100%;
            max-width: 100%;
            height: 100%;
        }
    }
</style>