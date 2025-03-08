let quizData = null;
let characterScores = {};
let userAnswers = [];
let currentQuestionIndex = 0;

function startQuiz() {
    document.getElementById('welcome-screen').style.display = 'none';
    const questionContainer = document.getElementById('question-container');
    questionContainer.style.display = 'block';
    questionContainer.innerHTML = '<div class="loading">Loading...</div>'; // Add loading indicator
    // Load quiz data when starting
    fetch('quiz.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            preloadImages(data).then(() => {
                initializeScores();
                showQuestion(0);
            });
        });
}

function preloadImages(data) {
    const imageUrls = [];
    data.quiz.forEach(question => {
        if (question.image) {
            imageUrls.push(question.image);
        }
    });
    Object.values(data.characters).forEach(character => {
        if (character.image) {
            imageUrls.push(character.image);
        }
    });

    const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = resolve;
            img.onerror = reject;
        });
    });

    return Promise.all(promises);
}

function initializeScores() {
    Object.keys(quizData.characters).forEach(character => {
        characterScores[character] = 0;
    });
}

function showQuestion(index) {
    const questionData = quizData.quiz[index];
    const questionContainer = document.getElementById('question-container');
    const progress = ((index + 1) / quizData.quiz.length) * 100;
    
    questionContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress" style="width: ${progress}%"></div>
        </div>
        <div class="question">
            <h2>${questionData.question}</h2>
        </div>
        <ul class="options">
            ${questionData.answers.map((answer, i) => `
                <li class="option" onclick="selectOption(${index}, ${i})">
                    ${answer.text}
                </li>
            `).join('')}
        </ul>
        ${questionData.image ? `<div class="question-image-container">
                                    <img src="${questionData.image}" alt="Question ${index + 1} Image" class="question-image">
                                </div>` : ''}
    `;
}

function selectOption(questionIndex, answerIndex) {
    const answer = quizData.quiz[questionIndex].answers[answerIndex];
    userAnswers.push(answer);
    
    // Update character scores based on answer weights
    Object.entries(answer.weights).forEach(([character, weight]) => {
        characterScores[character] += weight;
    });

    if (questionIndex < quizData.quiz.length - 1) {
        showQuestion(questionIndex + 1);
    } else {
        showResults();
    }
}

function showResults() {
    // Get top 3 characters
    const topMatches = Object.entries(characterScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    const [mainCharacter, secondCharacter, thirdCharacter] = topMatches;
    const character = quizData.characters[mainCharacter[0]];
    const questionContainer = document.getElementById('question-container');
    
    // Optional character image
    let characterImageHtml = "";
    if (character.image) {
        characterImageHtml = `<div class="character-image-container">
                                  <img src="${character.image}" alt="${mainCharacter[0]} Image" class="character-image">
                              </div>`;
    }
    
    const getAlliesHtml = Object.entries(character.allies)
        .map(([char, strength]) => `
            <div class="relationship-item ally">
                <span class="char-name">${char}</span>
                <span class="strength">${'✧'.repeat(strength)}</span>
            </div>
        `).join('');

    const getRivalsHtml = Object.entries(character.rivals)
        .map(([char, strength]) => `
            <div class="relationship-item rival">
                <span class="char-name">${char}</span>
                <span class="strength">${'✧'.repeat(strength)}</span>
            </div>
        `).join('');

    questionContainer.innerHTML = `
        <div class="results">
            <h1>${mainCharacter[0]}</h1>
            ${characterImageHtml}
            <div class="top-matches">
                <p class="match-info">You're also similar to: 
                    <span class="char-name">${secondCharacter[0]}</span> and 
                    <span class="char-name">${thirdCharacter[0]}</span>
                </p>
            </div>
            <div class="character-description">
                ${character.description}
            </div>
            <div class="chart-container">
                <canvas id="attributeChart"></canvas>
            </div>
            <div class="relationships">
                <div class="allies">
                    <h3>Allies</h3>
                    ${getAlliesHtml}
                </div>
                <div class="rivals">
                    <h3>Rivals</h3>
                    ${getRivalsHtml}
                </div>
            </div>
            <button class="start-btn" onclick="location.reload()">Discover Another Path</button>
            <p class="disclaimer">Images are copyright of Riot Games. Usage of the images follow the guidelines of Riot Game's <a href="https://www.riotgames.com/en/legal" target="_blank">Legal Jibber Jabber</a>.</p>
            <div class="linkedin-icon">
                <a href="https://linkedin.com/in/chanstan" target="_blank">
                    <i class="fab fa-linkedin"></i>
                </a>
            </div>
        </div>
    `;

    // Create the spider chart with improved styling
    const ctx = document.getElementById('attributeChart').getContext('2d');
    const attributes = character.attributes;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(attributes),
            datasets: [{
                label: false, // Remove the legend
                data: Object.values(attributes),
                backgroundColor: 'rgba(199, 158, 87, 0.2)',
                borderColor: '#c79e57',
                borderWidth: 2,
                pointBackgroundColor: '#c79e57'
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        display: false // Hide the numerical labels
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
                    pointLabels: {
                        color: '#e7e7e7',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Remove the legend completely
                }
            }
        }
    });
}