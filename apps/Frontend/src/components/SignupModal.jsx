import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/userSlice';
import '../css/signup-modal.css';

const INTERESTS_LIST = [
    "Math", "Puzzles", "Action Games", 
    "Friends Duo", "Fun"
];

const SignupModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);
    const emailInputRef = useRef(null);
    const faceRef = useRef(null);
    const leftHandRef = useRef(null);
    const rightHandRef = useRef(null);
    const tongueRef = useRef(null);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: ''
    });
    const [interests, setInterests] = useState([]);
    const [otp, setOtp] = useState('');
    const [errors, setErrors] = useState({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const API_URL = import.meta.env.VITE_BACKEND_URL;
    const dispatch = useDispatch();

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                setInterests([]);
                setOtp('');
                setErrors({});
                setIsSuccess(false);
            }, 300);
        }
    }, [isOpen]);

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

    useEffect(() => {
        if (!isOpen || step !== 1 || isSuccess) return;

        const emailInput = emailInputRef.current;
        const passwordInput = passwordInputRef.current;
        const confirmPasswordInput = confirmPasswordInputRef.current;
        const face = faceRef.current;
        if (!emailInput || (!passwordInput && !confirmPasswordInput) || !face) return;

        const onEmailFocus = () => showHands();
        const onEmailBlur = () => { face.style.setProperty('--rotate-head', '0deg'); };
        const onEmailInput = (e) => {
            const len = Math.min(e.target.value.length - 16, 19);
            face.style.setProperty('--rotate-head', `${-len}deg`);
        };
        const onPasswordFocus = () => hideHands();
        const onPasswordBlur = () => showHands();

        emailInput?.addEventListener('focus', onEmailFocus);
        emailInput?.addEventListener('blur', onEmailBlur);
        emailInput?.addEventListener('input', onEmailInput);
        passwordInput?.addEventListener('focus', onPasswordFocus);
        passwordInput?.addEventListener('blur', onPasswordBlur);
        confirmPasswordInput?.addEventListener('focus', onPasswordFocus);
        confirmPasswordInput?.addEventListener('blur', onPasswordBlur);

        return () => {
            emailInput?.removeEventListener('focus', onEmailFocus);
            emailInput?.removeEventListener('blur', onEmailBlur);
            emailInput?.removeEventListener('input', onEmailInput);
            passwordInput?.removeEventListener('focus', onPasswordFocus);
            passwordInput?.removeEventListener('blur', onPasswordBlur);
            confirmPasswordInput?.removeEventListener('focus', onPasswordFocus);
            confirmPasswordInput?.removeEventListener('blur', onPasswordBlur);
        };
    }, [isOpen, step, isSuccess, hideHands, showHands]);

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

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
        if (formData.password.length < 6) newErrors.password = "Min 6 chars";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords mismatch";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep1 = () => {
        if (validateStep1()) setStep(2);
    };

    const toggleInterest = (interest) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter(i => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
        if (errors.interests) setErrors({ ...errors, interests: null });
    };

    const handleNextStep2 = async () => {
        if (interests.length === 0) {
            setErrors({ interests: "Select at least 1 interest" });
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: formData.name, 
                    email: formData.email 
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                setErrors({ interests: data.message || "Failed to send OTP" });
            } else {
                setStep(3);
            }
        } catch (error) {
            setErrors({ interests: "Network error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (otp.length < 4) {
            setErrors({ otp: "Enter a valid OTP" });
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    otp: otp,
                    interest: interests
                }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ otp: data.message || "Invalid OTP" });
            } else {
                if (data.user) {
                    dispatch(setUser(data.user));
                }
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                    window.history.pushState({}, '', '/dashboard');
                    const navEvent = new PopStateEvent('popstate');
                    window.dispatchEvent(navEvent);
                }, 1500);
            }
        } catch (error) {
            setErrors({ otp: "Network error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-modal-backdrop" onClick={handleBackdropClick}>
            <div className="signup-center">



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

                <div className="hands" style={{ display: (step === 1 && !isSuccess) ? 'block' : 'none' }}>
                    <div className="hand hand--left" ref={leftHandRef}>
                        <Finger/><Finger/><Finger/>
                    </div>
                    <div className="hand hand--right" ref={rightHandRef}>
                        <Finger/><Finger/><Finger/>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="success-container">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2>Signup Successful!</h2>
                        <p style={{fontSize:'12px', color:'#555', marginTop:'10px'}}>Welcome to the club.</p>
                    </div>
                ) : (
                    <>
                        {step === 1 && (
                            <form className="signup-form" onSubmit={(e) => { e.preventDefault(); handleNextStep1(); }}>
                                <label>
                                    <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                                        <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                                    </svg>
                                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} />
                                    <span className="signup-error">{errors.name}</span>
                                </label>
                                <label>
                                    <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                                        <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                    <input ref={emailInputRef} type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                                    <span className="signup-error">{errors.email}</span>
                                </label>
                                <label>
                                    <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                                        <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                    <input ref={passwordInputRef} type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} />
                                    <span className="signup-error">{errors.password}</span>
                                </label>
                                <label>
                                    <svg className="field-icon" viewBox="0 0 24 24" width="15" height="15">
                                        <path stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round" d="M9 12l2 2 4-4m12 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <input ref={confirmPasswordInputRef} type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} />
                                    <span className="signup-error">{errors.confirmPassword}</span>
                                </label>
                                <button type="submit" className="primary-btn">
                                    <span className="btn-text">
                                        <span className="btn-text-line">NEXT</span>
                                        <span className="btn-text-line">NEXT</span>
                                    </span>
                                </button>
                                <div className="footer">
                                    Already have an account? <span className="footer-link" onClick={() => { onClose(); if(onSwitchToLogin) onSwitchToLogin(); }}>Login</span>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="interests-container">
                                <div className="interests-title">What are you interested in?</div>
                                <div className="interests-grid">
                                    {INTERESTS_LIST.map((interest) => (
                                        <div className="interest-chip" key={interest}>
                                            <input 
                                                type="checkbox" 
                                                id={`interest-${interest}`} 
                                                checked={interests.includes(interest)} 
                                                onChange={() => toggleInterest(interest)}
                                            />
                                            <label className="interest-chip-label" htmlFor={`interest-${interest}`}>
                                                {interest}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <div className="signup-error" style={{textAlign: 'center', marginTop: '10px'}}>{errors.interests}</div>
                                <button className="primary-btn" onClick={handleNextStep2} disabled={isLoading}>
                                    <span className="btn-text">
                                        <span className="btn-text-line">{isLoading ? "SENDING..." : "VERIFY EMAIL"}</span>
                                        <span className="btn-text-line">{isLoading ? "SENDING..." : "VERIFY EMAIL"}</span>
                                    </span>
                                </button>
                                <div className="footer" style={{marginTop:'8px'}}>
                                    <span className="footer-link" onClick={() => setStep(1)}>Back</span>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="otp-container">
                                <div className="otp-title">Validate your Email</div>
                                <div className="otp-subtitle">An OTP was sent to {formData.email}</div>
                                <input 
                                    className="otp-input" 
                                    type="text" 
                                    maxLength="4" 
                                    placeholder="----" 
                                    value={otp} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setOtp(val); 
                                        if(errors.otp) setErrors({...errors, otp:null});
                                    }}
                                />
                                <div className="signup-error" style={{marginTop: '5px'}}>{errors.otp}</div>
                                <button className="primary-btn" onClick={handleOtpSubmit} style={{marginTop: '15px'}} disabled={isLoading}>
                                    <span className="btn-text">
                                        <span className="btn-text-line">{isLoading ? "VERIFYING..." : "COMPLETE SIGNUP"}</span>
                                        <span className="btn-text-line">{isLoading ? "VERIFYING..." : "COMPLETE SIGNUP"}</span>
                                    </span>
                                </button>
                                <div className="footer" style={{marginTop:'12px'}}>
                                    <span className="footer-link" onClick={() => setStep(2)}>Back</span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!isSuccess && (
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close" style={{ zIndex: 9999 }}>
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                d="M6 6l12 12M6 18L18 6"/>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default SignupModal;
