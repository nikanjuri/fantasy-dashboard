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
        
        // Initialize theme immediately
        this.initializeTheme();
        
        this.init();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const html = document.documentElement;
        
        html.setAttribute('data-color-scheme', savedTheme);
        this.currentTheme = savedTheme;
        
        console.log('🎨 Theme initialized:', savedTheme);
        
        // Update theme icon after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.updateThemeIcon();
        }, 50);
    }

    updateThemeIcon() {
        const toggleButton = document.getElementById('themeToggle');
        if (!toggleButton) {
            console.log('❌ Theme toggle button not found');
            return;
        }
        
        const lightIcon = toggleButton.querySelector('.light-icon'); // 💡 bulb
        const darkIcon = toggleButton.querySelector('.dark-icon');   // 🌙 moon
        
        if (!lightIcon || !darkIcon) {
            console.log('❌ Theme icons not found');
            return;
        }
        
        console.log('🎯 Current theme:', this.currentTheme);
        
        // CORRECTED LOGIC: Show the icon for what you want to switch TO
        if (this.currentTheme === 'dark') {
            // In dark mode, show bulb (💡) to switch to light mode
            lightIcon.style.display = 'block';
            lightIcon.style.opacity = '1';
            lightIcon.style.visibility = 'visible';
            darkIcon.style.display = 'none';
            darkIcon.style.opacity = '0';
            darkIcon.style.visibility = 'hidden';
            console.log('🌙 Dark mode: showing light bulb icon');
        } else {
            // In light mode, show moon (🌙) to switch to dark mode
            lightIcon.style.display = 'none';
            lightIcon.style.opacity = '0';
            lightIcon.style.visibility = 'hidden';
            darkIcon.style.display = 'block';
            darkIcon.style.opacity = '1';
            darkIcon.style.visibility = 'visible';
            console.log('☀️ Light mode: showing moon icon');
        }
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
            
            // Initialize theme icons after DOM elements are ready
        setTimeout(() => {
                this.updateThemeIcon();
        }, 100);
            
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

        // Process each match
        Object.entries(this.rawData).forEach(([matchName, matchData]) => {
            const matchInfo = {
                matchName: matchName,
                teams: Object.keys(matchData).filter(key => key !== 'Team Total'),
                teamTotals: {},
                players: []
            };

            Object.entries(matchData).forEach(([teamName, teamData]) => {
                if (teamName === 'Team Total') return;

                const teamTotal = teamData['Team Total'] || 0;
                matchInfo.teamTotals[teamName] = teamTotal;

                if (!teamTotals[teamName]) {
                    teamTotals[teamName] = 0;
                }
                teamTotals[teamName] += teamTotal;

                // Process individual players for this match
                if (teamData.Players && Array.isArray(teamData.Players)) {
                    teamData.Players.forEach(player => {
                        const safeNumber = (val) => typeof val === 'number' && !isNaN(val) ? val : 0;
                        const safeValue = (val) => (val !== null && val !== undefined && !isNaN(val)) ? val : '-';
                        
                        const playerData = {
                            name: player.Player || 'Unknown',
                            team: teamName,
                            runs: safeNumber(player.Score),
                            balls: safeNumber(player.Balls),
                            fours: safeNumber(player['4s']),
                            sixes: safeNumber(player['6s']),
                            strikeRate: safeValue(player.SR),
                            wickets: safeNumber(player.Wickets),
                            dots: safeNumber(player['0s']),
                            economy: safeValue(player.ER),
                            catches: safeNumber(player.Catch) + safeNumber(player.Runout),
                            fantasyPoints: safeNumber(player.Points)
                        };
                        
                        matchInfo.players.push(playerData);

                        // Store in overall player stats
                        const playerKey = player.Player;
                        if (!playerStats[playerKey]) {
                            playerStats[playerKey] = {
                                player: player.Player,
                                name: player.Player,
                                team: teamName,
                                totalPoints: 0,
                                matches: 0,
                                runs: 0,
                    wickets: 0,
                    catches: 0,
                                averagePoints: 0
                            };
                        }

                        playerStats[playerKey].totalPoints += safeNumber(player.Points);
                        playerStats[playerKey].matches += 1;
                        playerStats[playerKey].runs += safeNumber(player.Score);
                        playerStats[playerKey].wickets += safeNumber(player.Wickets);
                        playerStats[playerKey].catches += safeNumber(player.Catch) + safeNumber(player.Runout);
                        playerStats[playerKey].averagePoints = playerStats[playerKey].totalPoints / playerStats[playerKey].matches;
                    });
                }
            });

            matches.push(matchInfo);
        });

        // Create players array for compatibility with existing code
        const players = Object.values(playerStats).sort((a, b) => b.totalPoints - a.totalPoints);

        // Store processed data
        this.data = {
            teamTotals,
            teamStandings: teamTotals,
            playerStats,
            players,
            matches,
            totalMatches: matches.length
        };

        console.log('✅ Fantasy data processed:', this.data);
    }

    processPlayerProfiles() {
        const profiles = {};
        
        // Combine fantasy performance with auction data
        Object.entries(this.playerListData).forEach(([teamName, players]) => {
            players.forEach(player => {
                const fantasyPlayer = this.data.playerStats[player.Player];
                
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
            expensivePicks: allPlayers.filter(p => (p.Price || 0) > 10 && p.pointsPerCrore < 45),
            highRiskReward: allPlayers.filter(p => p.Price >= 15 && p.pointsPerCrore >= 45)
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
        
        // Try reverse mapping for team names - updated for consistency
        const reverseMap = {
            'Sher-e-Punjab': 'Sher-e-Punjab',
            'The Kingsmen': 'The Kingsmen'
        };
        
        const fantasyTeamName = reverseMap[playerListTeamName] || playerListTeamName;
        return this.data.teamStandings[fantasyTeamName] || 0;
    }

    // Enhanced UI Update Methods
    updateAllDashboards() {
        this.updateTeamOverview();
        this.updateEnhancedTeamCards();
        this.updateAuctionAnalysis();
        this.updateTeamAuctionTables();
        this.updateVFMTable();
        this.updateTeamComposition();
        this.updateStats();
        this.updateScoringRules();
        this.updateMatchSelector();
        this.setupCharts();
    }

    updateTeamOverview() {
        // Update enhanced stats
        const totalPlayers = Object.values(this.data.playerProfiles).length;
        const totalInvestment = Object.values(this.data.teamCompositions)
            .reduce((sum, team) => sum + team.totalInvestment, 0);
        const avgPrice = totalInvestment / totalPlayers;

        // Find most expensive player
        let mostExpensivePlayer = null;
        let highestPrice = 0;
        
        Object.values(this.data.playerProfiles).forEach(player => {
            if (player.Price > highestPrice) {
                highestPrice = player.Price;
                mostExpensivePlayer = player;
            }
        });

        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('totalInvestment').textContent = `₹${totalInvestment.toFixed(1)} Cr`;
        document.getElementById('avgPrice').textContent = `₹${avgPrice.toFixed(1)} Cr`;
        
        // Update most expensive player display
        if (mostExpensivePlayer) {
            document.getElementById('mostExpensivePlayer').textContent = mostExpensivePlayer.Player;
        } else {
            document.getElementById('mostExpensivePlayer').textContent = '-';
        }

        // Update enhanced team cards
        this.updateEnhancedTeamCards();
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

        // Team colors for subtle tints and accents
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',       
            'Silly Pointers': '#3b82f6',      
            'The Kingsmen': '#10b981'         
        };

        // Dark backgrounds with subtle color tints
        const teamBackgrounds = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.1)',     // Subtle pink tint
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.1)',      // Subtle orange tint
            'Silly Pointers': 'rgba(59, 130, 246, 0.1)',     // Subtle blue tint
            'The Kingsmen': 'rgba(16, 185, 129, 0.1)'        // Subtle green tint
        };

        // Subtle border colors
        const teamBorderColors = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.3)',
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.3)', 
            'Silly Pointers': 'rgba(59, 130, 246, 0.3)',
            'The Kingsmen': 'rgba(16, 185, 129, 0.3)'
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

        const cardsHTML = sortedTeams.map(({team, points, rank, composition}) => {
            const bgColor = teamBackgrounds[team] || 'rgba(128, 128, 128, 0.1)';
            const borderColor = teamBorderColors[team] || 'rgba(128, 128, 128, 0.3)';
            const accentColor = teamColors[team] || '#007bff';
            
            return `
                <div class="enhanced-team-card" data-team="${team}" style="background: ${bgColor}; border: 1px solid ${borderColor};">
                    <div class="team-header">
                        <h4>${team}</h4>
                        <div class="team-rank" style="background: ${accentColor};">#${rank}</div>
                    </div>
                    <div class="team-points">${points.toLocaleString()} pts</div>
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
            `;
        }).join('');

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
            'Sher-e-Punjab': 'Sher-e-Punjab',
            'The Kingsmen': 'The Kingsmen',
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

        // Update high-risk, high-reward
        const highRiskContainer = document.getElementById('highRiskReward');
        if (highRiskContainer) {
            // Filter premium players (₹15Cr+) with decent returns (45+ pts/₹Cr)
            const highRiskReward = this.data.auctionData.allPlayers
                .filter(player => player.Price >= 15 && player.pointsPerCrore >= 45)
                .sort((a, b) => b.performance.totalPoints - a.performance.totalPoints)
                .slice(0, 5);

            highRiskContainer.innerHTML = highRiskReward
                .map(player => `
                    <div class="highrisk-item">
                        <strong>${player.Player}</strong>
                        <div class="highrisk-details">
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
        const hiddenTableBody = document.getElementById('vfmTableBodyHidden');
        const expandControls = document.getElementById('vfmExpandControls');
        
        if (!tableBody) return;

        const allPlayers = this.data.auctionData.allPlayers;
        const visiblePlayers = allPlayers.slice(0, 15);
        const hiddenPlayers = allPlayers.slice(15, 30);

        const themeColors = this.getThemeColors();

        // Enhanced team colors with maximum visibility on both backgrounds
        const teamColors = {
            'Royal Smashers': '#ff6384',      // Pink/Red - good visibility
            'Sher-e-Punjab': '#f59e0b',       // Bright orange/amber - very visible
            'Silly Pointers': '#3b82f6',      // Bright blue - good visibility  
            'The Kingsmen': '#10b981'         // Bright emerald green - very visible
        };

        // Function to create table row with theme-aware colors
        const createTableRow = (player, index) => {
            const teamColor = teamColors[player.fantasyTeam] || themeColors.textColor;
            const rankColor = index < 5 ? '#4ade80' : index < 10 ? '#fbbf24' : '#94a3b8';
            
            return `
                <tr>
                    <td>
                        <div class="vfm-player-cell">
                            <span class="vfm-rank" style="background: ${rankColor}">${index + 1}</span>
                            <strong style="color: ${teamColor}">${player.Player}</strong>
                        </div>
                    </td>
                    <td style="color: ${teamColor}; font-weight: 500">${player.fantasyTeam}</td>
                    <td style="color: ${themeColors.subtleTextColor}">₹${player.Price.toFixed(1)}</td>
                    <td style="color: ${themeColors.textColor}; font-weight: 600">${player.performance.totalPoints}</td>
                    <td style="color: #4ade80; font-weight: 600">${player.pointsPerCrore.toFixed(1)}</td>
                    <td><span class="value-badge ${player.valueForMoney.toLowerCase()}">${player.valueForMoney}</span></td>
                </tr>
            `;
        };

        // Populate visible rows
        tableBody.innerHTML = visiblePlayers.map((player, index) => createTableRow(player, index)).join('');

        // Populate hidden rows if they exist
        if (hiddenTableBody && hiddenPlayers.length > 0) {
            hiddenTableBody.innerHTML = hiddenPlayers.map((player, index) => createTableRow(player, index + 15)).join('');
            
            // Show expand controls if there are hidden rows
            if (expandControls) {
                expandControls.style.display = 'flex';
            }
        }

        // Add global toggle function for VFM table
        window.toggleVFMRows = function() {
            const hiddenRows = document.getElementById('vfmTableBodyHidden');
            const button = document.querySelector('.vfm-expand-btn');
            const expandText = button.querySelector('.vfm-expand-text');
            const collapseText = button.querySelector('.vfm-collapse-text');
            const expandIcon = button.querySelector('.vfm-expand-icon');
            
            if (hiddenRows.style.display === 'none') {
                hiddenRows.style.display = 'table-row-group';
                expandText.style.display = 'none';
                collapseText.style.display = 'inline';
                expandIcon.textContent = '▲';
            } else {
                hiddenRows.style.display = 'none';
                expandText.style.display = 'inline';
                collapseText.style.display = 'none';
                expandIcon.textContent = '▼';
            }
        };
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
                                <span class="rule-points" ${points < 0 ? 'data-negative="true"' : ''}>${points > 0 ? '+' : ''}${points}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
    }

    // Enhanced Chart Methods
    setupCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, skipping chart creation');
            return;
        }

        this.createPricePointsChart();
        this.createInvestmentChart();
        this.createPlayerTypeChart();
        this.createExperienceChart();
    }

    createPricePointsChart() {
        const ctx = document.getElementById('pricePointsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const themeColors = this.getThemeColors();

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
                    label: 'Players',
                    data: playerData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 10,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: themeColors.backgroundColor,
                        titleColor: themeColors.textColor,
                        bodyColor: themeColors.textColor,
                        borderColor: themeColors.subtleTextColor,
                        borderWidth: 1,
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
                            text: 'Price (₹Cr)',
                            color: themeColors.textColor,
                            font: {
                                size: 14,
                                weight: 'normal'
                            }
                        },
                        ticks: {
                            color: themeColors.subtleTextColor,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            color: themeColors.borderColor,
                            width: 2
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Fantasy Points',
                            color: themeColors.textColor,
                            font: {
                                size: 14,
                                weight: 'normal'
                            }
                        },
                        ticks: {
                            color: themeColors.subtleTextColor,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        },
                        border: {
                            color: themeColors.borderColor,
                            width: 2
                        }
                    }
                }
            }
        });
    }

    createPlayerTypeChart() {
        // Implementation of createPlayerTypeChart method
    }

    createExperienceChart() {
        // Implementation of createExperienceChart method
    }

    createInvestmentChart() {
        const ctx = document.getElementById('investmentChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const themeColors = this.getThemeColors();

        // Define price brackets
        const priceRanges = {
            'Budget (< ₹5Cr)': { min: 0, max: 5, count: 0, players: [] },
            'Mid-range (₹5-10Cr)': { min: 5, max: 10, count: 0, players: [] },
            'Premium (₹10-20Cr)': { min: 10, max: 20, count: 0, players: [] },
            'Superstars (> ₹20Cr)': { min: 20, max: 999, count: 0, players: [] }
        };

        // Count players in each price bracket
        this.data.auctionData.allPlayers.forEach(player => {
            Object.entries(priceRanges).forEach(([range, bracket]) => {
                if (player.Price >= bracket.min && player.Price < bracket.max) {
                    bracket.count++;
                    bracket.players.push(player);
                }
            });
        });

        const chartData = {
            labels: Object.keys(priceRanges),
                datasets: [{
                data: Object.values(priceRanges).map(range => range.count),
                backgroundColor: ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444'],
                borderColor: themeColors.borderColor,
                borderWidth: 1
            }]
        };

        // Destroy existing chart if it exists
        if (this.charts.investmentChart) {
            this.charts.investmentChart.destroy();
        }

        this.charts.investmentChart = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: themeColors.subtleTextColor,  // Use theme-responsive color
                            usePointStyle: false,
                            font: {
                                size: 12,
                                family: 'Arial, sans-serif'
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i]} players`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    fontColor: themeColors.subtleTextColor,  // Use theme-responsive color
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: themeColors.backgroundColor,
                        titleColor: themeColors.textColor,
                        bodyColor: themeColors.textColor,
                        borderColor: themeColors.subtleTextColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} players (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
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
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.updateThemeIcon();
        
        // Refresh charts with new theme colors
        this.setupCharts();
        
        // Refresh VFM table with new theme colors
        this.updateVFMTable();
        
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
            'valuePerformanceChart', 'pricePointsChart',
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

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            console.log('✅ Theme toggle listener added');
        }
        
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
        console.log('✅ Tab navigation listeners added:', tabButtons.length);
        
        // Generate Best XI button
        const generateXIBtn = document.getElementById('generateXI');
        if (generateXIBtn) {
            generateXIBtn.addEventListener('click', () => this.generateBestXI());
            console.log('✅ Generate XI button listener added');
        }
        
        // Match selector
        const matchSelector = document.getElementById('matchSelector');
        if (matchSelector) {
            matchSelector.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.updateMatchDetails(parseInt(e.target.value));
                } else {
                    // Clear match details when "Select Match" is chosen
                    this.clearMatchDetails();
                }
            });
            console.log('✅ Match selector listener added');
        }
        
        // Search and filter controls
        const playerSearch = document.getElementById('playerSearch');
        if (playerSearch) {
            playerSearch.addEventListener('input', (e) => this.handlePlayerSearch(e.target.value));
        }
        
        const teamFilter = document.getElementById('teamFilter');
        if (teamFilter) {
            teamFilter.addEventListener('change', (e) => this.handleTeamFilter(e.target.value));
        }
        
        const positionFilter = document.getElementById('positionFilter');
        if (positionFilter) {
            positionFilter.addEventListener('change', (e) => this.handlePositionFilter(e.target.value));
        }
        
        console.log('✅ All event listeners setup complete');
    }

    handlePlayerSearch(searchTerm) {
        console.log('🔍 Player search:', searchTerm);
        // Add search functionality here if needed
    }

    handleTeamFilter(team) {
        console.log('🏏 Team filter:', team);
        // Add team filtering functionality here if needed
    }

    handlePositionFilter(position) {
        console.log('📍 Position filter:', position);
        // Add position filtering functionality here if needed
    }

    filterByTeam(teamName) {
        console.log('🎯 Filter by team:', teamName);
        // Add team filtering functionality here if needed
    }

    renderPlayersTable() {
        console.log('📊 Rendering players table...');
        const tableBody = document.getElementById('playersTableBody');
        if (!tableBody) {
            console.log('❌ playersTableBody not found, skipping table render');
            return;
        }

        // Simple player table rendering
        const topPlayers = this.data.players.slice(0, 20);
        tableBody.innerHTML = topPlayers.map(player => `
            <tr>
                <td><strong>${player.player}</strong></td>
                <td>${player.team}</td>
                <td>${player.totalPoints}</td>
                <td>${player.runs}</td>
                <td>${player.wickets}</td>
                <td>${player.catches}</td>
                <td>${player.matchesPlayed}</td>
            </tr>
        `).join('');
        
        console.log('✅ Players table rendered with', topPlayers.length, 'players');
    }

    renderLeaderboards() {
        console.log('🏆 Rendering leaderboards...');
        
        // Top Scorers
        const topScorersContainer = document.getElementById('topScorers');
        if (topScorersContainer) {
            const topScorers = this.data.players
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, 5);

            topScorersContainer.innerHTML = topScorers.map((player, index) => `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-player">${player.player}</span>
                    <span class="leaderboard-value">${player.totalPoints} pts</span>
                </div>
            `).join('');
        }
        
        // Top Batsmen
        const topBatsmenContainer = document.getElementById('topBatsmen');
        if (topBatsmenContainer) {
            const topBatsmen = this.data.players
                .sort((a, b) => b.runs - a.runs)
                .slice(0, 5);
            
            topBatsmenContainer.innerHTML = topBatsmen.map((player, index) => `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-player">${player.player}</span>
                    <span class="leaderboard-value">${player.runs} runs</span>
                </div>
            `).join('');
        }
        
        // Top Bowlers
        const topBowlersContainer = document.getElementById('topBowlers');
        if (topBowlersContainer) {
            const topBowlers = this.data.players
                .sort((a, b) => b.wickets - a.wickets)
                .slice(0, 5);
            
            topBowlersContainer.innerHTML = topBowlers.map((player, index) => `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-player">${player.player}</span>
                    <span class="leaderboard-value">${player.wickets} wickets</span>
                </div>
            `).join('');
        }
        
        console.log('✅ Leaderboards rendered');
    }

    updateMatchSelector() {
        const matchSelector = document.getElementById('matchSelector');
        if (!matchSelector || !this.data.matches) return;

        // Clear existing options except the first one
        matchSelector.innerHTML = '<option value="">Select Match</option>';
        
        // Add match options
        this.data.matches.forEach((match, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = match.matchName;
            matchSelector.appendChild(option);
        });
        
        console.log('✅ Match selector updated with', this.data.matches.length, 'matches');
    }

    updateMatchDetails(matchIndex) {
        if (!this.data.matches || !this.data.matches[matchIndex]) return;
        
        const match = this.data.matches[matchIndex];
        const scorecardContainer = document.getElementById('matchScorecard');
        const playerDetailsContainer = document.getElementById('playerPerformanceDetails');
        
        if (!scorecardContainer || !playerDetailsContainer) return;
        
        // Team colors for consistency
        const teamColors = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.1)',     // Light pink background
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.1)',      // Light orange background  
            'Silly Pointers': 'rgba(59, 130, 246, 0.1)',     // Light blue background
            'The Kingsmen': 'rgba(16, 185, 129, 0.1)'        // Light green background - changed from rgba(75, 192, 192, 0.8)
        };

        const teamBorderColors = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.8)',
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.8)',      // Orange border
            'Silly Pointers': 'rgba(59, 130, 246, 0.8)',     // Blue border  
            'The Kingsmen': 'rgba(16, 185, 129, 0.8)'        // Green border - changed from rgba(75, 192, 192, 0.8)
        };
        
        // Find the winning team
        const winningTeam = Object.entries(match.teamTotals)
            .sort(([,a], [,b]) => b - a)[0][0];
        
        // Create team performance cards (without player table)
        const teamCardsHTML = Object.entries(match.teamTotals)
            .sort(([,a], [,b]) => b - a)
            .map(([teamName, total]) => {
                const bgColor = teamColors[teamName] || 'rgba(128, 128, 128, 0.1)';
                const borderColor = teamBorderColors[teamName] || 'rgba(128, 128, 128, 0.8)';
                const isWinner = teamName === winningTeam;
                
                return `
                    <div class="match-team-card" style="background: ${bgColor}; border: 2px solid ${borderColor};">
                        <h4>${isWinner ? '🏆 ' : ''}${teamName}</h4>
                        <div class="team-match-points">${total.toFixed(1)} pts</div>
                </div>
                `;
            }).join('');
        
        // Create scorecard HTML (without player table)
        const scorecardHTML = `
            <div class="match-info">
                <div class="team-cards-container">
                    ${teamCardsHTML}
                </div>
                </div>
        `;
        
        scorecardContainer.innerHTML = scorecardHTML;
        
        // Group players by team and sort within teams
        const playersByTeam = {};
        match.players.forEach(player => {
            if (!playersByTeam[player.team]) {
                playersByTeam[player.team] = [];
            }
            playersByTeam[player.team].push(player);
        });
        
        // Sort players within each team by fantasy points
        Object.keys(playersByTeam).forEach(team => {
            playersByTeam[team].sort((a, b) => b.fantasyPoints - a.fantasyPoints);
        });
        
        // Create enhanced player performance table
        const playerDetailsHTML = `
            ${Object.entries(playersByTeam).map(([teamName, players]) => {
                const bgColor = teamColors[teamName] || 'rgba(128, 128, 128, 0.1)';
                const borderColor = teamBorderColors[teamName] || 'rgba(128, 128, 128, 0.8)';
                
                return `
                    <div class="team-section" style="border-left: 4px solid ${borderColor};">
                        <div class="team-section-header" style="background: ${bgColor};">
                            <h5>${teamName}</h5>
                            <span class="team-section-total">${match.teamTotals[teamName].toFixed(1)} pts</span>
                </div>
                        <div class="team-players-table">
                            <table class="players-table enhanced-table">
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Runs</th>
                                        <th>Balls</th>
                                        <th>4s</th>
                                        <th>6s</th>
                                        <th>SR</th>
                                        <th>Wickets</th>
                                        <th>Dots</th>
                                        <th>Economy</th>
                                        <th>Fielding Points</th>
                                        <th>Total Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${players.map(player => `
                                        <tr>
                                            <td><strong>${player.name}</strong></td>
                                            <td>${player.runs}</td>
                                            <td>${player.balls}</td>
                                            <td>${player.fours}</td>
                                            <td>${player.sixes}</td>
                                            <td>${player.strikeRate}</td>
                                            <td>${player.wickets}</td>
                                            <td>${player.dots}</td>
                                            <td>${player.economy}</td>
                                            <td>${player.catches}</td>
                                            <td><strong>${player.fantasyPoints}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                </div>
            </div>
        `;
            }).join('')}
        `;
        
        playerDetailsContainer.innerHTML = playerDetailsHTML;
        
        // Add toggle functionality for player details
        const toggleButton = document.getElementById('togglePlayerDetails');
        const playerDetailsDiv = document.getElementById('playerPerformanceDetails');
        let isExpanded = true;
        
        if (toggleButton && playerDetailsDiv) {
            toggleButton.addEventListener('click', () => {
                isExpanded = !isExpanded;
                playerDetailsDiv.style.display = isExpanded ? 'block' : 'none';
                toggleButton.textContent = isExpanded ? 'Collapse Details' : 'Show Details';
            });
        }
        
        // Update the points breakdown chart
        this.createMatchPointsChart(match);
        
        console.log('✅ Match details updated for:', match.matchName);
    }

    clearMatchDetails() {
        // Clear match scorecard container
        const scorecardContainer = document.getElementById('matchScorecard');
        if (scorecardContainer) {
            scorecardContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 20px;">Please select a match to view details.</p>';
        }
        
        // Clear player performance details container
        const playerDetailsContainer = document.getElementById('playerPerformanceDetails');
        if (playerDetailsContainer) {
            playerDetailsContainer.innerHTML = '<p style="color: var(--color-text-secondary); text-align: center; padding: 20px;">Player\'s Match details will appear here.</p>';
        }
        
        // Clear the match points chart
        const ctx = document.getElementById('matchPointsChart');
        if (ctx && this.charts.matchPoints) {
            this.charts.matchPoints.destroy();
            this.charts.matchPoints = null;
        }
        
        console.log('✅ Match details cleared');
    }

    createMatchPointsChart(match) {
        const ctx = document.getElementById('matchPointsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        // Team colors
        const teamColors = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.8)',
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.8)',      // Orange
            'Silly Pointers': 'rgba(59, 130, 246, 0.8)',     // Blue
            'The Kingsmen': 'rgba(16, 185, 129, 0.8)'        // Green - changed from rgba(75, 192, 192, 0.8)
        };

        // Prepare data for pie chart
        const chartData = [];
        const chartLabels = [];
        const chartColors = [];
        
        // Group players by team and handle "Others"
        const playersByTeam = {};
        match.players.forEach(player => {
            if (!playersByTeam[player.team]) {
                playersByTeam[player.team] = [];
            }
            playersByTeam[player.team].push(player);
        });
        
        Object.entries(playersByTeam).forEach(([teamName, players]) => {
            const teamColor = teamColors[teamName] || 'rgba(128, 128, 128, 0.8)';
            
            // Individual players with >= 25 points
            const significantPlayers = players.filter(p => p.fantasyPoints >= 25);
            const otherPlayers = players.filter(p => p.fantasyPoints < 25);
            
            // Add significant players
            significantPlayers.forEach(player => {
                chartData.push(player.fantasyPoints);
                chartLabels.push(player.name);
                chartColors.push(teamColor);
            });
            
            // Add "Others" group if there are any
            if (otherPlayers.length > 0) {
                const othersTotal = otherPlayers.reduce((sum, p) => sum + p.fantasyPoints, 0);
                if (othersTotal > 0) {
                    chartData.push(othersTotal);
                    chartLabels.push(`Others - ${teamName}`);
                    chartColors.push(teamColor.replace('0.8', '0.4')); // Lighter shade for others
                }
            }
        });

        // Destroy existing chart if it exists
        if (this.charts.matchPoints) {
            this.charts.matchPoints.destroy();
        }

        this.charts.matchPoints = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderColor: chartColors.map(color => color.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} pts (${percentage}%)`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        bottom: 40
                    }
                }
            }
        });
    }

    updateTeamAuctionTables() {
        const container = document.getElementById('teamAuctionTables');
        if (!container) return;

        const teams = ['Royal Smashers', 'Sher-e-Punjab', 'Silly Pointers', 'The Kingsmen'];
        
        // Team colors for styling
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',       // Changed from #ffce56 - bright orange/amber
            'Silly Pointers': '#3b82f6',      // Changed from #36a2eb - bright blue
            'The Kingsmen': '#10b981'         // Changed from #4bc0c0 - bright emerald green
        };

        let tablesHTML = '<div class="team-auction-tables-grid">';

        teams.forEach((teamName, index) => {
            const teamKey = this.findCompositionKey(teamName);
            const teamPlayers = this.playerListData[teamKey] || [];
            
            if (teamPlayers.length === 0) return;

            // Calculate team total
            const totalPurchase = teamPlayers.reduce((sum, p) => sum + (p.Price || 0), 0);
            const teamColor = teamColors[teamName];
            const tableId = `team-table-${index}`;

            // Sort players by purchase price (highest first)
            const sortedPlayers = [...teamPlayers].sort((a, b) => (b.Price || 0) - (a.Price || 0));
            
            // Split into visible and hidden rows
            const visibleRows = sortedPlayers.slice(0, 5);
            const hiddenRows = sortedPlayers.slice(5);

            tablesHTML += `
                <div class="team-auction-table-card">
                    <div class="team-table-header" style="border-left: 4px solid ${teamColor}">
                        <h4 style="color: ${teamColor}">${teamName}</h4>
                        <div class="team-total">
                            Total: <span style="color: ${teamColor}">₹${totalPurchase.toFixed(1)}Cr</span>
                </div>
                    </div>
                    <div class="auction-table-container">
                        <table class="auction-table">
                            <thead>
                                <tr>
                                    <th style="color: ${teamColor}">Player</th>
                                    <th style="color: #cccccc">Base Price</th>
                                    <th style="color: #cccccc">Purchase Price</th>
                                </tr>
                            </thead>
                            <tbody id="${tableId}-visible">
            `;

            // Add visible rows
            visibleRows.forEach(player => {
                const basePrice = player.Base || 0;
                const purchasePrice = player.Price || 0;

                tablesHTML += `
                    <tr>
                        <td class="player-name">${player.Player}</td>
                        <td style="color: #aaaaaa">₹${basePrice.toFixed(1)}Cr</td>
                        <td style="color: #ffffff">₹${purchasePrice.toFixed(1)}Cr</td>
                    </tr>
                `;
            });

            tablesHTML += `
                            </tbody>
                            <tbody id="${tableId}-hidden" class="hidden-rows" style="display: none;">
            `;

            // Add hidden rows
            hiddenRows.forEach(player => {
                const basePrice = player.Base || 0;
                const purchasePrice = player.Price || 0;

                tablesHTML += `
                    <tr>
                        <td class="player-name">${player.Player}</td>
                        <td style="color: #aaaaaa">₹${basePrice.toFixed(1)}Cr</td>
                        <td style="color: #ffffff">₹${purchasePrice.toFixed(1)}Cr</td>
                    </tr>
                `;
            });

            tablesHTML += `
                            </tbody>
                        </table>
            `;

            // Add expand/collapse button if there are hidden rows
            if (hiddenRows.length > 0) {
                tablesHTML += `
                    <div class="table-expand-controls">
                        <button class="expand-btn" onclick="toggleTableRows('${tableId}')" style="color: ${teamColor}; border-color: ${teamColor}">
                            <span class="expand-text">Show All (${sortedPlayers.length})</span>
                            <span class="collapse-text" style="display: none">Show Less</span>
                            <span class="expand-icon">▼</span>
                        </button>
                </div>
                `;
            }

            tablesHTML += `
                </div>
                </div>
            `;
        });

        tablesHTML += '</div>';
        container.innerHTML = tablesHTML;

        // Add global toggle function to window for onclick handlers
        window.toggleTableRows = function(tableId) {
            const hiddenRows = document.getElementById(`${tableId}-hidden`);
            const button = document.querySelector(`[onclick="toggleTableRows('${tableId}')"]`);
            const expandText = button.querySelector('.expand-text');
            const collapseText = button.querySelector('.collapse-text');
            const expandIcon = button.querySelector('.expand-icon');
            
            // Check if we're on desktop (where sync behavior should be enabled)
            const isDesktop = window.innerWidth > 768;
            
            if (hiddenRows.style.display === 'none') {
                // Expanding - show hidden rows
                hiddenRows.style.display = 'table-row-group';
                expandText.style.display = 'none';
                collapseText.style.display = 'inline';
                expandIcon.textContent = '▲';
                
                // On desktop, expand all other team tables too
                if (isDesktop) {
                    document.querySelectorAll('.expand-btn').forEach(otherButton => {
                        if (otherButton !== button) {
                            const otherTableId = otherButton.getAttribute('onclick')?.match(/toggleTableRows\('([^']+)'\)/)?.[1];
                            if (otherTableId) {
                                const otherHiddenRows = document.getElementById(`${otherTableId}-hidden`);
                                const otherExpandText = otherButton.querySelector('.expand-text');
                                const otherCollapseText = otherButton.querySelector('.collapse-text');
                                const otherExpandIcon = otherButton.querySelector('.expand-icon');
                                
                                if (otherHiddenRows && otherHiddenRows.style.display === 'none') {
                                    otherHiddenRows.style.display = 'table-row-group';
                                    otherExpandText.style.display = 'none';
                                    otherCollapseText.style.display = 'inline';
                                    otherExpandIcon.textContent = '▲';
                                }
                            }
                        }
                    });
                }
            } else {
                // Collapsing - hide rows
                hiddenRows.style.display = 'none';
                expandText.style.display = 'inline';
                collapseText.style.display = 'none';
                expandIcon.textContent = '▼';
                
                // On desktop, collapse all other team tables too
                if (isDesktop) {
                    document.querySelectorAll('.expand-btn').forEach(otherButton => {
                        if (otherButton !== button) {
                            const otherTableId = otherButton.getAttribute('onclick')?.match(/toggleTableRows\('([^']+)'\)/)?.[1];
                            if (otherTableId) {
                                const otherHiddenRows = document.getElementById(`${otherTableId}-hidden`);
                                const otherExpandText = otherButton.querySelector('.expand-text');
                                const otherCollapseText = otherButton.querySelector('.collapse-text');
                                const otherExpandIcon = otherButton.querySelector('.expand-icon');
                                
                                if (otherHiddenRows && otherHiddenRows.style.display !== 'none') {
                                    otherHiddenRows.style.display = 'none';
                                    otherExpandText.style.display = 'inline';
                                    otherCollapseText.style.display = 'none';
                                    otherExpandIcon.textContent = '▼';
                                }
                            }
                        }
                    });
                }
                
                // Scroll back to team tables section when collapsed
                setTimeout(() => {
                    const teamTablesContainer = document.getElementById('teamAuctionTables');
                    if (teamTablesContainer) {
                        teamTablesContainer.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                            inline: 'nearest'
                        });
                    }
                }, 150); // Small delay to ensure DOM updates are complete
            }
        };
    }

    // Add this helper method to get theme-appropriate colors
    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        return {
            textColor: isDark ? '#ffffff' : '#000000',
            subtleTextColor: isDark ? '#cccccc' : '#666666',
            borderColor: isDark ? '#ffffff' : '#000000',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'
        };
    }
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