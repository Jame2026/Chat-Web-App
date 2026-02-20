import React, { useState } from 'react';
import { auth, db, googleProvider, githubProvider } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowRight, Github } from 'lucide-react';

const Auth = ({ onAuthSuccess, theme }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            const existingData = userDoc.exists() ? userDoc.data() : {};
            const photoToUse = existingData.photoURL || user.photoURL;

            // Sync profile info, but keep manual photo if it exists
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: photoToUse,
                online: true,
                lastSeen: serverTimestamp()
            }, { merge: true });

            console.log("🔄 Social Login - Photo source:", photoToUse === user.photoURL ? "Google" : "Database (Manual)");
            onAuthSuccess();
        } catch (err) {
            console.error(err);
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const user = result.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            const existingData = userDoc.exists() ? userDoc.data() : {};
            const photoToUse = existingData.photoURL || user.photoURL;

            // Sync profile info, but keep manual photo if it exists
            await setDoc(userDocRef, {
                uid: user.uid,
                displayName: user.displayName || user.email?.split('@')[0] || 'Github User',
                email: user.email,
                photoURL: photoToUse,
                online: true,
                lastSeen: serverTimestamp()
            }, { merge: true });

            console.log("🔄 Github Login - Photo source:", photoToUse === user.photoURL ? "Github" : "Database (Manual)");
            onAuthSuccess();
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with the same email. Try logging in with Google or Email.');
            } else {
                setError(err.message.replace('Firebase:', '').trim());
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await updateProfile(user, { displayName });

                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    displayName,
                    email,
                    photoURL: '',
                    online: true,
                    lastSeen: serverTimestamp()
                });
            }
            onAuthSuccess();
        } catch (err) {
            console.error(err);
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`auth-container ${theme === 'light' ? 'light' : ''}`}>
            <div className="auth-bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="auth-card"
            >
                <div className="auth-header">
                    <div className="brand-badge">
                        <AtSign size={18} />
                        <span>Chat Messenger</span>
                    </div>
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>{isLogin ? 'Sign in to continue your conversations' : 'Join thousands of users in our community'}</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="name-field"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="input-field-wrapper"
                            >
                                <div className="input-group">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required={!isLogin}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="input-field-wrapper">
                        <div className="input-group">
                            <Mail className="input-icon" size={18} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-field-wrapper">
                        <div className="input-group">
                            <Lock className="input-icon" size={18} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="auth-error"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Get Started')}</span>
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>Social Login</span>
                </div>

                <div className="social-grid">
                    <button onClick={handleGoogleLogin} className="social-btn google" disabled={loading}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Google
                    </button>
                    <button onClick={handleGithubLogin} className="social-btn github" disabled={loading}>
                        <Github size={18} />
                        GitHub
                    </button>
                </div>

                <div className="auth-footer">
                    <span>{isLogin ? "Don't have an account?" : "Already member?"}</span>
                    <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                        {isLogin ? 'Create one now' : 'Sign in here'}
                    </button>
                </div>
            </motion.div>

            <style>{`
                .auth-container {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: #0a0a0f;
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                    overflow: hidden;
                }

                .auth-bg-blobs {
                    position: absolute;
                    width: 100%; height: 100%;
                    filter: blur(80px);
                    z-index: -1;
                    opacity: 0.4;
                }

                .blob {
                    position: absolute;
                    border-radius: 50%;
                }
                .blob-1 {
                    width: 400px; height: 400px;
                    background: #3b82f6;
                    top: -100px; right: -100px;
                    animation: float 20s infinite alternate;
                }
                .blob-2 {
                    width: 300px; height: 300px;
                    background: #8b5cf6;
                    bottom: -50px; left: -50px;
                    animation: float 25s infinite alternate-reverse;
                }
                .blob-3 {
                    width: 250px; height: 250px;
                    background: #ec4899;
                    top: 40%; left: 20%;
                    animation: float 30s infinite alternate;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(50px, 50px) scale(1.1); }
                }

                .auth-card {
                    background: rgba(26, 26, 36, 0.7);
                    backdrop-filter: blur(20px);
                    width: 100%; maxWidth: 420px;
                    padding: 40px;
                    border-radius: 32px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .brand-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(93, 101, 242, 0.1);
                    color: #5865f2;
                    padding: 6px 12px;
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 24px;
                }

                .auth-header h1 { color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.02em; }
                .auth-header p { color: #94a3b8; margin: 12px 0 32px; font-size: 15px; line-height: 1.5; }

                .input-field-wrapper { margin-bottom: 16px; overflow: hidden; }
                .input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 16px;
                    color: #64748b;
                    transition: color 0.2s;
                }
                .input-group input {
                    width: 100%; padding: 14px 14px 14px 48px;
                    background: rgba(47, 49, 54, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    color: white; outline: none;
                    font-size: 15px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-group input:focus {
                    background: rgba(47, 49, 54, 0.8);
                    border-color: #5865f2;
                    box-shadow: 0 0 0 4px rgba(88, 101, 242, 0.15);
                }
                .input-group input:focus + .input-icon { color: #5865f2; }

                .auth-submit {
                    width: 100%; padding: 16px;
                    background: linear-gradient(135deg, #5865f2 0%, #4752c4 100%);
                    color: white;
                    border: none; border-radius: 16px;
                    font-weight: 700; font-size: 16px;
                    cursor: pointer;
                    margin-top: 12px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
                }
                .auth-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(88, 101, 242, 0.4);
                }
                .auth-submit:active { transform: translateY(0); }
                .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                
                .auth-divider {
                    margin: 28px 0;
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: #64748b;
                }
                .auth-divider::before, .auth-divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
                .auth-divider span {
                    padding: 0 16px;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .social-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 32px;
                }

                .social-btn {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    color: #e2e8f0;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    font-weight: 600;
                    font-size: 14px;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .social-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }
                .social-btn img { width: 18px; height: 18px; }

                .auth-footer { text-align: center; color: #94a3b8; font-size: 14px; font-weight: 500; }
                .toggle-auth {
                    background: none; border: none; color: #5865f2;
                    font-weight: 700; cursor: pointer; margin-left: 6px;
                    transition: color 0.2s;
                    font-size: 14px;
                }
                .toggle-auth:hover { color: #4752c4; text-decoration: underline; }

                .auth-error {
                    color: #ef4444; background: rgba(239, 68, 68, 0.1);
                    padding: 12px; border-radius: 12px; margin: 16px 0;
                    font-size: 13px; text-align: center;
                    border: 1px solid rgba(239, 68, 68, 0.1);
                    font-weight: 500;
                }
                
                .light .auth-container { background: #f8fafc; }
                .light .auth-card { background: rgba(255, 255, 255, 0.8); border-color: #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
                .light .auth-header h1 { color: #0f172a; }
                .light .auth-header p { color: #64748b; }
                .light .input-group input { background: #ffffff; border-color: #e2e8f0; color: #0f172a; }
                .light .social-btn { background: #ffffff; border-color: #e2e8f0; color: #0f172a; }
                .light .blob-1 { background: #bfdbfe; }
                .light .blob-2 { background: #ddd6fe; }
                .light .blob-3 { background: #fbcfe8; }
            `}</style>
        </div>
    );
};

export default Auth;
