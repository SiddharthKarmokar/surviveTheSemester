import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './profileratings.css';

const ForwardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const ProfileRatings = () => {
    const user = useSelector((state) => state.user.currentUser);
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const fallbackRating = user?.rating || user?.Rating || 0;
    const [rating, setRating] = useState(fallbackRating);

    useEffect(() => {
        let cancelled = false;

        const fetchRating = async () => {
            try {
                const response = await fetch(`${API_URL}/api/rating/stats`, {
                    credentials: 'include'
                });
                if (!response.ok) return;
                const data = await response.json();
                if (!cancelled && Number.isFinite(data?.overallRating)) {
                    setRating(data.overallRating);
                }
            } catch {
                // keep fallback rating
            }
        };

        fetchRating();
        return () => {
            cancelled = true;
        };
    }, [API_URL]);

    return (
        <div className="profile-ratings-container">
            <div className="profile-section-header">
                <h3 className="profile-section-title">Ratings</h3>
                <button className="profile-section-forward">
                    <ForwardIcon />
                </button>
            </div>

            <div className="profile-ratings-grid">
                <div className="profile-rating-card">
                    <h4 className="profile-rating-score">{rating}</h4>
                    <p className="profile-rating-label">Overall rating</p>
                </div>
            </div>
        </div>
    );
};

export default ProfileRatings;
