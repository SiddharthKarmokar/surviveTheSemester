import React from 'react';
import './ratingcard.css';

const RatingCard = ({ title, rating, icon }) => {
    return (
        <div className="ratingcard-container">
            <span className="ratingcard-icon">{icon}</span>
            <div className="ratingcard-content">
                <span className="ratingcard-title">{title}</span>
                <span className="ratingcard-score">{rating}</span>
            </div>
        </div>
    );
};

export default RatingCard;
