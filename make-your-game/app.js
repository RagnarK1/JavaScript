document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const miniGrid = document.querySelector('.mini-grid');
    const startPauseBtn = document.getElementById('start-pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const showScore = document.getElementById('score');
    const showLives = document.getElementById('lives');
    const timeSec = document.getElementById(`sec`);
    const timeMin = document.getElementById(`min`);
  

    const WIDTH = 10;
    const DROP_INTERVAL = 500; 
    const COLORS = ['#6C7BFF', '#FFAC69', '#89FF89', '#FF5763','#7B3A7F', 'E0FF56', '#B1FFF5'];

    let squares = [];
    let score = 0; 
    let nextRandomTetromino = 0;
    let gameStarted = false;
    let animationId;
    let previousFrameTime = 0;
    let dropCounter = 0;
    let lives = 3;
    let seconds = 0;
    let minutes = 0;
    let timerInterval;


    for (let i = 0; i < 226; i++) {
        const item = document.createElement('div');
      
        if (i < 200) {
          grid.append(item);
          squares.push(item);
        } else if (i < 210) {
          item.classList.add('taken');
          grid.append(item);
          squares.push(item);
        } else {
          miniGrid.append(item);
        }
    }

    const jTetromino = [
        [0, WIDTH, WIDTH+1, WIDTH+2],
        [1, WIDTH+1, WIDTH*2+1, 2],
        [WIDTH, WIDTH+1, WIDTH+2, WIDTH*2+2],
        [1, WIDTH+1, WIDTH*2+1, WIDTH*2],
    ];

    const lTetromino = [
        [WIDTH, WIDTH+1, WIDTH+2, 2],
        [1, WIDTH+1, WIDTH*2+1, WIDTH*2+2],
        [WIDTH, WIDTH*2, WIDTH+1, WIDTH+2],
        [0, 1, WIDTH+1, WIDTH*2+1]
    ];

    const sTetromino = [
        [WIDTH, WIDTH+1, 1, 2],
        [1, WIDTH+1, WIDTH+2, WIDTH*2+2],
        [WIDTH*2, WIDTH*2+1, WIDTH+1, WIDTH+2],
        [0, WIDTH, WIDTH+1, WIDTH*2+1]
    ];

    const zTetromino = [
        [0, 1, WIDTH+1, WIDTH+2],
        [2, WIDTH+2, WIDTH+1, WIDTH*2+1],
        [WIDTH, WIDTH+1, WIDTH*2+1, WIDTH*2+2],
        [1, WIDTH+1, WIDTH, WIDTH*2]  
    ]

    const tTetromino = [
        [1, WIDTH+1, WIDTH, WIDTH+2],
        [1, WIDTH+1,WIDTH+2, WIDTH*2+1],
        [WIDTH, WIDTH+1, WIDTH+2, WIDTH*2+1],
        [1, WIDTH, WIDTH+1, WIDTH*2+1]
    ];

    const oTetromino = [
        [1, 2, WIDTH+1, WIDTH+2],
        [1, 2, WIDTH+1, WIDTH+2],
        [1, 2, WIDTH+1, WIDTH+2],
        [1, 2, WIDTH+1, WIDTH+2]
    ];

    const iTetromino = [
        [WIDTH, WIDTH+1, WIDTH+2, WIDTH+3],
        [2, WIDTH+2, WIDTH*2+2, WIDTH*3+2],
        [WIDTH*2, WIDTH*2+1, WIDTH*2+2, WIDTH*2+3],
        [1, WIDTH+1, WIDTH*2+1, WIDTH*3+1]
    ];

    function findRandomTetromino() {
        return Math.floor(Math.random() * tetrominoes.length);
    }

    const tetrominoes = [jTetromino, lTetromino, sTetromino, zTetromino, tTetromino, oTetromino, iTetromino];
    let randomTetromino = findRandomTetromino();
    let currentPosition = 4;
    let currentRotation = 0;
    let currentTetromino = tetrominoes[randomTetromino][currentRotation];

    function draw() {
        currentTetromino.forEach(index => {
            squares[currentPosition + index].classList.add('tetromino'); 
            squares[currentPosition + index].classList.remove('tetromino-cell'); // Remove tetromino-cell class
            squares[currentPosition + index].style.setProperty('--tetromino-color', COLORS[randomTetromino]);
        });
    }

    function undraw() {
        currentTetromino.forEach(index => {
            squares[currentPosition + index].classList.remove('tetromino');
        });
    }

    document.addEventListener('keydown', controlKey);

    function controlKey(e) {
        if (!gameStarted) {
            return;
        }

        if (e.keyCode === 37) {
            moveLeft();
        } else if (e.keyCode === 39) {
            moveRight();
        } else if (e.keyCode === 38) {
            rotateTetrominoe();
        } else if (e.keyCode === 40) {
            moveDown();
        }
    }

    function moveDown() {
        undraw();
        currentPosition += WIDTH;
        draw();
        freezeTetromino();
    }

    function update() {
        const currentTime = Date.now();
        const timeBetweenFrames = currentTime - previousFrameTime
        
        previousFrameTime = currentTime;

        dropCounter += timeBetweenFrames;

        if (dropCounter > DROP_INTERVAL) {
            moveDown();
            dropCounter = 0;
        }
        
        if (gameStarted) {
            animationId = requestAnimationFrame(update);
        }
    }

    function freezeTetromino() {  
        const hasAnyTetrominosBeenPlaced = currentTetromino.some(index => squares[currentPosition + index + WIDTH].classList.contains('taken'));
        showShape();

        if (hasAnyTetrominosBeenPlaced) {
            currentTetromino.forEach(index => squares[currentPosition + index].classList.add('taken', 'tetromino-cell'));
            randomTetromino = nextRandomTetromino;
            nextRandomTetromino = findRandomTetromino();
            currentTetromino = tetrominoes[randomTetromino][currentRotation];
            currentPosition = 4;
            draw();
            addScore();

            const gridFull = currentTetromino.some(index => squares[currentPosition + index].classList.contains('taken'));

            if (gridFull) {
                lives--;
                updateLivesDisplay();
                if (lives === 0) {
                    gameOver();
                    lives = 4;
                    score = 0;
                } else {
                    clearGrid();
                    randomTetromino = findRandomTetromino();
                    currentPosition = 4;
                    currentRotation = 0;
                    currentTetromino = tetrominoes[randomTetromino][currentRotation];
                    update();
                    showShape();
                }
            }
        }
    }

    function isAtLeftEdge(currentTetromino) {
        return currentTetromino.some(index => (currentPosition + index) % WIDTH === 0);
    }

    function isAtRightEdge(currentTetromino) {
        return currentTetromino.some(index => (currentPosition + index) % WIDTH === WIDTH - 1);
    }

    function moveLeft() {
        undraw();

        if (!isAtLeftEdge(currentTetromino)) currentPosition -= 1;
        if (currentTetromino.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            currentPosition += 1;
        }

        draw();
    }

    function moveRight() {
        undraw();

        if (!isAtRightEdge(currentTetromino)) currentPosition += 1;
        if (currentTetromino.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            currentPosition -= 1;
        }

        draw();
    }

    function rotateTetrominoe() {
        const nextRotation = (currentRotation + 1) % 4;
        const nextTetromino = tetrominoes[randomTetromino][nextRotation];

        if (isAtLeftEdge(nextTetromino) || isAtRightEdge(nextTetromino)) return;

        undraw();
        currentRotation = nextRotation;
        currentTetromino = nextTetromino;
        draw();

    }

    const showSquares = document.querySelectorAll('.mini-grid div');
    const showWidth = 4;
    let showIndex = 0;

    const nextTetromino = [
        [0, showWidth, showWidth +1, showWidth +2],
        [showWidth, showWidth +1, showWidth +2, 2],
        [showWidth, showWidth +1, 1, 2],
        [0, 1, showWidth+1, showWidth +2],
        [showWidth, showWidth +1, showWidth+2, 1],
        [1, 2, showWidth +1, showWidth +2],
        [showWidth, showWidth +1, showWidth +2, showWidth +3]
    ];

    function showShape() {
        showSquares.forEach(square => {
            square.classList.remove('tetromino');
        });
        nextTetromino[nextRandomTetromino].forEach(index => {
            showSquares[showIndex + index].classList.add('tetromino');
            showSquares[showIndex + index].style.setProperty('--tetromino-color', COLORS[nextRandomTetromino]);
        });
    }

    startPauseBtn.addEventListener('click', () => {
        if (gameStarted) {
            stopTimer();
            cancelAnimationFrame(animationId); 
            gameStarted = false;
        } else {
            resetTimer();
            startTimer();
            gameStarted = true;
            nextRandomTetromino = findRandomTetromino();
            updateScoresDisplay(score);
            updateLivesDisplay(lives);
            update();
        }
    });

    function addScore() {
        for (let i = 0; i < 199; i +=WIDTH) {
            const row = [i, i+1, i+2, i+3, i+4, i+5, i+6, i+7, i+8, i+9];

            if (row.every(index => squares[index].classList.contains('taken'))) {
                score += 10;
                updateScoresDisplay(score);

                row.forEach(index => {
                    squares[index].classList.remove('taken');
                    squares[index].classList.remove('tetromino');
                });
                const removeSquares = squares.splice(i, WIDTH);
                squares = removeSquares.concat(squares);
                squares.forEach(cell => grid.append(cell));
            }
        }
    }

    function restartGame() {
        gameStarted = true;
        score = 0;
        lives = 3;
        updateScoresDisplay(score);
        updateLivesDisplay(lives);

        clearGrid();
        resetTimer();

        randomTetromino = Math.floor(Math.random() * tetrominoes.length);
        currentPosition = 4;
        currentRotation = 0;
        currentTetromino = tetrominoes[randomTetromino][currentRotation];
        update();
        showShape();
    }

    function clearGrid() {
        squares.forEach(square => {
            square.classList.remove('tetromino', 'taken');
        });
    
        for (let i = 0; i < 10; i++) {
            squares[squares.length - 1 - i].classList.add('taken');
        }
    }
    
    restartBtn.addEventListener('click', () => {
        restartGame();
    });

    function gameOver() {
        if (currentTetromino.some(index => squares[currentPosition + index].classList.contains('taken'))) {
            updateScoresDisplay('end');
            gameStarted = false;
            stopTimer();

            cancelAnimationFrame(animationId);
        }
    }

    function updateLivesDisplay() {
        showLives.innerHTML = lives;
    }

    function updateScoresDisplay(score) {
        showScore.innerHTML = score;
    }
    function startTimer() {
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    function stopTimer() {
        clearInterval(timerInterval);
    }
    
    function updateTimer() {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        updateTimeDisplay();
    }
    
    function updateTimeDisplay() {
        timeSec.textContent = seconds < 10 ? `0${seconds}` : seconds;
        timeMin.textContent = minutes < 10 ? `0${minutes}` : minutes;
    }
    
    function resetTimer() {
        seconds = 0;
        minutes = 0;
        updateTimeDisplay();
    }
})