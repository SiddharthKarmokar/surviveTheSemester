import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import './streakcalendar.css';

const monthLabel = (date) =>
    date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

const FIRE_LOTTIE_URL = 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json';

const StreakCalendar = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [monthOffset, setMonthOffset] = useState(0);
    const [fireAnimation, setFireAnimation] = useState(null);

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

    const getStatusForDay = (day) => {
        if (!isCurrentMonth) {
            if (day === 3 || day === 10 || day === 18) return 'streak';
            if (day === 7 || day === 21) return 'active';
            if (day === 14) return 'missed';
            return 'default';
        }
        if (day > today) return 'default';
        if (day === today || day === today - 1 || day === today - 2) return 'streak';
        if (day === 5 || day === 12) return 'missed';
        if (day % 3 === 0) return 'active';
        return 'default';
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
                    <h4 className="streak-title">3 day</h4>
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
                                    {status === 'missed' && <div className="day-missed-dot"></div>}
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
