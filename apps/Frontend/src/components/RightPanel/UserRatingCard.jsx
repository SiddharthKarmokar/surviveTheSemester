import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import './userratingcard.css';

const TARGET_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3af/lottie.json';

const UserRatingCard = () => {
    const [targetAnimation, setTargetAnimation] = useState(null);

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
            <h2 className="user-rating-score">1018</h2>
        </div>
    );
};

export default UserRatingCard;
