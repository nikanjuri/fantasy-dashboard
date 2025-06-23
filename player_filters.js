// Enhanced player filtering functionality

// Add to DashboardApp class
initializePlayerFilters() {
    this.filteredPlayers = [...this.data.players];
    this.currentFilters = {
        search: '',
        team: '',
        position: '',
        performance: ''
    };
}

handlePlayerSearch(searchTerm) {
    console.log('🔍 Player search:', searchTerm);
    this.currentFilters.search = searchTerm.toLowerCase();
    this.applyFilters();
    this.updateSearchResultsCount();
}

handleTeamFilter(team) {
    console.log('🏏 Team filter:', team);
    this.currentFilters.team = team;
    this.applyFilters();
}

handlePositionFilter(position) {
    console.log('📍 Position filter:', position);
    this.currentFilters.position = position;
    this.applyFilters();
}

handlePerformanceFilter(performance) {
    console.log('🎯 Performance filter:', performance);
    this.currentFilters.performance = performance;
    this.applyFilters();
}

applyFilters() {
    if (!this.data.players) return;
    
    let filtered = [...this.data.players];
    
    // Apply search filter
    if (this.currentFilters.search) {
        filtered = filtered.filter(player => 
            player.player.toLowerCase().includes(this.currentFilters.search)
        );
    }
    
    // Apply team filter
    if (this.currentFilters.team) {
        filtered = filtered.filter(player => player.team === this.currentFilters.team);
    }
    
    // Apply position filter (need to get position from player profiles)
    if (this.currentFilters.position) {
        filtered = filtered.filter(player => {
            const profile = this.data.playerProfiles[player.player];
            return profile && this.getPlayerPosition(profile.Type) === this.currentFilters.position;
        });
    }
    
    // Apply performance filter
    if (this.currentFilters.performance) {
        filtered = this.applyPerformanceFilter(filtered, this.currentFilters.performance);
    }
    
    this.filteredPlayers = filtered;
    this.renderFilteredPlayersTable();
    this.updateSearchResultsCount();
}

getPlayerPosition(type) {
    const typeMap = {
        'BAT': 'Batsman',
        'BOWL': 'Bowler', 
        'AR': 'All-rounder',
        'WK': 'Wicket-keeper'
    };
    return typeMap[type] || type;
}

applyPerformanceFilter(players, performance) {
    switch (performance) {
        case 'top':
            return players.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 20);
        case 'rising':
            // Players with good recent form (simplified)
            return players.filter(p => p.averagePoints > 50);
        case 'consistent':
            // Players with consistent performance (simplified)
            return players.filter(p => p.matches >= 3);
        case 'value':
            // Value picks based on points per match
            return players.filter(p => p.averagePoints > 40).sort((a, b) => b.averagePoints - a.averagePoints);
        default:
            return players;
    }
}

renderFilteredPlayersTable() {
    const tableBody = document.getElementById('playersTableBody');
    if (!tableBody) return;
    
    const players = this.filteredPlayers.slice(0, 50); // Show top 50 filtered results
    
    tableBody.innerHTML = players.map(player => {
        const profile = this.data.playerProfiles[player.player];
        const position = profile ? this.getPlayerPosition(profile.Type) : 'N/A';
        const strikeRate = this.calculateStrikeRate(player);
        const economy = this.calculateEconomy(player);
        
        return `
            <tr>
                <td><strong>${player.player}</strong></td>
                <td>${player.team}</td>
                <td>${player.totalPoints}</td>
                <td>${player.runs}</td>
                <td>${player.wickets}</td>
                <td>${player.catches}</td>
                <td>${strikeRate}</td>
                <td>${economy}</td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ Filtered players table rendered with', players.length, 'players');
}

calculateStrikeRate(player) {
    // This would need match-by-match data to calculate properly
    // For now, return a placeholder or calculated value if available
    return player.strikeRate || '-';
}

calculateEconomy(player) {
    // This would need match-by-match data to calculate properly
    // For now, return a placeholder or calculated value if available
    return player.economy || '-';
}

updateSearchResultsCount() {
    const countElement = document.getElementById('searchResultsCount');
    if (countElement) {
        const count = this.filteredPlayers.length;
        countElement.textContent = count > 0 ? `${count} results` : '';
    }
}

clearAllFilters() {
    this.currentFilters = {
        search: '',
        team: '',
        position: '',
        performance: ''
    };
    
    // Reset form elements
    const playerSearch = document.getElementById('playerSearch');
    const teamFilter = document.getElementById('teamFilter');
    const positionFilter = document.getElementById('positionFilter');
    const performanceFilter = document.getElementById('performanceFilter');
    
    if (playerSearch) playerSearch.value = '';
    if (teamFilter) teamFilter.value = '';
    if (positionFilter) positionFilter.value = '';
    if (performanceFilter) performanceFilter.value = '';
    
    this.applyFilters();
}
