import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './profileheader.css';
import EditProfileModal from './EditProfileModal';
import explorerBadge from '../../assests/title_badges/explorer.svg';

const AVATAR_STORAGE_KEY = 'sts-avatar-preferences';
const avatarModules = import.meta.glob('../../assests/avatars/*.svg', { eager: true, import: 'default' });
const avatarOptions = Object.entries(avatarModules)
    .sort((a, b) => {
        const aNum = Number(a[0].match(/(\d+)\.svg$/)?.[1] || 0);
        const bNum = Number(b[0].match(/(\d+)\.svg$/)?.[1] || 0);
        return aNum - bNum;
    })
    .map(([, src]) => src);

const UserPlusIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
);

const EditIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const ProfileHeader = () => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const user = useSelector((state) => state.user.currentUser);
    const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const [profile, setProfile] = useState({
        name: user?.name || 'Guest',
        handle: user?.email ? `@${user.email.split('@')[0]}` : '@guest',
        friends: 0,
        avatar: {
            src: avatarOptions[0] || '',
            fill: '#121212',
            stroke: '#f0fd63'
        }
    });

    useEffect(() => {
        let storedAvatar = null;

        try {
            const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
            storedAvatar = raw ? JSON.parse(raw) : null;
        } catch {
            storedAvatar = null;
        }

        if (user) {
            setProfile((prev) => ({
                ...prev,
                name: user.name,
                handle: `@${user.email.split('@')[0]}`,
                friends: Array.isArray(user.friendlist) ? new Set(user.friendlist).size : 0,
                avatar: storedAvatar || prev.avatar
            }));
        } else if (storedAvatar) {
            setProfile((prev) => ({
                ...prev,
                avatar: storedAvatar
            }));
        }
    }, [user]);

    useEffect(() => {
        let cancelled = false;

        const fetchSummary = async () => {
            try {
                const response = await fetch(`${API_URL}/api/rating/summary`, {
                    credentials: 'include'
                });
                if (!response.ok) return;
                const data = await response.json();
                if (!cancelled) {
                    setProfile((prev) => ({
                        ...prev,
                        friends: Number(data?.friendsCount || 0)
                    }));
                }
            } catch {
                // keep existing profile values on fetch failure
            }
        };

        fetchSummary();
        return () => {
            cancelled = true;
        };
    }, [API_URL]);

    const handleSaveProfile = (newData) => {
        setProfile((prev) => ({ ...prev, avatar: newData }));
        localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(newData));
        window.dispatchEvent(new Event('sts:avatar-updated'));
    };

    const handleMoreFriends = () => {
        window.dispatchEvent(new CustomEvent('dashboard:set-tab', { detail: 'Search users' }));
    };

    return (
        <div className="profile-header-container">
            <div className="profile-cover">
                <img src={explorerBadge} alt="Explorer title badge" className="profile-cover-image" />
                <span className="profile-cover-badge">Explorer</span>
            </div>

            <div className="profile-info-section">
                <div className="profile-avatar-wrapper">
                    <div
                        className="profile-avatar"
                        style={{
                            background: profile.avatar.fill,
                            borderColor: profile.avatar.stroke
                        }}
                    >
                        {profile.avatar.src && <img src={profile.avatar.src} alt={profile.name} className="profile-avatar-image" />}
                    </div>
                    <button
                        type="button"
                        className="profile-avatar-edit"
                        onClick={() => setIsEditModalOpen(true)}
                        title="Edit avatar"
                    >
                        <EditIcon />
                    </button>
                </div>

                <div className="profile-details">
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-handle">{profile.handle}</p>
                    <p className="profile-friends-count">{profile.friends} Friends</p>
                </div>

                <div className="profile-actions">
                    <button type="button" className="profile-action-btn" onClick={handleMoreFriends}>
                        <UserPlusIcon /> Add More Friends
                    </button>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profileData={profile.avatar}
                profileName={profile.name}
                onSave={handleSaveProfile}
            />
        </div>
    );
};

export default ProfileHeader;
