<!-- SortSelector.svelte -->
<script>
    // Props
    let { 
        sortOptions = [], 
        selectedSorts = [], 
        onSortChange = () => {},
        label = "Sort" 
    } = $props();
    
    // State
    let showMenu = $state(false);
    
    // Toggle menu visibility
    function toggleMenu() {
        showMenu = !showMenu;
    }
    
    // Handle sort selection/deselection
    function toggleSort(sortValue) {
        let newSorts;
        
        if (selectedSorts.includes(sortValue)) {
            // Remove the sort if already selected
            newSorts = selectedSorts.filter(s => s !== sortValue);
        } else {
            // Add the sort if not selected
            newSorts = [...selectedSorts, sortValue];
        }
        
        onSortChange(newSorts);
    }
    
    // Close menu when clicking outside
    function handleClickOutside(event) {
        if (showMenu && 
            !event.target.closest('.sort-button') && 
            !event.target.closest('.sort-menu')) {
            showMenu = false;
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') showMenu = false;
    }
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="sort-select-container">
    <button
        class="sort-button"
        onclick={toggleMenu}
        aria-label={label}
        aria-expanded={showMenu}
        aria-haspopup="menu"
    >
        <span class="button-text">{label}</span>
        {#if selectedSorts.length > 0}
            <span class="button-count tabular">{selectedSorts.length}</span>
        {/if}
        <svg class="chevron" class:open={showMenu} viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
    </button>
    
    {#if showMenu}
    <div class="sort-menu" role="menu">
        {#each sortOptions as option}
            <button 
                class="sort-option"
                role="menuitemcheckbox"
                aria-checked={selectedSorts.includes(option.value)}
                class:active={selectedSorts.includes(option.value)} 
                onclick={() => toggleSort(option.value)}
            >
                <span>{option.label}</span>
                {#if selectedSorts.includes(option.value)}
                    <span class="checkmark" aria-hidden="true">✓</span>
                {/if}
            </button>
        {/each}
    </div>
    {/if}
</div>

<style>
    .sort-select-container {
        position: relative;
    }
    
    .sort-button {
        height: 30px;
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        padding: 0 0.6em;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background-color: var(--surface-2);
        color: var(--text-2);
        font-family: inherit;
        cursor: pointer;
        transition: background-color var(--speed) ease, border-color var(--speed) ease,
            color var(--speed) ease;
    }
    
    .button-text {
        font-size: 0.75rem;
        font-weight: 550;
    }

    /* How many sorts are stacked, without opening the menu */
    .button-count {
        min-width: 15px;
        padding: 0 3px;
        border-radius: 999px;
        background-color: var(--accent-wash);
        color: var(--accent);
        font-size: 0.6875rem;
        font-weight: 600;
        text-align: center;
    }
    
    .sort-button:hover {
        background-color: var(--surface-3);
        border-color: var(--border-strong);
        color: var(--text-1);
    }

    .chevron {
        width: 10px;
        height: 10px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform var(--speed) ease;
    }

    .chevron.open {
        transform: rotate(180deg);
    }
    
    .sort-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background-color: var(--surface-1);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-menu);
        padding: 4px;
        display: flex;
        flex-direction: column;
        min-width: 150px;
        z-index: 100;
    }
    
    .sort-option {
        background-color: transparent;
        border: none;
        padding: 0.5em 0.7em;
        text-align: left;
        border-radius: var(--radius-sm);
        font-family: inherit;
        font-size: 0.8125rem;
        color: var(--text-2);
        cursor: pointer;
        transition: background-color var(--speed) ease, color var(--speed) ease;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75em;
    }
    
    .sort-option:hover {
        background-color: var(--surface-3);
        color: var(--text-1);
    }
    
    .sort-option.active {
        background-color: var(--accent-wash);
        color: var(--accent);
        font-weight: 550;
    }
</style>
