import React, { useState } from 'react';
import './dashboard.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import TopUserRow from '../../components/TopUserRow/TopUserRow';
import GameCardGrid from '../../components/GameCardGrid/GameCardGrid';
import RightPanel from '../../components/RightPanel/RightPanel';
import Navbar from '../../components/Navbar';
import MyProfile from './MyProfile'; 
import Leaderboard from './Leaderboard';
import Chat from './Chat';
import SearchUsers from './SearchUsers';
import Notifications from './Notifications';

const TWO_PLAYER_URL = import.meta.env.VITE_TWO_PLAYER_GAME_URL || 'http://localhost:3000';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('Arena');

    const handlePlayGame = (gameId) => {
        if (gameId === 'twoPlayer') {
            window.location.href = TWO_PLAYER_URL;
        } else if (gameId === 'puzzle') {
            window.location.href = '/puzzle';
        } else if (gameId === 'canonGame') {
            window.location.href = '/canon';
        } else if (gameId === 'mathTug') {
            window.location.href = '/mathtug';
        } else if (gameId === 'binarySudoku') {
            window.location.href = '/binarysudoku';
        }
    };

    const renderMainContent = () => {
        if (activeTab === 'My profile') {
            return <MyProfile />;
        }
        if (activeTab === 'Leaderboard') {
            return <Leaderboard />;
        }
        if (activeTab === 'chat') {
            return <Chat />;
        }
        if (activeTab === 'Search users') {
            return <SearchUsers />;
        }
        if (activeTab === 'Notifications') {
            return <Notifications />;
        }
        return (
            <>
                <TopUserRow />
                <GameCardGrid onPlayGame={handlePlayGame} />
            </>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar /> 
            <div className="dashboard-container">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="dashboard-main-content">
                    {renderMainContent()}
                </main>
                <RightPanel />
            </div>
        </div>
    );
};

export default Dashboard;
