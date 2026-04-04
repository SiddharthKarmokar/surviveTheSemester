import React, { useRef } from 'react';
import '../css/games.css';

const GamesList = () => {
    const containerRef = useRef(null);

    return (
        <div id="games-list" ref={containerRef}>
            <div id="games-heading">
                <div>EXPLORE THE GAMES </div>
                <div>FROM US</div>
            </div>
            <div id="list">
                {["TOSIS","15 PUZZLE","CANON GAME","MATH WAR","BINARY SUDOKU"].map((name,num) => (
                    <div className={`game-item game-${num}`} key={num}>
                        <div id="item-number">
                            {num.toString().padStart(2, '0')}
                        </div>
                        <div id="game-name">
                            {name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GamesList;
