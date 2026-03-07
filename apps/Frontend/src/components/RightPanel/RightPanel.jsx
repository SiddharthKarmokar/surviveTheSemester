import React from 'react';
import './rightpanel.css';
import UserRatingCard from './UserRatingCard';
import StreakCalendar from './StreakCalendar';

const RightPanel = () => {
    return (
        <aside className="dashboard-rightpanel">
            <UserRatingCard />
            <StreakCalendar />
        </aside>
    );
};

export default RightPanel;
