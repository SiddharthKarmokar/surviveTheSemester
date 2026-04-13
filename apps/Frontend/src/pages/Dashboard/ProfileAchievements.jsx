import React from 'react';
import './profileachievements.css';
import firstBadge from '../../assests/Badges/first.svg';
import sevenDayBadge from '../../assests/Badges/7day.svg';
import thirtyDayBadge from '../../assests/Badges/30day.svg';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const achievementsData = [
    { id: 'first', label: 'First win', image: firstBadge, locked: false },
    { id: '7day', label: '7 day streak', image: sevenDayBadge, locked: true },
    { id: '30day', label: '30 day streak', image: thirtyDayBadge, locked: true },
];

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
                {achievementsData.map((badge) => (
                    <div key={badge.id} className={`profile-achievement-badge ${badge.locked ? 'is-locked' : ''}`}>
                        <img src={badge.image} alt={badge.label} className="profile-achievement-image" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileAchievements;
