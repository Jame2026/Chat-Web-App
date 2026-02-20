
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Calendar, MapPin, Instagram, Twitter, Github, MessageCircle, Heart, User, ExternalLink, Settings, Shield } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, isCurrentUser, onOpenSettings, isBlocked, onToggleBlock }) => {
    const [viewFullPhoto, setViewFullPhoto] = useState(false);

    if (!isOpen || !user) return null;

    const accentColor = user.themeColor || 'var(--accent-color)';

    const statusColors = {
        active: 'var(--success-color)',
        away: '#f59e0b',
        busy: '#ef4444',
        offline: '#94a3b8'
    };
    const statusColor = statusColors[user.status] || 'var(--success-color)';

    // Mock data for the profile
    const profileInfo = {
        phone: '+1 (555) 001-2024',
        joined: 'Joined Jan 2024',
        location: 'California, USA',
        bio: user.bio || `Passionate about creating amazing digital experiences. Constantly exploring new technologies and connecting with like-minded individuals. Let's build something great!`,
        followers: '1.2k',
        following: '840'
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3000,
                padding: '16px',
                backdropFilter: 'blur(12px)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    style={{
                        width: '100%',
                        maxWidth: '440px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.45)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                    }}
                >
                    {/* Immersive Header */}
                    <div style={{
                        height: '310px',
                        background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.2)), url('${user.photoURL || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop'}') center 14% / cover no-repeat`,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        padding: '16px',
                        backgroundColor: accentColor // Fallback color
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(to bottom, transparent 80%, var(--bg-secondary))`
                        }} />

                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(12px)',
                                zIndex: 10,
                                transition: 'background-color 0.2s',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <X size={18} />
                        </motion.button>
                    </div>

                    {/* Profile Content */}
                    <div style={{ padding: '0 24px 24px', marginTop: '-50px', position: 'relative', zIndex: 5 }}>
                        {/* Status Avatar */}
                        <div
                            style={{ position: 'relative', display: 'inline-block', marginBottom: '16px', cursor: 'pointer' }}
                            onClick={() => user.photoURL && setViewFullPhoto(true)}
                            title={user.photoURL ? "Click to view full photo" : ""}
                        >
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '24px',
                                backgroundImage: user.photoURL ? `url("${user.photoURL}")` : 'none',
                                backgroundColor: accentColor,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '6px solid var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: '900',
                                color: 'white',
                                boxShadow: '0 15px 35px -5px rgba(0,0,0,0.3)',
                                transform: 'rotate(-3deg)',
                                transition: 'all 0.3s'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'rotate(-3deg) scale(1)';
                                }}>
                                {!user.photoURL && (user.nickname || user.displayName || user.name || '?').charAt(0).toUpperCase()}
                            </div>
                            {user.photoURL && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    <ExternalLink size={12} />
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '-4px',
                                width: '24px',
                                height: '24px',
                                background: statusColor,
                                border: '4px solid var(--bg-secondary)',
                                borderRadius: '50%',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }} />
                        </div>

                        {/* Name & Title */}
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                                    {user.nickname || user.displayName || user.name}
                                </h2>
                                <Heart size={16} color={accentColor} fill={accentColor} style={{ opacity: 0.7 }} />
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                @{(user.nickname || user.displayName || user.name || 'user').toLowerCase().replace(/\s+/g, '_')}
                                <span style={{ width: '3px', height: '3px', background: 'var(--border-color)', borderRadius: '50%' }} />
                                {profileInfo.joined}
                            </p>
                        </div>

                        {/* Stats Row */}
                        <div style={{
                            display: 'flex',
                            gap: '20px',
                            marginBottom: '12px',
                            padding: '4px 0'
                        }}>
                            <div>
                                <span style={{ fontSize: '18px', fontWeight: '800', display: 'block' }}>{profileInfo.followers}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '18px', fontWeight: '800', display: 'block' }}>{profileInfo.following}</span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Following</span>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: '800', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>About Me</h3>
                            <p style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--text-primary)', opacity: 0.9 }}>
                                {profileInfo.bio}
                            </p>
                        </div>

                        {/* Links & Info Card */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '12px',
                            backgroundColor: 'var(--bg-tertiary)',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px', fontWeight: '500' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={16} color={accentColor} />
                                </div>
                                <span>{profileInfo.location}</span>
                            </div>

                            {/* Social Icons Placeholder */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                marginTop: '8px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Instagram size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                                <Twitter size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                                <Github size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                            </div>
                        </div>

                        {/* Main Action Button */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {isCurrentUser ? (
                                <motion.button
                                    whileHover={{ scale: 1.02, translateY: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onOpenSettings}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '14px',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <Settings size={20} color={accentColor} />
                                    Edit Account Settings
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.02, translateY: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '14px',
                                        backgroundColor: accentColor,
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: `0 10px 20px ${accentColor}44`,
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <MessageCircle size={20} />
                                    Send Direct Message
                                </motion.button>
                            )}

                            {!isCurrentUser && (
                                <button
                                    onClick={() => {
                                        onToggleBlock();
                                        onClose();
                                    }}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '14px',
                                        backgroundColor: 'transparent',
                                        color: isBlocked ? 'var(--accent-color)' : '#ef4444',
                                        border: '1px solid ' + (isBlocked ? 'var(--accent-color)' : '#ef4444'),
                                        fontWeight: '700',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s',
                                        marginBottom: '10px'
                                    }}
                                >
                                    <Shield size={20} />
                                    {isBlocked ? 'Unblock User' : 'Block User'}
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                style={{
                                    padding: '12px 20px',
                                    borderRadius: '14px',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid transparent',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Full Photo Overlay */}
                <AnimatePresence>
                    {viewFullPhoto && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewFullPhoto(false)}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.96)',
                                zIndex: 4000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'zoom-out',
                                padding: '40px'
                            }}
                        >
                            <button
                                onClick={() => setViewFullPhoto(false)}
                                style={{
                                    position: 'absolute',
                                    top: '30px',
                                    right: '30px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '50%',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>
                            <motion.img
                                initial={{ scale: 0.8, rotate: -5 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0.8, rotate: -5 }}
                                src={user.photoURL}
                                alt="Profile"
                                style={{
                                    maxWidth: '90%',
                                    maxHeight: '90%',
                                    borderRadius: '24px',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                                    objectFit: 'contain'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
};

export default ProfileModal;
