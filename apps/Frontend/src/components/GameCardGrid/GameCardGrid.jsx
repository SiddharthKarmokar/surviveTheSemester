import React from 'react';
import GameCard from './GameCard';
import './gamecardgrid.css';

import puzzleAnim from '../../assests/lottie/15puzzle.json';
const games = [
    { id: 1, title: 'Two Player Arena (TOSIOS)', animationData: puzzleAnim, gameId: 'twoPlayer' },
    { id: 2, title: '15 Puzzle', animationData: puzzleAnim, gameId: 'puzzle' },
    { id: 3, title: 'Canon Game', animationData: puzzleAnim, gameId: 'canonGame' },
    { id: 4, title: 'Math Tug-of-War', animationData: puzzleAnim, gameId: 'mathTug' },
    { id: 5, title: 'Binary Sudoku', animationData: puzzleAnim, gameId: 'binarySudoku' },
];

const GameCardGrid = ({ onPlayGame }) => {
    return (
        <div className="gamecardgrid-container">
            <h3 className="gamecardgrid-title">Arena Games</h3>
            <div className="gamecardgrid-grid">
                {games.map((game) => (
                    <GameCard 
                        key={game.id} 
                        title={game.title} 
                        animationData={game.animationData} 
                        onClick={() => onPlayGame && onPlayGame(game.gameId)}
                    />
                ))}
            </div>
        </div>
    );
};

export default GameCardGrid;
