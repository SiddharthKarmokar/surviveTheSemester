import React from 'react';
import Lottie from 'lottie-react';
import './gamecard.css';

const GameCard = ({ title, animationData, onClick }) => {
    return (
        <div className="gamecard-container" onClick={onClick} style={{ cursor: 'pointer' }}>
            <div className="gamecard-lottie-wrapper">
                <Lottie animationData={animationData} loop={true} autoplay={true} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="gamecard-content">
                <h4 className="gamecard-title">{title}</h4>
            </div>
            <button className="gamecard-action" onClick={(e) => { e.stopPropagation(); onClick(); }}>Play</button>
        </div>
    );
};

export default GameCard;
