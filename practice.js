// Initialize variables
let currentLanguage = localStorage.getItem('currentLanguage') || 'english';
let score = 0;
let timer;
let timeLeft = 20;
let isPracticeActive = false;
let currentLetter = '';
let videoStream = null;
let hands = null;
let canvas = null;
let ctx = null;
let lastSignTime = 0;
let signCooldown = 2000; // 2 seconds cooldown between sign checks
const submitButton = document.getElementById('submit-sign');
const skipButton = document.getElementById('skip-sign');
let isWaitingForFeedback = false;

// Get DOM elements
const startButton = document.getElementById('start-practice');
const practiceContent = document.querySelector('.practice-content');
const resultsSection = document.querySelector('.practice-results');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const currentLetterDisplay = document.getElementById('current-letter');
const feedbackText = document.getElementById('feedback-text');
const cameraFeed = document.getElementById('camera-feed');
const finalScoreDisplay = document.getElementById('final-score');
const correctCountDisplay = document.getElementById('correct-count');
const totalTimeDisplay = document.getElementById('total-time');
const restartButton = document.getElementById('restart-practice');

// Language-specific alphabets
const alphabets = {
    english: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    hindi: 'अआइईउऊऋएऐओऔकखगघचछजझटठडढतथदधनपफबभमयरलवशषसह',
    bengali: 'অআইঈউঊঋএঐওঔকখগঘচছজঝটঠডঢতথদধনপফবভমযরলশষসহ'
};

// Sign recognition patterns (simplified for demonstration)
const signPatterns = {
    'A': { thumb: 'up', index: 'up', middle: 'up', ring: 'up', pinky: 'up' },
    'B': { thumb: 'in', index: 'up', middle: 'up', ring: 'up', pinky: 'up' },
    'C': { thumb: 'in', index: 'curved', middle: 'curved', ring: 'curved', pinky: 'curved' },
    // Add more sign patterns as needed
};

// Initialize MediaPipe Hands
async function initializeHandTracking() {
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults(onHandResults);

    // Create canvas for hand tracking visualization
    canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = 'calc(100% - 60px)'; // Leave space for controls
    canvas.style.zIndex = '1';
    document.querySelector('.camera-container').appendChild(canvas);
    ctx = canvas.getContext('2d');
}

// Process hand tracking results
function onHandResults(results) {
    if (!isPracticeActive) return;

    // Store the results for manual submission
    hands.lastResults = results;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
            });
            drawLandmarks(ctx, landmarks, {
                color: '#FF0000',
                lineWidth: 1
            });

            // Check sign if enough time has passed since last check
            const now = Date.now();
            if (now - lastSignTime > signCooldown) {
                checkSign(landmarks);
                lastSignTime = now;
            }
        }
    }
    ctx.restore();
}

// Check if the current hand position matches the expected sign
function checkSign(landmarks) {
    if (!currentLetter || !signPatterns[currentLetter]) return false;

    const pattern = signPatterns[currentLetter];
    const handState = analyzeHandState(landmarks);

    // Compare hand state with expected pattern
    const isCorrect = Object.keys(pattern).every(finger => 
        handState[finger] === pattern[finger]
    );

    if (isCorrect) {
        handleCorrectSign();
    }

    return isCorrect;
}

// Analyze the state of each finger
function analyzeHandState(landmarks) {
    const fingerState = {
        thumb: 'down',
        index: 'down',
        middle: 'down',
        ring: 'down',
        pinky: 'down'
    };

    // Simplified finger state detection
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerBases = [2, 5, 9, 13, 17];

    fingerTips.forEach((tip, index) => {
        const tipY = landmarks[tip].y;
        const baseY = landmarks[fingerBases[index]].y;
        const isUp = tipY < baseY;
        const isCurved = Math.abs(tipY - baseY) < 0.1;

        const fingerName = ['thumb', 'index', 'middle', 'ring', 'pinky'][index];
        fingerState[fingerName] = isUp ? 'up' : (isCurved ? 'curved' : 'down');
    });

    return fingerState;
}

// Handle correct sign detection
function handleCorrectSign() {
    score += 10;
    updateScore();
    feedbackText.textContent = 'Correct! +10 points';
    feedbackText.className = 'feedback correct';
    
    setTimeout(() => {
        showNextLetter();
    }, 2000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const icon = themeToggle.querySelector('i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
        });
    }

    // Add event listeners
    startButton.addEventListener('click', startPractice);
    restartButton.addEventListener('click', restartPractice);
    submitButton.addEventListener('click', handleSignSubmission);
    skipButton.addEventListener('click', skipCurrentSign);
});

// Start practice session
async function startPractice() {
    try {
        // Request camera access
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        // Set up camera feed
        cameraFeed.srcObject = videoStream;
        
        // Initialize hand tracking
        await initializeHandTracking();
        
        // Start camera processing
        const camera = new Camera(cameraFeed, {
            onFrame: async () => {
                await hands.send({ image: cameraFeed });
            },
            width: 1280,
            height: 720
        });
        camera.start();
        
        // Initialize practice
        score = 0;
        timeLeft = 20;
        updateScore();
        updateTimer();
        
        // Show practice content and ensure buttons are visible
        startButton.style.display = 'none';
        practiceContent.style.display = 'grid';
        resultsSection.style.display = 'none';
        
        // Make sure submit and skip buttons are visible
        submitButton.style.display = 'block';
        skipButton.style.display = 'block';
        submitButton.disabled = false;
        skipButton.disabled = false;
        
        // Start the practice
        isPracticeActive = true;
        showNextLetter();
        startTimer();
    } catch (error) {
        console.error('Error initializing practice:', error);
        alert('Please allow camera access to use this feature.');
    }
}

// Show next letter to sign
function showNextLetter() {
    const alphabet = alphabets[currentLanguage];
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    currentLetter = alphabet[randomIndex];
    currentLetterDisplay.textContent = currentLetter;
    feedbackText.textContent = '';
    feedbackText.className = 'feedback';
    timeLeft = 20;
    updateTimer();
}

// Start the timer
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeUp();
        }
    }, 1000);
}

// Update timer display
function updateTimer() {
    timerDisplay.textContent = timeLeft;
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = score;
}

// Handle when time runs out
function handleTimeUp() {
    feedbackText.textContent = 'Time\'s up!';
    feedbackText.className = 'feedback incorrect';
    setTimeout(showNextLetter, 2000);
    timeLeft = 20;
    updateTimer();
    startTimer();
}

// Handle sign submission
function handleSignSubmission() {
    if (!isPracticeActive || isWaitingForFeedback) return;
    
    isWaitingForFeedback = true;
    submitButton.disabled = true;
    skipButton.disabled = true;
    
    // Get the current hand landmarks if available
    const currentLandmarks = getCurrentHandLandmarks();
    const isCorrect = currentLandmarks ? checkSign(currentLandmarks) : false;
    
    if (isCorrect) {
        score += 10;
        updateScore();
        feedbackText.textContent = 'Correct! +10 points';
        feedbackText.className = 'feedback correct';
    } else {
        feedbackText.textContent = 'Incorrect. Try again!';
        feedbackText.className = 'feedback incorrect';
    }
    
    // Enable buttons after feedback
    setTimeout(() => {
        submitButton.disabled = false;
        skipButton.disabled = false;
        isWaitingForFeedback = false;
        
        if (isCorrect) {
            showNextLetter();
        }
    }, 2000);
}

// Get current hand landmarks
function getCurrentHandLandmarks() {
    if (!hands || !hands.lastResults || !hands.lastResults.multiHandLandmarks) {
        return null;
    }
    return hands.lastResults.multiHandLandmarks[0]; // Get the first detected hand
}

// Skip current sign
function skipCurrentSign() {
    if (!isPracticeActive || isWaitingForFeedback) return;
    
    feedbackText.textContent = 'Sign skipped';
    feedbackText.className = 'feedback';
    showNextLetter();
}

// End practice session
function endPractice() {
    isPracticeActive = false;
    clearInterval(timer);
    
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    // Show results
    practiceContent.style.display = 'none';
    resultsSection.style.display = 'block';
    finalScoreDisplay.textContent = score;
    correctCountDisplay.textContent = Math.floor(score / 10);
    totalTimeDisplay.textContent = (20 - timeLeft) + (20 * Math.floor(score / 10));
}

// Restart practice
function restartPractice() {
    startPractice();
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
}); 