import React, { useState } from 'react';
import './profilehistory.css';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const filters = [
    { id: 'math', label: 'Math', icon: '▶▶' },
    { id: 'classical', label: 'Classical', icon: '♔' },
    { id: 'memory', label: 'Memory', icon: '⚖' },
    { id: 'puzzle', label: 'Puzzle', icon: '⚄' },
    { id: 'groupplay', label: 'Group Play', icon: '🫂' }
];

const matchesData = [
    {
        id: 1,
        opponent: 'prob',
        opponentScore: 1118,
        date: '30 Jan, 11:04 AM',
        mode: 'SPRINT DUELS',
        myMatchScore: 19,
        oppMatchScore: 28,
        ratingDiff: -5,
        avatarInitial: 'P'
    },
    {
        id: 2,
        opponent: 'guest640233',
        opponentScore: 1072,
        date: '12 Jan, 08:30 AM',
        mode: 'SPRINT DUELS',
        myMatchScore: 21,
        oppMatchScore: 10,
        ratingDiff: 13,
        avatarImg: '🐶' // Using emoji as placeholder since image not easily available
    }
];

const ProfileHistory = () => {
    const [activeFilter, setActiveFilter] = useState('math');

    return (
        <div className="profile-history-container">
            <div className="profile-section-header">
                <h3 className="profile-section-title">Last 5 Games</h3>
                <button className="profile-section-forward">
                    <ForwardIcon />
                </button>
            </div>
            
            <div className="profile-history-filters">
                {filters.map(filter => (
                    <button 
                        key={filter.id}
                        className={`profile-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        <span>{filter.icon}</span> {filter.label}
                    </button>
                ))}
            </div>
            
            <div className="profile-matches-list">
                {matchesData.map(match => {
                    const isWin = match.myMatchScore > match.oppMatchScore;
                    return (
                        <div key={match.id} className="profile-match-card">
                            <div className="profile-match-left">
                                <div className="profile-match-avatar" style={match.avatarImg ? {backgroundColor: '#dcdde1'} : {}}>
                                    {match.avatarImg ? match.avatarImg : match.avatarInitial}
                                </div>
                                <div className="profile-match-info">
                                    <h4 className="profile-match-name">{match.opponent}</h4>
                                    <p className="profile-match-meta">
                                        <span className="profile-match-score">{match.opponentScore}</span> {`(${match.date})`}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="profile-match-right">
                                <span className="profile-match-type">{match.mode}</span>
                                <div className="profile-match-result-row">
                                    <div className="profile-match-scores">
                                        <span className={isWin ? 'win' : 'lose'}>{match.myMatchScore}</span> - <span>{match.oppMatchScore}</span>
                                    </div>
                                    <div className={`profile-match-diff ${match.ratingDiff >= 0 ? 'positive' : 'negative'}`}>
                                        {match.ratingDiff > 0 ? `+${match.ratingDiff}` : match.ratingDiff}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProfileHistory;
