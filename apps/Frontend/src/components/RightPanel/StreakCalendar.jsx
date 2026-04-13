import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import './streakcalendar.css';

const monthLabel = (date) =>
    date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

const FIRE_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json';

const StreakCalendar = () => {
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const [currentTime, setCurrentTime] = useState(new Date());
    const [monthOffset, setMonthOffset] = useState(0);
    const [fireAnimation, setFireAnimation] = useState(null);
    const [activeDays, setActiveDays] = useState([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    const fetchCalendar = async (offset, onSuccess, onFailure) => {
        try {
            const response = await fetch(`${API_URL}/api/rating/streak-calendar?monthOffset=${offset}`, {
                credentials: 'include'
            });
            if (!response.ok) return;
            const data = await response.json();
            onSuccess(data);
        } catch {
            onFailure?.();
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadAnimation = async () => {
            try {
                const response = await fetch(FIRE_LOTTIE_URL);
                if (!response.ok) return;
                const data = await response.json();
                if (isMounted) {
                    setFireAnimation(data);
                }
            } catch {
                // keep the card usable even if the remote animation is unavailable
            }
        };

        loadAnimation();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const refreshCalendar = () => {
            fetchCalendar(
                monthOffset,
                (data) => {
                    if (!cancelled) {
                        setActiveDays(Array.isArray(data?.activeDays) ? data.activeDays : []);
                        setCurrentStreak(Number(data?.currentStreak || 0));
                    }
                },
                () => {
                    if (!cancelled) {
                        setActiveDays([]);
                    }
                }
            );
        };

        const handleVisibilityRefresh = () => {
            if (document.visibilityState === 'visible') {
                refreshCalendar();
            }
        };

        refreshCalendar();
        const intervalId = window.setInterval(refreshCalendar, 5000);
        window.addEventListener('focus', refreshCalendar);
        document.addEventListener('visibilitychange', handleVisibilityRefresh);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener('focus', refreshCalendar);
            document.removeEventListener('visibilitychange', handleVisibilityRefresh);
        };
    }, [API_URL, monthOffset]);

    const endOfDay = new Date(currentTime);
    endOfDay.setHours(23, 59, 59, 999);
    const msLeft = endOfDay - currentTime;
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const secondsLeft = Math.floor((msLeft % (1000 * 60)) / 1000).toString().padStart(2, '0');
    const timeLeftStr = `${hoursLeft}:${minutesLeft}:${secondsLeft} left`;

    const displayDate = new Date(currentTime.getFullYear(), currentTime.getMonth() + monthOffset, 1);
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const isCurrentMonth = monthOffset === 0;
    const today = currentTime.getDate();

    const streakStart = Math.max(1, today - currentStreak + 1);
    const getStatusForDay = (day) => {
        const played = activeDays.includes(day);
        if (!played) return 'default';
        if (isCurrentMonth && day >= streakStart && day <= today) return 'streak';
        return 'active';
    };

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="streak-calendar-container">
            <div className="streak-header-row">
                <div className="streak-heading-group">
                    <div className="streak-fire-badge" aria-hidden="true">
                        {fireAnimation ? (
                            <Lottie animationData={fireAnimation} loop autoplay />
                        ) : (
                            <span>🔥</span>
                        )}
                    </div>
                    <div>
                    <p className="streak-kicker">Consistency</p>
                    <h4 className="streak-title">{currentStreak} day</h4>
                    </div>
                </div>
                <span className="streak-timer">{timeLeftStr}</span>
            </div>

            <div className="streak-month-row">
                <button type="button" className="streak-month-btn" onClick={() => setMonthOffset((prev) => prev - 1)}>
                    Prev
                </button>
                <span className="streak-month-label">{monthLabel(displayDate)}</span>
                <button
                    type="button"
                    className="streak-month-btn"
                    onClick={() => setMonthOffset((prev) => prev + 1)}
                    disabled={monthOffset >= 0}
                >
                    Next
                </button>
            </div>

            <div className="calendar-grid-wrapper">
                <div className="calendar-weekdays">
                    {weekdays.map((d, i) => <div key={i}>{d}</div>)}
                </div>

                <div className="calendar-grid">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day-empty"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const status = getStatusForDay(day);
                        const showFire = status === 'streak';
                        return (
                            <div key={`day-${day}`} className="calendar-day-wrapper">
                                <div className={`calendar-day day-${status}`}>
                                    {showFire ? '🔥' : day}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StreakCalendar;
