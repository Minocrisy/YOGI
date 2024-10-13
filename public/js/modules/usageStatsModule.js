export function initUsageStatsModule() {
    const usageStats = document.getElementById('usage-stats');

    async function loadUsageStats() {
        try {
            const response = await fetch('/api/usage');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stats = await response.json();
            usageStats.innerHTML = `
                <p>Total API Calls: ${stats.totalCalls}</p>
                <p>Total Cost: $${stats.totalCost.toFixed(2)}</p>
                <h4>Usage by Model:</h4>
                <ul>
                    ${Object.entries(stats.byModel).map(([model, calls]) => `
                        <li>${model}: ${calls} calls</li>
                    `).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error loading usage stats:', error);
            usageStats.innerHTML = '<p>Error loading usage stats. Please try refreshing the page.</p>';
        }
    }

    return { loadUsageStats };
}
