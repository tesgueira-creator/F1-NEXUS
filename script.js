// F1 NEXUS - JavaScript functionality

// Sample F1 data - in a real application, this would come from an API
const f1Teams = [
    {
        name: "Red Bull Racing",
        base: "Milton Keynes, UK",
        championships: 6,
        drivers: ["Max Verstappen", "Sergio Perez"],
        color: "#0600EF"
    },
    {
        name: "Mercedes",
        base: "Brackley, UK", 
        championships: 8,
        drivers: ["Lewis Hamilton", "George Russell"],
        color: "#00D2BE"
    },
    {
        name: "Ferrari",
        base: "Maranello, Italy",
        championships: 16,
        drivers: ["Charles Leclerc", "Carlos Sainz"],
        color: "#DC143C"
    },
    {
        name: "McLaren",
        base: "Woking, UK",
        championships: 8,
        drivers: ["Lando Norris", "Oscar Piastri"],
        color: "#FF8700"
    },
    {
        name: "Aston Martin",
        base: "Silverstone, UK",
        championships: 0,
        drivers: ["Fernando Alonso", "Lance Stroll"],
        color: "#006F62"
    },
    {
        name: "Alpine",
        base: "Enstone, UK",
        championships: 2,
        drivers: ["Esteban Ocon", "Pierre Gasly"],
        color: "#0090FF"
    }
];

const featuredDrivers = [
    {
        name: "Max Verstappen",
        team: "Red Bull Racing",
        number: 1,
        nationality: "Dutch",
        wins: 54
    },
    {
        name: "Lewis Hamilton", 
        team: "Mercedes",
        number: 44,
        nationality: "British",
        wins: 103
    },
    {
        name: "Charles Leclerc",
        team: "Ferrari", 
        number: 16,
        nationality: "Monégasque",
        wins: 5
    },
    {
        name: "Lando Norris",
        team: "McLaren",
        number: 4,
        nationality: "British", 
        wins: 1
    }
];

const standingsData = [
    {
        position: 1,
        driver: "Max Verstappen",
        team: "Red Bull Racing",
        points: 393
    },
    {
        position: 2,
        driver: "Lando Norris",
        team: "McLaren",
        points: 331
    },
    {
        position: 3,
        driver: "Charles Leclerc", 
        team: "Ferrari",
        points: 307
    },
    {
        position: 4,
        driver: "Oscar Piastri",
        team: "McLaren",
        points: 262
    },
    {
        position: 5,
        driver: "Carlos Sainz",
        team: "Ferrari",
        points: 244
    }
];

// DOM Content Loaded Event Listener
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    populateTeams();
    populateDrivers();
    populateStandings();
    setupNavigation();
    
    console.log('F1 NEXUS initialized successfully!');
}

// Populate teams section
function populateTeams() {
    const teamsContainer = document.getElementById('teams-container');
    if (!teamsContainer) return;
    
    teamsContainer.innerHTML = '';
    
    f1Teams.forEach(team => {
        const teamCard = createTeamCard(team);
        teamsContainer.appendChild(teamCard);
    });
}

// Create team card element
function createTeamCard(team) {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.style.borderLeftColor = team.color;
    
    card.innerHTML = `
        <h3>${team.name}</h3>
        <p><strong>Base:</strong> ${team.base}</p>
        <p><strong>Drivers:</strong> ${team.drivers.join(', ')}</p>
        <div class="team-stats">
            <div class="stat">
                <strong>${team.championships}</strong>
                <span>Championships</span>
            </div>
            <div class="stat">
                <strong>${team.drivers.length}</strong>
                <span>Drivers</span>
            </div>
        </div>
    `;
    
    return card;
}

// Populate drivers section
function populateDrivers() {
    const driversContainer = document.getElementById('drivers-container');
    if (!driversContainer) return;
    
    driversContainer.innerHTML = '';
    
    featuredDrivers.forEach(driver => {
        const driverCard = createDriverCard(driver);
        driversContainer.appendChild(driverCard);
    });
}

// Create driver card element  
function createDriverCard(driver) {
    const card = document.createElement('div');
    card.className = 'driver-card';
    
    card.innerHTML = `
        <div class="driver-number" style="margin: 0 auto 1rem;">${driver.number}</div>
        <h3>${driver.name}</h3>
        <p><strong>Team:</strong> ${driver.team}</p>
        <p><strong>Nationality:</strong> ${driver.nationality}</p>
        <p><strong>Race Wins:</strong> ${driver.wins}</p>
    `;
    
    return card;
}

// Populate standings table
function populateStandings() {
    const standingsContainer = document.getElementById('standings-container');
    if (!standingsContainer) return;
    
    const table = document.createElement('table');
    
    // Create table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Position</th>
        <th>Driver</th>
        <th>Team</th>
        <th>Points</th>
    `;
    
    const thead = document.createElement('thead');
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    standingsData.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${entry.position}</strong></td>
            <td>${entry.driver}</td>
            <td>${entry.team}</td>
            <td><strong>${entry.points}</strong></td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    standingsContainer.appendChild(table);
}

// Setup navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll to teams function (called from CTA button)
function scrollToTeams() {
    const teamsSection = document.getElementById('teams');
    if (teamsSection) {
        const headerHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = teamsSection.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Utility function to format numbers
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Add loading animation for future API calls
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading">Loading...</div>';
    }
}

// Error handling for future API calls
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error">Error: ${message}</div>`;
    }
}

// Add some basic animations on scroll
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.team-card, .driver-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// Initialize scroll animations when page loads
window.addEventListener('load', addScrollAnimations);