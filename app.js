// IPL Fantasy League Dashboard Application
class DashboardApp {
    constructor() {
        this.data = {
            teamStandings: {
                "Royals": 11128.5,
                "Sher": 10862.5, 
                "Silly": 9642.0,
                "Kingsmen": 9495.0
            },
            players: [
                {
                    player: "KL Rahul",
                    team: "Kingsmen", 
                    totalPoints: 428,
                    runs: 112,
                    wickets: 0,
                    catches: 0,
                    strikeRate: 172,
                    economyRate: null,
                    match: "DC vs GT, Match 60"
                },
                {
                    player: "Abhishek Sharma",
                    team: "Royals",
                    totalPoints: 418.5,
                    runs: 141,
                    wickets: 0, 
                    catches: 1,
                    strikeRate: 256,
                    economyRate: null,
                    match: "SRH vs PK, Match 27"
                },
                {
                    player: "Travis Head",
                    team: "Silly",
                    totalPoints: 154,
                    runs: 76,
                    wickets: 0,
                    catches: 0,
                    strikeRate: 190,
                    economyRate: null,
                    match: "SRH vs KKR, Match 68"
                },
                {
                    player: "Harshal Patel", 
                    team: "Kingsmen",
                    totalPoints: 129,
                    runs: 0,
                    wickets: 4,
                    catches: 0,
                    strikeRate: null,
                    economyRate: 10.5,
                    match: "SRH vs PK, Match 27"
                },
                {
                    player: "Virat Kohli",
                    team: "Royals",
                    totalPoints: 385,
                    runs: 98,
                    wickets: 0,
                    catches: 2,
                    strikeRate: 145,
                    economyRate: null,
                    match: "RCB vs MI, Match 45"
                },
                {
                    player: "Jasprit Bumrah",
                    team: "Sher",
                    totalPoints: 298,
                    runs: 8,
                    wickets: 3,
                    catches: 0,
                    strikeRate: 88,
                    economyRate: 6.2,
                    match: "MI vs CSK, Match 33"
                },
                {
                    player: "Rashid Khan",
                    team: "Silly",
                    totalPoints: 245,
                    runs: 12,
                    wickets: 2,
                    catches: 1,
                    strikeRate: 120,
                    economyRate: 7.8,
                    match: "GT vs DC, Match 52"
                },
                {
                    player: "Jos Buttler",
                    team: "Sher",
                    totalPoints: 367,
                    runs: 89,
                    wickets: 0,
                    catches: 3,
                    strikeRate: 178,
                    economyRate: null,
                    match: "RR vs PBKS, Match 19"
                }
            ],
            matches: [
                {
                    matchNumber: 1,
                    teams: ["KKR", "RCB"],
                    description: "KKR vs RCB, Match 1",
                    topPerformer: "Phil Salt - 118 points"
                },
                {
                    matchNumber: 2, 
                    teams: ["SRH", "RR"],
                    description: "SRH vs RR, Match 2",
                    topPerformer: "Ishan Kishan - 216 points"
                },
                {
                    matchNumber: 27,
                    teams: ["SRH", "PK"], 
                    description: "SRH vs PK, Match 27",
                    topPerformer: "Abhishek Sharma - 418.5 points"
                },
                {
                    matchNumber: 33,
                    teams: ["MI", "CSK"],
                    description: "MI vs CSK, Match 33",
                    topPerformer: "Jasprit Bumrah - 298 points"
                },
                {
                    matchNumber: 45,
                    teams: ["RCB", "MI"],
                    description: "RCB vs MI, Match 45",
                    topPerformer: "Virat Kohli - 385 points"
                }
            ]
        };
        
        this.filteredPlayers = [...this.data.players];
        this.charts = {};
        this.currentTheme = 'light';
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTabs();
        this.setupCharts();
        this.populateDropdowns();
        this.updateStats();
        this.renderPlayersTable();
        this.renderLeaderboards();
        this.renderTopPerformers();
        this.renderMatchTimeline();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());

        // Search and filters
        document.getElementById('playerSearch').addEventListener('input', (e) => this.filterPlayers());
        document.getElementById('teamFilter').addEventListener('change', (e) => this.filterPlayers());
        document.getElementById('positionFilter').addEventListener('change', (e) => this.filterPlayers());

        // Player comparison
        document.getElementById('compareBtn').addEventListener('click', () => this.comparePlayer());

        // Match selector
        document.getElementById('matchSelector').addEventListener('change', (e) => this.showMatchDetails(e.target.value));

        // Leaderboard category
        document.getElementById('leaderboardCategory').addEventListener('change', (e) => this.updateLeaderboards(e.target.value));

        // Table sorting
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', (e) => this.sortTable(e.target.dataset.sort));
        });

        // Team card clicks
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', (e) => this.filterByTeam(e.currentTarget.dataset.team));
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');

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
        this.createTeamStandingsChart();
        this.createPointDistributionChart();
        this.createStrikeRateChart();
        this.createCategoryChart();
        this.createRadarChart();
    }

    createTeamStandingsChart() {
        const ctx = document.getElementById('teamStandingsChart').getContext('2d');
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
        const ctx = document.getElementById('pointDistributionChart').getContext('2d');
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
        const ctx = document.getElementById('strikeRateChart').getContext('2d');
        const batsmen = this.data.players.filter(p => p.strikeRate !== null);

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
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Batting', 'Bowling', 'Fielding', 'Bonuses'],
                datasets: [{
                    data: [65, 25, 8, 2],
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
        const ctx = document.getElementById('radarChart').getContext('2d');
        
        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Batting', 'Bowling', 'Fielding', 'Consistency', 'Impact'],
                datasets: [
                    {
                        label: 'Royals',
                        data: [90, 60, 75, 85, 88],
                        backgroundColor: 'rgba(31, 184, 205, 0.2)',
                        borderColor: '#1FB8CD',
                        borderWidth: 2
                    },
                    {
                        label: 'Sher',
                        data: [85, 70, 80, 82, 85],
                        backgroundColor: 'rgba(255, 193, 133, 0.2)',
                        borderColor: '#FFC185',
                        borderWidth: 2
                    }
                ]
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
        // Populate comparison dropdowns
        const comparePlayer1 = document.getElementById('comparePlayer1');
        const comparePlayer2 = document.getElementById('comparePlayer2');
        
        this.data.players.forEach(player => {
            const option1 = new Option(player.player, player.player);
            const option2 = new Option(player.player, player.player);
            comparePlayer1.add(option1);
            comparePlayer2.add(option2);
        });

        // Populate match selector
        const matchSelector = document.getElementById('matchSelector');
        this.data.matches.forEach(match => {
            const option = new Option(match.description, match.matchNumber);
            matchSelector.add(option);
        });
    }

    updateStats() {
        const totalRuns = this.data.players.reduce((sum, p) => sum + p.runs, 0);
        const totalWickets = this.data.players.reduce((sum, p) => sum + p.wickets, 0);
        const totalCatches = this.data.players.reduce((sum, p) => sum + p.catches, 0);
        const highestScore = Math.max(...this.data.players.map(p => p.totalPoints));

        document.getElementById('totalRuns').textContent = totalRuns;
        document.getElementById('totalWickets').textContent = totalWickets;
        document.getElementById('totalCatches').textContent = totalCatches;
        document.getElementById('highestScore').textContent = highestScore;
    }

    filterPlayers() {
        const searchTerm = document.getElementById('playerSearch').value.toLowerCase();
        const teamFilter = document.getElementById('teamFilter').value;
        const positionFilter = document.getElementById('positionFilter').value;

        this.filteredPlayers = this.data.players.filter(player => {
            const matchesSearch = player.player.toLowerCase().includes(searchTerm);
            const matchesTeam = !teamFilter || player.team === teamFilter;
            // For position filter, we'll use simple logic based on stats
            const matchesPosition = !positionFilter || 
                (positionFilter === 'Batsman' && player.strikeRate !== null) ||
                (positionFilter === 'Bowler' && player.economyRate !== null) ||
                (positionFilter === 'All-rounder' && player.strikeRate !== null && player.economyRate !== null);
            
            return matchesSearch && matchesTeam && matchesPosition;
        });

        this.renderPlayersTable();
    }

    filterByTeam(team) {
        document.getElementById('teamFilter').value = team;
        this.switchTab('player-analytics');
        this.filterPlayers();
    }

    renderPlayersTable() {
        const tbody = document.getElementById('playersTableBody');
        tbody.innerHTML = '';

        this.filteredPlayers.forEach(player => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="font-medium">${player.player}</td>
                <td><span class="status status--info">${player.team}</span></td>
                <td class="text-primary font-bold">${player.totalPoints}</td>
                <td>${player.runs}</td>
                <td>${player.wickets}</td>
                <td>${player.catches}</td>
                <td>${player.strikeRate || '-'}</td>
                <td>${player.economyRate || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update header indicators
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            if (header.dataset.sort === column) {
                header.classList.add(`sort-${this.sortDirection}`);
            }
        });

        // Sort the data
        this.filteredPlayers.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            if (aVal === null || aVal === undefined) aVal = -1;
            if (bVal === null || bVal === undefined) bVal = -1;
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.renderPlayersTable();
    }

    comparePlayer() {
        const player1Name = document.getElementById('comparePlayer1').value;
        const player2Name = document.getElementById('comparePlayer2').value;
        
        if (!player1Name || !player2Name) {
            alert('Please select both players to compare');
            return;
        }

        const player1 = this.data.players.find(p => p.player === player1Name);
        const player2 = this.data.players.find(p => p.player === player2Name);

        const resultsContainer = document.getElementById('comparisonResults');
        resultsContainer.innerHTML = `
            <div class="comparison-card">
                <h4>${player1.player} (${player1.team})</h4>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Total Points</span>
                    <span class="comparison-stat-value">${player1.totalPoints}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Runs</span>
                    <span class="comparison-stat-value">${player1.runs}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Wickets</span>
                    <span class="comparison-stat-value">${player1.wickets}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Catches</span>
                    <span class="comparison-stat-value">${player1.catches}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Strike Rate</span>
                    <span class="comparison-stat-value">${player1.strikeRate || 'N/A'}</span>
                </div>
            </div>
            <div class="comparison-card">
                <h4>${player2.player} (${player2.team})</h4>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Total Points</span>
                    <span class="comparison-stat-value">${player2.totalPoints}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Runs</span>
                    <span class="comparison-stat-value">${player2.runs}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Wickets</span>
                    <span class="comparison-stat-value">${player2.wickets}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Catches</span>
                    <span class="comparison-stat-value">${player2.catches}</span>
                </div>
                <div class="comparison-stat">
                    <span class="comparison-stat-label">Strike Rate</span>
                    <span class="comparison-stat-value">${player2.strikeRate || 'N/A'}</span>
                </div>
            </div>
        `;
    }

    showMatchDetails(matchNumber) {
        if (!matchNumber) return;

        const match = this.data.matches.find(m => m.matchNumber == matchNumber);
        if (!match) return;

        const scorecard = document.getElementById('matchScorecard');
        scorecard.innerHTML = `
            <div class="match-info">
                <h4>${match.description}</h4>
                <p><strong>Top Performer:</strong> ${match.topPerformer}</p>
                <p><strong>Teams:</strong> ${match.teams.join(' vs ')}</p>
            </div>
        `;

        // Create match points chart
        const ctx = document.getElementById('matchPointsChart').getContext('2d');
        if (this.charts.matchPoints) {
            this.charts.matchPoints.destroy();
        }

        this.charts.matchPoints = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Batting', 'Bowling', 'Fielding'],
                datasets: [{
                    label: 'Points Distribution',
                    data: [120, 80, 24],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderMatchTimeline() {
        const timeline = document.getElementById('matchTimeline');
        timeline.innerHTML = '';

        this.data.matches.forEach(match => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <div class="timeline-match">${match.description}</div>
                    <div class="timeline-performer">${match.topPerformer}</div>
                </div>
            `;
            timelineItem.addEventListener('click', () => {
                document.getElementById('matchSelector').value = match.matchNumber;
                this.showMatchDetails(match.matchNumber);
            });
            timeline.appendChild(timelineItem);
        });
    }

    renderLeaderboards() {
        this.renderOverallLeaderboard();
        this.renderBattingLeaderboard();
        this.renderBowlingLeaderboard();
    }

    renderOverallLeaderboard() {
        const container = document.getElementById('overallLeaderboard');
        const sortedPlayers = [...this.data.players].sort((a, b) => b.totalPoints - a.totalPoints);
        
        container.innerHTML = '';
        sortedPlayers.slice(0, 5).forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.totalPoints}</div>
            `;
            container.appendChild(item);
        });
    }

    renderBattingLeaderboard() {
        const container = document.getElementById('battingLeaderboard');
        const batsmen = this.data.players.filter(p => p.runs > 0);
        const sortedBatsmen = batsmen.sort((a, b) => b.runs - a.runs);
        
        container.innerHTML = '';
        sortedBatsmen.slice(0, 5).forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.runs} runs</div>
            `;
            container.appendChild(item);
        });
    }

    renderBowlingLeaderboard() {
        const container = document.getElementById('bowlingLeaderboard');
        const bowlers = this.data.players.filter(p => p.wickets > 0);
        const sortedBowlers = bowlers.sort((a, b) => b.wickets - a.wickets);
        
        container.innerHTML = '';
        sortedBowlers.slice(0, 5).forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-player">
                    <div class="leaderboard-name">${player.player}</div>
                    <div class="leaderboard-team">${player.team}</div>
                </div>
                <div class="leaderboard-value">${player.wickets} wickets</div>
            `;
            container.appendChild(item);
        });
    }

    updateLeaderboards(category) {
        // This would update leaderboards based on selected category
        // For now, we'll just re-render the existing ones
        this.renderLeaderboards();
    }

    renderTopPerformers() {
        const container = document.getElementById('topPerformersContainer');
        const topPlayers = [...this.data.players]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 5);

        container.innerHTML = '<div class="top-performers-list"></div>';
        const list = container.querySelector('.top-performers-list');

        topPlayers.forEach(player => {
            const item = document.createElement('div');
            item.className = 'performer-item';
            item.innerHTML = `
                <div class="performer-avatar">${player.player.charAt(0)}</div>
                <div class="performer-info">
                    <div class="performer-name">${player.player}</div>
                    <div class="performer-stats">${player.team} • ${player.runs} runs, ${player.wickets} wickets</div>
                </div>
                <div class="performer-points">${player.totalPoints}</div>
            `;
            list.appendChild(item);
        });
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
        const csvContent = this.convertToCSV(this.data.players);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'ipl_fantasy_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    convertToCSV(data) {
        const headers = ['Player', 'Team', 'Total Points', 'Runs', 'Wickets', 'Catches', 'Strike Rate', 'Economy Rate'];
        const csvArray = [headers.join(',')];
        
        data.forEach(player => {
            const row = [
                player.player,
                player.team,
                player.totalPoints,
                player.runs,
                player.wickets,
                player.catches,
                player.strikeRate || '',
                player.economyRate || ''
            ];
            csvArray.push(row.join(','));
        });
        
        return csvArray.join('\n');
    }
}

// Initialize the dashboard when DOM is loaded
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