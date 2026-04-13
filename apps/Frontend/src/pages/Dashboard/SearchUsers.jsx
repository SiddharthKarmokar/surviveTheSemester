import React, { useState, useEffect } from 'react';
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
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const SearchUsers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [requestedIds, setRequestedIds] = useState(new Set());
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (!cancelled) {
                    if (data.results) {
                        setResults(data.results);
                    } else {
                        setResults([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
                if (!cancelled) {
                    setResults([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [searchQuery]);

    const handleRequest = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/connections/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId: id }),
                credentials: 'include'
            });
            
            if (response.ok) {
                setRequestedIds(prev => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                });
            }
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    const filteredUsers = results.filter(user => {
        const matchesFilter = activeFilter === 'All' || (user.interest && user.interest.includes(activeFilter));
        return matchesFilter;
    });

    const getAvatarBackground = (name) => {
        const colors = [
            'linear-gradient(135deg, #FF9A9E, #FECFEF)',
            'linear-gradient(135deg, #a18cd1, #fbc2eb)',
            'linear-gradient(135deg, #84fab0, #8fd3f4)',
            'linear-gradient(135deg, #fccb90, #d57eeb)',
            'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
        ];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const getInitials = (name) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return (name[0] || '?').toUpperCase();
    };

    return (
        <div className="search-users-container">
            <div className="search-header">
                <h2 className="search-title">Search Users</h2>
                <div className="search-input-wrapper">
                    <SearchIcon />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {/* 
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
                */}
            </div>

            <div className="search-results-list">
                {isLoading && <div style={{ padding: '24px', textAlign: 'center' }}>Searching...</div>}
                
                {!isLoading && filteredUsers.map(user => {
                    const isRequested = requestedIds.has(user.id) || user.isSentRequest;
                    const isReceived = user.isReceivedRequest;
                    return (
                        <div key={user.id} className="search-user-card">
                            <div className="search-user-info-group">
                                <div className="search-user-avatar" style={{ background: getAvatarBackground(user.name) }}>
                                    {getInitials(user.name)}
                                </div>
                                <div className="search-user-details">
                                    <h4 className="search-user-name">{user.name}</h4>
                                    <p className="search-user-handle">{user.email}</p>
                                    <div className="search-user-interests">
                                        {user.interest && user.interest.map(interest => (
                                            <span key={interest} className="search-user-interest">{interest}</span>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--md-sys-color-primary)' }}>
                                        {user.isConnection ? 'Connection' : `${user.mutualConnectionsCount} mutual connections`}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                className={`search-action-btn ${isRequested ? 'requested' : ''} ${isReceived || user.isConnection ? 'disabled-btn' : ''}`}
                                onClick={() => !isRequested && !user.isConnection && !isReceived && handleRequest(user.id)}
                            >
                                {user.isConnection ? (
                                    <><CheckIcon /> Connected</>
                                ) : isReceived ? (
                                    <><CheckIcon /> Request Pending</>
                                ) : isRequested ? (
                                    <><CheckIcon /> Requested</>
                                ) : (
                                    <><UserPlusIcon /> Add</>
                                )}
                            </button>
                        </div>
                    );
                })}
                {!isLoading && filteredUsers.length === 0 && (
                    <div style={{ color: 'var(--md-sys-color-on-surface-variant)', padding: '24px', textAlign: 'center' }}>
                        {searchQuery.trim() === '' ? 'No users available right now.' : 'No users found matching your search.'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchUsers;

