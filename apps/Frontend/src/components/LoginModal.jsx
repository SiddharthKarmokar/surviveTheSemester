import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/userSlice';
import '../css/login-modal.css';

const LoginModal = ({ isOpen, onClose, onSwitchToSignup }) => {
    const passwordInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const faceRef = useRef(null);
    const leftHandRef = useRef(null);
    const rightHandRef = useRef(null);
    const tongueRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const dispatch = useDispatch();

    const hideHands = useCallback(() => {
        leftHandRef.current?.classList.add('hide');
        rightHandRef.current?.classList.add('hide');
        tongueRef.current?.classList.remove('breath');
    }, []);

    const showHands = useCallback(() => {
        leftHandRef.current?.classList.remove('hide');
        leftHandRef.current?.classList.remove('peek');
        rightHandRef.current?.classList.remove('hide');
        rightHandRef.current?.classList.remove('peek');
        tongueRef.current?.classList.add('breath');
    }, []);

    const peekHands = useCallback(() => {
        leftHandRef.current?.classList.remove('hide');
        leftHandRef.current?.classList.add('peek');
        rightHandRef.current?.classList.remove('hide');
        rightHandRef.current?.classList.add('peek');
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const emailInput = emailInputRef.current;
        const passwordInput = passwordInputRef.current;
        const face = faceRef.current;
        if (!emailInput || !passwordInput || !face) return;

        const onEmailFocus = () => showHands();
        const onEmailBlur = () => { face.style.setProperty('--rotate-head', '0deg'); };
        const onEmailInput = (e) => {
            const len = Math.min(e.target.value.length - 16, 19);
            face.style.setProperty('--rotate-head', `${-len}deg`);
        };
        const onPasswordFocus = () => hideHands();
        const onPasswordBlur = () => showHands();

        emailInput.addEventListener('focus', onEmailFocus);
        emailInput.addEventListener('blur', onEmailBlur);
        emailInput.addEventListener('input', onEmailInput);
        passwordInput.addEventListener('focus', onPasswordFocus);
        passwordInput.addEventListener('blur', onPasswordBlur);

        return () => {
            emailInput.removeEventListener('focus', onEmailFocus);
            emailInput.removeEventListener('blur', onEmailBlur);
            emailInput.removeEventListener('input', onEmailInput);
            passwordInput.removeEventListener('focus', onPasswordFocus);
            passwordInput.removeEventListener('blur', onPasswordBlur);
        };
    }, [isOpen, hideHands, showHands]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    const Finger = () => (
        <div className="finger">
            <div className="bone"></div>
            <div className="nail"></div>
        </div>
    );

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="center">

                <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            d="M6 6l12 12M6 18L18 6"/>
                    </svg>
                </button>

               
                <div className="ear ear--left"></div>
                <div className="ear ear--right"></div>


                <div className="face" ref={faceRef} style={{ '--rotate-head': '0deg' }}>
                    <div className="eyes">
                        <div className="eye eye--left"><div className="glow"></div></div>
                        <div className="eye eye--right"><div className="glow"></div></div>
                    </div>

                    <div className="nose">
                        <svg width="38.161" height="22.03">
                            <path d="M2.017 10.987Q-.563 7.513.157 4.754C.877 1.994 2.976.135 6.164.093 16.4-.04 22.293-.022 32.048.093c3.501.042 5.48 2.081 6.02 4.661q.54 2.579-2.051 6.233-8.612 10.979-16.664 11.043-8.053.063-17.336-11.043z" fill="#111"/>
                        </svg>
                        <div className="glow"></div>
                    </div>

                    <div className="mouth">
                        <svg className="smile" viewBox="-2 -2 84 23" width="84" height="23">
                            <path d="M0 0c3.76 9.279 9.69 18.98 26.712 19.238 17.022.258 10.72.258 28 0S75.959 9.182 79.987.161"
                                fill="none" stroke="#111" strokeWidth="3" strokeLinecap="square" strokeMiterlimit="3"/>
                        </svg>
                        <div className="mouth-hole"></div>
                        <div className="tongue breath" ref={tongueRef}>
                            <div className="tongue-top"></div>
                            <div className="line"></div>
                            <div className="median"></div>
                        </div>
                    </div>
                </div>

                
                <div className="hands">
                    <div className="hand hand--left" ref={leftHandRef}>
                        <Finger/><Finger/><Finger/>
                    </div>
                    <div className="hand hand--right" ref={rightHandRef}>
                        <Finger/><Finger/><Finger/>
                    </div>
                </div>

                
                
                <form className="login" onSubmit={async (e) => {
                    e.preventDefault();
                    const email = emailInputRef.current?.value;
                    const password = passwordInputRef.current?.value;

                    if (!email || !password) {
                        setErrorMsg("Missing Email or Password");
                        return;
                    }

                    setIsLoading(true);
                    setErrorMsg('');

                    try {
                        const response = await fetch(`${API_URL}/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password }),
                            credentials: 'include'
                        });
                        
                        const data = await response.json();

                        if (!response.ok) {
                            setErrorMsg(data.message || "Invalid credentials");
                        } else {
                            if (data.user) {
                                dispatch(setUser(data.user));
                            }
                            onClose();
                            window.history.pushState({}, '', '/dashboard');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                    } catch (err) {
                        setErrorMsg("Network error occurred.");
                    } finally {
                        setIsLoading(false);
                    }
                }}>
                    <label>
                        <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                            <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <input
                            ref={emailInputRef}
                            className="username"
                            type="email"
                            autoComplete="email"
                            placeholder="Email"
                        />
                    </label>

                    <label>
                        <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                            <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <input
                            ref={passwordInputRef}
                            className="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Password"
                        />
                    </label>

                        <div className="login-error" style={{color: '#ff6b6b', fontSize: '13px', textAlign: 'center', marginBottom: '10px', minHeight: '18px'}}>
                            {errorMsg}
                        </div>

                    <button type="submit" className="login-button nav-btn" disabled={isLoading}>
                        <span className="btn-text">
                            <span className="btn-text-line">{isLoading ? "LOGGING IN..." : "LOGIN"}</span>
                            <span className="btn-text-line">{isLoading ? "LOGGING IN..." : "LOGIN"}</span>
                        </span>
                    </button>
                </form>

                <div className="footer">
                    No account? <span className="footer-link" style={{cursor: 'pointer'}} onClick={() => { onClose(); if(onSwitchToSignup) onSwitchToSignup(); }}>Register</span>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
