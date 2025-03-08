let quizData = null;
let characterScores = {};
let userAnswers = [];
let currentQuestionIndex = 0;
let userAttributes = {}; // Add new global variable

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

    // Add attribute tracking
    Object.entries(answer.attributes).forEach(([attr, value]) => {
        if (!userAttributes[attr]) {
            userAttributes[attr] = 0;
        }
        userAttributes[attr] += value;
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

    const getAttributeEmojis = (value, attribute) => {
        const emojiCount = Math.round(value / 20); // Convert 0-100 scale to 0-5 emojis
        const emojiMap = {
            'Intelligence': '🧠',
            'Strength': '💪',
            'Charisma': '✨',
            'Technology': '🔬',
            'Ambition': '🤑',
            'Loyalty': '❤️'
        };
        return emojiMap[attribute].repeat(emojiCount);
    };

    const generateShareText = () => {
        const shareLines = [`🎭 Out of Your League: ${mainCharacter[0]}\n`];
        Object.entries(userAttributes).forEach(([attr, value]) => {
            const emojis = getAttributeEmojis(value, attr);
            if (emojis) {
                shareLines.push(`${attr}: ${emojis}`);
            }
        });
        shareLines.push('\nhttps://outofyourleague.netlify.app');
        return shareLines.join('\n');
    };

    const handleShare = async () => {
        const shareText = generateShareText();
        try {
            await navigator.clipboard.writeText(shareText);
            const shareBtn = document.getElementById('shareButton');
            shareBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
            setTimeout(() => {
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i><span>Share Result</span>';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

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
                <div class="chart-toggles" style="text-align: center; margin-bottom: 1rem;">
                    <label style="margin-right: 1rem; color: #c79e57;">
                        <input type="checkbox" id="toggleCharacter" checked> ${mainCharacter[0]}
                    </label>
                    <label style="color: #6baed6;">
                        <input type="checkbox" id="toggleUser" checked> You
                    </label>
                </div>
                <canvas id="attributeChart"></canvas>
            </div>
            <button id="shareButton" class="share-btn" onclick="handleShare()">
                <i class="fas fa-share-alt"></i>
                <span>Share Result</span>
            </button>
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

    // Make handleShare available globally
    window.handleShare = handleShare;

    // Create the spider chart with both datasets
    const ctx = document.getElementById('attributeChart').getContext('2d');
    const labels = Object.keys(character.attributes);
    const characterData = Object.values(character.attributes);
    
    // Scale up user attributes to match character scale
    const userValues = labels.map(attr => {
        const value = userAttributes[attr] || 0;
        return value
    });

    const chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: mainCharacter[0],
                data: characterData,
                backgroundColor: 'rgba(199, 158, 87, 0.2)',
                borderColor: '#c79e57',
                borderWidth: 2,
                pointBackgroundColor: '#c79e57'
            },
            {
                label: 'You',
                data: userValues,
                backgroundColor: 'rgba(107, 174, 214, 0.2)',
                borderColor: '#6baed6',
                borderWidth: 2,
                pointBackgroundColor: '#6baed6'
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, display: false },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' },
                    angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                    pointLabels: {
                        color: '#e7e7e7',
                        font: { size: 14, weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Remove legend since we have custom toggles
                }
            }
        }
    });

    // Add toggle functionality
    document.getElementById('toggleCharacter').addEventListener('change', function(e) {
        chart.data.datasets[0].hidden = !e.target.checked;
        chart.update();
    });

    document.getElementById('toggleUser').addEventListener('change', function(e) {
        chart.data.datasets[1].hidden = !e.target.checked;
        chart.update();
    });
}