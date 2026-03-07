import React, { useState } from 'react';
import './searchusers.css';

const SearchIcon = () => (
    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const UserPlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const filters = ['All', 'Math', 'Puzzle', 'Classical', 'Memory', 'Code', 'Chess'];

const dummyUsers = [
    { id: 1, name: 'Alice Cooper', handle: '@alice', interests: ['Math', 'Puzzle'], avatar: 'linear-gradient(135deg, #FF9A9E, #FECFEF)', init: 'AC' },
    { id: 2, name: 'Bob Friend', handle: '@bobster', interests: ['Classical', 'Chess'], avatar: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', init: 'BF' },
    { id: 3, name: 'Charlie Pal', handle: '@charliep', interests: ['Code', 'Math'], avatar: 'linear-gradient(135deg, #84fab0, #8fd3f4)', init: 'CP' },
    { id: 4, name: 'Diana Prince', handle: '@diana', interests: ['Memory', 'Puzzle'], avatar: 'linear-gradient(135deg, #fccb90, #d57eeb)', init: 'DP' },
    { id: 5, name: 'Evan Wright', handle: '@evanw', interests: ['Code', 'Chess'], avatar: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)', init: 'EW' },
];

const SearchUsers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [requestedIds, setRequestedIds] = useState(new Set());

    const handleRequest = (id) => {
        setRequestedIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const filteredUsers = dummyUsers.filter(user => {
        const matchesQuery = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             user.handle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' || user.interests.includes(activeFilter);
        return matchesQuery && matchesFilter;
    });

    return (
        <div className="search-users-container">
            <div className="search-header">
                <h2 className="search-title">Search Users</h2>
                <div className="search-input-wrapper">
                    <SearchIcon />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search by name or handle..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="search-filters">
                    {filters.map(filter => (
                        <button 
                            key={filter} 
                            className={`search-filter-tag ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="search-results-list">
                {filteredUsers.map(user => {
                    const isRequested = requestedIds.has(user.id);
                    return (
                        <div key={user.id} className="search-user-card">
                            <div className="search-user-info-group">
                                <div className="search-user-avatar" style={{ background: user.avatar }}>
                                    {user.init}
                                </div>
                                <div className="search-user-details">
                                    <h4 className="search-user-name">{user.name}</h4>
                                    <p className="search-user-handle">{user.handle}</p>
                                    <div className="search-user-interests">
                                        {user.interests.map(interest => (
                                            <span key={interest} className="search-user-interest">{interest}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                className={`search-action-btn ${isRequested ? 'requested' : ''}`}
                                onClick={() => !isRequested && handleRequest(user.id)}
                            >
                                {isRequested ? (
                                    <><CheckIcon /> Requested</>
                                ) : (
                                    <><UserPlusIcon /> Add Friend</>
                                )}
                            </button>
                        </div>
                    );
                })}
                {filteredUsers.length === 0 && (
                    <div style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: '24px', textAlign: 'center' }}>
                        No users found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchUsers;
