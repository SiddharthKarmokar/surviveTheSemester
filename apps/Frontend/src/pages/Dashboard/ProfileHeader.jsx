import React, { useState } from 'react';
import './profileheader.css';
import EditProfileModal from './EditProfileModal';

const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

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
    
    // Core profile state
    const [profile, setProfile] = useState({
        name: 'Anil kumawat',
        handle: '@anilkumawat8738',
        friends: 0,
        tag1: 'Add College',
        tag2: 'Add Socials',
        avatarGradient: 'linear-gradient(135deg, #ff7e5f, #feb47b)'
    });

    const handleSaveProfile = (newData) => {
        setProfile(newData);
    };

    return (
        <div className="profile-header-container">
            <div className="profile-cover">
                <span className="profile-cover-badge">Amateur</span>
            </div>
            
            <div className="profile-info-section">
                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar" style={{ background: profile.avatarGradient }}></div>
                </div>
                
                <div className="profile-details">
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-handle">{profile.handle}</p>
                    <p className="profile-friends-count">{profile.friends} Friends</p>
                </div>
                
                <div className="profile-tags">
                    <button className="profile-tag-btn">
                        <PlusIcon /> {profile.tag1}
                    </button>
                    <button className="profile-tag-btn">
                        <PlusIcon /> {profile.tag2}
                    </button>
                </div>
                
                <div className="profile-actions">
                    <button className="profile-action-btn">
                        <UserPlusIcon /> Add More Friends
                    </button>
                    <button className="profile-share-btn" onClick={() => setIsEditModalOpen(true)} title="Edit Profile">
                        <EditIcon />
                    </button>
                </div>
            </div>

            <EditProfileModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                profileData={profile}
                onSave={handleSaveProfile}
            />
        </div>
    );
};

export default ProfileHeader;
