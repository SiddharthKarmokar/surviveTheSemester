import React from 'react';
import './myprofile.css';
import ProfileHeader from './ProfileHeader';
import ProfileRatings from './ProfileRatings';
import ProfileAchievements from './ProfileAchievements';
import ProfileHistory from './ProfileHistory';

const MyProfile = () => {
    return (
        <div className="myprofile-container">
            <ProfileHeader />
            <ProfileRatings />
            <ProfileAchievements />
            <ProfileHistory />
        </div>
    );
};

export default MyProfile;
