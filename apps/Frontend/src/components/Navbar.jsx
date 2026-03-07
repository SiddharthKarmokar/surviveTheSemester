import React, { useState } from 'react';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import '../css/navbar.css'; 

const Navbar = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [pathname, setPathname] = useState(window.location.pathname);

    React.useEffect(() => {
        const updatePath = () => setPathname(window.location.pathname);
        window.addEventListener('popstate', updatePath);
        return () => window.removeEventListener('popstate', updatePath);
    }, []);

    return (
        <>
            <nav className="navbar">
                <div id="title">
                    <p>Games</p>           
                </div>

                <div id="buttons">
                    {pathname === '/dashboard' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
                                </svg>
                                <span>1</span>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" color="#aaa" style={{ marginTop: '6px' }}>
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
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
