export function initNotionModule() {
    const syncNotionBtn = document.getElementById('sync-notion');
    const notionStatus = document.getElementById('notion-status');

    syncNotionBtn.addEventListener('click', syncNotion);

    async function syncNotion() {
        try {
            syncNotionBtn.disabled = true;
            syncNotionBtn.innerHTML = 'Syncing... <span class="loading"></span>';
            const response = await fetch('/api/sync-notion', { method: 'POST' });
            const data = await response.json();
            notionStatus.textContent = data.message;
        } catch (error) {
            console.error('Error:', error);
            notionStatus.textContent = 'Error syncing with Notion.';
        } finally {
            syncNotionBtn.disabled = false;
            syncNotionBtn.textContent = 'Sync with Notion';
        }
    }

    return { syncNotion };
}
