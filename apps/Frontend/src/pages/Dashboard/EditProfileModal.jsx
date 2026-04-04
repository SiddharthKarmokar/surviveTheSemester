import React, { useState } from 'react';
import './editprofilemodal.css';

const avatarModules = import.meta.glob('../../assests/avatars/*.svg', { eager: true, import: 'default' });
const avatarOptions = Object.entries(avatarModules)
    .sort((a, b) => {
        const aNum = Number(a[0].match(/(\d+)\.svg$/)?.[1] || 0);
        const bNum = Number(b[0].match(/(\d+)\.svg$/)?.[1] || 0);
        return aNum - bNum;
    })
    .map(([path, src]) => ({
        id: path.match(/(\d+)\.svg$/)?.[1] || path,
        src
    }));

const fillSwatches = ['#121212', '#FF4800', '#F0FD63', '#0F3B2E', '#1A2441', '#FAF4E0'];
const strokeSwatches = ['#FFFFFF', '#FF4800', '#F0FD63', '#5BE584', '#6FA8FF', '#FAF4E0'];

const EditProfileModal = ({ isOpen, onClose, profileData, profileName, onSave }) => {
    const [formData, setFormData] = useState(profileData || {});

    React.useEffect(() => {
        setFormData(profileData || {});
    }, [profileData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <div>
                        <p className="modal-eyebrow">Profile styling</p>
                        <h3 className="modal-title">Edit Avatar</h3>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>Close</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="modal-scroll-area">
                        <div className="avatar-modal-layout">
                            <div className="avatar-preview-panel">
                                <p className="avatar-panel-label">Live Preview</p>
                                <div
                                    className="avatar-preview-shell"
                                    style={{
                                        background: formData.fill || '#121212',
                                        borderColor: formData.stroke || '#ffffff'
                                    }}
                                >
                                    {formData.src && <img src={formData.src} alt={profileName || 'Profile avatar'} className="avatar-preview-image" />}
                                </div>
                                <p className="avatar-preview-name">{profileName || 'Player'}</p>
                                <p className="avatar-preview-copy">Pick an avatar, then tune the fill and stroke colors.</p>
                            </div>

                            <div className="avatar-controls-panel">
                                <div className="form-group">
                                    <label>Avatar Library</label>
                                    <div className="avatar-selection-grid">
                                        {avatarOptions.map((avatar) => (
                                            <button
                                                key={avatar.id}
                                                type="button"
                                                className={`avatar-option ${formData.src === avatar.src ? 'selected' : ''}`}
                                                onClick={() => setFormData((prev) => ({ ...prev, src: avatar.src }))}
                                                style={{
                                                    background: formData.fill || '#121212',
                                                    borderColor: formData.src === avatar.src ? (formData.stroke || '#ffffff') : '#242424'
                                                }}
                                            >
                                                <img src={avatar.src} alt={`Avatar ${avatar.id}`} className="avatar-option-image" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Fill Color</label>
                                    <div className="color-row">
                                        <input
                                            type="color"
                                            value={formData.fill || '#121212'}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, fill: e.target.value }))}
                                            className="color-picker"
                                        />
                                        <span className="color-value">{formData.fill || '#121212'}</span>
                                    </div>
                                    <div className="color-swatches">
                                        {fillSwatches.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`color-swatch ${formData.fill === color ? 'selected' : ''}`}
                                                style={{ background: color }}
                                                onClick={() => setFormData((prev) => ({ ...prev, fill: color }))}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Stroke Color</label>
                                    <div className="color-row">
                                        <input
                                            type="color"
                                            value={formData.stroke || '#ffffff'}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, stroke: e.target.value }))}
                                            className="color-picker"
                                        />
                                        <span className="color-value">{formData.stroke || '#ffffff'}</span>
                                    </div>
                                    <div className="color-swatches">
                                        {strokeSwatches.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                className={`color-swatch ${formData.stroke === color ? 'selected' : ''}`}
                                                style={{ background: color }}
                                                onClick={() => setFormData((prev) => ({ ...prev, stroke: color }))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="modal-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="modal-btn-save">Save Avatar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
