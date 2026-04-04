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

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('Arena');
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    React.useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${API_URL}/api/connections/notifications`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.notifications && data.notifications.some(n => !n.isRead)) {
                        setHasUnreadNotifications(true);
                    } else {
                        setHasUnreadNotifications(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching unread notifications:", error);
            }
        };

        fetchNotifications();
        // Poll every 10 seconds for real-time feel
        const intervalId = setInterval(fetchNotifications, 10000);
        return () => clearInterval(intervalId);
    }, []);

    // Also mark read when switching to Notifications tab
    React.useEffect(() => {
        if (activeTab === 'Notifications' && hasUnreadNotifications) {
            setHasUnreadNotifications(false);
            // Optionally, we could call the mark as read API here too, 
            // but Notifications.jsx will handle marking as read on mount.
        }
    }, [activeTab, hasUnreadNotifications]);

    const gameRoutes = {
        twoPlayer: "/campusFighter",
        puzzle: "/puzzle",
        canonGame: "/canon",
        mathTug: "/mathtug",
        binarySudoku: "/binarysudoku",
    };

    const handlePlayGame = (gameId) => {
        const route = gameRoutes[gameId];
        if (route) {
            window.open(route, '_blank', 'noopener,noreferrer');
        } else {
            console.warn("Unknown game:", gameId);
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
                {/* <TopUserRow /> */}
                <GameCardGrid onPlayGame={handlePlayGame} />
            </>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar /> 
            <div className="dashboard-container">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} hasUnreadNotifications={hasUnreadNotifications} />
                <main className="dashboard-main-content">
                    {renderMainContent()}
                </main>
                <RightPanel />
            </div>
        </div>
    );
};

export default Dashboard;
