import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AtSign, Check, ShieldAlert, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

const ResetPasswordHandler = ({ theme }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const actionCode = urlParams.get('oobCode');

    useEffect(() => {
        if (actionCode) {
            verifyPasswordResetCode(auth, actionCode)
                .then((email) => {
                    setEmail(email);
                    setIsVerified(true);
                })
                .catch(() => {
                    setError('This link is invalid or has expired. Please request a new password reset link.');
                });
        } else {
            setError('No reset code found in the URL.');
        }
    }, [actionCode]);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await confirmPasswordReset(auth, actionCode, newPassword);
            setMessage('Your password has been reset successfully! You can now log in.');
            setTimeout(() => {
                window.location.href = window.location.origin;
            }, 3000);
        } catch (err) {
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
                className="auth-card"
            >
                {loading && (
                    <div className="card-loading-overlay">
                        <Loader2 className="spinner" size={40} />
                    </div>
                )}

                <div className="auth-header">
                    <div className="brand-badge-row">
                        <div className="brand-badge">
                            <AtSign size={16} />
                            <span>Chat Messenger</span>
                        </div>
                    </div>
                    <h1>New Password</h1>
                    <p>
                        {isVerified
                            ? `Setting a new password for ${email}`
                            : 'Verifying your reset link...'}
                    </p>
                </div>

                {isVerified ? (
                    <form onSubmit={handleReset} className="auth-form">
                        <div className="input-field-wrapper">
                            <div className="input-group">
                                <Lock className="input-icon" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="auth-error-container"
                                >
                                    <div className="auth-error">
                                        <ShieldAlert size={16} />
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="auth-message"
                                >
                                    <Check size={16} />
                                    <span>{message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button type="submit" className="auth-submit" disabled={loading}>
                            <span>{loading ? 'Updating...' : 'Update Password'}</span>
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                ) : (
                    <div className="auth-error-container">
                        <div className="auth-error">
                            <ShieldAlert size={16} />
                            <span>{error || 'Validating link...'}</span>
                        </div>
                        {error && (
                            <button
                                onClick={() => window.location.href = window.location.origin}
                                className="resend-btn"
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                Back to Login
                            </button>
                        )}
                    </div>
                )}
            </motion.div>

            <style>{`
                .auth-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #0a0a0f; display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; overflow: hidden; }
                .auth-bg-blobs { position: absolute; width: 100%; height: 100%; filter: blur(80px); z-index: -1; opacity: 0.4; }
                .blob { position: absolute; border-radius: 50%; }
                .blob-1 { width: 400px; height: 400px; background: #3b82f6; top: -100px; right: -100px; animation: float 20s infinite alternate; }
                .blob-2 { width: 300px; height: 300px; background: #8b5cf6; bottom: -50px; left: -50px; animation: float 25s infinite alternate-reverse; }
                .blob-3 { width: 250px; height: 250px; background: #ec4899; top: 40%; left: 20%; animation: float 30s infinite alternate; }

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
                    position: relative;
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

                .password-toggle-icon {
                    position: absolute;
                    right: 16px;
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s;
                }
                .password-toggle-icon:hover {
                    color: #5865f2;
                }

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

                .auth-error-container { background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 12px; margin: 16px 0; font-size: 13px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.1); font-weight: 500; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .auth-error { color: #ef4444; display: flex; align-items: center; gap: 8px; }
                .auth-message { color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 12px; margin: 16px 0; font-size: 13px; border: 1px solid rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; gap: 8px; }
                
                .card-loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 15, 0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; }
                .spinner { color: #5865f2; animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .resend-btn { padding: 8px 16px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; font-size: 13px; margin-top: 10px; background: rgba(255,255,255,0.1); color: white; transition: all 0.2s; }
                .resend-btn:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default ResetPasswordHandler;
