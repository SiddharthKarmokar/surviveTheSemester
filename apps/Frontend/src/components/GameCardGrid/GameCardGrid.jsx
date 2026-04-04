import React from 'react';
import GameCard from './GameCard';
import './gamecardgrid.css';

import tosiosImage from '../../assests/gamesCards/tosios.png';
import puzzleImage from '../../assests/gamesCards/15puzzle.png';
import canonImage from '../../assests/gamesCards/canon.png';
import mathTugImage from '../../assests/gamesCards/mathTug.png';
import binarySudokuImage from '../../assests/gamesCards/binarySudoku.png'

const games = [
    { id: 1, title: 'Two Player Arena (TOSIOS)', imageSrc: tosiosImage, gameId: 'twoPlayer' },
    { id: 2, title: '15 Puzzle', imageSrc: puzzleImage, gameId: 'puzzle' },
    { id: 3, title: 'Canon Game', imageSrc: canonImage, gameId: 'canonGame' },
    { id: 4, title: 'Math Tug-of-War', imageSrc: mathTugImage, gameId: 'mathTug' },
    { id: 5, title: 'Binary Sudoku', imageSrc: binarySudokuImage, gameId: 'binarySudoku' },
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
                        imageSrc={game.imageSrc}
                        onClick={() => onPlayGame && onPlayGame(game.gameId)}
                    />
                ))}
            </div>
        </div>
    );
};

export default GameCardGrid;
