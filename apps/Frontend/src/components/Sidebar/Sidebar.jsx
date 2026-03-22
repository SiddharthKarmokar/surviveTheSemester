import React from 'react';
import './sidebar.css';

const IconBase = ({ children }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const ArenaIcon = () => <IconBase><circle cx="12" cy="12" r="8" /><path d="M8.5 15.5 15.5 8.5" /><path d="M9 8h7v7" /></IconBase>;
const LeaderboardIcon = () => <IconBase><path d="M6 18V10" /><path d="M12 18V6" /><path d="M18 18v-4" /></IconBase>;
const ChatIcon = () => <IconBase><path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" /></IconBase>;
const SearchIcon = () => <IconBase><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></IconBase>;
const BellIcon = () => <IconBase><path d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V10a5 5 0 1 1 10 0v4.2a2 2 0 0 0 .6 1.4L19 17h-4" /><path d="M10 20a2 2 0 0 0 4 0" /></IconBase>;
const ProfileIcon = () => <IconBase><circle cx="12" cy="8" r="3.5" /><path d="M5 19a7 7 0 0 1 14 0" /></IconBase>;
const ChevronIcon = () => <IconBase><path d="m9 6 6 6-6 6" /></IconBase>;

const navItems = [
    { label: 'Arena', icon: <ArenaIcon /> },
    { label: 'Leaderboard', icon: <LeaderboardIcon /> },
    { label: 'chat', icon: <ChatIcon /> },
    { label: 'Search users', icon: <SearchIcon /> },
    { label: 'Notifications', icon: <BellIcon /> },
    { label: 'My profile', icon: <ProfileIcon />, separator: true }
];

const Sidebar = ({ activeTab, setActiveTab, hasUnreadNotifications }) => {
    return (
        <aside className="dashboard-sidebar">
            {/* <div className="sidebar-logo">
                <span className="logo-icon">
                    <span></span>
                </span>
                <div>
                    <p className="sidebar-kicker">Semester hub</p>
                    <h3>Dashboard</h3>
                </div>
            </div> */}

            <nav className="sidebar-nav">
                {navItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.separator && <div className="sidebar-separator"></div>}
                        <button
                            type="button"
                            className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.label)}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-label">{item.label}</span>
                            {item.label === 'Notifications' && hasUnreadNotifications && (
                                <span className="notification-dot"></span>
                            )}
                            <span className="sidebar-item-arrow"><ChevronIcon /></span>
                        </button>
                    </React.Fragment>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
