import React, { useState, useEffect } from 'react';

const ships = [
    { name: 'Carrier', length: 5, placed: false },
    { name: 'Fightboat', length: 4, placed: false },
    { name: 'Cruiser', length: 3, placed: false },
    { name: 'Submarine', length: 2, placed: false },
    { name: 'Destroyer', length: 1, placed: false }
];

function GameBoard({ isPlayerBoard, onCellClick, board, isSetupPhase, onShipPlacement }) {
    const [selectedShip, setSelectedShip] = useState(ships[4]);
    const [isHorizontal, setIsHorizontal] = useState(true);
    const [placedShips, setPlacedShips] = useState(0);
    const [playerShips, setPlayerShips] = useState({
        Carrier: [],
        Fightboat: [],
        Cruiser: [],
        Submarine: [],
        Destroyer: []
    });

    const handleCellClick = (row, col) => {
        if (isSetupPhase && isPlayerBoard) {
            placeShip(row, col);
        } else if (!isSetupPhase && !isPlayerBoard) {
            onCellClick(row, col);
        }
    };

    const placeShip = (row, col) => {
        if (selectedShip.placed) {
            alert(`${selectedShip.name} has already been placed.`);
            return;
        }

        if (canPlaceShip(row, col, selectedShip.length, isHorizontal)) {
            let coordinates = [];
            const newBoard = [...board];

            for (let i = 0; i < selectedShip.length; i++) {
                if (isHorizontal) {
                    newBoard[row][col + i] = 'ship';
                    coordinates.push({ x: row, y: col + i });
                } else {
                    newBoard[row + i][col] = 'ship';
                    coordinates.push({ x: row + i, y: col });
                }
            }

            setPlayerShips(prev => ({
                ...prev,
                [selectedShip.name]: coordinates
            }));

            setSelectedShip(prev => ({ ...prev, placed: true }));
            setPlacedShips(prev => prev + 1);
            onShipPlacement(newBoard, selectedShip.name);
        } else {
            alert('Cannot place ship here.');
        }
    };

    const canPlaceShip = (row, col, length, isHorizontal) => {
        if (isHorizontal) {
            if (col + length > 10) return false;
            for (let i = 0; i < length; i++) {
                if (board[row][col + i] !== 'empty') return false;
            }
        } else {
            if (row + length > 10) return false;
            for (let i = 0; i < length; i++) {
                if (board[row + i][col] !== 'empty') return false;
            }
        }
        return true;
    };

    return (
        <div className="game-board">
            <div className="board-header">
                {isPlayerBoard ? 'Your Fleet' : 'Opponent\'s Fleet'}
            </div>
            <div className="board-grid">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="board-row">
                        {row.map((cell, colIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={`board-cell ${cell}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            />
                        ))}
                    </div>
                ))}
            </div>
            {isSetupPhase && isPlayerBoard && (
                <div className="setup-controls">
                    <select
                        value={selectedShip.name}
                        onChange={(e) => setSelectedShip(ships.find(s => s.name === e.target.value))}
                    >
                        {ships.map(ship => (
                            <option key={ship.name} value={ship.name}>
                                {ship.name} ({ship.length})
                            </option>
                        ))}
                    </select>
                    <button onClick={() => setIsHorizontal(!isHorizontal)}>
                        {isHorizontal ? 'Horizontal' : 'Vertical'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default GameBoard; 