import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/userSlice';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import '../css/navbar.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const ProfileIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19a7 7 0 0 1 14 0" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
    </svg>
);

const Navbar = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.user.currentUser);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [pathname, setPathname] = useState(window.location.pathname);
    const [menuOpen, setMenuOpen] = useState(false);

    React.useEffect(() => {
        const updatePath = () => setPathname(window.location.pathname);
        window.addEventListener('popstate', updatePath);
        return () => window.removeEventListener('popstate', updatePath);
    }, []);

    React.useEffect(() => {
        const closeMenu = () => setMenuOpen(false);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const displayName = useMemo(
        () => currentUser?.name || currentUser?.username || 'Player',
        [currentUser]
    );

    const displayScore = useMemo(
        () => currentUser?.rating || currentUser?.Rating || currentUser?.score || 1018,
        [currentUser]
    );

    const handleProfileNavigate = () => {
        setMenuOpen(false);
        window.dispatchEvent(new CustomEvent('dashboard:set-tab', { detail: 'My profile' }));
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'GET',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            dispatch(clearUser());
            setMenuOpen(false);
            window.location.href = '/';
        }
    };

    return (
        <>
            <nav className="navbar">
                <div id="title">
                    <p>Games</p>
                </div>

                <div id="buttons">
                    {pathname === '/dashboard' ? (
                        <div
                            className={`dashboard-profile-wrap ${menuOpen ? 'open' : ''}`}
                            onMouseEnter={() => setMenuOpen(true)}
                            onMouseLeave={() => setMenuOpen(false)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="dashboard-profile-trigger"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen((prev) => !prev)}
                            >
                                <div className="dashboard-profile-avatar">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="dashboard-profile-copy">
                                    <span className="dashboard-profile-name">{displayName}</span>
                                </div>
                            </button>

                            {menuOpen && (
                                <div className="dashboard-profile-menu">
                                    <button type="button" className="dashboard-menu-item" onClick={handleProfileNavigate}>
                                        <span className="dashboard-menu-icon"><ProfileIcon /></span>
                                        <span>My Profile</span>
                                    </button>
                                    <button type="button" className="dashboard-menu-item" onClick={handleLogout}>
                                        <span className="dashboard-menu-icon"><LogoutIcon /></span>
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div id="login-button">
                                <button className="nav-btn" onClick={() => setIsLoginOpen(true)}>
                                    <span className="btn-text">
                                        <span className="btn-text-line">LOGIN</span>
                                        <span className="btn-text-line">LOGIN</span>
                                    </span>
                                </button>
                            </div>
                            <div id="register-button">
                                <button className="nav-btn nav-btn--alt" onClick={() => setIsSignupOpen(true)}>
                                    <span className="btn-text">
                                        <span className="btn-text-line">
                                            REGISTER
                                            <span>
                                                <span className="">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" aria-hidden="true" focusable="false">
                                                        <path fill="currentColor" d="M8 0L4.66706 8L3.4838 4.51621L0 3.33294L8 0Z"></path>
                                                    </svg>
                                                </span>
                                            </span>
                                        </span>
                                        <span className="btn-text-line">
                                            REGISTER
                                            <span>
                                                <span className="">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" aria-hidden="true" focusable="false">
                                                        <path fill="currentColor" d="M8 0L4.66706 8L3.4838 4.51621L0 3.33294L8 0Z"></path>
                                                    </svg>
                                                </span>
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </nav>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToSignup={() => {
                    setIsLoginOpen(false);
                    setIsSignupOpen(true);
                }}
            />
            <SignupModal
                isOpen={isSignupOpen}
                onClose={() => setIsSignupOpen(false)}
                onSwitchToLogin={() => {
                    setIsSignupOpen(false);
                    setIsLoginOpen(true);
                }}
            />
        </>
    );
};

export default Navbar;
