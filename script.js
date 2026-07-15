// सर्व आवश्यक एलिमेंट्स मिळवणे
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const winnerScreen = document.getElementById('winner-screen');
const cardGrid = document.getElementById('card-grid');

const p1ScoreDisplay = document.getElementById('p1-score');
const p2ScoreDisplay = document.getElementById('p2-score');
const turnIndicator = document.getElementById('turn-indicator');
const winnerText = document.getElementById('winner-text');

// ऑडिओ एलिमेंट्स
const audioClick = document.getElementById('audio-click');
const audioFlip = document.getElementById('audio-flip');
const audioMatch = document.getElementById('audio-match');
const audioWrong = document.getElementById('audio-wrong');
const audioWin = document.getElementById('audio-win');

// गेम व्हेरिएबल्स
let p1Score = 0;
let p2Score = 0;
let activePlayer = 1; // 1 = Player 1, 2 = Player 2
let cardsData = []; 
let flippedCards = [];
let isLockBoard = false;
let totalMatches = 0;

// १० इमेजेसच्या जोड्या (एकूण २० कार्ड्स)
const initialCardsData = [
    { id: 1, img: 'card1.png' }, { id: 1, img: 'card1.png' },
    { id: 2, img: 'card2.png' }, { id: 2, img: 'card2.png' },
    { id: 3, img: 'card3.png' }, { id: 3, img: 'card3.png' },
    { id: 4, img: 'card4.png' }, { id: 4, img: 'card4.png' },
    { id: 5, img: 'card5.png' }, { id: 5, img: 'card5.png' },
    { id: 6, img: 'card6.png' }, { id: 6, img: 'card6.png' },
    { id: 7, img: 'card7.png' }, { id: 7, img: 'card7.png' },
    { id: 8, img: 'card8.png' }, { id: 8, img: 'card8.png' },
    { id: 9, img: 'card9.png' }, { id: 9, img: 'card9.png' },
    { id: 10, img: 'card10.png' }, { id: 10, img: 'card10.png' }
];

// साऊंड प्ले करण्याचे फंक्शन (बग-फ्री प्लेबॅकसाठी रिसेट सह)
function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Audio play blocked by browser"));
}

// फिशर-येट्स शफल अल्गोरिदम
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// १ सेकंद ब्लर + फेड ट्रान्झिशन फंक्शन
function switchScreen(fromScreen, toScreen, isWinnerScreen = false) {
    fromScreen.classList.add('blur-out');
    
    setTimeout(() => {
        fromScreen.classList.remove('active', 'blur-out');
        if (isWinnerScreen) {
            toScreen.classList.remove('hide-winner');
            toScreen.classList.add('active');
        } else {
            toScreen.classList.add('active');
        }
    }, 1000);
}

// गेम बोर्ड तयार करणे
function createBoard() {
    cardGrid.innerHTML = '';
    cardsData.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.id = card.id;
        cardElement.dataset.index = index;

        cardElement.innerHTML = `
            <div class="card-inner">
                <div class="card-face card-back"></div>
                <div class="card-face card-front">
                    <img src="${card.img}" alt="Card Image">
                </div>
            </div>
        `;
        
        cardElement.addEventListener('click', flipCard);
        cardGrid.appendChild(cardElement);
    });
}

// कार्ड फ्लिप करणे
function flipCard() {
    if (isLockBoard) return;
    if (this.classList.contains('flipped')) return;

    playSound(audioFlip);
    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkMatch();
    }
}

// उरलेली कार्ड्स रँडमली शफल करणे (प्रत्येक राउंडनंतर)
function shuffleRemainingCards() {
    // अजून मॅच न झालेली (स्क्रीनवर न उघडलेली) कार्ड्स शोधणे
    const unflippedCards = Array.from(document.querySelectorAll('.card:not(.flipped)'));
    
    if (unflippedCards.length <= 2) return; // २ किंवा कमी उरली असतील तर शफलची गरज नाही

    // उरलेल्या कार्ड्सचा डेटा काढणे
    const remainingData = unflippedCards.map(card => {
        return cardsData[parseInt(card.dataset.index)];
    });

    // डेटा शफल करणे
    shuffle(remainingData);

    // स्क्रीनवरील उरलेल्या कार्ड्समध्ये नवीन शफल केलेला डेटा भरणे
    unflippedCards.forEach((card, i) => {
        const newCardData = remainingData[i];
        card.dataset.id = newCardData.id;
        card.querySelector('.card-front img').src = newCardData.img;
        
        // मुख्य एरेमधील इंडेक्सनुसार डेटा अपडेट करणे
        cardsData[parseInt(card.dataset.index)] = newCardData;
    });
}

// कार्ड्स मॅच झाली का तपासणे
function checkMatch() {
    isLockBoard = true;
    const [card1, card2] = flippedCards;

    if (card1.dataset.id === card2.dataset.id) {
        // MATCH ZALA!
        setTimeout(() => {
            playSound(audioMatch);
            triggerStarAnimation();
        
            // पॉईंट्स देणे
            if (activePlayer === 1) {
                p1Score++;
                p1ScoreDisplay.textContent = p1Score;
            } else {
                p2Score++;
                p2ScoreDisplay.textContent = p2Score;
            }

            totalMatches++;
            flippedCards = [];
            
            // गेम संपला का तपासणे
            if (totalMatches === 10) {
                endGame();
            } else {
                // मॅच झाल्यावर उरलेली कार्ड्स शफल करणे आणि सेम प्लेयरची टर्न राहणे
                
                isLockBoard = false;
            }
        }, 300);

    } else {
        // MATCH NAHI ZALA!
        setTimeout(() => {
            playSound(audioWrong);
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            
            flippedCards = [];
            switchTurn();
            isLockBoard = false;
        }, 700); // ०.४ सेकंद कार्ड दिसण्यासाठी आणि टोटल ~०.७ सेकंदाचा वेळ
    }
}

// टर्न बदलणे
function switchTurn() {
    activePlayer = activePlayer === 1 ? 2 : 1;
    turnIndicator.textContent = `Player ${activePlayer} Turn`;
}

// स्टार ॲनिमेशन इफेक्ट
function triggerStarAnimation() {
    const containerId = activePlayer === 1 ? 'p1-stars' : 'p2-stars';
    const container = document.getElementById(containerId);
    
    for (let i = 0; i < 6; i++) {
        const star = document.createElement('span');
        star.classList.add('star-pop');
        star.textContent = '⭐';
        
        // रँडम दिशा ठरवणे (फ्लाय आऊटसाठी)
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 40;
        const x = Math.cos(angle) * distance + 'px';
        const y = Math.sin(angle) * distance + 'px';
        
        star.style.setProperty('--x', x);
        star.style.setProperty('--y', y);
        
        container.appendChild(star);
        
        setTimeout(() => star.remove(), 800);
    }
}

// गेम संपल्यावर विनर स्क्रीन दाखवणे
function endGame() {
    setTimeout(() => {
        playSound(audioWin);
        
        let resultMessage = "";
        if (p1Score > p2Score) {
            resultMessage = `Player 1 Won 🎉<br><span class="points-text">by ${p1Score - p2Score} points!</span>`;
        } else if (p2Score > p1Score) {
            resultMessage = `Player 2 Won 🎉<br><span class="points-text">by ${p2Score - p1Score} points!</span>`;
        } else {
            resultMessage = `Game Tie 🤝<br><span class="points-text">Both got ${p1Score} points!</span>`;
        }
        
        document.getElementById('winner-text').innerHTML = resultMessage;
        switchScreen(gameScreen, winnerScreen, true);
    }, 500);
}

// गेम पूर्ण रीसेट करणे
function resetGame() {
    p1Score = 0;
    p2Score = 0;
    totalMatches = 0;
    activePlayer = 1;
    flippedCards = [];
    isLockBoard = false;
    
    p1ScoreDisplay.textContent = '0';
    p2ScoreDisplay.textContent = '0';
    turnIndicator.textContent = 'Player 1 Turn';
    
    cardsData = [...initialCardsData];
    shuffle(cardsData);
    createBoard();
}

// --- बटन इव्हेंट लिस्टनर्स ---

// १. START GAME Button
document.getElementById('start-btn').addEventListener('click', () => {
    playSound(audioClick);
    resetGame();
    switchScreen(startScreen, gameScreen);
});

// २. PLAY AGAIN Button
document.getElementById('play-again-btn').addEventListener('click', () => {
    playSound(audioClick);
    resetGame();
    winnerScreen.classList.add('hide-winner');
    winnerScreen.classList.remove('active');
    gameScreen.classList.add('active');
});

// ३. EXIT Button
document.getElementById('exit-btn').addEventListener('click', () => {
    playSound(audioClick);
    winnerScreen.classList.add('hide-winner');
    winnerScreen.classList.remove('active');
    startScreen.classList.add('active');
});
