# Fantasy Cricket Dashboard

A comprehensive fantasy cricket dashboard for IPL auction analysis, team management, and player performance tracking. Built with vanilla HTML, CSS, and JavaScript for optimal performance and mobile responsiveness.

## Overview

This dashboard manages **4 fantasy teams** with **103 players** and **₹598.4 Cr total investment**, providing detailed auction insights, team composition analysis, and player performance metrics.

### Fantasy Teams
- **Royal Smashers**
- **Sher-e-Punjab**  
- **Silly Pointers**
- **The Kingsmen**

## Key Features

### Dashboard Overview
- **6 Key Metrics Cards**: Total Teams, Players, Investment, Average Price, Most Expensive Player, Highest Bid (₹28.0 Cr)
- **Team Performance Rankings** with points and investment details
- **Real-time Statistics** with live updates

### Match Analysis
- **74 Individual Matches** with detailed breakdowns
- **Interactive Match Selector** with team performance charts
- **Points Distribution Analysis** across all matches
- **Team vs Team Comparisons**

### Team Management
- **Squad Composition** with player role distribution (BAT/BOWL/AR/WK)
- **Investment Analysis** per team
- **Player Type Visualization** with interactive charts
- **Best XI Generator** (points-based or value-based)

### Player Analytics
- **Advanced Filtering System** (team, position, performance level)
- **Search Functionality** with real-time results
- **Player Performance Details** with comprehensive stats
- **Value-for-Money Rankings** with expandable tables

### Auction Analysis
- **Best Bargains** identification
- **Expensive Picks** analysis
- **High-Risk, High-Reward** players
- **Price vs Performance** scatter plots
- **Investment Distribution** charts

### Scoring System
- **Complete Fantasy Rules** display
- **Points Breakdown** by action type
- **Batting, Bowling, Fielding** scoring details

## Design Features

### Mobile-First Responsive Design
- **Perfect Mobile Optimization** with touch-friendly interfaces
- **Horizontal Scrolling Tables** for complete data access
- **Responsive Grid Layouts** (desktop: 6 cards/row, mobile: 3 cards/row)
- **Touch-Optimized Navigation** with proper spacing

### Theme Support
- **Light/Dark Mode Toggle** with system preference detection
- **Consistent Color Schemes** across all components
- **Proper Contrast Ratios** for accessibility
- **Smooth Theme Transitions**

### Enhanced UX
- **Text-Width Tab Highlighting** for precise navigation
- **Hover Effects** and smooth transitions
- **Loading States** and error handling
- **Expandable Tables** with show more/less functionality

## Technical Implementation

### Technologies Used
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for interactive visualizations  
- **Icons**: Custom SVG icons and emoji indicators
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Data**: JSON-based data processing and management

### Performance Optimizations
- **Efficient Data Processing** with caching mechanisms
- **Lazy Loading** for large datasets
- **Optimized CSS** with organized architecture
- **Touch-Friendly Scrolling** with `-webkit-overflow-scrolling`

### Code Architecture
- **Modular JavaScript** with class-based organization
- **Responsive CSS** with mobile-first approach
- **Clean HTML Structure** with semantic elements
- **Maintainable Codebase** with proper documentation

## Data Processing

### Player Statistics
- **Performance Metrics**: Runs, Balls, 4s, 6s, Strike Rate, Wickets, Dots, Economy, Fielding Points
- **Captain/Vice-Captain Multipliers**: 2.0x, 1.5x, 1.0x
- **Total Points Calculation** with comprehensive scoring
- **Value Analysis** (Points per Crore)

### Team Analytics
- **Squad Balance**: Player type distribution
- **Investment Tracking**: Base price vs purchase price
- **Performance Rankings** based on total points
- **Composition Analysis** with visual breakdowns

## Getting Started

### Live Demo
**Access the dashboard directly**: [https://nikanjuri.github.io/fantasy-dashboard/](https://nikanjuri.github.io/fantasy-dashboard/)

### Local Development
```bash
# Clone the repository
git clone https://github.com/nikanjuri/fantasy-dashboard.git

# Navigate to project directory
cd fantasy-dashboard

# Start local server
python3 -m http.server 8000

# Open in browser
http://localhost:8000
```

### File Structure
```
fantasy-dashboard/
├── index.html          # Main HTML file
├── style.css           # Comprehensive styling (60KB)
├── app.js             # Core application logic (79KB)
├── data/              # JSON data files
│   ├── Fantasy_Points_2025.json
│   ├── Player_List_By_Team.json
│   └── Scoring_System.json
└── raw data/          # Source Excel files
```

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Responsive Breakpoints**: 768px, 1024px, 1280px
- **Touch Support**: Full touch and gesture support

## Version History

### v1.0 (Current - Production Ready)
- Complete mobile optimization with perfect centering
- 6 responsive stat cards with Highest Bid feature
- Player Performance Details with horizontal scrolling
- Text-width tab highlighting and backgrounds
- Complete theme support and touch-friendly design
- Production-ready milestone with comprehensive features

## Contributing

This is a specialized fantasy cricket dashboard. For major changes or feature requests, please create an issue first to discuss proposed modifications.

## License

This project is for educational and personal use in fantasy cricket league management.

---

**Built with care for Fantasy Cricket Enthusiasts**
