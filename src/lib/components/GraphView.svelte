<!-- GraphView.svelte -->
<script>
	import CytoscapeGraph from '$lib/components/CytoscapeGraph.svelte';
	import OptionSelector from '$lib/components/OptionSelector.svelte';
	
	let { graphmlData, highlightedPath = null } = $props();
    
	// Layout options
	const layouts = {
		cose: { 
			name: 'cose',
			idealEdgeLength: 100,
			nodeOverlap: 200,
			refresh: 20,
			fit: true,
			padding: 200,
			randomize: false,
			componentSpacing: 100,
			nodeRepulsion: 400000,
			edgeElasticity: 500,
			nestingFactor: 5,
			gravity: 80,
			numIter: 1000,
			initialTemp: 200,
			coolingFactor: 0.95,
			minTemp: 1.0
		},
		customDAGView: {
			name: 'customDAGView',
			fit: true,
			padding: 100,
			animate: true
		},
		concentric: {
			name: 'concentric',
			concentric: function(node) {
				return 10 - node.indegree();
			},
			levelWidth: function(nodes) {
				return 2;
			},
			minNodeSpacing: 100,
			animate: true,
			padding: 100,
			fit: true,
			spacingFactor: 1.2
		}
	};
	
	// Current layout
	let currentLayout = $state(layouts.cose);
	

    // Layout selection options for OptionSelector
    const layoutOptions = [
        { value: 'cose', label: 'Force' },
		{ value: 'concentric', label: 'Concentric' },
        { value: 'customDAGView', label: 'Custom DAG' }
    ];
	
	// Handle layout change
	function changeLayout(layoutName) {
		currentLayout = layouts[layoutName];
	}
	
	// Track container dimensions
	let containerWidth = $state(0);
	let containerHeight = $state(0);
</script>

<div class="graph-view-container" bind:clientWidth={containerWidth} bind:clientHeight={containerHeight}>
    <div class="graph-view-header">
		<div class="header-title">
			<h2>Graph View</h2>
			<span class="chip">
				{layoutOptions.find(option => option.value === currentLayout.name)?.label || currentLayout.name}
			</span>
		</div>
		<!-- Option select component for layout options -->
		<div class="graph-view-selector">
			<OptionSelector 
				options={layoutOptions} 
				activeOption={currentLayout.name} 
				onSelect={changeLayout} 
				label="Layout"
			/>
		</div>
	</div>
	
	<div class="cytoscape-wrapper">
		<CytoscapeGraph {graphmlData} layout={currentLayout} {highlightedPath} />
	</div>
</div>

<style>
	.graph-view-container {
		height: 100%;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
	}
    
    .graph-view-header {
        margin-bottom: 0.75em;
        padding: 0 0.25em 0.5em;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75em;
        flex: 0 0 auto;
        border-bottom: 1px solid var(--border);
    }

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}
    
	.graph-view-header h2 {
        margin: 0;
        text-align: left;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--text-1);
		white-space: nowrap;
	}

	/* Which layout is showing is metadata about the view, not its name */
	.chip {
		font-size: 0.6875rem;
		font-weight: 550;
		color: var(--text-2);
		background-color: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.15em 0.55em;
		white-space: nowrap;
	}
    
    .graph-view-selector {
        flex: 0 0 auto;
    }
    
    .cytoscape-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 0;
        overflow: hidden;
        position: relative;
    }
</style>
