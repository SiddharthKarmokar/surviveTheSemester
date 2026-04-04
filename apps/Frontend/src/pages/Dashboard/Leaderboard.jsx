import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react';
import './leaderboard.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const LEADERBOARD_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/lottie.json';
const PODIUM_LOTTIES = {
    1: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f947/lottie.json',
    2: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f948/lottie.json',
    3: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f949/lottie.json'
};

const generateColorForUser = (userId) => {
    const firstChar = String(userId || 'U').charCodeAt(0);
    const hue = (firstChar * 137.508) % 360;
    return `hsl(${hue}, 70%, 60%)`;
};

const transformLeaderboardData = (backendData, currentUserId) => {
    if (!Array.isArray(backendData)) return [];

    return [...backendData]
        .sort((a, b) => Number(b?.rating || 0) - Number(a?.rating || 0))
        .map((item, index) => ({
        id: item?.id ?? `user-${index}`,
        rank: index + 1,
        name: item?.name || 'Unknown Player',
        handle: `@${String(item?.name || 'unknown').toLowerCase().replace(/\s+/g, '')}`,
        score: Number(item?.rating || 0),
        avatarBg: generateColorForUser(item?.id ?? `user-${index}`),
        avatarInit: String(item?.name || 'UP').substring(0, 2).toUpperCase(),
        isMe: item?.id === currentUserId,
    }));
};

const ensureCurrentUserInFriendsLeaderboard = async (entries, user) => {
    if (!user?.id) return Array.isArray(entries) ? entries : [];

    const baseEntries = Array.isArray(entries) ? entries : [];
    const alreadyIncluded = baseEntries.some((item) => item?.id === user.id);
    if (alreadyIncluded) return baseEntries;

    try {
        const response = await fetch(`${API_URL}/api/rating/summary`, {
            credentials: 'include',
        });

        if (!response.ok) return baseEntries;

        const data = await response.json();
        const fallbackRating = Number(
            data?.rating ??
            data?.user?.rating ??
            user?.rating ??
            user?.Rating ??
            0
        );

        return [
            ...baseEntries,
            {
                id: user.id,
                name: user.name || 'You',
                rating: fallbackRating,
            }
        ];
    } catch {
        return baseEntries;
    }
};

const Leaderboard = () => {
    const [view, setView] = useState('global');
    const user = useSelector((state) => state.user.currentUser);
    const [headerAnimation, setHeaderAnimation] = useState(null);
    const [podiumAnimations, setPodiumAnimations] = useState({});
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadAnimations = async () => {
            try {
                const headerResponse = await fetch(LEADERBOARD_LOTTIE_URL);
                if (headerResponse.ok) {
                    const headerData = await headerResponse.json();
                    if (isMounted) setHeaderAnimation(headerData);
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

    useEffect(() => {
        let isMounted = true;

        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const endpoint = view === 'friends'
                    ? `${API_URL}/api/rating/friends?limit=50`
                    : `${API_URL}/api/rating?limit=50`;

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                const contentType = response.headers.get('content-type') || '';

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(
                        `Failed to fetch leaderboard (${response.status}) from ${endpoint}: ${errorBody.substring(0, 120)}`
                    );
                }

                if (!contentType.includes('application/json')) {
                    const unexpectedBody = await response.text();
                    throw new Error(
                        `Expected JSON from ${endpoint} but received ${contentType || 'unknown content type'}: ${unexpectedBody.substring(0, 120)}`
                    );
                }

                const data = await response.json();
                const rawEntries = view === 'friends'
                    ? await ensureCurrentUserInFriendsLeaderboard(data?.leaderboard, user)
                    : data?.leaderboard;

                if (isMounted) {
                    setLeaderboardData(
                        transformLeaderboardData(rawEntries, user?.id)
                    );
                }
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                if (isMounted) {
                    setError(err?.message || 'Unable to load leaderboard');
                    setLeaderboardData([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLeaderboard();

        return () => {
            isMounted = false;
        };
    }, [view, user?.id]);

    const activeData = leaderboardData.map((entry) =>
        entry.isMe
            ? {
                ...entry,
                name: user?.name || 'Guest',
                handle: user?.email ? `@${user.email.split('@')[0]}` : '@guest',
                avatarInit: (user?.name || 'Guest').substring(0, 2).toUpperCase()
            }
            : entry
    );

    const podiumData = activeData.filter((entry) => entry.rank <= 3);
    const listData = activeData.filter((entry) => entry.rank > 3);
    const firstPlace = podiumData.find((entry) => entry.rank === 1);
    const secondPlace = podiumData.find((entry) => entry.rank === 2);
    const thirdPlace = podiumData.find((entry) => entry.rank === 3);

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <div className="leaderboard-title-wrap">
                    <span className="leaderboard-header-lottie" aria-hidden="true">
                        {headerAnimation ? <Lottie animationData={headerAnimation} loop autoplay /> : <span>Top</span>}
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

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading leaderboard...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#ff6b6b' }}>
                    <p>Error loading leaderboard: {error}</p>
                </div>
            ) : (
                <>
                    <div className="leaderboard-podium">
                        {secondPlace && (
                            <div className="leaderboard-podium-card podium-second">
                                <span className="leaderboard-podium-lottie" aria-hidden="true">
                                    {podiumAnimations[2] ? <Lottie animationData={podiumAnimations[2]} loop autoplay /> : <span>2</span>}
                                </span>
                                <div className="leaderboard-podium-avatar" style={{ background: secondPlace.avatarBg }}>
                                    {secondPlace.avatarInit}
                                </div>
                                <h4>{secondPlace.name}{secondPlace.isMe ? ' (You)' : ''}</h4>
                                <p>{secondPlace.score} pts</p>
                            </div>
                        )}

                        {firstPlace && (
                            <div className="leaderboard-podium-card podium-first">
                                <span className="leaderboard-podium-lottie leaderboard-podium-lottie--large" aria-hidden="true">
                                    {podiumAnimations[1] ? <Lottie animationData={podiumAnimations[1]} loop autoplay /> : <span>1</span>}
                                </span>
                                <div className="leaderboard-podium-avatar" style={{ background: firstPlace.avatarBg }}>
                                    {firstPlace.avatarInit}
                                </div>
                                <h4>{firstPlace.name}{firstPlace.isMe ? ' (You)' : ''}</h4>
                                <p>{firstPlace.score} pts</p>
                            </div>
                        )}

                        {thirdPlace && (
                            <div className="leaderboard-podium-card podium-third">
                                <span className="leaderboard-podium-lottie" aria-hidden="true">
                                    {podiumAnimations[3] ? <Lottie animationData={podiumAnimations[3]} loop autoplay /> : <span>3</span>}
                                </span>
                                <div className="leaderboard-podium-avatar" style={{ background: thirdPlace.avatarBg }}>
                                    {thirdPlace.avatarInit}
                                </div>
                                <h4>{thirdPlace.name}{thirdPlace.isMe ? ' (You)' : ''}</h4>
                                <p>{thirdPlace.score} pts</p>
                            </div>
                        )}
                    </div>

                    <div className="leaderboard-list">
                        {listData.length === 0 && activeData.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <p>{view === 'friends' ? 'No friends yet' : 'No leaderboard data available'}</p>
                            </div>
                        ) : (
                            listData.map((entry) => (
                                <div key={entry.id} className={`leaderboard-row rank-${entry.rank} ${entry.isMe ? 'is-me' : ''}`}>
                                    <div className="leaderboard-rank">{entry.rank}</div>
                                    <div className="leaderboard-avatar" style={{ background: entry.avatarBg }}>
                                        {entry.avatarInit}
                                    </div>
                                    <div className="leaderboard-info">
                                        <h4 className="leaderboard-name">{entry.name}{entry.isMe ? ' (You)' : ''}</h4>
                                        <p className="leaderboard-handle">{entry.handle}</p>
                                    </div>
                                    <div className="leaderboard-score-container">
                                        <span className="leaderboard-score-value">{entry.score}</span>
                                        <span className="leaderboard-score-label">Points</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaderboard;
