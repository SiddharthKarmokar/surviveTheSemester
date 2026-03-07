import React, { useState } from 'react';
import './notifications.css';

const dummyConnections = [
    { id: 101, type: 'request', user: 'Alex Johnson', time: '2 hours ago', avatarClass: 'icon-blue', initial: 'AJ' },
    { id: 102, type: 'accepted', user: 'Sam Rivera', time: 'Yesterday', avatarClass: 'icon-neon', initial: 'SR' }
];

const dummyGeneral = [
    { id: 201, title: 'Congrats! You have won a 7-day streak badge 🔥', time: '5 hours ago', icon: '🏆', iconClass: 'icon-orange' },
    { id: 202, title: 'You moved up to Global Rank #5! Keep it up.', time: '1 day ago', icon: '📈', iconClass: 'icon-neon' }
];

const Notifications = () => {
    const [view, setView] = useState('connections'); // 'connections' or 'general'
    const [connections, setConnections] = useState(dummyConnections);

    const handleAction = (id) => {
        // Just remove from list to simulate handling
        setConnections(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="notifications-container">
            <div className="notifications-header">
                <h2 className="notifications-title">Notifications</h2>
                
                {/* Reusing the same MD3 toggle structure from Leaderboard */}
                <div className="leaderboard-toggle-wrapper" data-active={view}>
                    <div className="leaderboard-toggle-pill"></div>
                    <button 
                        className={`leaderboard-toggle-btn ${view === 'connections' ? 'active' : ''}`}
                        onClick={() => setView('connections')}
                    >
                        Connections
                    </button>
                    <button 
                        className={`leaderboard-toggle-btn ${view === 'general' ? 'active' : ''}`}
                        onClick={() => setView('general')}
                    >
                        General
                    </button>
                </div>
            </div>

            <div className="notifications-list">
                {view === 'connections' && connections.map(notif => (
                    <div key={notif.id} className="notification-card">
                        <div className={`notification-icon-wrapper ${notif.avatarClass}`}>
                            {notif.initial}
                        </div>
                        <div className="notification-content">
                            <p className="notification-text">
                                {notif.type === 'request' ? (
                                    <><strong>{notif.user}</strong> sent you a connection request.</>
                                ) : (
                                    <><strong>{notif.user}</strong> accepted your connection request.</>
                                )}
                            </p>
                            <span className="notification-time">{notif.time}</span>
                            
                            {notif.type === 'request' && (
                                <div className="notification-actions">
                                    <button className="notif-btn-accept" onClick={() => handleAction(notif.id)}>Accept</button>
                                    <button className="notif-btn-decline" onClick={() => handleAction(notif.id)}>Decline</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {view === 'connections' && connections.length === 0 && (
                    <div style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: '24px' }}>
                        No new connection notifications.
                    </div>
                )}

                {view === 'general' && dummyGeneral.map(notif => (
                    <div key={notif.id} className="notification-card">
                        <div className={`notification-icon-wrapper ${notif.iconClass}`}>
                            {notif.icon}
                        </div>
                        <div className="notification-content">
                            <p className="notification-text">{notif.title}</p>
                            <span className="notification-time">{notif.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
