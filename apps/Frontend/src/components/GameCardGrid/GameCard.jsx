import React from 'react';
import Lottie from 'lottie-react';
import './gamecard.css';

const GameCard = ({ title, animationData }) => {
    return (
        <div className="gamecard-container">
            <div className="gamecard-lottie-wrapper">
                <Lottie animationData={animationData} loop={true} autoplay={true} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="gamecard-content">
                <h4 className="gamecard-title">{title}</h4>
            </div>
            <button className="gamecard-action">Play</button>
        </div>
    );
};

export default GameCard;
