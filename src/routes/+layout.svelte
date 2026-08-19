<script>
    import NavBar from '$lib/components/NavBar.svelte';
    import './style.css';

    let { children } = $props();
</script>

<div class="container">
    <header class="header">
        <NavBar />
    </header>
    <main class="main">
        {@render children?.()}
    </main>
</div>

<style>
    .container {
        font-size: 16px;
        /* 100% rather than 100vw: vw includes the scrollbar gutter and was
           forcing a horizontal scrollbar whenever a panel overflowed */
        height: 100%;
        width: 100%;
        padding: 0.75em 1em 1em;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
    }

    .header {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
    }

    .main {
        /* take the rest of the container, and be allowed to shrink */
        flex: 1;
        min-height: 0;
        display: flex;
        gap: 0.75em;
    }
</style>
