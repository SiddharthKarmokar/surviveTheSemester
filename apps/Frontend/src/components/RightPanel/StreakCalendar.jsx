import React, { useState, useEffect } from 'react';
import './streakcalendar.css';

const StreakCalendar = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate time left in day
    const endOfDay = new Date(currentTime);
    endOfDay.setHours(23, 59, 59, 999);
    const msLeft = endOfDay - currentTime;
    const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const secondsLeft = Math.floor((msLeft % (1000 * 60)) / 1000).toString().padStart(2, '0');
    const timeLeftStr = `${hoursLeft}:${minutesLeft}:${secondsLeft} left`;

    // Calendar Math
    const year = currentTime.getFullYear();
    const month = currentTime.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    
    // Generate dummy statuses for visual demonstration
    const getStatusForDay = (day) => {
        const today = currentTime.getDate();
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
                <h4 className="streak-title">Day 3 Streak</h4>
                <span className="streak-timer">{timeLeftStr}</span>
            </div>
            
            <div className="calendar-grid-wrapper">
                <div className="calendar-weekdays">
                    {weekdays.map((d, i) => <div key={i}>{d}</div>)}
                </div>
                
                <div className="calendar-grid">
                    {/* Empty cells for first day alignment */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day-empty"></div>
                    ))}
                    
                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const status = getStatusForDay(day);
                        return (
                            <div key={`day-${day}`} className="calendar-day-wrapper">
                                <div className={`calendar-day day-${status}`}>
                                    {day}
                                    {status === 'missed' && <div className="day-missed-dot"></div>}
                                </div>
                                {status === 'streak' && <div className="day-streak-icon">🔥</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StreakCalendar;
