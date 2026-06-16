// Application State
let state = {
    releases: [],
    filteredReleases: [],
    currentFilter: 'all',
    searchQuery: '',
    isLoading: false,
    theme: 'dark'
};

// DOM Elements
const DOM = {
    releasesGrid: document.getElementById('releases-grid'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    filterTags: document.querySelectorAll('.filter-tag'),
    
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    retryBtn: document.getElementById('retry-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    
    feedStatus: document.getElementById('feed-status'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    
    // Stats
    statTotal: document.getElementById('stat-total'),
    statFeatures: document.getElementById('stat-features'),
    statChanges: document.getElementById('stat-changes'),
    statBreaking: document.getElementById('stat-breaking'),
    statIssues: document.getElementById('stat-issues'),
    statCards: document.querySelectorAll('.stat-card')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchReleases();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        state.theme = savedTheme;
    } else {
        state.theme = systemPrefersDark ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeToggleUI();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeToggleUI();
}

function updateThemeToggleUI() {
    // Lucide icons will be updated automatically, but we can log or trigger visual changes if needed
    // The CSS uses the sun/moon selectors to toggle visibility of paths
}

// Event Listeners Setup
function setupEventListeners() {
    // Search
    DOM.searchInput.addEventListener('input', handleSearch);
    DOM.clearSearchBtn.addEventListener('click', clearSearch);
    
    // Filters
    DOM.filterTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            const filterValue = e.target.getAttribute('data-filter');
            setFilter(filterValue);
        });
    });
    
    // Stat Cards (clickable filters)
    DOM.statCards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.getAttribute('data-type');
            let filterValue = 'all';
            
            if (type === 'feature') filterValue = 'Feature';
            else if (type === 'change') filterValue = 'Change';
            else if (type === 'breaking') filterValue = 'Breaking';
            else if (type === 'issue') filterValue = 'Issue';
            
            setFilter(filterValue);
            
            // Scroll to control panel smoothly
            document.querySelector('.control-panel').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Refresh & Retry
    DOM.refreshBtn.addEventListener('click', () => fetchReleases(true));
    DOM.retryBtn.addEventListener('click', () => fetchReleases(true));
    
    // Theme Toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Export CSV
    if (DOM.exportCsvBtn) {
        DOM.exportCsvBtn.addEventListener('click', exportToCsv);
    }

    // Releases grid click delegation (for Tweet & Copy buttons)
    DOM.releasesGrid.addEventListener('click', (e) => {
        const tweetBtn = e.target.closest('.btn-tweet');
        if (tweetBtn) {
            const card = tweetBtn.closest('.release-card');
            const id = card.getAttribute('data-id');
            const item = state.releases.find(r => r.id === id);
            if (item) {
                tweetRelease(item.date, item.type, item.content, item.link);
            }
        }

        const copyBtn = e.target.closest('.btn-copy');
        if (copyBtn) {
            const card = copyBtn.closest('.release-card');
            const id = card.getAttribute('data-id');
            const item = state.releases.find(r => r.id === id);
            if (item) {
                copyRelease(item.date, item.type, item.content, copyBtn);
            }
        }
    });
}

// Handle Search Input
function handleSearch(e) {
    state.searchQuery = e.target.value.toLowerCase().trim();
    
    if (state.searchQuery.length > 0) {
        DOM.clearSearchBtn.style.display = 'flex';
    } else {
        DOM.clearSearchBtn.style.display = 'none';
    }
    
    applyFilterAndSearch();
}

// Clear Search Box
function clearSearch() {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.clearSearchBtn.style.display = 'none';
    applyFilterAndSearch();
    DOM.searchInput.focus();
}

// Set Active Filter Tag
function setFilter(filterValue) {
    state.currentFilter = filterValue;
    
    DOM.filterTags.forEach(tag => {
        const tagFilter = tag.getAttribute('data-filter');
        if (tagFilter === filterValue) {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });
    
    applyFilterAndSearch();
}

// Fetch Release Notes from backend API
async function fetchReleases(forceRefresh = false) {
    if (state.isLoading) return;
    
    state.isLoading = true;
    showState('loading');
    
    // Start spin animation on refresh button
    DOM.refreshIcon.classList.add('spinning');
    DOM.refreshBtn.disabled = true;
    
    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        state.releases = data.items || [];
        updateStatusIndicator(data.source, data.error);
        updateLastUpdated(data.last_updated);
        updateStats();
        applyFilterAndSearch();
        
    } catch (error) {
        console.error('Error fetching release notes:', error);
        DOM.errorMessage.textContent = error.message || 'Could not connect to the release feed. Please check your network connection.';
        showState('error');
        updateStatusIndicator('error', error.message);
    } finally {
        state.isLoading = false;
        DOM.refreshIcon.classList.remove('spinning');
        DOM.refreshBtn.disabled = false;
    }
}

// Apply current Filters and Search Query to Releases
function applyFilterAndSearch() {
    let filtered = [...state.releases];
    
    // Apply Type Filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(item => item.type === state.currentFilter);
    }
    
    // Apply Search Query
    if (state.searchQuery) {
        filtered = filtered.filter(item => {
            const dateMatch = item.date.toLowerCase().includes(state.searchQuery);
            const typeMatch = item.type.toLowerCase().includes(state.searchQuery);
            const contentMatch = item.content.toLowerCase().includes(state.searchQuery);
            return dateMatch || typeMatch || contentMatch;
        });
    }
    
    state.filteredReleases = filtered;
    renderReleases();
}

// Render release notes to grid
function renderReleases() {
    DOM.releasesGrid.innerHTML = '';
    
    if (state.filteredReleases.length === 0) {
        showState('empty');
        return;
    }
    
    showState('grid');
    
    state.filteredReleases.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'release-card';
        card.setAttribute('data-type', item.type);
        card.setAttribute('data-id', item.id);
        card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
        
        // Formulate type-specific icons
        let typeIcon = 'sparkles'; // default
        if (item.type === 'Change') typeIcon = 'refresh-cw';
        else if (item.type === 'Breaking') typeIcon = 'alert-triangle';
        else if (item.type === 'Issue') typeIcon = 'bug';
        else if (item.type === 'Announcement') typeIcon = 'info';
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-meta">
                    <span class="type-tag"><i data-lucide="${typeIcon}" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i>${item.type}</span>
                    <span class="release-date">
                        <i data-lucide="calendar"></i>
                        <span>${item.date}</span>
                    </span>
                </div>
                <div class="card-actions">
                    <button class="btn-copy" title="Copy text to clipboard">
                        <i data-lucide="copy"></i>
                    </button>
                    <button class="btn-tweet" title="Tweet about this">
                        <i data-lucide="twitter"></i>
                    </button>
                    ${item.link ? `
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-link" title="Open in Official Release Notes">
                        <i data-lucide="external-link"></i>
                    </a>
                    ` : ''}
                </div>
            </div>
            <div class="card-body">
                ${item.content}
            </div>
        `;
        
        DOM.releasesGrid.appendChild(card);
    });
    
    // Reinitialize Lucide icons in dynamically created elements
    lucide.createIcons();
}

// Update Stats counter in the top panel
function updateStats() {
    const counts = {
        total: state.releases.length,
        feature: 0,
        change: 0,
        breaking: 0,
        issue: 0
    };
    
    state.releases.forEach(item => {
        const type = item.type.toLowerCase();
        if (type === 'feature') counts.feature++;
        else if (type === 'change') counts.change++;
        else if (type === 'breaking') counts.breaking++;
        else if (type === 'issue') counts.issue++;
    });
    
    DOM.statTotal.textContent = counts.total;
    DOM.statFeatures.textContent = counts.feature;
    DOM.statChanges.textContent = counts.change;
    DOM.statBreaking.textContent = counts.breaking;
    DOM.statIssues.textContent = counts.issue;
}

// Update status badge UI
function updateStatusIndicator(source, error) {
    DOM.feedStatus.className = 'status-indicator';
    const textSpan = DOM.feedStatus.querySelector('.status-text');
    
    if (source === 'live') {
        DOM.feedStatus.classList.add('live');
        textSpan.textContent = 'Live Feed Connected';
    } else if (source === 'cache') {
        DOM.feedStatus.classList.add('cache');
        textSpan.textContent = 'Cached Data (10m)';
    } else if (source === 'stale') {
        DOM.feedStatus.classList.add('stale');
        textSpan.textContent = 'Stale Data (Offline)';
    } else {
        DOM.feedStatus.classList.add('error');
        textSpan.textContent = 'Feed Offline';
    }
}

// Update Last Updated Timestamp in footer
function updateLastUpdated(timestamp) {
    if (!timestamp) {
        DOM.lastUpdatedText.textContent = 'Last updated: Never';
        return;
    }
    
    const date = new Date(timestamp * 1000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = date.toLocaleDateString();
    DOM.lastUpdatedText.textContent = `Last updated: ${dateStr} ${timeStr}`;
}

// Toggle display states for container elements
function showState(activeState) {
    DOM.loadingState.style.display = activeState === 'loading' ? 'flex' : 'none';
    DOM.errorState.style.display = activeState === 'error' ? 'flex' : 'none';
    DOM.emptyState.style.display = activeState === 'empty' ? 'flex' : 'none';
    DOM.releasesGrid.style.display = activeState === 'grid' ? 'grid' : 'none';
}

// Format and construct Twitter sharing intent
function tweetRelease(date, type, contentHtml, link) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    let plainText = tempDiv.textContent || tempDiv.innerText || "";
    
    // Clean up spaces
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    const header = `BigQuery ${type} (${date}): `;
    const hashtags = ` #BigQuery #GoogleCloud`;
    
    // Twitter max length is 280. URLs count as 23 characters.
    const maxTextLength = 280 - header.length - hashtags.length - 24; 
    
    let description = plainText;
    if (description.length > maxTextLength) {
        description = description.slice(0, maxTextLength - 3) + '...';
    }
    
    const tweetText = `${header}${description}${hashtags}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(link)}`;
    
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
}

// Copy release content to clipboard with micro-interaction feedback
async function copyRelease(date, type, contentHtml, copyBtn) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contentHtml;
    let plainText = tempDiv.textContent || tempDiv.innerText || "";
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    const formattedText = `BigQuery Release (${date}) - ${type}:\n${plainText}\nLink: ${copyBtn.closest('.release-card').querySelector('a')?.href || 'N/A'}`;
    
    try {
        await navigator.clipboard.writeText(formattedText);
        
        // Success micro-interaction
        const icon = copyBtn.querySelector('i');
        copyBtn.title = "Copied!";
        copyBtn.classList.add('copied');
        icon.setAttribute('data-lucide', 'check');
        lucide.createIcons();
        
        setTimeout(() => {
            copyBtn.title = "Copy text to clipboard";
            copyBtn.classList.remove('copied');
            icon.setAttribute('data-lucide', 'copy');
            lucide.createIcons();
        }, 1500);
        
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

// Export currently filtered list of releases to CSV format
function exportToCsv() {
    if (state.filteredReleases.length === 0) return;
    
    const headers = ["ID", "Date", "Type", "Link", "Content"];
    
    const rows = state.filteredReleases.map(item => {
        // Strip HTML tags for clean text content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.content;
        let plainText = tempDiv.textContent || tempDiv.innerText || "";
        plainText = plainText.replace(/\s+/g, ' ').replace(/"/g, '""').trim(); // Escape double quotes
        
        const escapedDate = item.date.replace(/"/g, '""');
        const escapedType = item.type.replace(/"/g, '""');
        const escapedLink = item.link.replace(/"/g, '""');
        
        return [
            `"${item.id}"`,
            `"${escapedDate}"`,
            `"${escapedType}"`,
            `"${escapedLink}"`,
            `"${plainText}"`
        ];
    });
    
    // Combine header and rows
    const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');
    
    // Create download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `bigquery_releases_${state.currentFilter}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
