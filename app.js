// IPL Fantasy League Dashboard Application
class DashboardApp {
    constructor() {
        this.rawData = null;
        this.data = {
            teamStandings: {},
            players: [],
            matches: []
        };
        
        this.filteredPlayers = [];
        this.charts = {};
        this.currentTheme = 'light';
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        this.init();
    }

    async init() {
        try {
            // Show loading state
            this.showLoading();
            
            await this.loadData();
            this.processData();
            this.setupEventListeners();
            this.initializeTabs();
            
            // Initialize charts only if Chart.js is available
            if (typeof Chart !== 'undefined') {
                this.setupCharts();
            } else {
                console.warn('Chart.js not loaded - charts will be disabled');
                this.hideChartContainers();
            }
            
            this.populateDropdowns();
            this.updateStats();
            this.renderPlayersTable();
            this.renderLeaderboards();
            this.renderTopPerformers();
            this.renderMatchTimeline();
            this.updateTeamCards();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.hideLoading();
            this.showError('Failed to load data. Please ensure you are running this from a web server and Fantasy_Points_2025.json is available.');
        }
    }

    async loadData() {
        try {
            const response = await fetch('Fantasy_Points_2025.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawText = await response.text();
            // Replace NaN values with null before parsing
            const cleanedText = rawText.replace(/:\s*NaN/g, ': null');
            this.rawData = JSON.parse(cleanedText);
            
            console.log('Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    processData() {
        if (!this.rawData) return;

        // Initialize data structures
        const teamTotals = {};
        const playerStats = {};
        const matches = [];

        // Process each match
        Object.entries(this.rawData).forEach(([matchName, matchData]) => {
            const matchInfo = {
                matchName: matchName,
                teams: Object.keys(matchData).filter(key => key !== 'Team Total'),
                teamTotals: {}
            };

            // Process each team in the match
            Object.entries(matchData).forEach(([teamName, teamData]) => {
                if (teamName === 'Team Total') return;

                // Initialize team total if not exists
                if (!teamTotals[teamName]) {
                    teamTotals[teamName] = 0;
                }

                // Add team total for this match
                const teamTotal = teamData['Team Total'] || 0;
                teamTotals[teamName] += teamTotal;
                matchInfo.teamTotals[teamName] = teamTotal;

                // Process players in this team
                if (teamData.Players) {
                    teamData.Players.forEach(player => {
                        const playerName = player.Player;
                        
                        if (!playerStats[playerName]) {
                            playerStats[playerName] = {
                                player: playerName,
                                team: teamName,
                                totalPoints: 0,
                                runs: 0,
                                wickets: 0,
                                catches: 0,
                                balls: 0,
                                dotBalls: 0,
                                fours: 0,
                                sixes: 0,
                                matchesPlayed: 0,
                                battingPoints: 0,
                                bowlingPoints: 0,
                                fieldingPoints: 0,
                                economyTotal: 0,
                                economyInnings: 0
                            };
                        }

                        const stats = playerStats[playerName];
                        
                        // Safely handle null/undefined values
                        const safeNumber = (val) => typeof val === 'number' && !isNaN(val) ? val : 0;
                        
                        // Accumulate statistics
                        stats.totalPoints += safeNumber(player.Total);
                        stats.runs += safeNumber(player.Score);
                        stats.wickets += safeNumber(player.Wickets);
                        stats.balls += safeNumber(player.Balls);
                        stats.dotBalls += safeNumber(player['0s']);
                        stats.fours += safeNumber(player['4s']);
                        stats.sixes += safeNumber(player['6s']);
                        stats.battingPoints += safeNumber(player.Batting);
                        stats.bowlingPoints += safeNumber(player.Bowling);
                        stats.fieldingPoints += safeNumber(player.Catch) + safeNumber(player.Runout);
                        stats.matchesPlayed++;

                        // Handle catches (fielding points are often in the Catch field)
                        if (player.Catch && typeof player.Catch === 'number') {
                            stats.catches += Math.floor(player.Catch / 8); // Assuming 8 points per catch
                        }

                        // Economy rate calculation
                        if (player.ER && typeof player.ER === 'number' && player.ER > 0) {
                            stats.economyTotal += player.ER;
                            stats.economyInnings++;
                        }
                    });
                }
            });

            matches.push(matchInfo);
        });

        // Calculate derived statistics for players
        const processedPlayers = Object.values(playerStats).map(player => {
            return {
                ...player,
                strikeRate: player.balls > 0 ? Math.round((player.runs / player.balls) * 100 * 100) / 100 : null,
                economyRate: player.economyInnings > 0 ? Math.round((player.economyTotal / player.economyInnings) * 100) / 100 : null,
                average: player.runs > 0 ? Math.round((player.runs / player.matchesPlayed) * 100) / 100 : 0
            };
        });

        // Update data structure
        this.data.teamStandings = teamTotals;
        this.data.players = processedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
        this.data.matches = matches;
        this.filteredPlayers = [...this.data.players];

        console.log('Data processed:', {
            teams: Object.keys(teamTotals).length,
            players: processedPlayers.length,
            matches: matches.length
        });
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'loading-container';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading fantasy data...</div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    hideChartContainers() {
        const chartIds = ['teamStandingsChart', 'pointDistributionChart', 'strikeRateChart', 'categoryChart', 'radarChart', 'matchPointsChart'];
        chartIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                canvas.style.display = 'none';
                const container = canvas.closest('.card__body');
                if (container) {
                    container.innerHTML = '<p>Charts require Chart.js library to be loaded.</p>';
                }
            }
        });
    }

    updateTeamCards() {
        const container = document.getElementById('teamCardsContainer');
        if (!container) return;

        const sortedTeams = Object.entries(this.data.teamStandings)
            .sort(([,a], [,b]) => b - a)
            .map(([team, points], index) => ({team, points, rank: index + 1}));

        container.innerHTML = sortedTeams.map(({team, points, rank}) => `
            <div class="team-card" data-team="${team}">
                <h4>${team}</h4>
                <div class="team-points">${points.toLocaleString()} pts</div>
                <div class="team-rank">#${rank}</div>
            </div>
        `).join('');

        // Add click event listeners to new team cards
        container.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', (e) => this.filterByTeam(e.currentTarget.dataset.team));
        });
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Search and filters
        const playerSearch = document.getElementById('playerSearch');
        const teamFilter = document.getElementById('teamFilter');
        const positionFilter = document.getElementById('positionFilter');
        
        if (playerSearch) playerSearch.addEventListener('input', () => this.filterPlayers());
        if (teamFilter) teamFilter.addEventListener('change', () => this.filterPlayers());
        if (positionFilter) positionFilter.addEventListener('change', () => this.filterPlayers());

        // Player comparison
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.comparePlayer());
        }

        // Match selector
        const matchSelector = document.getElementById('matchSelector');
        if (matchSelector) {
            matchSelector.addEventListener('change', (e) => this.showMatchDetails(e.target.value));
        }

        // Leaderboard category
        const leaderboardCategory = document.getElementById('leaderboardCategory');
        if (leaderboardCategory) {
            leaderboardCategory.addEventListener('change', (e) => this.updateLeaderboards(e.target.value));
        }

        // Table sorting
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => this.sortTable(e.target.dataset.sort));
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (targetTab) targetTab.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const targetContent = document.getElementById(tabId);
        if (targetContent) targetContent.classList.add('active');

        // Refresh charts if needed
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.resize) chart.resize();
            });
        }, 100);
    }

    initializeTabs() {
        // Set default active tab
        this.switchTab('team-overview');
    }

    setupCharts() {
        try {
            this.createTeamStandingsChart();
            this.createPointDistributionChart();
            this.createStrikeRateChart();
            this.createCategoryChart();
            this.createRadarChart();
        } catch (error) {
            console.error('Error setting up charts:', error);
        }
    }

    createTeamStandingsChart() {
        const canvas = document.getElementById('teamStandingsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const teams = Object.keys(this.data.teamStandings);
        const points = Object.values(this.data.teamStandings);

        this.charts.teamStandings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: teams,
                datasets: [{
                    label: 'Team Points',
                    data: points,
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                    borderColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Points'
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const team = teams[index];
                        this.filterByTeam(team);
                    }
                }
            }
        });
    }

    createPointDistributionChart() {
        const canvas = document.getElementById('pointDistributionChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const teams = Object.keys(this.data.teamStandings);
        const points = Object.values(this.data.teamStandings);

        this.charts.pointDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: teams,
                datasets: [{
                    data: points,
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createStrikeRateChart() {
        const canvas = document.getElementById('strikeRateChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const batsmen = this.data.players.filter(p => p.strikeRate !== null && p.strikeRate > 0);

        this.charts.strikeRate = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Players',
                    data: batsmen.map(p => ({
                        x: p.strikeRate,
                        y: p.totalPoints,
                        player: p.player,
                        team: p.team
                    })),
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Strike Rate'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Points'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.parsed;
                                const data = context.raw;
                                return `${data.player} (${data.team}): SR ${point.x}, Points ${point.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate category distribution from actual data
        const totalBatting = this.data.players.reduce((sum, p) => sum + p.battingPoints, 0);
        const totalBowling = this.data.players.reduce((sum, p) => sum + p.bowlingPoints, 0);
        const totalFielding = this.data.players.reduce((sum, p) => sum + p.fieldingPoints, 0);
        const totalPoints = this.data.players.reduce((sum, p) => sum + p.totalPoints, 0);
        const totalBonuses = totalPoints - totalBatting - totalBowling - totalFielding;
        
        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Batting', 'Bowling', 'Fielding', 'Bonuses'],
                datasets: [{
                    data: [totalBatting, totalBowling, totalFielding, Math.max(0, totalBonuses)],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createRadarChart() {
        const canvas = document.getElementById('radarChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const teams = Object.keys(this.data.teamStandings);
        const datasets = teams.slice(0, 4).map((team, index) => {
            const teamPlayers = this.data.players.filter(p => p.team === team);
            const avgBatting = teamPlayers.reduce((sum, p) => sum + p.battingPoints, 0) / teamPlayers.length || 0;
            const avgBowling = teamPlayers.reduce((sum, p) => sum + p.bowlingPoints, 0) / teamPlayers.length || 0;
            const avgFielding = teamPlayers.reduce((sum, p) => sum + p.fieldingPoints, 0) / teamPlayers.length || 0;
            const consistency = teamPlayers.length > 0 ? 
                (teamPlayers.reduce((sum, p) => sum + p.totalPoints, 0) / teamPlayers.length) / 10 : 0;
            const impact = this.data.teamStandings[team] / Math.max(...Object.values(this.data.teamStandings)) * 100;

            const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5'];
            return {
                label: team,
                data: [
                    Math.min(100, avgBatting / 5), 
                    Math.min(100, avgBowling / 5), 
                    Math.min(100, avgFielding / 2), 
                    Math.min(100, consistency), 
                    Math.min(100, impact)
                ],
                backgroundColor: colors[index % colors.length] + '33',
                borderColor: colors[index % colors.length],
                borderWidth: 2
            };
        });
        
        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Batting', 'Bowling', 'Fielding', 'Consistency', 'Impact'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    populateDropdowns() {
        // Populate team filter
        const teamFilter = document.getElementById('teamFilter');
        if (teamFilter) {
            const teams = [...new Set(this.data.players.map(p => p.team))];
            
            teamFilter.innerHTML = '<option value="">All Teams</option>';
            teams.forEach(team => {
                const option = new Option(team, team);
                teamFilter.add(option);
            });
        }

        // Populate comparison dropdowns
        const comparePlayer1 = document.getElementById('comparePlayer1');
        const comparePlayer2 = document.getElementById('comparePlayer2');
        
        if (comparePlayer1 && comparePlayer2) {
            comparePlayer1.innerHTML = '<option value="">Select Player 1</option>';
            comparePlayer2.innerHTML = '<option value="">Select Player 2</option>';
            
            this.data.players.forEach(player => {
                const option1 = new Option(player.player, player.player);
                const option2 = new Option(player.player, player.player);
                comparePlayer1.add(option1);
                comparePlayer2.add(option2);
            });
        }

        // Populate match selector
        const matchSelector = document.getElementById('matchSelector');
        if (matchSelector) {
            matchSelector.innerHTML = '<option value="">Select a match</option>';
            this.data.matches.forEach((match, index) => {
                const option = new Option(match.matchName, index);
                matchSelector.add(option);
            });
        }
    }

    updateStats() {
        const totalRuns = this.data.players.reduce((sum, p) => sum + p.runs, 0);
        const totalWickets = this.data.players.reduce((sum, p) => sum + p.wickets, 0);
        const totalCatches = this.data.players.reduce((sum, p) => sum + p.catches, 0);
        const highestScore = Math.max(...this.data.players.map(p => p.totalPoints));

        // Update overview stats
        const teams = Object.keys(this.data.teamStandings);
        const sortedTeamPoints = Object.values(this.data.teamStandings).sort((a, b) => b - a);
        const pointDifference = sortedTeamPoints[0] - sortedTeamPoints[sortedTeamPoints.length - 1];
        const leadingTeam = Object.entries(this.data.teamStandings)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];

        // Safely update elements
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('totalTeams', teams.length);
        updateElement('matchesPlayed', this.data.matches.length);
        updateElement('leadingTeam', leadingTeam);
        updateElement('pointDifference', Math.round(pointDifference).toLocaleString());
        updateElement('totalRuns', totalRuns.toLocaleString());
        updateElement('totalWickets', totalWickets);
        updateElement('totalCatches', totalCatches);
        updateElement('highestScore', highestScore.toLocaleString());
    }

    filterPlayers() {
        const searchTerm = document.getElementById('playerSearch')?.value.toLowerCase() || '';
        const teamFilter = document.getElementById('teamFilter')?.value || '';
        const positionFilter = document.getElementById('positionFilter')?.value || '';

        this.filteredPlayers = this.data.players.filter(player => {
            const matchesSearch = player.player.toLowerCase().includes(searchTerm);
            const matchesTeam = !teamFilter || player.team === teamFilter;
            const matchesPosition = !positionFilter || 
                (positionFilter === 'Batsman' && player.strikeRate !== null && player.runs > 0) ||
                (positionFilter === 'Bowler' && player.economyRate !== null && player.wickets > 0) ||
                (positionFilter === 'All-rounder' && player.strikeRate !== null && player.economyRate !== null);

            return matchesSearch && matchesTeam && matchesPosition;
        });

        this.renderPlayersTable();
        if (typeof Chart !== 'undefined') {
            this.createStrikeRateChart();
        }
    }

    filterByTeam(team) {
        const teamFilter = document.getElementById('teamFilter');
        if (teamFilter) {
            teamFilter.value = team;
            this.filterPlayers();
            this.switchTab('player-analytics');
        }
    }

    renderPlayersTable() {
        const tableBody = document.getElementById('playersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.filteredPlayers.map(player => `
            <tr>
                <td>${player.player}</td>
                <td>${player.team}</td>
                <td>${player.totalPoints.toLocaleString()}</td>
                <td>${player.runs}</td>
                <td>${player.wickets}</td>
                <td>${player.catches}</td>
                <td>${player.strikeRate ? player.strikeRate.toFixed(1) : '-'}</td>
                <td>${player.economyRate ? player.economyRate.toFixed(2) : '-'}</td>
            </tr>
        `).join('');
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredPlayers.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal === null || aVal === undefined) aVal = 0;
            if (bVal === null || bVal === undefined) bVal = 0;

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Update sort indicators
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === column) {
                header.classList.add(`sort-${this.sortDirection}`);
            }
        });

        this.renderPlayersTable();
    }

    comparePlayer() {
        const player1Name = document.getElementById('comparePlayer1')?.value;
        const player2Name = document.getElementById('comparePlayer2')?.value;
        const resultsContainer = document.getElementById('comparisonResults');

        if (!resultsContainer) return;

        if (!player1Name || !player2Name) {
            resultsContainer.innerHTML = '<p>Please select both players to compare.</p>';
            return;
        }

        const player1 = this.data.players.find(p => p.player === player1Name);
        const player2 = this.data.players.find(p => p.player === player2Name);

        if (!player1 || !player2) {
            resultsContainer.innerHTML = '<p>Error: Could not find selected players.</p>';
            return;
        }

        resultsContainer.innerHTML = `
            <div class="comparison-cards">
                <div class="comparison-card">
                    <h4>${player1.player} (${player1.team})</h4>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Total Points:</span>
                        <span class="comparison-stat-value">${player1.totalPoints.toLocaleString()}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Runs:</span>
                        <span class="comparison-stat-value">${player1.runs}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Wickets:</span>
                        <span class="comparison-stat-value">${player1.wickets}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Strike Rate:</span>
                        <span class="comparison-stat-value">${player1.strikeRate ? player1.strikeRate.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Economy:</span>
                        <span class="comparison-stat-value">${player1.economyRate ? player1.economyRate.toFixed(2) : 'N/A'}</span>
                    </div>
                </div>
                <div class="comparison-card">
                    <h4>${player2.player} (${player2.team})</h4>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Total Points:</span>
                        <span class="comparison-stat-value">${player2.totalPoints.toLocaleString()}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Runs:</span>
                        <span class="comparison-stat-value">${player2.runs}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Wickets:</span>
                        <span class="comparison-stat-value">${player2.wickets}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Strike Rate:</span>
                        <span class="comparison-stat-value">${player2.strikeRate ? player2.strikeRate.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div class="comparison-stat">
                        <span class="comparison-stat-label">Economy:</span>
                        <span class="comparison-stat-value">${player2.economyRate ? player2.economyRate.toFixed(2) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    showMatchDetails(matchIndex) {
        if (!matchIndex || matchIndex === '') return;

        const match = this.data.matches[parseInt(matchIndex)];
        if (!match) return;

        const scorecard = document.getElementById('matchScorecard');
        if (scorecard) {
            scorecard.innerHTML = `
                <div class="match-info">
                    <h4>${match.matchName}</h4>
                    <div class="teams-scores">
                        ${Object.entries(match.teamTotals).map(([team, total]) => `
                            <p><strong>${team}:</strong> ${total.toLocaleString()} points</p>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Create match points chart only if Chart.js is available
        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('matchPointsChart');
            if (ctx && this.charts.matchPoints) {
                this.charts.matchPoints.destroy();
            }

            if (ctx) {
                this.charts.matchPoints = new Chart(ctx.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: Object.keys(match.teamTotals),
                        datasets: [{
                            label: 'Points',
                            data: Object.values(match.teamTotals),
                            backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    }

    renderMatchTimeline() {
        const timelineContainer = document.getElementById('matchTimeline');
        if (!timelineContainer) return;

        timelineContainer.innerHTML = this.data.matches.slice(0, 10).map((match, index) => `
            <div class="timeline-item">
                <div class="timeline-marker">${index + 1}</div>
                <div class="timeline-content">
                    <div class="timeline-match">${match.matchName}</div>
                    <div class="timeline-teams">
                        ${Object.entries(match.teamTotals).map(([team, points]) => `
                            <span>${team}: ${points} pts</span>
                        `).join(' | ')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderLeaderboards() {
        this.renderOverallLeaderboard();
        this.renderBattingLeaderboard();
        this.renderBowlingLeaderboard();
    }

    renderOverallLeaderboard() {
        const container = document.getElementById('overallLeaderboard');
        if (!container) return;

        const topPlayers = this.data.players.slice(0, 10);
        container.innerHTML = topPlayers.map((player, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.totalPoints.toLocaleString()}</div>
            </div>
        `).join('');
    }

    renderBattingLeaderboard() {
        const container = document.getElementById('battingLeaderboard');
        if (!container) return;

        const topBatsmen = this.data.players
            .filter(p => p.runs > 0)
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 10);

        container.innerHTML = topBatsmen.map((player, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.runs} runs</div>
            </div>
        `).join('');
    }

    renderBowlingLeaderboard() {
        const container = document.getElementById('bowlingLeaderboard');
        if (!container) return;

        const topBowlers = this.data.players
            .filter(p => p.wickets > 0)
            .sort((a, b) => b.wickets - a.wickets)
            .slice(0, 10);

        container.innerHTML = topBowlers.map((player, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.wickets} wickets</div>
            </div>
        `).join('');
    }

    updateLeaderboards(category) {
        // Implementation for dynamic leaderboard updates based on category
        switch(category) {
            case 'runs':
                this.renderBattingLeaderboard();
                break;
            case 'wickets':
                this.renderBowlingLeaderboard();
                break;
            default:
                this.renderOverallLeaderboard();
        }
    }

    renderTopPerformers() {
        const container = document.getElementById('topPerformersContainer');
        if (!container) return;

        const topPerformers = this.data.players.slice(0, 5);
        container.innerHTML = `
            <div class="top-performers-list">
                ${topPerformers.map(player => `
                    <div class="performer-item">
                        <div class="performer-info">
                            <div class="performer-name">${player.player}</div>
                            <div class="performer-stats">${player.team}</div>
                        </div>
                        <div class="performer-points">${player.totalPoints.toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', this.currentTheme);
        
        // Update charts for theme change
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart && chart.update) {
                    chart.update();
                }
            });
        }, 100);
    }

    exportData() {
        const dataToExport = {
            teamStandings: this.data.teamStandings,
            players: this.data.players,
            matches: this.data.matches.length,
            exportDate: new Date().toISOString()
        };

        const csv = this.convertToCSV(this.data.players);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `fantasy_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = ['Player', 'Team', 'Total Points', 'Runs', 'Wickets', 'Catches', 'Strike Rate', 'Economy Rate', 'Matches Played'];
        const csvContent = [
            headers.join(','),
            ...data.map(player => [
                `"${player.player}"`,
                `"${player.team}"`,
                player.totalPoints,
                player.runs,
                player.wickets,
                player.catches,
                player.strikeRate || '',
                player.economyRate || '',
                player.matchesPlayed
            ].join(','))
        ].join('\n');

        return csvContent;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-error);
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 400px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && e.shiftKey) {
        // Handle shift+tab for reverse navigation
        e.preventDefault();
    }
});

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});