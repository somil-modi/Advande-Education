// Initialize variables
let currentLanguage = localStorage.getItem('currentLanguage') || 'english';
let currentQuizType = '';
let currentQuestionIndex = 0;
let score = 0;
let quizQuestions = [];

// Quiz questions data
const quizData = {
    basic: {
        english: [
            {
                question: "What is this sign?",
                image: "images/english/A.png",
                options: ["A", "B", "C", "D"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/english/B.png",
                options: ["A", "B", "C", "D"],
                correct: 1
            },
            {
                question: "What is this sign?",
                image: "images/english/C.png",
                options: ["A", "B", "C", "D"],
                correct: 2
            }
        ],
        hindi: [
            {
                question: "What is this sign?",
                image: "images/hindi/अ.png",
                options: ["अ", "आ", "इ", "ई"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/hindi/आ.png",
                options: ["अ", "आ", "इ", "ई"],
                correct: 1
            },
            {
                question: "What is this sign?",
                image: "images/hindi/इ.png",
                options: ["अ", "आ", "इ", "ई"],
                correct: 2
            }
        ],
        bengali: [
            {
                question: "What is this sign?",
                image: "images/bengali/অ.png",
                options: ["অ", "আ", "ই", "ঈ"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/bengali/আ.png",
                options: ["অ", "আ", "ই", "ঈ"],
                correct: 1
            },
            {
                question: "What is this sign?",
                image: "images/bengali/ই.png",
                options: ["অ", "আ", "ই", "ঈ"],
                correct: 2
            }
        ]
    },
    advanced: {
        english: [
            {
                question: "What is this sign?",
                image: "images/english/phrases/Hello.png",
                options: ["Hello", "Goodbye", "Thank you", "Please"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/english/phrases/Thank you.png",
                options: ["Hello", "Goodbye", "Thank you", "Please"],
                correct: 2
            },
            {
                question: "What is this sign?",
                image: "images/english/phrases/Please.png",
                options: ["Hello", "Goodbye", "Thank you", "Please"],
                correct: 3
            }
        ],
        hindi: [
            {
                question: "What is this sign?",
                image: "images/hindi/phrases/नमस्ते.png",
                options: ["नमस्ते", "अलविदा", "धन्यवाद", "कृपया"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/hindi/phrases/धन्यवाद.png",
                options: ["नमस्ते", "अलविदा", "धन्यवाद", "कृपया"],
                correct: 2
            },
            {
                question: "What is this sign?",
                image: "images/hindi/phrases/कृपया.png",
                options: ["नमस्ते", "अलविदा", "धन्यवाद", "कृपया"],
                correct: 3
            }
        ],
        bengali: [
            {
                question: "What is this sign?",
                image: "images/bengali/phrases/হ্যালো.png",
                options: ["হ্যালো", "বিদায়", "ধন্যবাদ", "দয়া করে"],
                correct: 0
            },
            {
                question: "What is this sign?",
                image: "images/bengali/phrases/ধন্যবাদ.png",
                options: ["হ্যালো", "বিদায়", "ধন্যবাদ", "দয়া করে"],
                correct: 2
            },
            {
                question: "What is this sign?",
                image: "images/bengali/phrases/দয়া করে.png",
                options: ["হ্যালো", "বিদায়", "ধন্যবাদ", "দয়া করে"],
                correct: 3
            }
        ]
    }
};

// Function to start quiz
function startQuiz(type) {
    currentQuizType = type;
    currentQuestionIndex = 0;
    score = 0;
    quizQuestions = quizData[type][currentLanguage];
    
    document.querySelector('.quiz-options').style.display = 'none';
    document.getElementById('question-section').style.display = 'block';
    document.getElementById('result-section').style.display = 'none';
    
    showQuestion();
}

// Function to show current question
function showQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('sign-image').src = question.image;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionElement);
    });
    
    document.getElementById('next-btn').disabled = true;
}

// Function to select an option
function selectOption(index) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.classList.remove('selected'));
    options[index].classList.add('selected');
    document.getElementById('next-btn').disabled = false;
}

// Function to check answer
function checkAnswer() {
    const selectedOption = document.querySelector('.option.selected');
    if (!selectedOption) return;
    
    const selectedIndex = Array.from(document.querySelectorAll('.option')).indexOf(selectedOption);
    const isCorrect = selectedIndex === quizQuestions[currentQuestionIndex].correct;
    
    if (isCorrect) {
        score++;
        selectedOption.classList.add('correct');
    } else {
        selectedOption.classList.add('incorrect');
        document.querySelectorAll('.option')[quizQuestions[currentQuestionIndex].correct].classList.add('correct');
    }
    
    document.getElementById('next-btn').disabled = true;
    setTimeout(nextQuestion, 1500);
}

// Function to move to next question
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

// Function to show results
function showResults() {
    document.getElementById('question-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'block';
    
    const percentage = (score / quizQuestions.length) * 100;
    document.getElementById('score-display').textContent = `${score}/${quizQuestions.length} (${percentage}%)`;
    
    let feedback = '';
    if (percentage >= 80) {
        feedback = 'Excellent! You have a great understanding of sign language!';
    } else if (percentage >= 60) {
        feedback = 'Good job! Keep practicing to improve your skills.';
    } else {
        feedback = 'Keep practicing! You\'ll get better with time.';
    }
    document.getElementById('result-feedback').textContent = feedback;
}

// Function to restart quiz
function restartQuiz() {
    document.getElementById('result-section').style.display = 'none';
    document.querySelector('.quiz-options').style.display = 'grid';
}

// Initialize the page when it loads
document.addEventListener('DOMContentLoaded', function() {
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

    // Add event listeners for quiz buttons
    const basicQuizBtn = document.querySelector('[onclick="startQuiz(\'basic\')"]');
    const advancedQuizBtn = document.querySelector('[onclick="startQuiz(\'advanced\')"]');
    
    if (basicQuizBtn) basicQuizBtn.addEventListener('click', () => startQuiz('basic'));
    if (advancedQuizBtn) advancedQuizBtn.addEventListener('click', () => startQuiz('advanced'));
}); 