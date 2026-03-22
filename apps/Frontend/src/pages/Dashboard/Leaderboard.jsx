import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react';
import './leaderboard.css';

const LEADERBOARD_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/lottie.json';
const PODIUM_LOTTIES = {
    1: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/lottie.json',
    2: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f948/lottie.json',
    3: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f949/lottie.json'
};

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
    const user = useSelector((state) => state.user.currentUser);
    const [headerAnimation, setHeaderAnimation] = useState(null);
    const [podiumAnimations, setPodiumAnimations] = useState({});

    useEffect(() => {
        let isMounted = true;

        const loadAnimations = async () => {
            try {
                const headerResponse = await fetch(LEADERBOARD_LOTTIE_URL);
                if (headerResponse.ok) {
                    const headerData = await headerResponse.json();
                    if (isMounted) {
                        setHeaderAnimation(headerData);
                    }
                }
            } catch {
                // fallback handled in render
            }

            const entries = await Promise.all(
                Object.entries(PODIUM_LOTTIES).map(async ([rank, url]) => {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) return [rank, null];
                        const data = await response.json();
                        return [rank, data];
                    } catch {
                        return [rank, null];
                    }
                })
            );

            if (isMounted) {
                setPodiumAnimations(Object.fromEntries(entries));
            }
        };

        loadAnimations();
        return () => {
            isMounted = false;
        };
    }, []);

    const baseData = view === 'global' ? globalData : friendsData;
    
    const activeData = baseData.map(u => 
        u.isMe 
            ? { 
                ...u, 
                name: user?.name || 'Guest', 
                handle: user?.email ? `@${user.email.split('@')[0]}` : '@guest', 
                avatarInit: (user?.name || 'Guest').substring(0, 2).toUpperCase() 
              }
            : u
    );

    const podiumFallback = useMemo(() => ({
        1: '🥇',
        2: '🥈',
        3: '🥉'
    }), []);

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <div className="leaderboard-title-wrap">
                    <span className="leaderboard-header-lottie" aria-hidden="true">
                        {headerAnimation ? <Lottie animationData={headerAnimation} loop autoplay /> : <span>🏆</span>}
                    </span>
                    <h2 className="leaderboard-title">Leaderboards</h2>
                </div>
                
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
                            {user.rank <= 3 ? (
                                <span className="leaderboard-rank-lottie" aria-hidden="true">
                                    {podiumAnimations[user.rank]
                                        ? <Lottie animationData={podiumAnimations[user.rank]} loop autoplay />
                                        : <span>{podiumFallback[user.rank]}</span>}
                                </span>
                            ) : (
                                user.rank
                            )}
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
