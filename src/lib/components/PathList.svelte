<!-- PathList.svelte -->
<script>
    import OptionSelector from '$lib/components/OptionSelector.svelte';
    import SortSelector from '$lib/components/SortSelector.svelte';
	import { parsePaths } from '$lib/utils/pathUtils.js';
    import * as d3 from 'd3';
    
    // Define props with default values
    let { 
        paths = [], 
        onhover = () => {},
        currentPathType = 'train',
        onPathTypeChange = () => {} 
    } = $props();
    
    // Path options for the selector
    const pathTypeOptions = [
        { value: 'train', label: 'train' },
        { value: 'test', label: 'test' },
        { value: 'predicted', label: 'predicted' }
    ];
    
    // Make sure this function is correctly passing the type up to the parent
    function handlePathTypeChange(type) {
        onPathTypeChange(type);
    }

    // Sorting logic
    let selectedSorts = $state([]);
    
    // Define sort options based on path type using derived
    let sortOptions = $derived(
        currentPathType === 'predicted' 
        ? [
            { value: 'length+', label: 'Length ⬆︎' },
            { value: 'length-', label: 'Length ⬇︎' },
            { value: 's+', label: 'Start ⬆︎' },
            { value: 's-', label: 'Start ⬇︎' },
            { value: 't+', label: 'End ⬆︎' },
            { value: 't-', label: 'End ⬇︎' },
            { value: 'correct', label: 'Correct' },
            { value: 'incorrect', label: 'Incorrect' }
        ] 
        : [
            { value: 'length+', label: 'Length ⬆︎' },
            { value: 'length-', label: 'Length ⬇︎' },
            { value: 's+', label: 'Start ⬆︎' },
            { value: 's-', label: 'Start ⬇︎' },
            { value: 't+', label: 'End ⬆︎' },
            { value: 't-', label: 'End ⬇︎' }
        ]
    );
    
    // Apply D3 sorting to paths
    let sortedPaths = $derived(sortPathsWithD3(paths, selectedSorts));
    
    function sortPathsWithD3(pathsToSort, sortCriteria) {
        // Return original if no sort criteria
        if (!sortCriteria || sortCriteria.length === 0) {
            return pathsToSort;
        }
        
        // Create a new array to avoid mutating the original
        let sorted = [...pathsToSort];
        
        // D3 multi-level sorting
        sorted = d3.sort(sorted, (a, b) => {
            // Apply each sort criteria in sequence
            for (const sort of sortCriteria) {
                let accessor;
                let order = 1; // Default ascending
                
                switch (sort) {
                    case 'length+':
                        accessor = d => d.length;
                        break;
                    case 'length-':
                        accessor = d => d.length;
                        order = -1;
                        break;
                    case 's+':
                        accessor = d => d.start;
                        break;
                    case 's-':
                        accessor = d => d.start;
                        order = -1;
                        break;
                    case 't+':
                        accessor = d => d.end;
                        break;
                    case 't-':
                        accessor = d => d.end;
                        order = -1;
                        break;
                    case 'correct':
                        accessor = d => d.correct ? 1 : 0;
                        order = -1; // Put correct at top
                        break;
                    case 'incorrect':
                        accessor = d => d.correct ? 1 : 0;
                        // Default ascending puts incorrect at top
                        break;
                }
                
                // Apply this level of sorting
                const comparison = d3.ascending(accessor(a), accessor(b)) * order;
                
                // If this comparison yields a difference, return it
                if (comparison !== 0) return comparison;
            }
            
            // If all criteria are equal, maintain original order
            return 0;
        });
        
        return sorted;
    }
    
    // Handle sort changes
    function handleSortChange(newSorts) {
        selectedSorts = newSorts;
    }
</script>

<div class="path-list-container">
    <div class="path-list-header">
        <div class="header-title">
            <h2>Paths</h2>
            <span class="chip">{currentPathType}</span>
            <span class="count tabular">{paths.length.toLocaleString()}</span>
        </div>
        
        <div class="control-buttons">
            <div class="sort-selector">
                <SortSelector
                    sortOptions={sortOptions}
                    selectedSorts={selectedSorts}
                    onSortChange={handleSortChange}
                    label="Sort"
                />
            </div>
            
            <div class="path-selector">
                <OptionSelector 
                    options={pathTypeOptions}
                    activeOption={currentPathType}
                    onSelect={handlePathTypeChange}
                    label="View"
                />
            </div>
        </div>
    </div>
    
    <div class="path-list-wrapper">
        <div class="path-list-content">
            <ul>
                {#each sortedPaths as pathObj}
                    <li>
                        <button 
                            class="path-list-item"
                            class:incorrect={pathObj.correct === false}
                            onmouseover={() => onhover(pathObj.path)}
                            onfocus={() => onhover(pathObj.path)}
                            onmouseout={() => onhover(null)}
                            onblur={() => onhover(null)}
                        >
                            <span class="path-list-text tabular">{pathObj.path.join(' ')}</span>
                            {#if currentPathType === 'predicted' && pathObj.correct === false}
                                <span class="error-tag">{pathObj.errorType || 'error'}</span>
                            {/if}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
</div>

<style>
    .path-list-container {
        height: 100%;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    
    /* Wraps to a second row rather than clipping the Sort/View buttons when the
       column is narrow */
    .path-list-header {
        margin-bottom: 0.75em;
        padding: 0 0.25em 0.5em;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.5em 0.75em;
        flex: 0 0 auto;
        border-bottom: 1px solid var(--border);
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 0.5em;
        min-width: 0;
    }
    
    .path-list-header h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: -0.01em;
        color: var(--text-1);
        white-space: nowrap;
    }

    .chip {
        font-size: 0.6875rem;
        font-weight: 550;
        color: var(--text-2);
        background-color: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.15em 0.55em;
    }

    .count {
        font-size: 0.75rem;
        color: var(--text-3);
    }
    
    .control-buttons {
        display: flex;
        gap: 0.4em;
        flex: 0 0 auto;
    }
    
    .path-list-wrapper {
        flex: 1;
        display: flex;
        width: 100%;
        overflow: hidden;
        position: relative;
    }
    
    .path-list-content {
        flex: 1;
        width: 100%;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: auto;
    }
    
    ul {
        padding: 0.5em;
        margin: 0;
        list-style-type: none;
    }

    li {
        list-style: none;
    }
    
    .path-list-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5em;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        /* space kept for the incorrect marker so hovering doesn't shift the row */
        border-left: 2px solid transparent;
        padding: 0.4em 0.6em;
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--text-2);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background-color var(--speed) ease, color var(--speed) ease;
    }
    
    .path-list-item:hover,
    .path-list-item:focus-visible {
        background-color: var(--surface-3);
        color: var(--text-1);
    }
    
    .path-list-item.incorrect {
        border-left-color: var(--status-critical);
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }
    
    .path-list-text {
        flex: 1;
        min-width: 0;
        line-height: 1.45;
        word-break: break-word;
    }
    
    /* A status colour always ships with its label */
    .error-tag {
        flex: 0 0 auto;
        font-size: 0.6875rem;
        font-weight: 550;
        background-color: var(--status-critical);
        color: var(--status-critical-ink);
        padding: 0.1em 0.4em;
        border-radius: 4px;
    }
</style>
