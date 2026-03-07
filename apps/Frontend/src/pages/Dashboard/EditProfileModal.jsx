import React, { useState } from 'react';
import './editprofilemodal.css';

const avatars = [
    'linear-gradient(135deg, #ff7e5f, #feb47b)',
    'linear-gradient(135deg, #00c6ff, #0072ff)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #8E2DE2, #4A00E0)',
    'linear-gradient(135deg, #f12711, #f5af19)'
];

const EditProfileModal = ({ isOpen, onClose, profileData, onSave }) => {
    const [formData, setFormData] = useState(profileData || {});

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Edit Profile</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" name="handle" value={formData.handle || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Friends Count</label>
                        <input type="number" name="friends" value={formData.friends || 0} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Tag 1 (e.g., Add College)</label>
                        <input type="text" name="tag1" value={formData.tag1 || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Tag 2 (e.g., Add Socials)</label>
                        <input type="text" name="tag2" value={formData.tag2 || ''} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Profile Avatar Style</label>
                        <div className="avatar-selection">
                            {avatars.map((gradient, index) => (
                                <div 
                                    key={index} 
                                    className={`avatar-option ${formData.avatarGradient === gradient ? 'selected' : ''}`}
                                    style={{ background: gradient }}
                                    onClick={() => setFormData(prev => ({ ...prev, avatarGradient: gradient }))}
                                ></div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="modal-btn-save">Save changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
