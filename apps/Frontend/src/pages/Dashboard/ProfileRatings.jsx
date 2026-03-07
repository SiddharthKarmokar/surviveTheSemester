import React from 'react';
import './profileratings.css';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const ratingsData = [
    { id: 'math', score: 1018, label: 'Math', icon: '▶▶', iconClass: 'icon-math' },
    { id: 'classical', score: 986, label: 'Classical', icon: '♔', iconClass: 'icon-classical' },
    { id: 'memory', score: 1008, label: 'Memory', icon: '⚖', iconClass: 'icon-memory' },
    { id: 'puzzle', score: 1012, label: 'Puzzle', icon: '⚄', iconClass: 'icon-puzzle' },
];

const ProfileRatings = () => {
    return (
        <div className="profile-ratings-container">
            <div className="profile-section-header">
                <h3 className="profile-section-title">Ratings</h3>
                <button className="profile-section-forward">
                    <ForwardIcon />
                </button>
            </div>
            
            <div className="profile-ratings-grid">
                {ratingsData.map((rating) => (
                    <div key={rating.id} className="profile-rating-card">
                        <span className={`profile-rating-icon ${rating.iconClass}`}>{rating.icon}</span>
                        <h4 className="profile-rating-score">{rating.score}</h4>
                        <p className="profile-rating-label">{rating.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileRatings;
