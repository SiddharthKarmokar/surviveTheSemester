import React from 'react';
import './profileachievements.css';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const achievementsData = [3, 7, 14, 30, 50, 100];

const ProfileAchievements = () => {
    return (
        <div className="profile-achievements-container">
            <div className="profile-section-header">
                <h3 className="profile-section-title">Achievements</h3>
                <button className="profile-section-forward">
                    <ForwardIcon />
                </button>
            </div>
            
            <div className="profile-achievements-list">
                {achievementsData.map((num, i) => (
                    <div key={i} className="profile-achievement-badge">
                        <span className="badge-icon">🔥</span>
                        <span className="badge-number">{num}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileAchievements;
