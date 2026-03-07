import React from 'react';
import './sidebar.css';

const GenericIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    </svg>
);

const navItems = [
    { label: 'Arena', icon: <GenericIcon /> },
    { label: 'Leaderboard', icon: <GenericIcon /> },
    { label: 'chat', icon: <GenericIcon /> },
    { label: 'Search users', icon: <GenericIcon /> },
    { label: 'Notifications', icon: <GenericIcon /> },
    { label: 'My profile', icon: <GenericIcon />, separator: true }
];

const Sidebar = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-logo">
                <span className="logo-icon"></span>
                <h3>Dashboard</h3>
            </div>
            
            <nav className="sidebar-nav">
                {navItems.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.separator && <div className="sidebar-separator"></div>}
                        <button 
                            className={`sidebar-item ${activeTab === item.label ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.label)}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            <span className="sidebar-item-label">{item.label}</span>
                            <span className="sidebar-item-arrow">→</span>
                        </button>
                    </React.Fragment>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
