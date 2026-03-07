import React from 'react';
import './challengecard.css';

const ChallengeCard = ({ title, status }) => {
    return (
        <div className="challengecard-container">
            <div className="challengecard-info">
                <span className="challengecard-title">{title}</span>
                <span className={`challengecard-status ${status === 'Completed' ? 'status-completed' : 'status-pending'}`}>
                    {status}
                </span>
            </div>
            <button className="challengecard-action">
                {status === 'Completed' ? 'Review' : 'Start'}
            </button>
        </div>
    );
};

export default ChallengeCard;
