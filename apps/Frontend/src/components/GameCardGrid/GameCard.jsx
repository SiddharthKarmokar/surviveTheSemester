import React from 'react';
import './gamecard.css';

const GameCard = ({ title, imageSrc, onClick }) => {
    return (
        <div className="gamecard-container" onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className="gamecard-image-wrapper">
                <img src={imageSrc} alt={title} className="gamecard-image" />
                <div className="gamecard-image-title">{title}</div>
            </div>
            <button type="button" className="gamecard-action" onClick={(e) => { e.stopPropagation(); onClick(); }}>Play</button>
        </div>
    );
};

export default GameCard;
