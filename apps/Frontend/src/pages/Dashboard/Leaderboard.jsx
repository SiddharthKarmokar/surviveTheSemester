import React, { useState } from 'react';
import './leaderboard.css';

// Dummy data for simulation
const globalData = [
    { id: 1, rank: 1, name: 'Alex Johnson', handle: '@alexj', score: 2450, avatarBg: 'linear-gradient(135deg, #FFD700, #FDB931)', avatarInit: 'AJ' },
    { id: 2, rank: 2, name: 'Sam Rivera', handle: '@samr', score: 2310, avatarBg: 'linear-gradient(135deg, #C0C0C0, #8A8A8A)', avatarInit: 'SR' },
    { id: 3, rank: 3, name: 'Jordan Lee', handle: '@jlee', score: 2180, avatarBg: 'linear-gradient(135deg, #CD7F32, #8B4513)', avatarInit: 'JL' },
    { id: 4, rank: 4, name: 'guest4991', handle: '@guest4991', score: 1950, avatarBg: '#333', avatarInit: 'G' },
    { id: 5, rank: 5, name: 'Anil kumawat', handle: '@anilkumawat8738', score: 1018, avatarBg: 'linear-gradient(135deg, #ff7e5f, #feb47b)', avatarInit: 'AK', isMe: true },
    { id: 6, rank: 6, name: 'Taylor Swift', handle: '@taylor', score: 950, avatarBg: '#444', avatarInit: 'TS' },
];

const friendsData = [
    { id: 5, rank: 1, name: 'Anil kumawat', handle: '@anilkumawat8738', score: 1018, avatarBg: 'linear-gradient(135deg, #ff7e5f, #feb47b)', avatarInit: 'AK', isMe: true },
    { id: 7, rank: 2, name: 'Bob Friend', handle: '@bobster', score: 840, avatarBg: '#555', avatarInit: 'BF' },
    { id: 8, rank: 3, name: 'Charlie Pal', handle: '@charliep', score: 720, avatarBg: '#666', avatarInit: 'CP' },
];

const Leaderboard = () => {
    const [view, setView] = useState('global'); // 'global' or 'friends'

    const activeData = view === 'global' ? globalData : friendsData;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h2 className="leaderboard-title">Leaderboards</h2>
                
                <div className="leaderboard-toggle-wrapper" data-active={view}>
                    <div className="leaderboard-toggle-pill"></div>
                    <button 
                        className={`leaderboard-toggle-btn ${view === 'global' ? 'active' : ''}`}
                        onClick={() => setView('global')}
                    >
                        Global
                    </button>
                    <button 
                        className={`leaderboard-toggle-btn ${view === 'friends' ? 'active' : ''}`}
                        onClick={() => setView('friends')}
                    >
                        Friends
                    </button>
                </div>
            </div>

            <div className="leaderboard-list">
                {activeData.map((user) => (
                    <div key={user.id} className={`leaderboard-row rank-${user.rank} ${user.isMe ? 'is-me' : ''}`}>
                        <div className="leaderboard-rank">
                            {user.rank}
                        </div>
                        <div className="leaderboard-avatar" style={{ background: user.avatarBg }}>
                            {user.avatarInit}
                        </div>
                        <div className="leaderboard-info">
                            <h4 className="leaderboard-name">{user.name}{user.isMe ? ' (You)' : ''}</h4>
                            <p className="leaderboard-handle">{user.handle}</p>
                        </div>
                        <div className="leaderboard-score-container">
                            <span className="leaderboard-score-value">{user.score}</span>
                            <span className="leaderboard-score-label">Points</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
