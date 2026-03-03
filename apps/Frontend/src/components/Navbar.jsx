import React, { useState } from 'react';
import LoginModal from './LoginModal';
import '../css/navbar.css'; 

const Navbar = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <>
            <nav className="navbar">
                <div id="title">
                    <p>Games</p>           
                </div>

                <div id="buttons">
                    <div id="login-button">
                        <button className="nav-btn" onClick={() => setIsLoginOpen(true)}>
                            <span className="btn-text">
                                <span className="btn-text-line">LOGIN</span>
                                <span className="btn-text-line">LOGIN</span>
                            </span>
                        </button>
                    </div>
                    <div id="register-button">
                        <button className="nav-btn nav-btn--alt" onClick={() => window.location.href='/register'}>
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
                </div>
            </nav>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
};

export default Navbar;
