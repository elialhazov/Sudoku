import React, { useState } from 'react';
import ChatAssistant from './ChatAssistant';
import '../Styles/SudokuBoard.css';
import '../Styles/ChatAssistant.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import SudokuCell from './SudokuCell.jsx';
import ResetBoard from './ResetBoard.jsx';
import SolveStepButton from './SolveStepButton.jsx';
import Timer from './Timer.jsx';
import '../Styles/ResetBoard.css';
import '../Styles/SolveStepButton.css';
import '../Styles/Timer.css';

const SudokuBoard = () => {
    const generateBoard = () => {
        const board = Array(9).fill(null).map(() => Array(9).fill(''));
        const emptyCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                emptyCells.push([row, col]);
            }
        }
        fillRandomCells(board, emptyCells);
        return { board, emptyCells };
    };

    const fillRandomCells = (board, emptyCells) => {
        let filledCells = 0;
        while (filledCells <= 22 && emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const [row, col] = emptyCells[randomIndex];
            const num = Math.floor(Math.random() * 9) + 1;

            if (isValidPlacement(board, row, col, String(num))) {
                board[row][col] = String(num);
                emptyCells.splice(randomIndex, 1);
                filledCells++;
            }
        }
    };

    const isValidPlacement = (board, row, col, num) => {
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row][c] === num) {
                return false;
            }
        }

        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r][col] === num) {
                return false;
            }
        }

        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;

        for (let i = startRow; i < startRow + 3; i++) {
            for (let j = startCol; j < startCol + 3; j++) {
                if (i === row && j === col) continue;
                if (board[i][j] === num) {
                    return false;
                }
            }
        }

        return true;
    };

    const updateBoard = async (row, col, num) => {
        const isValidInput = /^[1-9]$/.test(num) || num === '';

        if (!isValidInput) {
            return;
        }

        const newBoard = board.map((rowArr, rowIndex) =>
            rowArr.map((cell, colIndex) => (rowIndex === row && colIndex === col ? num : cell))
        );

        const isPlacementValid = isValidPlacement(newBoard, row, col, num);

        if (!isPlacementValid && num !== '') {
            setMistakes((prevMistakes) => prevMistakes + 1);
        }

        setBoard(newBoard);
        setEmptyCells((prevEmptyCells) =>
            prevEmptyCells.filter(([r, c]) => !(r === row && c === col))
        );

        try {
            const params = new URLSearchParams();
            newBoard.forEach((row) => {
                const formattedRow = row.map((cell) => (cell === '' ? '0' : cell)).join(',');
                params.append('board', formattedRow);
            });

            const requestUrl = `/check_board/validate/?${params.toString()}`;
            const response = await fetch(requestUrl, {
                method: 'GET',
            });

            const data = await response.json();

            if (!data.valid) {
                setBackendError(`Error: ${data.error}`);
            } else {
                setBackendError('');
            }
        } catch {
            setBackendError('Error communicating with the backend.');
        }
    };

    const handleEndGame = async () => {
        const timerElement = document.querySelector('.timer-display');
        const timePlayed = timerElement ? timerElement.textContent : '00:00';

        try {
            const formData = new FormData();
            formData.append('time_played', timePlayed);
            formData.append('number_of_mistakes', mistakes);

            const response = await fetch('/check_board/save_game/', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                setBackendError(`Error: ${data.error}`);
            } else {
                setEndGameMessage(`Game ${data.game_number} saved successfully!`);
            }
        } catch (error) {
            setBackendError(`An error occurred while saving the game: ${error.message}`);
        }
    };

    const handleResetBoard = () => {
        const { board, emptyCells } = generateBoard();
        setBoard(board);
        setEmptyCells(emptyCells);
        setResetTimer((prev) => !prev);
        setBackendError('');
        setMistakes(0);
        setEndGameMessage('');
    };

    const findNextCell = (emptyCells) => {
        return emptyCells.length > 0 ? emptyCells[0] : null;
    };

    const { board: initialBoard, emptyCells: initialEmptyCells } = generateBoard();
    const [board, setBoard] = useState(initialBoard);
    const [emptyCells, setEmptyCells] = useState(initialEmptyCells);
    const [resetTimer, setResetTimer] = useState(false);
    const [backendError, setBackendError] = useState('');
    const [mistakes, setMistakes] = useState(0);
    const [endGameMessage, setEndGameMessage] = useState('');

    return (
        <div className="main-container">
            <div className="header-container">
                <h1 className="custom-title mb-4">🎲 Welcome to Sudoku Pro 🎲</h1>
                <p className="lead text-secondary">Solve Sudoku step-by-step or reset the board.</p>
            </div>
            <div className="mistakes-container">
                <p>Total Mistakes: {mistakes}</p>
            </div>

            <div className="sudoku-timer-container">
                <div className="timer-container">
                    <Timer reset={resetTimer} />
                </div>

                <div className="sudoku-container">
                    <div className="sudoku-board">
                        {board.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                                <SudokuCell
                                    key={`${rowIndex}-${colIndex}`}
                                    cell={cell}
                                    rowIndex={rowIndex}
                                    colIndex={colIndex}
                                    handleInputChange={updateBoard}
                                />
                            ))
                        )}
                    </div>

                    {backendError && <div className="alert alert-danger mt-3">{backendError}</div>}
                    {endGameMessage && (
                        <div className="alert alert-success mt-3" data-testid="end-game-message">
                            {endGameMessage}
                        </div>
                    )}
                </div>
            </div>

            <div className="button-container mt-4">
                <ResetBoard setInitialBoard={handleResetBoard} setBoard={setBoard} generateBoard={generateBoard} />
                <SolveStepButton
                    board={board}
                    setBoard={updateBoard}
                    findNextCell={() => findNextCell(emptyCells)}
                    isValidPlacement={isValidPlacement}
                    setEmptyCells={setEmptyCells}
                />
                <button className="btn btn-success end-game-button" onClick={handleEndGame}>
                    End Game
                </button>
            </div>
            <div className="chat-container mt-4">
                <ChatAssistant boardState={board} />
            </div>


            <footer className="footer mt-5">
                <p className="text-muted">© 2024 Sudoku Pro | By Michael Miron and Eli Alhazov :)</p>
            </footer>
        </div>
    );
};

export default SudokuBoard;
