<!-- OptionSelector.svelte -->
<script>
    // Props
    let { 
        options = [], 
        activeOption = null, 
        onSelect = () => {},
        label = "Options" 
    } = $props();
    
    // State
    let showMenu = $state(false);
    
    // Toggle menu visibility
    function toggleMenu() {
        showMenu = !showMenu;
    }
    
    // Handle option selection
    function handleSelect(option) {
        onSelect(option);
        showMenu = false;
    }
    
    // Close menu when clicking outside
    function handleClickOutside(event) {
        if (showMenu && 
            !event.target.closest('.option-button') && 
            !event.target.closest('.option-menu')) {
            showMenu = false;
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') showMenu = false;
    }

    // Show the current choice on the trigger so the state is readable without
    // opening the menu
    const activeLabel = $derived(
        options.find(o => o.value === activeOption)?.label ?? null
    );
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="option-select-container">
    <button
        class="option-button"
        onclick={toggleMenu}
        aria-label={label}
        aria-expanded={showMenu}
        aria-haspopup="menu"
    >
        <span class="button-text">{label}</span>
        {#if activeLabel}
            <span class="button-value">{activeLabel}</span>
        {/if}
        <svg class="chevron" class:open={showMenu} viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
    </button>
    
    {#if showMenu}
    <div class="option-menu" role="menu">
        {#each options as option}
            <button 
                role="menuitemradio"
                aria-checked={activeOption === option.value}
                class:active={activeOption === option.value} 
                onclick={() => handleSelect(option.value)}
            >
                {option.label}
            </button>
        {/each}
    </div>
    {/if}
</div>

<style>
    .option-select-container {
        position: relative;
    }
    
    /* A hairline ghost button rather than a filled pill: the accent stays
       reserved for data and for the active nav state */
    .option-button {
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

    .button-value {
        font-size: 0.75rem;
        color: var(--text-3);
    }
    
    .option-button:hover {
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
    
    .option-menu {
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
    
    .option-menu button {
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
    }
    
    .option-menu button:hover {
        background-color: var(--surface-3);
        color: var(--text-1);
    }
    
    .option-menu button.active {
        background-color: var(--accent-wash);
        color: var(--accent);
        font-weight: 550;
    }
</style>
