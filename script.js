// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEZ0EuL1d0ZFYitJobJvWhRF0_dxWmQU0",
  authDomain: "physics-tracker-bfb4e.firebaseapp.com",
  projectId: "physics-tracker-bfb4e",
  storageBucket: "physics-tracker-bfb4e.firebasestorage.app",
  messagingSenderId: "731148639376",
  appId: "1:731148639376:web:6e1db3d9c257710dda8c15"
};

// Initialize Firebase
let db = null;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// ============================================
// Motivational quotes
const quotes = [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Study while others are sleeping; work while others are loafing; prepare while others are playing.", author: "William Arthur Ward" },
    { text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "A little progress each day adds up to big results.", author: "Satya Nani" }
];

// User data
let userData = {
    name: '',
    email: '',
    batch: '',
    startYear: 2000,
    endYear: 2025,
    deadline: ''
};

let paperProgress = {};
let currentStep = 1;
let userId = null; // Unique user ID

// Generate or retrieve unique user ID
function getUserId() {
    let id = localStorage.getItem('physics-tracker-user-id');
    if (!id) {
        id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('physics-tracker-user-id', id);
    }
    return id;
}

// Set minimum date for deadline input (today)
function setMinimumDeadline() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Set minimum to tomorrow
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const deadlineInput = document.getElementById('input-deadline');
    if (deadlineInput) {
        deadlineInput.setAttribute('min', minDate);
    }
}

// Load saved data
function loadData() {
    const saved = localStorage.getItem('physics-tracker-user');
    if (saved) {
        userData = JSON.parse(saved);
        userId = getUserId();
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        initializeApp();
    } else {
        // Set minimum deadline when welcome screen loads
        setTimeout(setMinimumDeadline, 100);
    }
}

// Save user data
function saveUserData() {
    localStorage.setItem('physics-tracker-user', JSON.stringify(userData));
}

// Load progress
function loadProgress() {
    const saved = localStorage.getItem('physics-tracker-progress');
    if (saved) {
        paperProgress = JSON.parse(saved);
    }
}

// Save progress
function saveProgress() {
    localStorage.setItem('physics-tracker-progress', JSON.stringify(paperProgress));
}

// Save user data to Firebase
async function saveUserDataToFirebase(userData) {
    if (!db) {
        console.log("Firebase not initialized");
        return;
    }
    
    try {
        userId = getUserId();
        
        const userDoc = {
            userId: userId,
            name: userData.name,
            email: userData.email,
            batch: userData.batch,
            startYear: userData.startYear,
            endYear: userData.endYear,
            deadline: userData.deadline,
            registrationDate: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        await db.collection('users').doc(userId).set(userDoc);
        console.log("✅ User data saved to Firebase");
    } catch (error) {
        console.error("❌ Error saving user data:", error);
    }
}

// Save progress to Firebase
async function saveProgressToFirebase(progress) {
    if (!db || !userId) return;
    
    try {
        const totalSections = (userData.endYear - userData.startYear + 1) * 11;
        const completed = Object.values(progress).filter(Boolean).length;
        const percentage = Math.round((completed / totalSections) * 100);
        
        await db.collection('users').doc(userId).update({
            progress: progress,
            completedSections: completed,
            totalSections: totalSections,
            progressPercentage: percentage,
            lastActive: new Date().toISOString()
        });
        
        console.log("✅ Progress saved to Firebase");
    } catch (error) {
        console.error("❌ Error saving progress:", error);
    }
}

function nextStep(step) {
    // Validate current step
    if (step === 2) {
        const name = document.getElementById('input-name').value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
        userData.name = name;
        userData.email = ''; // No email needed
    } else if (step === 3) {
        const batch = document.getElementById('input-batch').value;
        if (!batch) {
            alert('Please select your batch');
            return;
        }
        userData.batch = batch;
    } else if (step === 4) {
        const startYear = document.getElementById('input-start-year').value;
        if (!startYear) {
            alert('Please select a start year');
            return;
        }
        userData.startYear = parseInt(startYear);
    } else if (step === 5) {
        const endYear = document.getElementById('input-end-year').value;
        if (!endYear) {
            alert('Please select an end year');
            return;
        }
        const endYearNum = parseInt(endYear);
        if (endYearNum < userData.startYear) {
            alert('End year must be greater than or equal to start year');
            return;
        }
        userData.endYear = endYearNum;
        
        // Set minimum deadline when reaching step 5
        setTimeout(setMinimumDeadline, 100);
    }

    // Hide current step
    document.getElementById(`step-${currentStep}`).classList.add('hidden');
    
    // Show next step
    document.getElementById(`step-${step}`).classList.remove('hidden');
    currentStep = step;
    
    // Focus on the select field of the new step
    setTimeout(() => {
        const nextInput = document.querySelector(`#step-${step} select, #step-${step} input`);
        if (nextInput) nextInput.focus();
    }, 100);
}

// Validate if deadline is in the future
function isValidFutureDate(dateString) {
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return selectedDate > today;
}

// Start the app
function startApp() {
    const deadline = document.getElementById('input-deadline').value;
    if (!deadline) {
        alert('Please select a deadline');
        return;
    }
    
    // Validate deadline is in the future
    if (!isValidFutureDate(deadline)) {
        alert('⚠️ Deadline must be a future date. Please select a date that is at least tomorrow or later.');
        return;
    }
    
    const consent = document.getElementById('consent-checkbox').checked;
    if (!consent) {
        alert('Please agree to share your progress data');
        return;
    }
    
    userData.deadline = deadline;

    // Save user data to Firebase
    saveUserDataToFirebase(userData);

    // Save data locally
    saveUserData();

    // Start app
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    initializeApp();
}

// Initialize the app
function initializeApp() {
    loadProgress();
    userId = getUserId(); // Get user ID
    
    // Display user info
    document.getElementById('display-name').textContent = userData.name;
    document.getElementById('display-batch').textContent = userData.batch;
    
    // Display random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('quote-text').textContent = `"${randomQuote.text}"`;
    document.getElementById('quote-author').textContent = `— ${randomQuote.author}`;
    
    // Generate paper table
    generatePaperTable();
    
    // Update stats
    updateStats();
    
    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Update last active time every 5 minutes
    setInterval(() => {
        if (db && userId) {
            db.collection('users').doc(userId).update({
                lastActive: new Date().toISOString()
            });
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Generate the past papers table
function generatePaperTable() {
    const container = document.getElementById('paper-container');
    container.innerHTML = '';
    
    for (let year = userData.startYear; year <= userData.endYear; year++) {
        const sections = ['mcq', 's01', 's02', 's03', 's04', 'e05', 'e06', 'e07', 'e08', 'e09', 'e10'];
        const completed = sections.filter(s => paperProgress[`${year}-${s}`]).length;
        const percentage = Math.round((completed / sections.length) * 100);
        
        const card = document.createElement('div');
        card.className = 'year-card';
        
        card.innerHTML = `
            <div class="year-card-header">
                <h3 class="year-title">📚 ${year}</h3>
                <div class="year-progress">
                    <span class="year-percentage">${percentage}%</span>
                    <div class="mini-progress-bar">
                        <div class="mini-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="sections-grid">
                <div class="section-group">
                    <div class="section-group-title">MCQ</div>
                    <div class="section-items">
                        ${createCheckButton(year, 'mcq', 'Part 1')}
                    </div>
                </div>
                
                <div class="section-group">
                    <div class="section-group-title">Structure Questions</div>
                    <div class="section-items">
                        ${createCheckButton(year, 's01', 'Q01')}
                        ${createCheckButton(year, 's02', 'Q02')}
                        ${createCheckButton(year, 's03', 'Q03')}
                        ${createCheckButton(year, 's04', 'Q04')}
                    </div>
                </div>
                
                <div class="section-group">
                    <div class="section-group-title">Essay Questions</div>
                    <div class="section-items">
                        ${createCheckButton(year, 'e05', 'Q05')}
                        ${createCheckButton(year, 'e06', 'Q06')}
                        ${createCheckButton(year, 'e07', 'Q07')}
                        ${createCheckButton(year, 'e08', 'Q08')}
                        ${createCheckButton(year, 'e09', 'Q09')}
                        ${createCheckButton(year, 'e10', 'Q10')}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    }
}

// Create a checkbox button
function createCheckButton(year, section, label) {
    const key = `${year}-${section}`;
    const isChecked = paperProgress[key];
    
    return `
        <button class="section-check-btn ${isChecked ? 'checked' : ''}" onclick="toggleSection('${key}')">
            <span class="check-icon">${isChecked ? '✓' : ''}</span>
            <span class="check-label">${label}</span>
        </button>
    `;
}

// Toggle section completion
function toggleSection(key) {
    paperProgress[key] = !paperProgress[key];
    saveProgress();
    saveProgressToFirebase(paperProgress); // Save to Firebase
    generatePaperTable();
    updateStats();
}

// Update statistics
function updateStats() {
    const totalSections = (userData.endYear - userData.startYear + 1) * 11;
    const completed = Object.values(paperProgress).filter(Boolean).length;
    const percentage = Math.round((completed / totalSections) * 100);
    
    document.getElementById('overall-progress').textContent = percentage + '%';
    document.getElementById('overall-bar').style.width = percentage + '%';
    document.getElementById('completed-sections').textContent = completed;
    document.getElementById('total-sections').textContent = totalSections;
    
    // Calculate daily rate
    const remaining = totalSections - completed;
    const daysLeft = Math.floor((new Date(userData.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const dailyRate = daysLeft > 0 ? (remaining / daysLeft).toFixed(1) : 0;
    
    document.getElementById('sections-left').textContent = remaining;
    document.getElementById('daily-rate').textContent = dailyRate;
}

// Update countdown timer
function updateCountdown() {
    const deadline = new Date(userData.deadline);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff < 0) {
        document.getElementById('countdown-days').textContent = '0';
        document.getElementById('countdown-hours').textContent = '00';
        document.getElementById('countdown-minutes').textContent = '00';
        document.getElementById('countdown-seconds').textContent = '00';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('countdown-days').textContent = days;
    document.getElementById('countdown-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdown-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdown-seconds').textContent = String(seconds).padStart(2, '0');
}

// Send feedback
function sendFeedback() {
    const feedback = document.getElementById('feedback-input').value.trim();
    if (!feedback) {
        alert('Please enter your feedback');
        return;
    }
    
    const mailtoLink = `mailto:aboohurairamohammedaqeed@gmail.com?subject=Feedback from ${userData.name}&body=${encodeURIComponent(feedback)}`;
    window.location.href = mailtoLink;
    
    document.getElementById('feedback-input').value = '';
    document.getElementById('feedback-success').textContent = '✓ Thank you for your feedback!';
    setTimeout(() => {
        document.getElementById('feedback-success').textContent = '';
    }, 3000);
}

// Reset app
function resetApp() {
    if (confirm('Are you sure you want to reset everything? This will clear all your progress and start fresh.')) {
        localStorage.removeItem('physics-tracker-user');
        localStorage.removeItem('physics-tracker-progress');
        localStorage.removeItem('physics-tracker-user-id');
        location.reload();
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', loadData);