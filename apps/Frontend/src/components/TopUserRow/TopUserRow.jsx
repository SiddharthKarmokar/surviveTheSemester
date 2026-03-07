import React from 'react';
import './topuserrow.css';

const users = [
    { id: 1, name: 'You', isOnline: true, isMe: true },
    { id: 2, name: 'Alice', isOnline: true },
    { id: 3, name: 'Bob', isOnline: false },
    { id: 4, name: 'Charlie', isOnline: true },
    { id: 5, name: 'Diana', isOnline: true },
    { id: 6, name: 'Evan', isOnline: false },
    { id: 7, name: 'Fiona', isOnline: true },
    { id: 8, name: 'George', isOnline: true },
];

const TopUserRow = () => {
    return (
        <div className="topuserrow-container">
            <h4 className="topuserrow-title">Active Players</h4>
            <div className="topuserrow-scroll">
                {users.map((user) => (
                    <div key={user.id} className="user-avatar-wrapper">
                        <div className={`user-avatar ${user.isMe ? 'user-avatar-me' : ''}`}>
                            {user.name.charAt(0)}
                        </div>
                        {user.isOnline && <div className="online-indicator"></div>}
                        <span className="user-name">{user.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopUserRow;
