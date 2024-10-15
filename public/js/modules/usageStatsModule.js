let usageStats = { totalCalls: 0, totalCost: 0, byModel: {} };
const eventTarget = new EventTarget();

export function initUsageStatsModule() {
    const usageStatsElement = document.getElementById('usage-stats');

    async function loadUsageStats() {
        try {
            const response = await fetch('/api/usage-stats');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            usageStats = await response.json();
            updateUsageStatsDisplay();
            eventTarget.dispatchEvent(new Event('usageStatsUpdated'));
        } catch (error) {
            console.error('Error loading usage stats:', error);
            usageStatsElement.innerHTML = '<p>Error loading usage stats. Please try refreshing the page.</p>';
        }
    }

    function updateUsageStatsDisplay() {
        usageStatsElement.innerHTML = `
            <p>Total API Calls: ${usageStats.totalCalls}</p>
            <p>Total Cost: $${usageStats.totalCost.toFixed(2)}</p>
            <h4>Usage by Model:</h4>
            <ul>
                ${Object.entries(usageStats.byModel).map(([model, calls]) => `
                    <li>${model}: ${calls} calls</li>
                `).join('')}
            </ul>
        `;
    }

    return {
        loadUsageStats,
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget)
    };
}
