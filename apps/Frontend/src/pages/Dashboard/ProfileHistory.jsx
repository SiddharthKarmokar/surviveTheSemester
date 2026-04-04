import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import './profilehistory.css';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const filters = [
    { id: 'all', label: 'All Games' },
    { id: 'campusFighter', label: 'Two Player Arena' },
    { id: 'puzzle15', label: '15 Puzzle' },
    { id: 'canon', label: 'Canon Game' },
    { id: 'mathTug', label: 'Math Tug-of-War' },
    { id: 'binarySudoku', label: 'Binary Sudoku' }
];

const GAME_LABELS = {
    campusFighter: 'Two Player Arena',
    puzzle15: '15 Puzzle',
    canon: 'Canon Game',
    mathTug: 'Math Tug-of-War',
    binarySudoku: 'Binary Sudoku'
};

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const ProfileHistory = () => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const user = useSelector((state) => state.user.currentUser);
    const [activeFilter, setActiveFilter] = useState('all');
    const [matchesData, setMatchesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchHistory = async () => {
            setLoading(true);
            setError('');
            try {
                const gameTypeParam = activeFilter === 'all' ? '' : `&gameType=${encodeURIComponent(activeFilter)}`;
                const response = await fetch(`${API_URL}/api/rating/history?limit=20${gameTypeParam}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch game history');
                }

                const payload = await response.json();
                const history = Array.isArray(payload?.history) ? payload.history : [];

                const mapped = history.map((match, index) => {
                    const isWinner = match.winnerId === user?.id;
                    const opponent = isWinner ? match.loser : match.winner;
                    const opponentName = opponent?.name || 'Opponent';

                    return {
                        id: match.id || index,
                        opponent: opponentName,
                        opponentScore: 0,
                        date: formatDate(match.createdAt),
                        mode: GAME_LABELS[match.gameType] || match.gameType,
                        myMatchScore: isWinner ? Number(match.winnerScore || 0) : Number(match.loserScore || 0),
                        oppMatchScore: isWinner ? Number(match.loserScore || 0) : Number(match.winnerScore || 0),
                        ratingDiff: isWinner ? Number(match.windScore || 0) : Number(match.loserRating || 0),
                        avatarInitial: opponentName.charAt(0).toUpperCase()
                    };
                });

                if (!cancelled) {
                    setMatchesData(mapped);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Failed to load history');
                    setMatchesData([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            cancelled = true;
        };
    }, [API_URL, activeFilter, user?.id]);

    const statusText = useMemo(() => {
        if (loading) return 'Loading game history...';
        if (error) return error;
        if (matchesData.length === 0) return 'No games found yet. Play a match to start your history.';
        return '';
    }, [loading, error, matchesData.length]);

    return (
        <div className="profile-history-container">
            <div className="profile-section-header">
                <h3 className="profile-section-title">Last 5 Games</h3>
                <button className="profile-section-forward">
                    <ForwardIcon />
                </button>
            </div>

            <div className="profile-history-filters">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        className={`profile-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="profile-matches-list">
                {statusText && <p className="profile-match-empty">{statusText}</p>}
                {matchesData.map((match) => {
                    const isWin = match.myMatchScore > match.oppMatchScore;
                    return (
                        <div key={match.id} className="profile-match-card">
                            <div className="profile-match-left">
                                <div className="profile-match-avatar" style={match.avatarImg ? { backgroundColor: '#dcdde1' } : {}}>
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
