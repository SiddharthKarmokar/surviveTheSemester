import React from 'react';
import GameCard from './GameCard';
import './gamecardgrid.css';

import puzzleAnim from '../../assests/lottie/15puzzle.json';
import swipeAnim from '../../assests/lottie/swipe.json';

const games = [
    { id: 1, title: '15 Puzzle', animationData: puzzleAnim },
    { id: 2, title: 'Make Grid Equal', animationData: swipeAnim },
];

const GameCardGrid = () => {
    return (
        <div className="gamecardgrid-container">
            <h3 className="gamecardgrid-title">Arena Games</h3>
            <div className="gamecardgrid-grid">
                {games.map((game) => (
                    <GameCard 
                        key={game.id} 
                        title={game.title} 
                        animationData={game.animationData} 
                    />
                ))}
            </div>
        </div>
    );
};

export default GameCardGrid;
