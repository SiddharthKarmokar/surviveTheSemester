import React from 'react';
import './userratingcard.css';

const UserRatingCard = () => {
    return (
        <div className="user-rating-container">
            <div className="user-rating-header">
                <h4 className="user-rating-title">Rating</h4>
            </div>
            <h2 className="user-rating-score">1018</h2>
            <p className="user-rating-label">Global Rank improving</p>
        </div>
    );
};

export default UserRatingCard;
