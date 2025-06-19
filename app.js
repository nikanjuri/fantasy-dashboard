// IPL Fantasy League Dashboard Application
class DashboardApp {
    constructor() {
        this.rawData = null;
        this.playerListData = null;
        this.scoringSystemData = null;
        this.data = {
            teamStandings: {},
            players: [],
            matches: [],
            playerProfiles: {},
            teamCompositions: {},
            auctionData: {}
        };
        
        this.filteredPlayers = [];
        this.charts = {};
        this.currentTheme = 'light';
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.enhancedFilters = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing dashboard...');
        try {
            this.showLoading();
            
            // Load and process data
            console.log('📡 Loading data...');
            await this.loadAllData();
            console.log('✅ Data loaded successfully');
            
            console.log('🔄 Processing data...');
            this.processAllData();
            console.log('✅ Data processed successfully');
            
            // Initialize UI components
            console.log('🎛️ Setting up UI...');
            this.initializeTabs();
            this.setupEventListeners();
            
            // Skip charts for now to avoid errors
            console.log('📊 Setting up charts...');
            try {
                this.setupCharts();
            } catch (chartError) {
                console.warn('Charts failed to load:', chartError);
            }
            
            console.log('🔄 Updating dashboard...');
            this.updateAllDashboards();
            
            this.hideLoading();
            console.log('✅ Dashboard initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            this.hideLoading();
            this.showError(`Failed to initialize dashboard: ${error.message}`);
        }
    }

    async loadAllData() {
        try {
            console.log('📂 Starting data load...');
            
            // Load all three JSON files
            const [fantasyResponse, playerListResponse, scoringResponse] = await Promise.all([
                fetch('data/Fantasy_Points_2025.json'),
                fetch('data/Player_List_By_Team.json'),
                fetch('data/Scoring_System.json')
            ]);

            console.log('📊 Response status:', {
                fantasy: fantasyResponse.status,
                playerList: playerListResponse.status,
                scoring: scoringResponse.status
            });

            if (!fantasyResponse.ok || !playerListResponse.ok || !scoringResponse.ok) {
                throw new Error('Failed to fetch one or more data files');
            }

            // Process fantasy points data
            console.log('📝 Processing fantasy data...');
            const rawText = await fantasyResponse.text();
            const cleanedText = rawText.replace(/:\s*NaN/g, ': null');
            this.rawData = JSON.parse(cleanedText);
            console.log('Fantasy data loaded:', Object.keys(this.rawData).length, 'matches');

            // Load other data files
            console.log('📝 Processing player list...');
            this.playerListData = await playerListResponse.json();
            console.log('Player list loaded:', Object.keys(this.playerListData).length, 'teams');

            console.log('📝 Processing scoring system...');
            this.scoringSystemData = await scoringResponse.json();
            console.log('Scoring system loaded');

            console.log('✅ All data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw error;
        }
    }

    processAllData() {
        if (!this.rawData || !this.playerListData || !this.scoringSystemData) return;

        // Process fantasy points data (existing logic)
        this.processFantasyData();
        
        // Process player profiles with auction data
        this.processPlayerProfiles();
        
        // Process team compositions
        this.processTeamCompositions();
        
        // Process auction analysis
        this.processAuctionData();
        
        console.log('All data processed successfully');
    }

    processFantasyData() {
        // Initialize data structures
        const teamTotals = {};
        const playerStats = {};
        const matches = [];

        // Process each match (existing logic)
        Object.entries(this.rawData).forEach(([matchName, matchData]) => {
            const matchInfo = {
                matchName: matchName,
                teams: Object.keys(matchData).filter(key => key !== 'Team Total'),
                teamTotals: {}
            };

            Object.entries(matchData).forEach(([teamName, teamData]) => {
                if (teamName === 'Team Total') return;

                if (!teamTotals[teamName]) {
                    teamTotals[teamName] = 0;
                }

                const teamTotal = teamData['Team Total'] || 0;
                teamTotals[teamName] += teamTotal;
                matchInfo.teamTotals[teamName] = teamTotal;

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
                        const safeNumber = (val) => typeof val === 'number' && !isNaN(val) ? val : 0;
                        
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

                        if (player.Catch && typeof player.Catch === 'number') {
                            stats.catches += Math.floor(player.Catch / 8);
                        }

                        if (player.ER && typeof player.ER === 'number' && player.ER > 0) {
                            stats.economyTotal += player.ER;
                            stats.economyInnings++;
                        }
                    });
                }
            });

            matches.push(matchInfo);
        });

        // Calculate derived statistics
        const processedPlayers = Object.values(playerStats).map(player => {
            return {
                ...player,
                strikeRate: player.balls > 0 ? Math.round((player.runs / player.balls) * 100 * 100) / 100 : null,
                economyRate: player.economyInnings > 0 ? Math.round((player.economyTotal / player.economyInnings) * 100) / 100 : null,
                average: player.runs > 0 ? Math.round((player.runs / player.matchesPlayed) * 100) / 100 : 0
            };
        });

        this.data.teamStandings = teamTotals;
        this.data.players = processedPlayers.sort((a, b) => b.totalPoints - a.totalPoints);
        this.data.matches = matches;
        this.filteredPlayers = [...this.data.players];
    }

    processPlayerProfiles() {
        const profiles = {};
        
        // Combine fantasy performance with auction data
        Object.entries(this.playerListData).forEach(([teamName, players]) => {
            players.forEach(player => {
                const fantasyPlayer = this.data.players.find(p => p.player === player.Player);
                
                profiles[player.Player] = {
                    ...player,
                    fantasyTeam: teamName,
                    performance: fantasyPlayer || {
                        totalPoints: 0,
                    runs: 0,
                    wickets: 0,
                    catches: 0,
                        matchesPlayed: 0
                    },
                    valueForMoney: this.calculateValueForMoney(fantasyPlayer?.totalPoints || 0, player.Price || 0),
                    priceCategory: this.categorizePriceRange(player.Price || 0),
                    experienceLevel: this.categorizeExperience(player)
                };
            });
        });

        this.data.playerProfiles = profiles;
    }

    processTeamCompositions() {
        const compositions = {};

        Object.entries(this.playerListData).forEach(([teamName, players]) => {
            const composition = {
                teamName,
                totalPlayers: players.length,
                totalInvestment: players.reduce((sum, p) => sum + (p.Price || 0), 0),
                avgPrice: players.reduce((sum, p) => sum + (p.Price || 0), 0) / players.length,
                playerTypes: {
                    BAT: players.filter(p => p.Type === 'BAT').length,
                    BOWL: players.filter(p => p.Type === 'BOWL').length,
                    AR: players.filter(p => p.Type === 'AR').length,
                    WK: players.filter(p => p.Type === 'WK').length
                },
                overseas: players.filter(p => p.Overseas === 'Yes').length,
            };

            compositions[teamName] = composition;
        });

        this.data.teamCompositions = compositions;
    }

    processAuctionData() {
        const allPlayers = [];
        
        Object.entries(this.playerListData).forEach(([teamName, players]) => {
            players.forEach(player => {
                const profile = this.data.playerProfiles[player.Player];
                if (profile) {
                    allPlayers.push({
                        ...profile,
                        pointsPerCrore: profile.performance.totalPoints / (profile.Price || 0.1)
                    });
                }
            });
        });

        // Sort by value for money
        allPlayers.sort((a, b) => b.pointsPerCrore - a.pointsPerCrore);

        this.data.auctionData = {
            allPlayers,
            bestBargains: allPlayers.slice(0, 5),
            expensivePicks: allPlayers.filter(p => (p.Price || 0) > 10 && p.pointsPerCrore < 50),
            fairValue: allPlayers.filter(p => p.pointsPerCrore >= 50 && p.pointsPerCrore <= 150)
        };
    }

    calculateValueForMoney(points, price) {
        if (price === 0 || price === null || price === undefined) return points > 0 ? 1000 : 0;
        const ratio = points / price;
        if (ratio > 150) return 'Excellent';
        if (ratio > 100) return 'Good';
        if (ratio > 50) return 'Fair';
        return 'Poor';
    }

    categorizePriceRange(price) {
        if (price >= 15) return 'Premium';
        if (price >= 8) return 'Expensive';
        if (price >= 4) return 'Medium';
        return 'Budget';
    }

    categorizeExperience(player) {
        const iplGames = player.IPL || 0;
        if (iplGames > 100) return 'Veteran';
        if (iplGames > 50) return 'Experienced';
        if (iplGames > 20) return 'Moderate';
        return 'Rookie';
    }

    findTeamPoints(playerListTeamName) {
        // Try exact match first
        if (this.data.teamStandings[playerListTeamName]) {
            return this.data.teamStandings[playerListTeamName];
        }
        
        // Try reverse mapping for team names
        const reverseMap = {
            'Sher-E-Punjab': 'Sher-e-Punjab',
            'Kingsmen': 'The Kingsmen'
        };
        
        const fantasyTeamName = reverseMap[playerListTeamName] || playerListTeamName;
        return this.data.teamStandings[fantasyTeamName] || 0;
    }

    // Enhanced UI Update Methods
    updateAllDashboards() {
        this.updateTeamOverview();
        this.updateAuctionAnalysis();
        this.updateTeamComposition();
        this.updateScoringRules();
        this.updateStats();
        this.renderPlayersTable();
        this.renderLeaderboards();
    }

    updateTeamOverview() {
        // Update smart insights
        this.updateSmartInsights();
        
        // Update enhanced stats
        const totalPlayers = Object.values(this.data.playerProfiles).length;
        const totalInvestment = Object.values(this.data.teamCompositions)
            .reduce((sum, team) => sum + team.totalInvestment, 0);
        const avgPrice = totalInvestment / totalPlayers;

        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('totalInvestment').textContent = `₹${totalInvestment.toFixed(1)} Cr`;
        document.getElementById('avgPrice').textContent = `₹${avgPrice.toFixed(1)} Cr`;

        // Update enhanced team cards
        this.updateEnhancedTeamCards();
    }

    updateSmartInsights() {
        if (!this.data.auctionData || !this.data.auctionData.bestBargains) return;
        
        const bestValue = this.data.auctionData.bestBargains[0];
        const hiddenGem = this.data.auctionData.allPlayers
            .filter(p => (p.Price || 0) < 2 && p.performance.totalPoints > 100)[0];
        const formPlayer = this.data.players
            .sort((a, b) => (b.totalPoints / b.matchesPlayed) - (a.totalPoints / a.matchesPlayed))[0];

        if (bestValue) {
            document.getElementById('bestValuePlayer').innerHTML = `
                <strong>${bestValue.Player}</strong><br>
                <small>₹${bestValue.Price}Cr • ${bestValue.performance.totalPoints} pts</small>
            `;
        }

        if (hiddenGem) {
            document.getElementById('hiddenGem').innerHTML = `
                <strong>${hiddenGem.Player}</strong><br>
                <small>₹${hiddenGem.Price}Cr • ${hiddenGem.performance.totalPoints} pts</small>
            `;
        }

        if (formPlayer) {
            document.getElementById('formPlayer').innerHTML = `
                <strong>${formPlayer.player}</strong><br>
                <small>${(formPlayer.totalPoints / formPlayer.matchesPlayed).toFixed(1)} pts/match</small>
            `;
        }
    }

    updateEnhancedTeamCards() {
        console.log('🎯 Starting updateEnhancedTeamCards...');
        
        const container = document.getElementById('teamCardsContainer');
        if (!container) {
            console.error('❌ teamCardsContainer not found!');
            return;
        }
        console.log('✅ Container found:', container);

        // Debug: Check if data exists
        console.log('📊 Team standings data:', this.data.teamStandings);
        console.log('📊 Team compositions data:', Object.keys(this.data.teamCompositions || {}));

        if (!this.data.teamStandings || Object.keys(this.data.teamStandings).length === 0) {
            console.error('❌ No team standings data available!');
            container.innerHTML = '<p style="color: red;">No team data available. Check console for errors.</p>';
            return;
        }

        // Create a mapping for consistent team display
        const teamDisplayMap = {
            'Sher-e-Punjab': 'Sher-e-Punjab',
            'The Kingsmen': 'The Kingsmen',
            'Royal Smashers': 'Royal Smashers',
            'Silly Pointers': 'Silly Pointers'
        };

        const sortedTeams = Object.entries(this.data.teamStandings)
            .sort(([,a], [,b]) => b - a)
            .map(([team, points], index) => {
                console.log(`🏏 Processing team: ${team}, Points: ${points}`);
                
                // Find composition data using team name mapping
                const compositionKey = this.findCompositionKey(team);
                const composition = this.data.teamCompositions[compositionKey];
                
                console.log(`📝 Composition for ${team}:`, composition);
                
                return {
                    team: teamDisplayMap[team] || team,
                    points,
                    rank: index + 1,
                    composition
                };
            });

        console.log('🎯 Sorted teams for display:', sortedTeams);

        const cardsHTML = sortedTeams.map(({team, points, rank, composition}) => `
            <div class="enhanced-team-card" data-team="${team}" style="border: 2px solid #ccc; margin: 10px; padding: 15px; background: white;">
                <div class="team-header">
                    <h4>${team}</h4>
                    <div class="team-rank">#${rank}</div>
                </div>
                <div class="team-points" style="font-size: 24px; font-weight: bold; color: #007bff;">${points.toLocaleString()} pts</div>
                <div class="team-details">
                    <div class="detail-item">
                        <span class="label">Investment:</span>
                        <span class="value">₹${composition?.totalInvestment?.toFixed(1) || 0}Cr</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Players:</span>
                        <span class="value">${composition?.totalPlayers || 0}</span>
                    </div>
                </div>
                <div class="team-stats">
                    <div class="stat-item">
                        <span class="icon">🏏</span>
                        <span class="count">${composition?.playerTypes?.BAT || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="icon">⚡</span>
                        <span class="count">${composition?.playerTypes?.BOWL || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="icon">🌟</span>
                        <span class="count">${composition?.playerTypes?.AR || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="icon">🧤</span>
                        <span class="count">${composition?.playerTypes?.WK || 0}</span>
                    </div>
                </div>
            </div>
        `).join('');

        console.log('🎨 Generated HTML length:', cardsHTML.length);
        console.log('🎨 Generated HTML preview:', cardsHTML.substring(0, 200) + '...');

        container.innerHTML = cardsHTML;
        
        console.log('✅ Team cards updated! Container innerHTML length:', container.innerHTML.length);

        // Add click listeners
        container.querySelectorAll('.enhanced-team-card').forEach(card => {
            card.addEventListener('click', (e) => this.filterByTeam(e.currentTarget.dataset.team));
        });
        
        console.log('✅ Click listeners added to', container.querySelectorAll('.enhanced-team-card').length, 'cards');
    }

    findCompositionKey(fantasyTeamName) {
        // Direct mapping from fantasy team names to player list team names
        const mapping = {
            'Sher-e-Punjab': 'Sher-E-Punjab',
            'The Kingsmen': 'Kingsmen',
            'Royal Smashers': 'Royal Smashers',
            'Silly Pointers': 'Silly Pointers'
        };
        
        return mapping[fantasyTeamName] || fantasyTeamName;
    }

    updateAuctionAnalysis() {
        // Update bargains list
        const bargainsContainer = document.getElementById('bestBargains');
        if (bargainsContainer) {
            bargainsContainer.innerHTML = this.data.auctionData.bestBargains
                .slice(0, 5)
                .map(player => `
                    <div class="bargain-item">
                        <strong>${player.Player}</strong>
                        <div class="bargain-details">
                            ₹${player.Price}Cr • ${player.performance.totalPoints} pts
                            <span class="value-ratio">${player.pointsPerCrore.toFixed(1)} pts/₹Cr</span>
                        </div>
                    </div>
                `).join('');
        }

        // Update expensive picks
        const expensiveContainer = document.getElementById('expensivePicks');
        if (expensiveContainer) {
            expensiveContainer.innerHTML = this.data.auctionData.expensivePicks
                .slice(0, 5)
                .map(player => `
                    <div class="expensive-item">
                        <strong>${player.Player}</strong>
                        <div class="expensive-details">
                            ₹${player.Price}Cr • ${player.performance.totalPoints} pts
                            <span class="value-ratio">${player.pointsPerCrore.toFixed(1)} pts/₹Cr</span>
                        </div>
                    </div>
                `).join('');
        }

        // Update VFM table
        this.updateVFMTable();
    }

    updateVFMTable() {
        const tableBody = document.getElementById('vfmTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = this.data.auctionData.allPlayers
            .slice(0, 20)
            .map(player => `
                <tr>
                    <td><strong>${player.Player}</strong></td>
                    <td>${player.fantasyTeam}</td>
                    <td>₹${player.Price.toFixed(1)}</td>
                    <td>${player.performance.totalPoints}</td>
                    <td>${player.pointsPerCrore.toFixed(1)}</td>
                    <td><span class="value-badge ${player.valueForMoney.toLowerCase()}">${player.valueForMoney}</span></td>
                </tr>
            `).join('');
    }

    updateTeamComposition() {
        const grid = document.getElementById('compositionGrid');
        if (!grid) return;

        grid.innerHTML = Object.entries(this.data.teamCompositions)
            .map(([teamName, comp]) => `
                <div class="composition-card">
                    <h4>${teamName}</h4>
                    <div class="comp-stats">
                        <div class="comp-stat">
                            <span class="comp-label">Total Investment</span>
                            <span class="comp-value">₹${comp.totalInvestment.toFixed(1)}Cr</span>
                        </div>
                        <div class="comp-stat">
                            <span class="comp-label">Avg Price</span>
                            <span class="comp-value">₹${comp.avgPrice.toFixed(1)}Cr</span>
                        </div>
                    </div>
                    <div class="player-breakdown">
                        <div class="breakdown-item">
                            <span class="type-icon">🏏</span>
                            <span class="type-label">Batsmen</span>
                            <span class="type-count">${comp.playerTypes.BAT}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="type-icon">⚡</span>
                            <span class="type-label">Bowlers</span>
                            <span class="type-count">${comp.playerTypes.BOWL}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="type-icon">🌟</span>
                            <span class="type-label">All-rounders</span>
                            <span class="type-count">${comp.playerTypes.AR}</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="type-icon">🧤</span>
                            <span class="type-label">Wicket-keepers</span>
                            <span class="type-count">${comp.playerTypes.WK || 0}</span>
                        </div>
                    </div>
                    <div class="experience-breakdown">
                        <div class="exp-item">
                            <span class="exp-label">Overseas</span>
                            <span class="exp-count">${comp.overseas}</span>
                        </div>
                    </div>
                </div>
            `).join('');
    }

    updateStats() {
        // Update KPI values in the statistics tab
        if (!this.data.players || this.data.players.length === 0) return;
        
        const totalRuns = this.data.players.reduce((sum, p) => sum + (p.runs || 0), 0);
        const totalWickets = this.data.players.reduce((sum, p) => sum + (p.wickets || 0), 0);
        const totalCatches = this.data.players.reduce((sum, p) => sum + (p.catches || 0), 0);
        const highestScore = Math.max(...this.data.players.map(p => p.runs || 0));

        // Update DOM elements if they exist
        const totalRunsEl = document.getElementById('totalRuns');
        if (totalRunsEl) totalRunsEl.textContent = totalRuns.toLocaleString();

        const totalWicketsEl = document.getElementById('totalWickets');
        if (totalWicketsEl) totalWicketsEl.textContent = totalWickets.toLocaleString();

        const totalCatchesEl = document.getElementById('totalCatches');
        if (totalCatchesEl) totalCatchesEl.textContent = totalCatches.toLocaleString();

        const highestScoreEl = document.getElementById('highestScore');
        if (highestScoreEl) highestScoreEl.textContent = highestScore.toLocaleString();

        console.log('✅ Stats updated:', { totalRuns, totalWickets, totalCatches, highestScore });
    }

    updateScoringRules() {
        const grid = document.getElementById('scoringRulesGrid');
        if (!grid) return;

        grid.innerHTML = Object.entries(this.scoringSystemData)
            .map(([category, rules]) => `
                <div class="scoring-card">
                    <h4>${category}</h4>
                    <div class="rules-list">
                        ${Object.entries(rules).map(([action, points]) => `
                            <div class="rule-item">
                                <span class="rule-action">${action}</span>
                                <span class="rule-points">${points > 0 ? '+' : ''}${points}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
    }

    // Enhanced Chart Methods
    setupCharts() {
        if (typeof Chart === 'undefined') {
            this.hideChartContainers();
            return;
        }

        this.createTeamStandingsChart();
        this.createPricePointsChart();
        this.createInvestmentChart();
        this.createPlayerTypeChart();
        this.createExperienceChart();
    }

    createTeamStandingsChart() {
        const ctx = document.getElementById('teamStandingsChart');
        if (!ctx) return;

        const teams = Object.keys(this.data.teamStandings);
        const points = Object.values(this.data.teamStandings);

        if (this.charts.teamStandings) {
            this.charts.teamStandings.destroy();
        }

        this.charts.teamStandings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: teams,
                datasets: [{
                    label: 'Total Points',
                    data: points,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
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
                            text: 'Total Points'
                        }
                    }
                }
            }
        });
    }

    createPricePointsChart() {
        const ctx = document.getElementById('pricePointsChart');
        if (!ctx) return;

        // Get player data for scatter plot
        const playerData = Object.values(this.data.playerProfiles)
            .filter(p => p.Price > 0 && p.performance.totalPoints > 0)
            .map(p => ({
                x: p.Price,
                y: p.performance.totalPoints,
                player: p.Player,
                team: p.fantasyTeam
            }));

        if (this.charts.pricePoints) {
            this.charts.pricePoints.destroy();
        }

        this.charts.pricePoints = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Price vs Points',
                    data: playerData,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '💰 Price vs Performance Analysis'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `${point.player}`,
                                    `Price: ₹${point.x}Cr`,
                                    `Points: ${point.y}`,
                                    `Team: ${point.team}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Price (₹Cr)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Fantasy Points'
                        }
                    }
                }
            }
        });
    }

    createInvestmentChart() {
        // Implementation of createInvestmentChart method
    }

    createPlayerTypeChart() {
        // Implementation of createPlayerTypeChart method
    }

    createExperienceChart() {
        // Implementation of createExperienceChart method
    }

    generateBestXI() {
        const criteria = document.getElementById('xiCriteria').value;
        const container = document.getElementById('bestXI');
        
        if (!container) return;

        let players = [...this.data.auctionData.allPlayers];
        
        // Sort based on criteria
        switch (criteria) {
            case 'points':
                players.sort((a, b) => b.performance.totalPoints - a.performance.totalPoints);
                break;
            case 'value':
                players.sort((a, b) => b.pointsPerCrore - a.pointsPerCrore);
                break;
            default:
                // Default selection
        }

        // Select balanced XI
        const xi = {
            WK: players.filter(p => p.Type === 'WK').slice(0, 1),
            BAT: players.filter(p => p.Type === 'BAT').slice(0, 4),
            AR: players.filter(p => p.Type === 'AR').slice(0, 3),
            BOWL: players.filter(p => p.Type === 'BOWL').slice(0, 3)
        };

        const totalCost = [...xi.WK, ...xi.BAT, ...xi.AR, ...xi.BOWL]
            .reduce((sum, p) => sum + p.Price, 0);

        container.innerHTML = `
            <div class="xi-summary">
                <h4>Best XI (${criteria} optimized)</h4>
                <p>Total Cost: ₹${totalCost.toFixed(1)}Cr</p>
                </div>
            <div class="xi-formation">
                ${Object.entries(xi).map(([type, players]) => `
                    <div class="xi-section">
                        <h5>${type}</h5>
                        ${players.map(player => `
                            <div class="xi-player">
                                <strong>${player.Player}</strong>
                                <small>₹${player.Price}Cr • ${player.performance.totalPoints}pts</small>
                </div>
                        `).join('')}
                </div>
                `).join('')}
            </div>
        `;
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        const targetTab = document.getElementById(tabId);
        const targetButton = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetTab && targetButton) {
            targetTab.classList.add('active');
            targetButton.classList.add('active');
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        const toggleButton = document.getElementById('themeToggle');
        
        // Add switching animation
        if (toggleButton) {
            toggleButton.classList.add('switching');
            setTimeout(() => {
                toggleButton.classList.remove('switching');
            }, 300);
        }
        
        html.setAttribute('data-color-scheme', newTheme);
        this.currentTheme = newTheme;
        
        localStorage.setItem('theme', newTheme);
        
        console.log(`🎨 Theme switched to: ${newTheme}`);
    }

    showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'loading-container';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading comprehensive fantasy data...</div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    hideChartContainers() {
        const chartIds = [
            'teamStandingsChart', 'valuePerformanceChart', 'pricePointsChart',
            'investmentChart', 'playerTypeChart', 'experienceChart'
        ];
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

    initializeTabs() {
        // Set up tab navigation functionality
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Initialize first tab as active
        if (tabButtons.length > 0 && tabContents.length > 0) {
            tabButtons[0].classList.add('active');
            tabContents[0].classList.add('active');
        }
        
        // Add click listeners for tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchTab(targetTab);
            });
        });
        
        console.log('✅ Tabs initialized successfully');
    }

    // Additional existing methods would continue here...
    // (renderPlayersTable, updateStats, renderLeaderboards, etc.)
}

// Enhanced Filters Class
class EnhancedFilters {
    constructor(app) {
        this.app = app;
        this.filters = {
            search: '',
            team: '',
            playerType: '',
            priceRange: [0, 50],
            overseas: null,
            experience: ''
        };
        this.setupFilters();
    }

    setupFilters() {
        // Add enhanced filter controls to player analytics tab
        const playerAnalyticsTab = document.getElementById('player-analytics');
        if (playerAnalyticsTab) {
            // Enhanced filters would be added here
        }
    }
}

// Initialize the enhanced dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});