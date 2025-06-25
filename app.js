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
        this.sortDirection = { matchesPlayed: 'desc', totalPoints: 'desc', runs: 'desc', fours: 'desc', sixes: 'desc', strikeRate: 'desc', wickets: 'desc', dots: 'desc', economyRate: 'desc' };
        this.enhancedFilters = null;
        this.showAllPlayers = false;
        
        // Initialize theme immediately
        this.initializeTheme();
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
        try {
            this.showLoading();
            console.log('📝 Starting initialization...');
            
            // Initialize theme
            this.initializeTheme();
            console.log('✅ Theme initialized');
            
            // Load all data
            console.log('📂 Loading data...');
            await this.loadAllData();
            console.log('✅ Data loaded');
            
            // Process loaded data
            console.log('🔄 Processing data...');
            this.processAllData();
            console.log('✅ Data processed');
            
            // Update all dashboard sections
            console.log('🔄 Updating dashboard sections...');
            this.updateAllDashboards();
            console.log('✅ Dashboard sections updated');
            
            // Initialize tabs
            console.log('🔄 Initializing tabs...');
            this.initializeTabs();
            console.log('✅ Tabs initialized');
            
            // Setup event listeners
            console.log('🔄 Setting up event listeners...');
            this.setupEventListeners();
            console.log('✅ Event listeners set up');
            
            // Setup table sorting
            console.log('🔄 Setting up table sorting...');
            this.setupTableSorting();
            console.log('✅ Table sorting set up');
            
            // Initialize player filters
            console.log('🔄 Initializing player filters...');
            this.initializePlayerFilters();
            console.log('✅ Player filters initialized');
            
            // Populate player stat tables with processed fantasy data
            console.log('🔄 Populating player stat tables...');
            if (this.fantasyData && Array.isArray(this.fantasyData)) {
                console.log('📊 Processing', this.fantasyData.length, 'matches for stat tables');
                this.populatePlayerStatTables(this.fantasyData);
                console.log('✅ Stat tables populated');
            } else {
                console.error('❌ Fantasy data not in expected format:', this.fantasyData);
                throw new Error('Fantasy data not in expected format for stat tables');
            }
            
            this.hideLoading();
            console.log('✅ Dashboard initialization complete!');
        } catch (error) {
            console.error('❌ Error initializing dashboard:', error);
            this.showError(`Failed to initialize dashboard: ${error.message}. Please try refreshing the page.`);
            throw error;
        }
    }

    async loadAllData() {
        try {
            console.log('📂 Loading data files...');
            
            // Load all three JSON files
            const [fantasyResponse, playerListResponse, scoringResponse] = await Promise.all([
                fetch('data/Fantasy_Points_2025.json'),
                fetch('data/Player_List_By_Team.json'),
                fetch('data/Scoring_System.json')
            ]);

            // Check responses
            if (!fantasyResponse.ok) throw new Error(`Failed to load fantasy data: ${fantasyResponse.status}`);
            if (!playerListResponse.ok) throw new Error(`Failed to load player list: ${playerListResponse.status}`);
            if (!scoringResponse.ok) throw new Error(`Failed to load scoring system: ${scoringResponse.status}`);

            // Process fantasy points data
            console.log('📝 Loading fantasy data...');
            const rawText = await fantasyResponse.text();
            const cleanedText = rawText.replace(/:\s*NaN/g, ': null');
            this.rawData = JSON.parse(cleanedText);
            
            if (!this.rawData || typeof this.rawData !== 'object') {
                throw new Error('Invalid fantasy data format');
            }
            console.log('✅ Fantasy data loaded:', Object.keys(this.rawData).length, 'matches');

            // Load player list
            console.log('📝 Loading player list...');
            this.playerListData = await playerListResponse.json();
            if (!this.playerListData || typeof this.playerListData !== 'object') {
                throw new Error('Invalid player list format');
            }
            console.log('✅ Player list loaded:', Object.keys(this.playerListData).length, 'teams');

            // Load scoring system
            console.log('📝 Loading scoring system...');
            this.scoringSystemData = await scoringResponse.json();
            if (!this.scoringSystemData || typeof this.scoringSystemData !== 'object') {
                throw new Error('Invalid scoring system format');
            }
            console.log('✅ Scoring system loaded');

            return true;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw error;
        }
    }

    processAllData() {
        if (!this.rawData || !this.playerListData || !this.scoringSystemData) {
            console.warn('Missing required data for processing');
            return;
        }

        // Process fantasy points data first
        this.processFantasyData();
        
        // Process player profiles with fantasy data
        this.processPlayerProfiles();
        
        // Process team compositions
        this.processTeamCompositions();
        
        // Process auction analysis
        this.processAuctionData();
        
        console.log('✅ All data processed successfully');
    }

    processFantasyData() {
        if (!this.rawData || typeof this.rawData !== 'object') {
            console.error('Invalid raw data format');
            return;
        }

        console.log('🔄 Starting fantasy data processing...');

        // Initialize data structures
        this.data = {
            teamTotals: {},
            teamStandings: {},  // Add team standings structure
            playerStats: {},
            players: [],
            matches: []
        };

        // Process each match WEEK
        Object.entries(this.rawData).forEach(([matchWeekName, matchWeekData]) => {
            console.log(`📅 Processing match week: ${matchWeekName}`);
            
            // Process each MATCH within the week
            Object.entries(matchWeekData).forEach(([matchName, matchData]) => {
                console.log(`🏏 Processing match: ${matchName}`);
                
                const matchInfo = {
                    matchWeek: matchWeekName,
                    matchName: matchName,
                    teams: Object.keys(matchData).filter(key => key !== 'Team Total'),
                    teamTotals: {},
                    players: []
                };

                // Process each FANTASY TEAM in the match
                Object.entries(matchData).forEach(([fantasyTeamName, teamData]) => {
                    if (fantasyTeamName === 'Team Total') return;
                    
                    if (!teamData || typeof teamData !== 'object') {
                        console.warn(`⚠️ Skipping invalid team data for ${fantasyTeamName} in ${matchName}`);
                        return;
                    }

                    // Extract team total and players list from nested structure
                    let teamTotal = 0;
                    let playersList = [];

                    if (teamData.Players) {
                        if (Array.isArray(teamData.Players)) {
                            playersList = teamData.Players;
                            teamTotal = teamData['Team Total'] || 0;
                        } else if (teamData.Players.Players && Array.isArray(teamData.Players.Players)) {
                            playersList = teamData.Players.Players;
                            teamTotal = teamData.Players['Team Total'] || 0;
                        }
                    }

                    console.log(`📊 Team ${fantasyTeamName} scored ${teamTotal} points in ${matchName}`);
                    
                    matchInfo.teamTotals[fantasyTeamName] = teamTotal;

                    // Initialize team standings if not exists
                    if (!this.data.teamStandings[fantasyTeamName]) {
                        this.data.teamStandings[fantasyTeamName] = {
                            name: fantasyTeamName,
                            matches: 0,
                            totalPoints: 0,
                            averagePoints: 0,
                            highestScore: 0,
                            lowestScore: Number.MAX_VALUE
                        };
                        console.log(`🆕 Initialized standings for ${fantasyTeamName}`);
                    }

                    // Update team standings
                    const standings = this.data.teamStandings[fantasyTeamName];
                    standings.matches++;
                    standings.totalPoints += teamTotal;
                    standings.averagePoints = standings.totalPoints / standings.matches;
                    standings.highestScore = Math.max(standings.highestScore, teamTotal);
                    standings.lowestScore = Math.min(standings.lowestScore, teamTotal);

                    console.log(`📈 Updated standings for ${fantasyTeamName}:`, {
                        matches: standings.matches,
                        totalPoints: standings.totalPoints,
                        avgPoints: standings.averagePoints
                    });

                    // Process individual players
                    playersList.forEach(player => {
                        if (!player || !player.Player) return;

                        const safeNumber = (val) => typeof val === 'number' && !isNaN(val) ? val : 0;
                        
                        const strikeRateCalc = player.Balls ? ((safeNumber(player.Score) / safeNumber(player.Balls)) * 100).toFixed(1) : '−';
                        const economyCalc = (typeof player.ER === 'number') ? player.ER.toFixed(1) : '−';
                        const catchesTotal = safeNumber(player.Catch) + safeNumber(player.Runout);

                        const playerData = {
                            name: player.Player,
                            team: fantasyTeamName,
                            runs: safeNumber(player.Score),
                            balls: safeNumber(player.Balls),
                            fours: safeNumber(player['4s']),
                            sixes: safeNumber(player['6s']),
                            wickets: safeNumber(player.Wickets),
                            dots: safeNumber(player['0s']),
                            strikeRate: strikeRateCalc,
                            economy: economyCalc,
                            catches: catchesTotal,
                            multiplier: player['C/VC'] || 1,
                            fantasyPoints: safeNumber(player.Points)
                        };
                        
                        matchInfo.players.push(playerData);

                        // Update player stats
                        const playerKey = player.Player;
                        if (!this.data.playerStats[playerKey]) {
                            this.data.playerStats[playerKey] = {
                                name: playerKey,
                                team: fantasyTeamName,
                                totalPoints: 0,
                                matches: 0,
                                runs: 0,
                                balls: 0,
                                fours: 0,
                                sixes: 0,
                                wickets: 0,
                                dots: 0,
                                averagePoints: 0
                            };
                        }

                        const stats = this.data.playerStats[playerKey];
                        stats.totalPoints += safeNumber(player.Points);
                        stats.matches += 1;
                        stats.runs += safeNumber(player.Score);
                        stats.balls += safeNumber(player.Balls);
                        stats.fours += safeNumber(player['4s']);
                        stats.sixes += safeNumber(player['6s']);
                        stats.wickets += safeNumber(player.Wickets);
                        stats.dots += safeNumber(player['0s']);
                        stats.averagePoints = stats.totalPoints / stats.matches;
                        stats.catches = (stats.catches || 0) + catchesTotal;
                    });
                });

                this.data.matches.push(matchInfo);
            });
        });

        console.log('📊 Final team standings:', this.data.teamStandings);
        
        // Create sorted players array and ensure each object has a `player` alias (UI expects this key)
        this.data.players = Object.values(this.data.playerStats)
            .map(s => ({ ...s, player: s.name }))
            .sort((a, b) => b.totalPoints - a.totalPoints);

        // Set this.fantasyData for the stat tables
        this.fantasyData = this.data.matches;

        console.log('✅ Fantasy data processed:', {
            matches: this.data.matches.length,
            players: Object.keys(this.data.playerStats).length,
            teams: Object.keys(this.data.teamTotals).length,
            standings: Object.keys(this.data.teamStandings).length
        });
    }

    processPlayerProfiles() {
        if (!this.playerListData || !this.data.playerStats) {
            console.warn('Missing required data for processing player profiles');
            return;
        }

        // Ensure container objects exist
        this.data.playerProfiles = this.data.playerProfiles || {};

        // Build a quick lookup for auction details
        const auctionDataMap = {};
        Object.entries(this.playerListData).forEach(([teamName, players]) => {
            players.forEach(p => {
                if (p.Player) {
                    auctionDataMap[p.Player.trim()] = { ...p, auctionTeam: teamName };
                }
            });
        });

        // Create player profiles directly from aggregated stats (no extra mutation)
        Object.values(this.data.playerStats).forEach(stats => {
            const auctionData = auctionDataMap[stats.name] || {};

            this.data.playerProfiles[stats.name] = {
                Player: stats.name,
                Type: auctionData.Type || 'N/A',
                Team: auctionData.auctionTeam || 'N/A', // fantasy team
                IPLTeam: auctionData.Team || 'N/A',
                Price: auctionData.Price || 0,
                Sale: auctionData.Sale || 'Unsold',
                Overseas: auctionData.Overseas || false,
                'Cap/Un': auctionData['Cap/Un'] || 'Uncapped',
                fantasyTeam: stats.team,
                performance: stats,
                valueForMoney: this.calculateValueForMoney(stats.totalPoints, auctionData.Price || 0),
                priceCategory: this.categorizePriceRange(auctionData.Price || 0)
            };
        });

        // Ensure data.players reference is up to date
        this.data.players = Object.values(this.data.playerStats).sort((a, b) => b.totalPoints - a.totalPoints);

        console.log('✅ Player profiles processed:', {
            stats: Object.keys(this.data.playerStats).length,
            profiles: Object.keys(this.data.playerProfiles).length,
            players: this.data.players.length
        });
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
                overseas: players.filter(p => p.Overseas === true).length,
                uncapped: players.filter(p => (p['Cap/Un'] || '').toLowerCase() === 'uncapped').length,
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
        if (ratio >= 150) return 'Excellent';
        if (ratio >= 100) return 'Good';
        if (ratio >= 50) return 'Fair';
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
        this.renderStatisticsLeaderboards();
        this.populatePlayerComparisonDropdowns();
        this.updateScoringRules();
        this.updateMatchSelector();
        this.setupCharts();
        this.initializePlayerFilters();
        this.renderPlayersTable();
        this.renderLeaderboards();
        this.renderTopPerformersTables(); // Added this line
        this.renderStatLeaderboards();
    }

    updateTeamOverview() {
        // Update enhanced stats
        const totalPlayers = Object.values(this.playerListData).reduce((sum, teamPlayers) => sum + teamPlayers.length, 0);
        const totalInvestment = Object.values(this.data.teamCompositions)
            .reduce((sum, team) => sum + team.totalInvestment, 0);
        const avgPrice = totalInvestment / totalPlayers;

        // Find most expensive player
        let mostExpensivePlayer = null;
        let highestPrice = 0;
        let highestBid = 0;
        
        Object.values(this.playerListData).forEach(teamPlayers => {
            teamPlayers.forEach(player => {
                if (player.Price > highestPrice) {
                    highestPrice = player.Price;
                    mostExpensivePlayer = player;
                }
                // Track highest bid separately
                if (player.Price > highestBid) {
                    highestBid = player.Price;
                }
            });
        });

        document.getElementById('totalPlayers').textContent = totalPlayers;
        document.getElementById('totalInvestment').textContent = `₹${totalInvestment.toFixed(1)} Cr`;
        document.getElementById('avgPrice').textContent = `₹${avgPrice.toFixed(1)} Cr`;
        document.getElementById('highestBid').textContent = `₹${highestBid.toFixed(1)} Cr`;
        
        // Update most expensive player display
        if (mostExpensivePlayer) {
            document.getElementById('mostExpensivePlayer').textContent = mostExpensivePlayer.Player;
        } else {
            document.getElementById('mostExpensivePlayer').textContent = '-';
        }

        // Note: updateEnhancedTeamCards() is called separately in updateAllDashboards()
    }

    updateEnhancedTeamCards() {
        console.log('🎯 Updating team cards...');
        
        const container = document.getElementById('teamCardsContainer');
        if (!container) {
            console.error('❌ teamCardsContainer not found!');
            return;
        }

        // Check if data exists
        if (!this.data.teamStandings || Object.keys(this.data.teamStandings).length === 0) {
            console.error('❌ No team standings data available!');
            console.log('Available data keys:', Object.keys(this.data || {}));
            container.innerHTML = '<p style="color: red;">No team data available. Check console for errors.</p>';
            return;
        }

        // Show what teams we have
        console.log('🏏 Available teams:', Object.keys(this.data.teamStandings));
        console.log('📊 Team standings data:', this.data.teamStandings);

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

        // Sort teams by total points
        const sortedTeams = Object.entries(this.data.teamStandings)
            .sort(([,a], [,b]) => b.totalPoints - a.totalPoints)
            .map(([team, standings], index) => {
                // Find composition data using team name mapping
                const compositionKey = this.findCompositionKey(team);
                const composition = this.data.teamCompositions[compositionKey];
                
                console.log(`📊 Processing team card for ${team}:`, {
                    standings,
                    composition,
                    rank: index + 1
                });
                
                return {
                    team: teamDisplayMap[team] || team,
                    standings,
                    rank: index + 1,
                    composition
                };
            });

        console.log('📊 Sorted teams:', sortedTeams);

        const cardsHTML = sortedTeams.map(({team, standings, rank, composition}) => {
            const bgColor = teamBackgrounds[team] || 'rgba(128, 128, 128, 0.1)';
            const borderColor = teamBorderColors[team] || 'rgba(128, 128, 128, 0.3)';
            const accentColor = teamColors[team] || '#007bff';
            
            return `
                <div class="enhanced-team-card" data-team="${team}" style="background: ${bgColor}; border: 1px solid ${borderColor};">
                    <div class="team-header">
                        <h4>${team}</h4>
                        <div class="team-rank" style="background: ${accentColor};">#${rank}</div>
                    </div>
                    <div class="team-points">${standings.totalPoints.toLocaleString()} pts</div>
                    
                    <div class="team-investment-stats">
                        <span>Investment: ₹${(composition?.totalInvestment || 0).toFixed(2)}Cr</span>
                        <span>Players: ${composition?.totalPlayers || 0}</span>
                    </div>
                    
                    <div class="team-type-icons">
                        <div class="type-icon-item">
                            <span class="icon">🏏</span>
                            <span class="count">${composition?.playerTypes?.BAT || 0}</span>
                        </div>
                        <div class="type-icon-item">
                            <span class="icon">⚡</span>
                            <span class="count">${composition?.playerTypes?.BOWL || 0}</span>
                        </div>
                        <div class="type-icon-item">
                            <span class="icon">🌟</span>
                            <span class="count">${composition?.playerTypes?.AR || 0}</span>
                        </div>
                        <div class="type-icon-item">
                            <span class="icon">🧤</span>
                            <span class="count">${composition?.playerTypes?.WK || 0}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = cardsHTML;
        
        console.log('✅ Team cards updated! Generated', sortedTeams.length, 'cards');

        // Add click listeners
        container.querySelectorAll('.enhanced-team-card').forEach(card => {
            card.addEventListener('click', (e) => this.filterByTeam(e.currentTarget.dataset.team));
        });
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

        // Render auction charts
        this.createPricePointsChart();
        this.createInvestmentChart();

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
            
            // Color the Points/₹Cr column based on value rating
            let pointsPerCroreColor = '#6b7280'; // Default grey for poor
            if (player.valueForMoney === 'Excellent') {
                pointsPerCroreColor = '#22c55e'; // Green
            } else if (player.valueForMoney === 'Good') {
                pointsPerCroreColor = '#3b82f6'; // Blue
            } else if (player.valueForMoney === 'Fair') {
                pointsPerCroreColor = '#fbbf24'; // Yellow
            }
            
            return `
                <tr>
                    <td>
                        <div class="vfm-player-cell">
                            <strong style="color: ${teamColor}">${player.Player}</strong>
                        </div>
                    </td>
                    <td style="color: ${teamColor}; font-weight: 500">${player.fantasyTeam}</td>
                    <td style="color: ${themeColors.textColor}; font-weight: 600">₹${player.Price.toFixed(1)}</td>
                    <td style="color: ${themeColors.textColor}; font-weight: 600">${player.performance.totalPoints}</td>
                    <td style="color: ${pointsPerCroreColor}; font-weight: 600">${player.pointsPerCrore.toFixed(1)}</td>
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

        // Get team names in a consistent order
        const teams = ['Royal Smashers', 'Sher-e-Punjab', 'Silly Pointers', 'The Kingsmen'];
        
        const getTypeIcon = (type) => {
            switch(type) {
                case 'BAT': return '🏏';
                case 'BOWL': return '⚡';
                case 'AR': return '🌟';
                case 'WK': return '🧤';
                default: return '❓';
            }
        };

        const getTypeLabel = (type) => {
            switch(type) {
                case 'BAT': return 'Batsman';
                case 'BOWL': return 'Bowler';
                case 'AR': return 'All-rounder';
                case 'WK': return 'Wicket-keeper';
                default: return type;
            }
        };

        grid.innerHTML = teams.map(teamName => {
            const teamKey = this.findCompositionKey(teamName);
            const players = this.playerListData[teamKey] || [];
            const comp = this.data.teamCompositions[teamKey];
            
            if (!players.length) return '';

            // Sort players by price (highest first)
            const sortedPlayers = [...players].sort((a, b) => (b.Price || 0) - (a.Price || 0));

            return `
                <div class="team-composition-card" data-team="${teamName}">
                    <div class="team-composition-header">
                        <div class="team-stats-row">
                            <div class="team-name-large">${teamName}</div>
                            <div class="team-basic-stats">
                                <span>${players.length} Players</span>
                                <span>${comp.overseas} Overseas</span>
                                <span>${comp.uncapped} Uncapped</span>
                            </div>
                            <div class="team-type-summary-inline">
                                <div class="type-stat">
                                    <span class="type-icon">🏏</span>
                                    <span class="type-count">${comp.playerTypes.BAT}</span>
                                </div>
                                <div class="type-stat">
                                    <span class="type-icon">⚡</span>
                                    <span class="type-count">${comp.playerTypes.BOWL}</span>
                                </div>
                                <div class="type-stat">
                                    <span class="type-icon">🌟</span>
                                    <span class="type-count">${comp.playerTypes.AR}</span>
                                </div>
                                <div class="type-stat">
                                    <span class="type-icon">🧤</span>
                                    <span class="type-count">${comp.playerTypes.WK}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="players-header">
                        <div>Player</div>
                        <div>Type</div>
                        <div>IPL Team</div>
                        <div>Status</div>
                    </div>
                    
                    <div class="players-grid">
                        ${sortedPlayers.map(player => `
                            <div class="player-card">
                                <div class="player-name">${player.Player}</div>
                                <div class="player-type">
                                    <span class="type-icon">${getTypeIcon(player.Type)}</span>
                                    <span>${getTypeLabel(player.Type)}</span>
                                </div>
                                <div class="player-team">${player.Team || 'N/A'}</div>
                                <div class="player-status">
                                    <div class="overseas-badge ${player.Overseas ? 'yes' : 'no'}">
                                        ${player.Overseas ? 'Overseas' : 'Local'}
                                    </div>
                                    <div class="cap-badge ${(player['Cap/Un'] || '').toLowerCase()}">
                                        ${player['Cap/Un'] || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).filter(html => html).join('');

        console.log('✅ Team composition updated with player cards!');
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

        console.log('🎨 Setting up charts...');
        console.log('Available data:', {
            playerProfiles: Object.keys(this.data.playerProfiles || {}).length,
            auctionData: this.data.auctionData ? Object.keys(this.data.auctionData).length : 0,
            teamCompositions: Object.keys(this.data.teamCompositions || {}).length
        });

        // Only create charts for elements that exist
        this.createMatchWeekProgressChart();
        this.createPositionProgressChart();
        this.createCumulativeWeekPointsChart();
        this.createPositionByMatchChart();
        // New chart: Average points per match progression
        this.createAvgPointsPerMatchChart();
        // Chart: points per player per week
        this.createPointsPerPlayerChart();
        // Chart: players count per week
        this.createPlayersPlayedChart();
    }

    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
        
        return {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            textColor: isDark ? '#f9fafb' : '#111827',
            subtleTextColor: isDark ? '#9ca3af' : '#6b7280',
            borderColor: isDark ? '#374151' : '#e5e7eb'
        };
    }

    createMatchWeekProgressChart() {
        const ctx = document.getElementById('matchWeekProgressChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data available for match-week progression chart');
            return;
        }

        // Identify unique match weeks in chronological order
        const weekLabels = [];
        matches.forEach(m => {
            if (!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek);
        });

        const teams = Object.keys(this.data.teamStandings || {});
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        const shortLabels = weekLabels.map(w=>{const n=(w||'').match(/\d+/);return n?`MW${n[0]}`:w;});

        const datasets = teams.map((team, i) => {
            const dataPoints = weekLabels.map(week => {
                // Sum points for this team for all matches in this week
                const weeklyTotal = matches
                    .filter(m => m.matchWeek === week)
                    .reduce((sum, m) => sum + (m.teamTotals[team] || 0), 0);
                return weeklyTotal;
            });
            return {
                label: team,
                data: dataPoints,
                borderColor: teamColors[team] || '#888',
                backgroundColor: teamColors[team] || '#888',
                fill: false,
                tension: 0.25,
                pointRadius: 3
            };
        });

        if (this.charts.matchWeekProgress) this.charts.matchWeekProgress.destroy();

        const themeColors = this.getThemeColors();

        this.charts.matchWeekProgress = new Chart(ctx, {
            type: 'line',
            data: { labels: shortLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: {
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: themeColors.subtleTextColor, precision:0, stepSize:1 },
                        grid: { color: themeColors.borderColor }
                    }
                }
            }
        });
    }

    createPositionProgressChart() {
        const ctx = document.getElementById('positionProgressChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data for position chart');
            return;
        }

        const teams = Object.keys(this.data.teamStandings || {});

        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        // Initialize cumulative points
        const cumulative = {};
        teams.forEach(t => cumulative[t] = 0);

        // Derive unique week labels chronologically
        const weekLabels = [];
        matches.forEach(m => { if(!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek); });

        // Prepare rank data structure
        const rankData = {}; teams.forEach(t=>rankData[t]=[]);

        // Reset cumulative per team
        teams.forEach(t=> cumulative[t]=0);

        weekLabels.forEach(week => {
            // Add this week's points to cumulative
            matches.filter(m=>m.matchWeek===week).forEach(m=>{
                teams.forEach(team=>{ cumulative[team]+= (m.teamTotals[team]||0); });
            });

            // Compute ranks after this week
            const sorted=[...teams].sort((a,b)=>cumulative[b]-cumulative[a]);
            teams.forEach(team=>{ rankData[team].push(sorted.indexOf(team)+1); });
        });

        const labels = weekLabels.map(w=>{const n=(w||'').match(/\d+/);return n?`MW${n[0]}`:w;});

        const datasets = teams.map(team => ({
            label: team,
            data: rankData[team],
            borderColor: teamColors[team] || '#888',
            backgroundColor: teamColors[team] || '#888',
            fill: false,
            tension: 0.25,
            pointRadius: 3
        }));

        if (this.charts.positionProgress) this.charts.positionProgress.destroy();

        const themeColors = this.getThemeColors();

        this.charts.positionProgress = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: {
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: themeColors.subtleTextColor, precision:0, stepSize:1 },
                        grid: { color: themeColors.borderColor },
                        reverse: true,
                        min: 1,
                        max: teams.length + 0.5,
                        stepSize: 1,
                        title: { display: true, text: 'Rank', color: themeColors.textColor }
                    }
                }
            }
        });
    }

    createCumulativeWeekPointsChart() {
        const ctx = document.getElementById('cumulativeWeekPointsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data for cumulative week chart');
            return;
        }

        // gather week labels in order
        const weekLabels = [];
        matches.forEach(m => { if(!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek); });

        const teams = Object.keys(this.data.teamStandings || {});
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        // cumulative structure
        const cumulative = {}; teams.forEach(t => cumulative[t] = 0);

        const shortLabels = weekLabels.map(w=>{const n=(w||'').match(/\d+/);return n?`MW${n[0]}`:w;});

        const datasets = teams.map(team => {
            const dataPoints = [];
            weekLabels.forEach(week => {
                const weeklyTotal = matches.filter(m => m.matchWeek === week).reduce((sum, m) => sum + (m.teamTotals[team] || 0), 0);
                cumulative[team] += weeklyTotal;
                dataPoints.push(cumulative[team]);
            });
            return { label: team, data: dataPoints, borderColor: teamColors[team] || '#888', backgroundColor: teamColors[team] || '#888', fill: false, tension: 0.25, pointRadius: 3 };
        });

        if (this.charts.cumulativeWeekPoints) this.charts.cumulativeWeekPoints.destroy();

        const themeColors = this.getThemeColors();
        this.charts.cumulativeWeekPoints = new Chart(ctx, { type: 'line', data: { labels: shortLabels, datasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, interaction: { mode: 'nearest', intersect: false }, scales: { x: { ticks: { color: themeColors.subtleTextColor }, grid: { display: false } }, y: { ticks: { color: themeColors.subtleTextColor }, grid: { color: themeColors.borderColor } } } } });
    }

    createInvestmentChart() {
        const ctx = document.getElementById('investmentChart');
        if (!ctx || typeof Chart === 'undefined') return;

        // Check if data exists
        if (!this.data.auctionData || !this.data.auctionData.allPlayers || this.data.auctionData.allPlayers.length === 0) {
            console.warn('No auction data available for investment chart');
            return;
        }

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
        
        // URL to data-tab mapping
        const urlToDataTab = {
            'overview': 'team-overview',
            'auction': 'auction-analysis', 
            'teams': 'team-composition',
            'players': 'player-analytics',
            'matches': 'match-analysis',
            'stats': 'statistics',
            'scoring': 'scoring-rules'
        };
        
        // Data-tab to URL mapping (reverse)
        const dataTabToUrl = {
            'team-overview': 'overview',
            'auction-analysis': 'auction',
            'team-composition': 'teams', 
            'player-analytics': 'players',
            'match-analysis': 'matches',
            'statistics': 'stats',
            'scoring-rules': 'scoring'
        };
        
        // Get active tab from URL parameter or default to 'overview'
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab') || 'overview';
        const activeTab = urlToDataTab[urlTab] || 'team-overview';
        
        // Set initial active tab based on URL
        this.setActiveTab(activeTab, tabButtons, tabContents);
        
        // Listen for browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            const urlParams = new URLSearchParams(window.location.search);
            const urlTab = urlParams.get('tab') || 'overview';
            const newTab = urlToDataTab[urlTab] || 'team-overview';
            this.setActiveTab(newTab, tabButtons, tabContents);
            this.switchTab(newTab);
        });
        
        // Add click listeners for tab switching with mobile support
        tabButtons.forEach(button => {
            // Handle both click and touch events for mobile
            const handleTabClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                let targetTab;
                if (e.target.classList.contains('tab-button')) {
                    targetTab = e.target.dataset.tab;
                } else if (e.target.classList.contains('tab-text')) {
                    targetTab = e.target.parentElement.dataset.tab;
                } else {
                    targetTab = e.target.closest('.tab-button')?.dataset.tab;
                }
                
                if (targetTab) {
                    // Convert data-tab to user-friendly URL
                    const urlTab = dataTabToUrl[targetTab] || 'overview';
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('tab', urlTab);
                    window.history.pushState({ tab: urlTab }, '', newUrl);
                    
                    this.switchTab(targetTab);
                }
            };
            
            button.addEventListener('click', handleTabClick);
            button.addEventListener('touchend', handleTabClick);
        });
        
        console.log('✅ Tabs initialized successfully with user-friendly URL navigation and mobile support');
    }

    setActiveTab(targetTab, tabButtons, tabContents) {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Find and activate the target tab button
        const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        // Activate the corresponding content
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            console.log('✅ Theme toggle listener added');
        }
        
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
        
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
        
        // Show All Players button will be handled separately in renderFilteredPlayersTable
        console.log('🔄 Show All Players button will be setup dynamically');
        
        // Setup additional player filters
        setTimeout(() => {
            setupPlayerFilters();
        }, 100);
        
        // Player Comparison Button
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compareSelectedPlayers());
        }
        
        console.log('✅ All event listeners setup complete');
    }

    setupTableSorting() {
        console.log('📊 Setting up table sorting...');
        
        // Initialize sorting state only if not already initialized
        if (!this.currentSort) {
            this.currentSort = {
                column: null,
                direction: null // 'asc' or 'desc'
            };
        }
        
        // Add click listeners to sortable headers
        const table = document.getElementById('playersTable');
        if (table) {
            const headers = table.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                // Remove existing listeners by cloning the element
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
                
                // Add new event listener
                newHeader.addEventListener('click', (e) => {
                    const sortKey = e.target.getAttribute('data-sort');
                    this.sortTable(sortKey);
                });
            });
            console.log('✅ Table sorting listeners added');
        }
    }

    sortTable(sortKey) {
        const currentDirection = this.sortDirection[sortKey] || 'desc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        this.sortDirection[sortKey] = newDirection;

        // Update sort headers
        this.updateSortHeaders(sortKey, newDirection);

        // Sort and render
        this.sortPlayersData(sortKey, newDirection);
        this.renderFilteredPlayersTable();
    }

    updateSortHeaders(activeColumn, direction) {
        const headers = document.querySelectorAll('#playersTable th[data-sort]');
        headers.forEach(header => {
            const column = header.getAttribute('data-sort');
            header.classList.remove('sort-asc', 'sort-desc');
            
            if (column === activeColumn) {
                header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    sortPlayersData(sortKey, direction) {
        if (!Array.isArray(this.filteredPlayers)) {
            console.warn('No filtered players data to sort');
            return;
        }

        const compareValues = (a, b) => {
            // Safely get values, handling undefined objects
            const aVal = a && a.performance ? a.performance[sortKey] : 0;
            const bVal = b && b.performance ? b.performance[sortKey] : 0;

            // Handle numeric comparisons
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Handle string comparisons
            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            return direction === 'asc' ? 
                aStr.localeCompare(bStr) : 
                bStr.localeCompare(aStr);
        };

        this.filteredPlayers.sort(compareValues);
    }

    handlePlayerSearch(searchTerm) {
        console.log('🔍 Player search:', searchTerm);
        this.currentFilters = this.currentFilters || { search: '', team: '', position: '' };
        this.currentFilters.search = searchTerm.toLowerCase();
        this.applyFilters();
        this.updateSearchResultsCount();
    }

    handleTeamFilter(team) {
        console.log('🏏 Team filter:', team);
        this.currentFilters = this.currentFilters || { search: '', team: '', position: '' };
        this.currentFilters.team = team;
        this.applyFilters();
    }

    handlePositionFilter(position) {
        console.log('📍 Position filter:', position);
        this.currentFilters = this.currentFilters || { search: '', team: '', position: '' };
        this.currentFilters.position = position;
        this.applyFilters();
    }

    applyFilters() {
        if (!this.data.players) return;
        
        console.log('🔍 Applying filters:', this.currentFilters);
        console.log('📊 Initial players count:', this.data.players.length);
        
        let filtered = [...this.data.players];
        
        // Apply search filter
        if (this.currentFilters?.search) {
            filtered = filtered.filter(player => 
                player.name.toLowerCase().includes(this.currentFilters.search)
            );
            console.log('🔍 After search filter:', filtered.length);
        }
        
        // Apply IPL team filter
        if (this.currentFilters?.team) {
            const sel = this.currentFilters.team.toLowerCase();
            filtered = filtered.filter(player => (player.team || '').toLowerCase().includes(sel));
            console.log('🏏 After team filter:', filtered.length);
        }
        
        // Apply additional IPL filter if separate dropdown is used
        if (this.currentFilters?.iplTeam) {
            const selIpl = this.currentFilters.iplTeam.toLowerCase();
            filtered = filtered.filter(player => {
                const iplTeam = this.playerIplMap ? this.playerIplMap[(player.name || player.player || '').toLowerCase()] : '';
                return (iplTeam || '').toLowerCase() === selIpl;
            });
            console.log('🏏 After IPL team filter:', filtered.length);
        }
        
        // Apply position filter
        if (this.currentFilters?.position) {
            filtered = filtered.filter(player => {
                const profile = this.data.playerProfiles[player.name];
                return profile && this.getPlayerPosition(profile.Type) === this.currentFilters.position;
            });
            console.log('📍 After position filter:', filtered.length);
        }
        
        this.filteredPlayers = filtered;
        
        // Reset pagination when filters are applied
        this.showAllPlayers = false;
        
        // Reapply current sort if one exists
        if (this.currentSort?.column) {
            this.sortPlayersData(this.currentSort.column, this.currentSort.direction);
        }
        
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

    calculateStrikeRate(player) {
        // Get comprehensive strike rate data from Fantasy_Points_2025.json
        if (!this.rawData) return '-';
        
        let totalRuns = 0;
        let totalBalls = 0;
        let matchCount = 0;
        
        // Traverse through all matches to find this player's strike rate data
        Object.values(this.rawData).forEach(matchWeek => {
            Object.values(matchWeek).forEach(match => {
                Object.values(match).forEach(teamData => {
                    if (teamData && teamData.Players) {
                        let playersList = [];
                        if (Array.isArray(teamData.Players)) {
                            playersList = teamData.Players;
                        } else if (teamData.Players.Players) {
                            playersList = teamData.Players.Players;
                        }
                        
                        playersList.forEach(p => {
                            if (p.Player === player.name && p.Score !== null && p.Balls !== null) {
                                totalRuns += p.Score || 0;
                                totalBalls += p.Balls || 0;
                                if (p.Score > 0 || p.Balls > 0) matchCount++;
                            }
                        });
                    }
                });
            });
        });
        
        if (totalBalls === 0) return '-';
        const sr = (totalRuns / totalBalls) * 100;
        return sr.toFixed(1);
    }

    calculateEconomy(player) {
        // Get comprehensive economy rate data from Fantasy_Points_2025.json
        if (!this.rawData) return '-';
        
        let totalRuns = 0;
        let matchCount = 0;
        
        // Traverse through all matches to find this player's economy data
        Object.values(this.rawData).forEach(matchWeek => {
            Object.values(matchWeek).forEach(match => {
                Object.values(match).forEach(teamData => {
                    if (teamData && teamData.Players) {
                        let playersList = [];
                        if (Array.isArray(teamData.Players)) {
                            playersList = teamData.Players;
                        } else if (teamData.Players.Players) {
                            playersList = teamData.Players.Players;
                        }
                        
                        playersList.forEach(p => {
                            if (p.Player === player.name && p.ER !== null) {
                                totalRuns += p.ER || 0;
                                matchCount++;
                            }
                        });
                    }
                });
            });
        });
        
        if (matchCount === 0) return '-';
        const economy = totalRuns / matchCount;
        return economy.toFixed(2);
    }

    updateSearchResultsCount() {
        const countElement = document.getElementById('resultsCounter');
        if (!countElement) return;
        
        const playersToShow = this.filteredPlayers.length > 0 || this.hasActiveFilters()
            ? this.filteredPlayers 
            : this.data.players;
        
        if (this.hasActiveFilters()) {
            const playerText = playersToShow.length === 1 ? 'player' : 'players';
            countElement.textContent = `${playersToShow.length} ${playerText}`;
            countElement.style.display = 'inline';
        } else {
            // Show total players when no filters are active
            const totalPlayers = this.data.players ? this.data.players.length : 0;
            const playerText = totalPlayers === 1 ? 'player' : 'players';
            countElement.textContent = `${totalPlayers} ${playerText}`;
            countElement.style.display = 'inline';
        }
    }

    updateShowAllButton() {
        const showAllBtn = document.getElementById('showAllPlayersBtn');
        const controls = document.getElementById('playersTableControls');
        
        if (!showAllBtn || !controls) {
            console.log('❌ Show all button or controls not found');
            return;
        }
        
        console.log('🔄 Updating show all button, showAllPlayers:', this.showAllPlayers);

        const playersToShow = this.filteredPlayers.length > 0 || this.hasActiveFilters()
            ? this.filteredPlayers 
            : this.data.players;

        if (playersToShow.length > 20) {
            controls.style.display = 'flex';
            console.log('✅ Showing controls, players to show:', playersToShow.length);
            const expandText = showAllBtn.querySelector('.expand-text');
            const collapseText = showAllBtn.querySelector('.collapse-text');
            const expandIcon = showAllBtn.querySelector('.expand-icon');
            
            if (this.showAllPlayers) {
                expandText.style.display = 'none';
                collapseText.style.display = 'inline';
                if (expandIcon) expandIcon.textContent = '▲';
            } else {
                expandText.style.display = 'inline';
                collapseText.style.display = 'none';
                expandText.textContent = `Show All Players (${playersToShow.length} total)`;
                if (expandIcon) expandIcon.textContent = '▼';
            }
        } else {
            controls.style.display = 'none';
        }
    }

    setupShowAllButtonListener() {
        const showAllPlayersBtn = document.getElementById('showAllPlayersBtn');
        if (showAllPlayersBtn) {
            // Remove any existing listeners by cloning the element
            const newBtn = showAllPlayersBtn.cloneNode(true);
            showAllPlayersBtn.parentNode.replaceChild(newBtn, showAllPlayersBtn);
            
            // Add new event listener
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Show All Players button clicked');
                this.toggleShowAllPlayers();
            });
            console.log('✅ Show All Players button listener setup complete');
        }
    }

    toggleShowAllPlayers() {
        console.log('🔄 Toggling show all players:', !this.showAllPlayers);
        this.showAllPlayers = !this.showAllPlayers;
        this.renderFilteredPlayersTable();
    }

    clearAllFilters() {
        // Reset all filter values
        this.currentFilters = { search: '', team: '', iplTeam: '', position: '' };
        this.filteredPlayers = [];
        this.showAllPlayers = false;
        
        // Reset UI controls
        const playerSearch = document.getElementById('playerSearch');
        const teamFilter = document.getElementById('teamFilter');
        const positionFilter = document.getElementById('positionFilter');
        const iplFilter = document.getElementById('iplTeamFilter');
        
        if (playerSearch) playerSearch.value = '';
        if (teamFilter) teamFilter.value = '';
        if (positionFilter) positionFilter.value = '';
        if (iplFilter) iplFilter.value = '';
        
        // Update display
        this.renderFilteredPlayersTable();
        this.updateSearchResultsCount();
        
        console.log('✅ All filters cleared');
    }

    initializePlayerFilters() {
        this.currentFilters = {
            search: '',
            team: '',
            iplTeam: '',
            position: ''
        };
        this.filteredPlayers = [];
        this.showAllPlayers = false;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        // Initialize UI
        this.populateTeamFilter();
        this.populateIplTeamFilter();
        this.renderFilteredPlayersTable();
        this.updateSearchResultsCount();
        
        console.log('✅ Player filters initialized with enhanced functionality');
    }

    populateTeamFilter() {
        const teamFilter = document.getElementById('teamFilter');
        if (!teamFilter || !this.data.teamStandings) return;
        
        // Clear existing options except "All Teams"
        teamFilter.innerHTML = '<option value="">All Teams</option>';
        
        // Collect unique IPL team names from players data
        const iplSet = new Set(this.data.players.map(p => p.team).filter(Boolean));
        const teams = Array.from(iplSet).sort();

        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            teamFilter.appendChild(option);
        });
    }

    populateIplTeamFilter() {
        const iplFilter = document.getElementById('iplTeamFilter');
        if (!iplFilter || !Array.isArray(this.data.players)) return;

        // Collect unique IPL team names from player list data (reliable)
        const teamSet = new Set();
        Object.values(this.playerListData || {}).forEach(arr => {
            (arr || []).forEach(p => { if (p.Team) teamSet.add(p.Team); });
        });

        // Build options
        iplFilter.innerHTML = '<option value="">All IPL Teams</option>';
        Array.from(teamSet).sort().forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            iplFilter.appendChild(opt);
        });

        // Build player to IPL team lookup once
        if (!this.playerIplMap) this.playerIplMap = {};
        Object.values(this.playerListData || {}).forEach(arr => {
            (arr || []).forEach(p => {
                if (p.Player && p.Team) this.playerIplMap[p.Player.toLowerCase()] = p.Team;
            });
        });
    }

    filterByTeam(teamName) {
        console.log('🎯 Filter by team:', teamName);
        // Add team filtering functionality here if needed
    }

    renderFilteredPlayersTable() {
        const tableBody = document.getElementById('playersTableBody');
        if (!tableBody) return;

        // Use filtered players if filters are applied, otherwise use all players
        const playersToShow = this.filteredPlayers.length > 0 || this.hasActiveFilters()
            ? this.filteredPlayers 
            : this.data.players;

        // Determine how many players to show
        const maxPlayers = this.showAllPlayers ? playersToShow.length : Math.min(20, playersToShow.length);
        const displayPlayers = playersToShow.slice(0, maxPlayers).map(p => ({ ...p, player: p.player || p.name }));

        console.log(`📊 Rendering ${displayPlayers.length} of ${playersToShow.length} players`);

        tableBody.innerHTML = displayPlayers.map(player => {
            // Get additional data from player profiles
            const profile = this.data.playerProfiles[player.player];
            const fantasyData = this.data.playerStats[player.player];
            
            // Calculate enhanced statistics
            const strikeRate = this.calculateStrikeRate(player);
            const economy = this.calculateEconomy(player);
            
            return `
                <tr>
                    <td><strong>${player.player}</strong></td>
                    <td>${player.team}</td>
                    <td>${player.matches || fantasyData?.matches || 0}</td>
                    <td><strong>${player.totalPoints}</strong></td>
                    <td>${player.runs || fantasyData?.runs || 0}</td>
                    <td>${fantasyData?.fours || 0}</td>
                    <td>${fantasyData?.sixes || 0}</td>
                    <td>${strikeRate}</td>
                    <td>${player.wickets || fantasyData?.wickets || 0}</td>
                    <td>${fantasyData?.dots || 0}</td>
                    <td>${economy}</td>
                </tr>
            `;
        }).join('');

        // Update show all button
        this.updateShowAllButton();
        
        // Re-setup event listeners for dynamic elements
        this.setupShowAllButtonListener();
        
        // Re-setup table sorting after re-rendering to ensure event listeners are preserved
        this.setupTableSorting();
        
        // Ensure sorting headers are properly styled after re-rendering
        if (this.currentSort && this.currentSort.column) {
            this.updateSortHeaders(this.currentSort.column, this.currentSort.direction);
        }
    }

    hasActiveFilters() {
        return this.currentFilters && (
            this.currentFilters.search || 
            this.currentFilters.team || 
            this.currentFilters.position ||
            this.currentFilters.iplTeam
        );
    }

    renderPlayersTable() {
        // Initialize player filters if not already done
        if (!this.currentFilters) {
            this.initializePlayerFilters();
        }
        this.renderFilteredPlayersTable();
        
        // Setup table sorting AFTER the table is rendered
        this.setupTableSorting();
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

    renderTopPerformersTables() {
        if (!this.rawData) return;

        // Enhanced stats collection with additional metrics
        let allStats = {};
        
        // Process data from Fantasy_Points_2025.json for comprehensive stats
        Object.values(this.rawData || {}).forEach(matchWeek => {
            Object.values(matchWeek).forEach(match => {
                Object.values(match).forEach(teamData => {
                    if (teamData && teamData.Players) {
                        let playersList = [];
                        if (Array.isArray(teamData.Players)) {
                            playersList = teamData.Players;
                        } else if (teamData.Players.Players) {
                            playersList = teamData.Players.Players;
                        }
                        
                        playersList.forEach(p => {
                            if (!allStats[p.Player]) {
                                allStats[p.Player] = {
                                    player: p.Player,
                                    runs: 0,
                                    fours: 0,
                                    sixes: 0,
                                    wickets: 0,
                                    dots: 0,
                                    catches: 0,
                                    matches: 0
                                };
                            }
                            
                            const stats = allStats[p.Player];
                            stats.runs += p.Score || 0;
                            stats.fours += p['4s'] || 0;
                            stats.sixes += p['6s'] || 0;
                            stats.wickets += p.Wickets || 0;
                            stats.dots += p['0s'] || 0;
                            stats.catches += (p.Catch || 0) + (p.Runout || 0);
                            if (p.Score !== null || p.Wickets !== null) stats.matches++;
                        });
                    }
                });
            });
        });

        const allPlayers = Object.values(allStats);

        // Most Runs
        const mostRunsList = document.getElementById('mostRunsList');
        if (mostRunsList) {
            const topRuns = [...allPlayers].sort((a, b) => b.runs - a.runs).slice(0, 5);
            mostRunsList.innerHTML = topRuns.map(player => `
                <div class="stats-row">
                    <div class="player-name">${player.player}</div>
                    <div class="stat-values">
                        <div class="stat-col">${player.runs}</div>
                    </div>
                </div>
            `).join('');
        }

        // Most Boundaries (4s + 6s)
        const topBoundariesBody = document.getElementById('topBoundariesBody');
        if (topBoundariesBody) {
            const topBoundaries = [...allPlayers]
                .sort((a, b) => {
                    const totalA = a.fours + a.sixes;
                    const totalB = b.fours + b.sixes;
                    if (totalB !== totalA) return totalB - totalA;
                    if (b.fours !== a.fours) return b.fours - a.fours;
                    return b.sixes - a.sixes;
                })
                .slice(0, 5);

            topBoundariesBody.innerHTML = topBoundaries.map(player => `
                <div class="stats-row">
                    <div class="player-name">${player.player}</div>
                    <div class="stat-values">
                        <div class="stat-col">${player.fours}</div>
                        <div class="stat-col">${player.sixes}</div>
                        <div class="stat-col">${player.fours + player.sixes}</div>
                    </div>
                </div>
            `).join('');
        }

        // Most Wickets
        const topWicketsBody = document.getElementById('topWicketsBody');
        if (topWicketsBody) {
            const topWickets = [...allPlayers].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
            topWicketsBody.innerHTML = topWickets.map(player => `
                <div class="stats-row">
                    <div class="player-name">${player.player}</div>
                    <div class="stat-values">
                        <div class="stat-col">${player.wickets}</div>
                    </div>
                </div>
            `).join('');
        }

        // Most Dot Balls
        const topDotBallsBody = document.getElementById('topDotBallsBody');
        if (topDotBallsBody) {
            const topDots = [...allPlayers].sort((a, b) => b.dots - a.dots).slice(0, 5);
            topDotBallsBody.innerHTML = topDots.map(player => `
                <div class="stats-row">
                    <div class="player-name">${player.player}</div>
                    <div class="stat-values">
                        <div class="stat-col">${player.dots}</div>
                    </div>
                </div>
            `).join('');
        }
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
                                        <th>Fielding</th>
                                        <th>C/VC Multiplier</th>
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
                                            <td>${player.multiplier || '1.0'}x</td>
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
    }

    clearMatchDetails() {
        const scorecardContainer = document.getElementById('matchScorecard');
        const playerDetailsContainer = document.getElementById('playerPerformanceDetails');
        
        if (scorecardContainer) {
            scorecardContainer.innerHTML = '<p class="placeholder-text">Select a match to view details</p>';
        }
        
        if (playerDetailsContainer) {
            playerDetailsContainer.innerHTML = '<p class="placeholder-text">Match player details will appear here</p>';
        }
        
        // Destroy existing chart if it exists
        if (this.charts.matchPoints) {
            this.charts.matchPoints.destroy();
            this.charts.matchPoints = null;
        }
    }

    createMatchPointsChart(match) {
        const ctx = document.getElementById('matchPointsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        // Team colors
        const teamColors = {
            'Royal Smashers': 'rgba(255, 99, 132, 0.8)',
            'Sher-e-Punjab': 'rgba(245, 158, 11, 0.8)',
            'Silly Pointers': 'rgba(59, 130, 246, 0.8)',
            'The Kingsmen': 'rgba(16, 185, 129, 0.8)'
        };

        // Prepare data for pie chart
        const chartData = [];
        const chartLabels = [];
        const chartColors = [];
        
        // Group players by team
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
                    chartColors.push(teamColor.replace('0.8', '0.4'));
                }
            }
        });

        // Destroy existing chart if it exists
        if (this.charts.matchPoints) {
            this.charts.matchPoints.destroy();
        }

        this.charts.matchPoints = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} pts (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateTeamAuctionTables() {
        const container = document.getElementById('teamAuctionTables');
        if (!container) return;

        const teams = ['Royal Smashers', 'Sher-e-Punjab', 'Silly Pointers', 'The Kingsmen'];
        
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        let tablesHTML = '<div class="team-auction-tables-grid">';

        teams.forEach((teamName, index) => {
            const teamKey = this.findCompositionKey(teamName);
            const teamPlayers = this.playerListData[teamKey] || [];
            
            if (teamPlayers.length === 0) return;

            const totalPurchase = teamPlayers.reduce((sum, p) => sum + (p.Price || 0), 0);
            const teamColor = teamColors[teamName];
            const tableId = `team-table-${index}`;

            const sortedPlayers = [...teamPlayers].sort((a, b) => (b.Price || 0) - (a.Price || 0));
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
                                    <th>Base Price</th>
                                    <th>Purchase Price</th>
                                </tr>
                            </thead>
                            <tbody id="${tableId}-visible">
            `;

            visibleRows.forEach(player => {
                const basePrice = player.Base || 0;
                const purchasePrice = player.Price || 0;

                tablesHTML += `
                    <tr>
                        <td class="player-name">${player.Player}</td>
                        <td class="base-price">₹${basePrice.toFixed(1)}Cr</td>
                        <td class="purchase-price">₹${purchasePrice.toFixed(1)}Cr</td>
                    </tr>
                `;
            });

            tablesHTML += `
                            </tbody>
                            <tbody id="${tableId}-hidden" class="hidden-rows" style="display: none;">
            `;

            hiddenRows.forEach(player => {
                const basePrice = player.Base || 0;
                const purchasePrice = player.Price || 0;

                tablesHTML += `
                    <tr>
                        <td class="player-name">${player.Player}</td>
                        <td class="base-price">₹${basePrice.toFixed(1)}Cr</td>
                        <td class="purchase-price">₹${purchasePrice.toFixed(1)}Cr</td>
                    </tr>
                `;
            });

            tablesHTML += `
                            </tbody>
                        </table>
            `;

            if (hiddenRows.length > 0) {
                tablesHTML += `
                    <div class="table-expand-controls">
                        <button class="expand-btn" onclick="toggleTableRows('${tableId}')" style="background-color: ${teamColor}; border-color: ${teamColor}; color: white;">
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
    }

    compareSelectedPlayers() {
        console.log('🔄 Comparing selected players...');

        const player1Name = document.getElementById('comparePlayer1').value.trim();
        const player2Name = document.getElementById('comparePlayer2').value.trim();
        const resultsContainer = document.getElementById('comparisonResults');

        if (!player1Name || !player2Name) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-20);">Please select both players to compare.</p>';
            return;
        }

        if (player1Name === player2Name) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-20);">Please select different players to compare.</p>';
            return;
        }

        const player1 = this.data.playerProfiles[player1Name];
        const player2 = this.data.playerProfiles[player2Name];

        if (!player1 || !player2) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-20);">Player data not found. Please try again.</p>';
            console.error('Could not find player profiles for:', { player1Name, player2Name });
            return;
        }

        // Gather stats
        const s1 = this.data.playerStats[player1Name] || {};
        const s2 = this.data.playerStats[player2Name] || {};

        const sr1 = parseFloat(this.calculateStrikeRate({ name: player1Name })) || 0;
        const sr2 = parseFloat(this.calculateStrikeRate({ name: player2Name })) || 0;
        const eco1 = parseFloat(this.calculateEconomy({ name: player1Name })) || 999;
        const eco2 = parseFloat(this.calculateEconomy({ name: player2Name })) || 999;

        // Helper → returns { left, right } classes
        const getClasses = (v1, v2, higherBetter = true) => {
            if (v1 === v2) return { left: '', right: '' };
            const leftBetter = higherBetter ? v1 > v2 : v1 < v2;
            return {
                left:  leftBetter ? 'better-value' : 'worse-value',
                right: leftBetter ? 'worse-value' : 'better-value'
            };
        };

        // Pre-compute classes per metric
        const clsPrice   = getClasses(player1.Price || 0,              player2.Price || 0,              false);
        const clsPoints  = getClasses(s1.totalPoints || 0,              s2.totalPoints || 0);
        const clsRuns    = getClasses(s1.runs || 0,                     s2.runs || 0);
        const clsFours   = getClasses(s1.fours || 0,                    s2.fours || 0);
        const clsSixes   = getClasses(s1.sixes || 0,                    s2.sixes || 0);
        const clsSR      = getClasses(sr1,                              sr2);
        const clsWkts    = getClasses(s1.wickets || 0,                  s2.wickets || 0);
        const clsDots    = getClasses(s1.dots || 0,                     s2.dots || 0);
        const clsEco     = getClasses(eco1,                             eco2,                             false);
        const clsCatches = getClasses(s1.catches || 0,                  s2.catches || 0);

        // Build HTML
        const comparisonHTML = `
            <div class="comparison-wrapper">
                <div class="comparison-table">
                    <div class="comparison-header">
                        <div class="player-header">${player1.Player}</div>
                        <div class="stat-header">Statistics</div>
                        <div class="player-header">${player2.Player}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value">${player1.Team || 'N/A'}</div>
                        <div class="stat-label">Fantasy Team</div>
                        <div class="player-value">${player2.Team || 'N/A'}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value">${player1.IPLTeam || 'N/A'}</div>
                        <div class="stat-label">IPL Team</div>
                        <div class="player-value">${player2.IPLTeam || 'N/A'}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsPrice.left}">₹${player1.Price || 0}Cr</div>
                        <div class="stat-label">Price</div>
                        <div class="player-value ${clsPrice.right}">₹${player2.Price || 0}Cr</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsPoints.left}">${s1.totalPoints || 0}</div>
                        <div class="stat-label">Total Points</div>
                        <div class="player-value ${clsPoints.right}">${s2.totalPoints || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value">${s1.matches || 0}</div>
                        <div class="stat-label">Matches</div>
                        <div class="player-value">${s2.matches || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsRuns.left}">${s1.runs || 0}</div>
                        <div class="stat-label">Runs</div>
                        <div class="player-value ${clsRuns.right}">${s2.runs || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsFours.left}">${s1.fours || 0}</div>
                        <div class="stat-label">4s</div>
                        <div class="player-value ${clsFours.right}">${s2.fours || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsSixes.left}">${s1.sixes || 0}</div>
                        <div class="stat-label">6s</div>
                        <div class="player-value ${clsSixes.right}">${s2.sixes || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsSR.left}">${sr1.toFixed(2)}</div>
                        <div class="stat-label">Strike Rate</div>
                        <div class="player-value ${clsSR.right}">${sr2.toFixed(2)}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsWkts.left}">${s1.wickets || 0}</div>
                        <div class="stat-label">Wickets</div>
                        <div class="player-value ${clsWkts.right}">${s2.wickets || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsDots.left}">${s1.dots || 0}</div>
                        <div class="stat-label">Dots</div>
                        <div class="player-value ${clsDots.right}">${s2.dots || 0}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsEco.left}">${eco1.toFixed(2)}</div>
                        <div class="stat-label">Economy</div>
                        <div class="player-value ${clsEco.right}">${eco2.toFixed(2)}</div>
                    </div>
                    <div class="comparison-row">
                        <div class="player-value ${clsCatches.left}">${s1.catches || 0}</div>
                        <div class="stat-label">Fielding Points</div>
                        <div class="player-value ${clsCatches.right}">${s2.catches || 0}</div>
                    </div>
                </div>
                <div class="comparison-actions">
                    <button class="btn btn--outline btn--lg" id="clearComparisonBtn">Clear Comparison</button>
                </div>
            </div>`;

        // Render & wire clear button
        resultsContainer.innerHTML = '<div class="comparison-results">' + comparisonHTML + '</div>';
        const clearBtn = document.getElementById('clearComparisonBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                document.getElementById('comparePlayer1').value = '';
                document.getElementById('comparePlayer2').value = '';
                resultsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: var(--space-20);">Please select both players to compare.</p>';
            };
        }
    }

    populatePlayerComparisonDropdowns() {
        // Support current markup IDs comparePlayer1 / comparePlayer2
        const dropdownIds = ['comparePlayer1','comparePlayer2'];
        const dropdowns = dropdownIds.map(id => document.getElementById(id));
        
        if (!dropdowns.every(Boolean)) {
            console.warn('❌ Player comparison dropdowns not found');
            return;
        }

        // Get sorted list of all players
        const players = Object.values(this.data.playerProfiles)
            .sort((a, b) => a.Player.localeCompare(b.Player));

        // Create dropdown options
        const options = players.map(player => {
            const stats = this.data.playerStats[player.Player] || {};
            return `<option value="${player.Player}">${player.Player}</option>`;
        }).join('');

        // Set the same options for both dropdowns
        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="">Select Player</option>' + options;
        });

        console.log('✅ Player comparison dropdowns populated with', players.length, 'players');
    }

    getBetterValueClass(value1, value2, higherIsBetter = true) {
        // Return CSS class for better value styling
        if (value1 === value2) return '';
        
        const isBetter = higherIsBetter ? value2 > value1 : value2 < value1;
        return isBetter ? 'better-value' : 'worse-value';
    }

    // Function to populate player stat tables
    populatePlayerStatTables(playerData) {
        // Helper function to create player stat item
        function createStatItem(player, statValue, extraStats = null) {
            const row = document.createElement('div');
            row.className = 'stats-row';

            const playerNameDiv = document.createElement('div');
            playerNameDiv.className = 'player-name';
            playerNameDiv.textContent = player;

            const valuesDiv = document.createElement('div');
            valuesDiv.className = 'stat-values';

            if (extraStats) {
                valuesDiv.innerHTML = extraStats;
            } else {
                const valueCol = document.createElement('div');
                valueCol.className = 'stat-col';
                valueCol.textContent = statValue;
                valuesDiv.appendChild(valueCol);
            }

            row.appendChild(playerNameDiv);
            row.appendChild(valuesDiv);
            return row;
        }

        // Process and sort player data
        const playerStats = {};
        playerData.forEach(match => {
            match.players.forEach(player => {
                if (!playerStats[player.name]) {
                    playerStats[player.name] = {
                        runs: 0,
                        fours: 0,
                        sixes: 0,
                        wickets: 0,
                        dots: 0
                    };
                }
                playerStats[player.name].runs += player.runs || 0;
                playerStats[player.name].fours += player.fours || 0;
                playerStats[player.name].sixes += player.sixes || 0;
                playerStats[player.name].wickets += player.wickets || 0;
                playerStats[player.name].dots += player.dots || 0;
            });
        });

        // Convert to array for sorting
        const players = Object.entries(playerStats).map(([name, stats]) => ({
            name,
            ...stats
        }));

        // Populate Most Runs
        const mostRunsList = document.getElementById('mostRunsList');
        if (mostRunsList) {
            mostRunsList.innerHTML = '';
            players
                .sort((a, b) => b.runs - a.runs)
                .slice(0, 5)
                .forEach(player => {
                    mostRunsList.appendChild(createStatItem(player.name, player.runs));
                });
        }

        // Populate Most Boundaries
        const mostBoundariesList = document.getElementById('mostBoundariesList');
        if (mostBoundariesList) {
            mostBoundariesList.innerHTML = '';
            players
                .sort((a, b) => ((b.fours + b.sixes) - (a.fours + a.sixes)))
                .slice(0, 5)
                .forEach(player => {
                    const row = document.createElement('div');
                    row.className = 'stats-row';
                    
                    const name = document.createElement('div');
                    name.className = 'player-name';
                    name.textContent = player.name;
                    
                    const values = document.createElement('div');
                    values.className = 'stat-values';
                    values.innerHTML = `
                        <div class="stat-value">${player.fours}</div>
                        <div class="stat-value">${player.sixes}</div>
                        <div class="stat-value">${player.fours + player.sixes}</div>
                    `;
                    
                    row.appendChild(name);
                    row.appendChild(values);
                    mostBoundariesList.appendChild(row);
                });
        }

        // Populate Most Wickets
        const mostWicketsList = document.getElementById('mostWicketsList');
        if (mostWicketsList) {
            mostWicketsList.innerHTML = '';
            players
                .sort((a, b) => b.wickets - a.wickets)
                .slice(0, 5)
                .forEach(player => {
                    mostWicketsList.appendChild(createStatItem(player.name, player.wickets));
                });
        }

        // Populate Most Dots
        const mostDotsList = document.getElementById('mostDotsList');
        if (mostDotsList) {
            mostDotsList.innerHTML = '';
            players
                .sort((a, b) => b.dots - a.dots)
                .slice(0, 5)
                .forEach(player => {
                    mostDotsList.appendChild(createStatItem(player.name, player.dots));
                });
        }
    }

    createPositionByMatchChart() {
        const ctx=document.getElementById('positionMatchChart');
        if(!ctx||typeof Chart==='undefined') return;

        const matches=this.data.matches||[];
        if(matches.length===0){console.warn('No matches data for position-by-match chart');return;}

        const teams=Object.keys(this.data.teamStandings||{});
        const teamColors={
            'Royal Smashers':'#ff6384',
            'Sher-e-Punjab':'#f59e0b',
            'Silly Pointers':'#3b82f6',
            'The Kingsmen':'#10b981'
        };

        // cumulative points per team
        const cumulative={};teams.forEach(t=>cumulative[t]=0);

        const labels=matches.map((m,i)=>`M${i+1}`);

        const rankData={};teams.forEach(t=>rankData[t]=[]);

        matches.forEach(match=>{
            teams.forEach(team=>{ cumulative[team]+= (match.teamTotals[team]||0); });
            const sorted=[...teams].sort((a,b)=> cumulative[b]-cumulative[a]);
            teams.forEach(team=> rankData[team].push(sorted.indexOf(team)+1));
        });

        const datasets=teams.map(team=>({
            label:team,
            data:rankData[team],
            borderColor:teamColors[team]||'#888',
            backgroundColor:teamColors[team]||'#888',
            fill:false,
            tension:0.25,
            pointRadius:3
        }));

        if(this.charts.positionMatch) this.charts.positionMatch.destroy();

        const themeColors=this.getThemeColors();
        this.charts.positionMatch=new Chart(ctx,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},interaction:{mode:'nearest',intersect:false},scales:{x:{ticks:{color:themeColors.subtleTextColor},grid:{display:false}},y:{ticks:{color:themeColors.subtleTextColor,precision:0,stepSize:1},grid:{color:themeColors.borderColor},reverse:true,min:1,max:teams.length+0.5}}}});
    }

    createAvgPointsPerMatchChart() {
        const ctx = document.getElementById('avgPointsPerMatchChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data for avg points per match-week chart');
            return;
        }

        const teams = Object.keys(this.data.teamStandings || {});
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        // Determine unique weeks in chronological order
        const weekLabels = [];
        matches.forEach(m => { if (!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek); });

        const shortLabels = weekLabels.map(w => {
            const n = (w || '').match(/\d+/);
            return n ? `MW${n[0]}` : w;
        });

        const datasets = teams.map(team => {
            const dataPoints = weekLabels.map(week => {
                const weekMatches = matches.filter(m => m.matchWeek === week);
                const totalPoints = weekMatches.reduce((sum, m) => sum + (m.teamTotals[team] || 0), 0);
                const avg = weekMatches.length ? totalPoints / weekMatches.length : 0;
                return avg;
            });
            return {
                label: team,
                data: dataPoints,
                borderColor: teamColors[team] || '#888',
                backgroundColor: teamColors[team] || '#888',
                fill: false,
                tension: 0.25,
                pointRadius: 3
            };
        });

        if (this.charts.avgPointsPerMatch) this.charts.avgPointsPerMatch.destroy();

        const themeColors = this.getThemeColors();

        this.charts.avgPointsPerMatch = new Chart(ctx, {
            type: 'line',
            data: { labels: shortLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: {
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { color: themeColors.borderColor }
                    }
                }
            }
        });
    }

    createPricePointsChart() {
        const ctx = document.getElementById('pricePointsChart');
        if (!ctx || typeof Chart === 'undefined') return;

        // Ensure data exists
        if (!this.data.auctionData || !Array.isArray(this.data.auctionData.allPlayers) || this.data.auctionData.allPlayers.length === 0) {
            console.warn('No auction data for price vs points chart');
            return;
        }

        const players = this.data.auctionData.allPlayers;

        const datasets = [{
            label: 'Players',
            data: players.map(p => ({ x: p.performance.totalPoints, y: p.Price, r: 4 })),
            backgroundColor: players.map(p => {
                const teamColors = {
                    'Royal Smashers': '#ff6384',
                    'Sher-e-Punjab': '#f59e0b',
                    'Silly Pointers': '#3b82f6',
                    'The Kingsmen': '#10b981'
                };
                return teamColors[p.fantasyTeam] || '#888';
            })
        }];

        // Destroy existing chart
        if (this.charts.pricePoints) this.charts.pricePoints.destroy();

        const themeColors = this.getThemeColors();

        this.charts.pricePoints = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const p = players[context.dataIndex];
                                return `${p.Player}: ${p.performance.totalPoints} pts, ₹${p.Price}Cr`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Total Points', color: themeColors.textColor },
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { color: themeColors.borderColor },
                        min: 0
                    },
                    y: {
                        title: { display: true, text: 'Price (Cr)', color: themeColors.textColor },
                        ticks: { color: themeColors.subtleTextColor },
                        grid: { color: themeColors.borderColor }
                    }
                }
            }
        });
    }

    createPointsPerPlayerChart() {
        const ctx = document.getElementById('pointsPerPlayerChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data for points-per-player chart');
            return;
        }

        // Determine chronological week labels
        const weekLabels = [];
        matches.forEach(m => { if(!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek); });
        const shortLabels = weekLabels.map(w=>{const n=(w||'').match(/\d+/);return n?`MW${n[0]}`:w;});

        const teams = Object.keys(this.data.teamStandings || {});
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        const datasets = teams.map(team => {
            const dataPoints = weekLabels.map(week => {
                const weekMatches = matches.filter(m => m.matchWeek === week);
                let totalPoints = 0;
                let playerAppearances = 0;
                weekMatches.forEach(match => {
                    totalPoints += (match.teamTotals[team] || 0);
                    match.players.forEach(pl => { if(pl.team === team) playerAppearances += 1; });
                });
                const value = playerAppearances ? (totalPoints / playerAppearances) : 0;
                return value;
            });
            return {
                label: team,
                data: dataPoints,
                borderColor: teamColors[team] || '#888',
                backgroundColor: teamColors[team] || '#888',
                fill: false,
                tension: 0.25,
                pointRadius: 3
            };
        });

        if (this.charts.pointsPerPlayer) this.charts.pointsPerPlayer.destroy();

        const themeColors = this.getThemeColors();

        this.charts.pointsPerPlayer = new Chart(ctx, {
            type: 'line',
            data: { labels: shortLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: { ticks: { color: themeColors.subtleTextColor }, grid: { display: false } },
                    y: { ticks: { color: themeColors.subtleTextColor }, grid: { color: themeColors.borderColor } }
                }
            }
        });
    }

    createPlayersPlayedChart() {
        const ctx = document.getElementById('playersPlayedChart');
        if (!ctx || typeof Chart === 'undefined') return;

        const matches = this.data.matches || [];
        if (matches.length === 0) {
            console.warn('No matches data for players-played chart');
            return;
        }

        // week labels
        const weekLabels = [];
        matches.forEach(m => { if (!weekLabels.includes(m.matchWeek)) weekLabels.push(m.matchWeek); });
        const shortLabels = weekLabels.map(w => { const n=(w||'').match(/\d+/); return n?`MW${n[0]}`:w; });

        const teams = Object.keys(this.data.teamStandings || {});
        const teamColors = {
            'Royal Smashers': '#ff6384',
            'Sher-e-Punjab': '#f59e0b',
            'Silly Pointers': '#3b82f6',
            'The Kingsmen': '#10b981'
        };

        const datasets = teams.map(team => {
            const dataPoints = weekLabels.map(week => {
                const weekMatches = matches.filter(m => m.matchWeek === week);
                let count = 0;
                weekMatches.forEach(match => {
                    const appearances = match.players.filter(pl => pl.team === team).length;
                    count += appearances;
                });
                return count;
            });
            return {
                label: team,
                data: dataPoints,
                borderColor: teamColors[team] || '#888',
                backgroundColor: teamColors[team] || '#888',
                fill: false,
                tension: 0.25,
                pointRadius: 3
            };
        });

        if (this.charts.playersPlayed) this.charts.playersPlayed.destroy();

        const themeColors = this.getThemeColors();

        this.charts.playersPlayed = new Chart(ctx, {
            type: 'line',
            data: { labels: shortLabels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                interaction: { mode: 'nearest', intersect: false },
                scales: {
                    x: { ticks: { color: themeColors.subtleTextColor }, grid: { display: false } },
                    y: { ticks: { color: themeColors.subtleTextColor }, grid: { color: themeColors.borderColor }, beginAtZero: true }
                }
            }
        });
    }

    renderStatisticsLeaderboards() {
        // Player avg points
        const playerAvgTable = document.querySelector('#leaderboardPlayerAvg tbody');
        const teamAvgTable = document.querySelector('#leaderboardTeamAvg tbody');
        const teamGameTable = document.querySelector('#leaderboardTeamGame tbody');
        const playerGameTable = document.querySelector('#leaderboardPlayerGame tbody');
        if (!playerAvgTable || !teamAvgTable || !teamGameTable || !playerGameTable) return;

        // Highest avg points player
        const topPlayersAvg = [...this.data.players]
            .filter(p => p.matches && p.matches>0)
            .sort((a,b)=>b.averagePoints - a.averagePoints)
            .slice(0,3);
        playerAvgTable.innerHTML = topPlayersAvg.map(p=>`<tr><td>${p.name}</td><td>${p.averagePoints.toFixed(1)}</td></tr>`).join('');

        // Team avg
        const topTeamsAvg = Object.entries(this.data.teamStandings)
            .sort(([,a],[,b])=>b.averagePoints - a.averagePoints)
            .slice(0,3);
        teamAvgTable.innerHTML = topTeamsAvg.map(([team,stat])=>`<tr><td>${team}</td><td>${stat.averagePoints.toFixed(1)}</td></tr>`).join('');

        // Highest points game team
        const teamMaxMap = {};
        this.data.matches.forEach(match=>{
            Object.entries(match.teamTotals).forEach(([team,pts])=>{
                if((teamMaxMap[team]||0)<pts) teamMaxMap[team]=pts;
            });
        });
        const topTeamGame = Object.entries(teamMaxMap)
            .sort(([,a],[,b])=>b-a)
            .slice(0,3);
        teamGameTable.innerHTML = topTeamGame.map(([team,pts])=>`<tr><td>${team}</td><td>${pts}</td></tr>`).join('');

        // Highest points game player
        const playerMaxMap = {};
        this.data.matches.forEach(match=>{
            match.players.forEach(pl=>{
                if((playerMaxMap[pl.name]||0)<pl.fantasyPoints) playerMaxMap[pl.name]=pl.fantasyPoints;
            });
        });
        const topPlayerGame = Object.entries(playerMaxMap)
            .sort(([,a],[,b])=>b-a)
            .slice(0,3);
        playerGameTable.innerHTML = topPlayerGame.map(([player,pts])=>`<tr><td>${player}</td><td>${pts}</td></tr>`).join('');
    }

    renderStatLeaderboards() {
        const plAvgBody=document.querySelector('#leaderPlayerAvg tbody');
        const teamAvgBody=document.querySelector('#leaderTeamAvg tbody');
        const teamGameBody=document.querySelector('#leaderTeamGame tbody');
        const plGameBody=document.querySelector('#leaderPlayerGame tbody');
        if(!plAvgBody||!teamAvgBody||!teamGameBody||!plGameBody) return;
        // Player avg
        const topPlayers=[...this.data.players].filter(p=>p.matches>0).sort((a,b)=>b.averagePoints-a.averagePoints).slice(0,3);
        plAvgBody.innerHTML=topPlayers.map(p=>`<tr><td>${p.name}</td><td>${p.averagePoints.toFixed(1)}</td></tr>`).join('');
        // Team avg
        const teamArr=Object.entries(this.data.teamStandings).map(([team,val])=>({team,avg:val.averagePoints||0}));
        teamArr.sort((a,b)=>b.avg-a.avg);
        teamAvgBody.innerHTML=teamArr.slice(0,3).map(t=>`<tr><td>${t.team}</td><td>${t.avg.toFixed(1)}</td></tr>`).join('');
        // highest game team
        const teamMax={};
        this.data.matches.forEach(m=>{Object.entries(m.teamTotals).forEach(([team,pts])=>{teamMax[team]=Math.max(teamMax[team]||0,pts);});});
        const topTeamGame=Object.entries(teamMax).sort((a,b)=>b[1]-a[1]).slice(0,3);
        teamGameBody.innerHTML=topTeamGame.map(([team,pts])=>`<tr><td>${team}</td><td>${pts}</td></tr>`).join('');
        // highest game player
        const playerMax={};
        this.data.matches.forEach(m=>{m.players.forEach(p=>{playerMax[p.name]=Math.max(playerMax[p.name]||0,p.fantasyPoints);});});
        const topPlayerGame=Object.entries(playerMax).sort((a,b)=>b[1]-a[1]).slice(0,3);
        plGameBody.innerHTML=topPlayerGame.map(([pl,pts])=>`<tr><td>${pl}</td><td>${pts}</td></tr>`).join('');
    }

    handleIplTeamFilter(team) {
        console.log('🏏 IPL Team filter:', team);
        this.currentFilters = this.currentFilters || {};
        this.currentFilters.iplTeam = team;
        this.applyFilters();
    }
}

// Global functions
function toggleTableRows(tableId) {
    const visibleRows = document.getElementById(`${tableId}-visible`);
    const hiddenRows = document.getElementById(`${tableId}-hidden`);
    const button = document.querySelector(`button[onclick="toggleTableRows('${tableId}')"]`);
    
    if (!visibleRows || !hiddenRows || !button) return;
    
    const expandText = button.querySelector('.expand-text');
    const collapseText = button.querySelector('.collapse-text');
    const expandIcon = button.querySelector('.expand-icon');
    
    const isExpanded = hiddenRows.style.display !== 'none';
    
    if (isExpanded) {
        hiddenRows.style.display = 'none';
        expandText.style.display = 'inline';
        collapseText.style.display = 'none';
        expandIcon.textContent = '▼';
        
        if (window.innerWidth > 768) {
            const tableSection = document.getElementById('teamAuctionTables');
            if (tableSection) {
                setTimeout(() => {
                    tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }
        }
    } else {
        hiddenRows.style.display = '';
        expandText.style.display = 'none';
        collapseText.style.display = 'inline';
        expandIcon.textContent = '▲';
    }
    
    if (window.innerWidth > 768) {
        const allTables = ['team-table-0', 'team-table-1', 'team-table-2', 'team-table-3'];
        allTables.forEach(otherTableId => {
            if (otherTableId !== tableId) {
                const otherHiddenRows = document.getElementById(`${otherTableId}-hidden`);
                const otherButton = document.querySelector(`button[onclick="toggleTableRows('${otherTableId}')"]`);
                
                if (otherHiddenRows && otherButton) {
                    const otherExpandText = otherButton.querySelector('.expand-text');
                    const otherCollapseText = otherButton.querySelector('.collapse-text');
                    const otherExpandIcon = otherButton.querySelector('.expand-icon');
                    
                    if (isExpanded) {
                        otherHiddenRows.style.display = 'none';
                        otherExpandText.style.display = 'inline';
                        otherCollapseText.style.display = 'none';
                        otherExpandIcon.textContent = '▼';
                    } else {
                        otherHiddenRows.style.display = '';
                        otherExpandText.style.display = 'none';
                        otherCollapseText.style.display = 'inline';
                        otherExpandIcon.textContent = '▲';
                    }
                }
            }
        });
    }
}

function toggleVFMRows() {
    const hiddenRows = document.getElementById('vfmTableBodyHidden');
    const controls = document.getElementById('vfmExpandControls');
    const button = controls?.querySelector('.vfm-expand-btn');
    
    if (!hiddenRows || !button) return;
    
    const expandText = button.querySelector('.expand-text');
    const collapseText = button.querySelector('.collapse-text');
    const expandIcon = button.querySelector('.expand-icon');
    
    const isExpanded = hiddenRows.style.display !== 'none';
    
    if (isExpanded) {
        hiddenRows.style.display = 'none';
        expandText.style.display = 'inline';
        collapseText.style.display = 'none';
        expandIcon.textContent = '▼';
    } else {
        hiddenRows.style.display = '';
        expandText.style.display = 'none';
        collapseText.style.display = 'inline';
        expandIcon.textContent = '▲';
    }
}

function setupPlayerFilters() {
    const app = window.dashboardApp;
    if (!app) return;

    // Initialize filters
    app.initializePlayerFilters();

    // Set up event listeners
    const playerSearch = document.getElementById('playerSearch');
    const teamFilter = document.getElementById('teamFilter');
    const positionFilter = document.getElementById('positionFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const iplFilter = document.getElementById('iplTeamFilter');

    if (playerSearch) {
        playerSearch.addEventListener('input', (e) => app.handlePlayerSearch(e.target.value));
    }

    if (teamFilter) {
        teamFilter.addEventListener('change', (e) => app.handleTeamFilter(e.target.value));
    }

    if (positionFilter) {
        positionFilter.addEventListener('change', (e) => app.handlePositionFilter(e.target.value));
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => app.clearAllFilters());
    }

    if (iplFilter) {
        iplFilter.addEventListener('change', (e) => app.handleIplTeamFilter(e.target.value));
    }

    // Initial render
    app.applyFilters();
}

// Initialize the dashboard when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initializing Fantasy Dashboard...');
        window.dashboardApp = new DashboardApp();
        await window.dashboardApp.init();
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
    }
});