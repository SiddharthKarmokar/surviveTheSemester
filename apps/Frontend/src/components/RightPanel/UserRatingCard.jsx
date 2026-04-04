import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Lottie from 'lottie-react';
import './userratingcard.css';

const TARGET_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/lottie.json';

const UserRatingCard = () => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const user = useSelector((state) => state.user.currentUser);
    const [targetAnimation, setTargetAnimation] = useState(null);
    const [rating, setRating] = useState(user?.rating || user?.Rating || 0);

    useEffect(() => {
        let isMounted = true;

        const loadAnimation = async () => {
            try {
                const response = await fetch(TARGET_LOTTIE_URL);
                if (!response.ok) return;
                const data = await response.json();
                if (isMounted) {
                    setTargetAnimation(data);
                }
            } catch {
                // fallback icon will render instead
            }
        };

        loadAnimation();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchRating = async () => {
            try {
                const response = await fetch(`${API_URL}/api/rating/summary`, {
                    credentials: 'include'
                });
                if (!response.ok) return;
                const data = await response.json();
                if (!cancelled && Number.isFinite(data?.rating)) {
                    setRating(data.rating);
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
        <div className="user-rating-container">
            <div className="user-rating-header">
                <div className="user-rating-title-wrap">
                    <span className="user-rating-lottie" aria-hidden="true">
                        {targetAnimation ? <Lottie animationData={targetAnimation} loop autoplay /> : <span>🎯</span>}
                    </span>
                    <h4 className="user-rating-title">Rating</h4>
                </div>
            </div>
            <h2 className="user-rating-score">{rating}</h2>
        </div>
    );
};

export default UserRatingCard;
