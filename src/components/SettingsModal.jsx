
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Camera, Check, LogOut, Settings, User as UserIcon, Type, FileText, Circle, Smile, Image as ImageIcon, ExternalLink, MapPin, Instagram, Github, Facebook, Link as LinkIcon, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ImageEditorModal from './ImageEditorModal';

const SettingsModal = ({
    isOpen,
    onClose,
    theme,
    onToggleTheme,
    user,
    onUpdateName,
    userBio,
    onUpdateBio,
    onUpdatePhoto,
    onOpenProfile,
    onLogout,
    userPhotoURL,
    status: currentStatus,
    onUpdateStatus,
    userWallpaper,
    onUpdateWallpaper,
    userLocation,
    userInstagram,
    userTelegram,
    userLink,
    userFacebook,
    onUpdateSocials
}) => {
    // Local state for all fields
    const [newName, setNewName] = useState('');
    const [newBio, setNewBio] = useState('');
    const [location, setLocation] = useState('');
    const [instagram, setInstagram] = useState('');
    const [telegram, setTelegram] = useState('');
    const [link, setLink] = useState('');
    const [facebook, setFacebook] = useState('');
    const [localPreview, setLocalPreview] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [status, setStatus] = useState(currentStatus || 'active');
    const [pendingWallpaper, setPendingWallpaper] = useState(userWallpaper || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [croppingImage, setCroppingImage] = useState(null); // The source image for the cropper

    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // Sync local state when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setNewName(user.displayName || '');
            setNewBio(userBio || '');
            setLocation(userLocation || '');
            setInstagram(userInstagram || '');
            setTelegram(userTelegram || '');
            setLink(userLink || '');
            setFacebook(userFacebook || '');
            setStatus(currentStatus || 'active');
            setPendingWallpaper(userWallpaper || '');
            setLocalPreview(null);
            setPendingFile(null);
            setIsSavingAll(false);
            setCroppingImage(null);
        }
    }, [isOpen, user, userBio, currentStatus, userWallpaper, userLocation, userInstagram, userTelegram, userLink, userFacebook]);

    // Handle clicking outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasChanges =
        newName.trim() !== (user?.displayName || '') ||
        newBio.trim() !== (userBio || '') ||
        location.trim() !== (userLocation || '') ||
        instagram.trim() !== (userInstagram || '') ||
        telegram.trim() !== (userTelegram || '') ||
        link.trim() !== (userLink || '') ||
        facebook.trim() !== (userFacebook || '') ||
        status !== (currentStatus || 'active') ||
        pendingWallpaper !== (userWallpaper || '') ||
        pendingFile !== null;

    const handleUpdateAll = async () => {
        if (!hasChanges || isSavingAll) return;
        setIsSavingAll(true);
        try {
            if (newName.trim() !== (user?.displayName || '')) {
                await onUpdateName(newName.trim());
            }
            if (newBio.trim() !== (userBio || '')) {
                await onUpdateBio(newBio.trim());
            }
            if (status !== (currentStatus || 'active')) {
                await onUpdateStatus(status);
            }
            if (pendingWallpaper !== (userWallpaper || '')) {
                await onUpdateWallpaper(pendingWallpaper);
            }

            const socialsToUpdate = {};
            if (location.trim() !== (userLocation || '')) socialsToUpdate.location = location.trim();
            if (instagram.trim() !== (userInstagram || '')) socialsToUpdate.instagram = instagram.trim();
            if (telegram.trim() !== (userTelegram || '')) socialsToUpdate.telegram = telegram.trim();
            if (link.trim() !== (userLink || '')) socialsToUpdate.link = link.trim();
            if (facebook.trim() !== (userFacebook || '')) socialsToUpdate.facebook = facebook.trim();

            if (Object.keys(socialsToUpdate).length > 0) {
                await onUpdateSocials(socialsToUpdate);
            }
            if (pendingFile) {
                await onUpdatePhoto(pendingFile);
            }
            setTimeout(() => {
                onClose();
            }, 800);
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update profile: " + err.message);
        } finally {
            setIsSavingAll(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setCroppingImage(reader.result);
            };
        }
        // Reset input value so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleEmojiClick = (emojiData) => {
        if (showEmojiPicker === 'name') setNewName(prev => prev + emojiData.emoji);
        if (showEmojiPicker === 'bio') setNewBio(prev => prev + emojiData.emoji);
        setShowEmojiPicker(null);
    };

    const statusOptions = [
        { id: 'active', label: 'Active Now', color: '#10b981', icon: <Circle size={10} fill="#10b981" /> },
        { id: 'away', label: 'Away', color: '#f59e0b', icon: <Circle size={10} fill="#f59e0b" /> },
        { id: 'busy', label: 'Do Not Disturb', color: '#ef4444', icon: <Circle size={10} fill="#ef4444" /> },
        { id: 'offline', label: 'Invisible', color: '#94a3b8', icon: <Circle size={10} fill="#94a3b8" /> }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2500,
                backdropFilter: 'blur(12px)',
                padding: '20px'
            }} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 32px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--bg-tertiary)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon size={20} color="var(--accent-color)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>My Account</h2>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Profile & Personalization</p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                        >
                            <X size={18} />
                        </motion.button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>

                        {/* 1. Photo Section */}
                        <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '32px',
                                        backgroundImage: localPreview ? `url("${localPreview}")` : (userPhotoURL ? `url("${userPhotoURL}")` : 'none'),
                                        backgroundColor: 'var(--accent-color)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '48px',
                                        fontWeight: '900',
                                        color: 'white',
                                        cursor: 'pointer',
                                        border: `4px solid ${pendingFile ? 'var(--accent-color)' : 'var(--bg-tertiary)'}`,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        boxShadow: pendingFile ? '0 0 20px rgba(var(--accent-color-rgb), 0.4)' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {!localPreview && !userPhotoURL && (user?.displayName || 'U').charAt(0).toUpperCase()}
                                    <div className="photo-overlay" style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 0.3s ease', gap: '10px',
                                        backdropFilter: 'blur(4px)', pointerEvents: 'none'
                                    }}>
                                        <Camera size={24} color="white" />
                                    </div>
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: '2px', right: '2px', width: '24px', height: '24px',
                                    borderRadius: '50%', backgroundColor: statusOptions.find(o => o.id === status)?.color,
                                    border: '4px solid var(--bg-secondary)',
                                    zIndex: 2
                                }} />
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                >
                                    <Camera size={14} /> {userPhotoURL ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                {userPhotoURL && (
                                    <button
                                        onClick={() => onOpenProfile({ ...user, photoURL: userPhotoURL })}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--text-secondary)',
                                            padding: '8px 16px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                            <style>{`
                                .photo-overlay { pointer-events: none; }
                                [onClick]:hover .photo-overlay { opacity: 1 !important; }
                            `}</style>
                        </section>

                        {/* 2. Name & Bio */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <Type size={12} /> Display Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 40px 12px 14px', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                    <button onClick={() => setShowEmojiPicker('name')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <Smile size={18} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    <FileText size={12} /> Status Bio
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        value={newBio}
                                        onChange={(e) => setNewBio(e.target.value)}
                                        placeholder="What's on your mind?"
                                        style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 40px 12px 14px', color: 'var(--text-primary)', outline: 'none', height: '80px', resize: 'none' }}
                                    />
                                    <button onClick={() => setShowEmojiPicker('bio')} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                        <Smile size={18} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenProfile({
                                        ...user,
                                        displayName: newName,
                                        bio: newBio,
                                        location: location,
                                        instagram: instagram,
                                        telegram: telegram,
                                        link: link,
                                        facebook: facebook,
                                        photoURL: localPreview || userPhotoURL,
                                        status: status
                                    });
                                }}
                                style={{
                                    background: 'rgba(var(--accent-color-rgb), 0.1)',
                                    border: '1px solid var(--accent-color)',
                                    color: 'var(--accent-color)',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    marginTop: '8px',
                                    cursor: 'pointer',
                                    padding: '10px 16px',
                                    borderRadius: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.2s',
                                    width: '100%'
                                }}
                            >
                                <ExternalLink size={16} />
                                Preview My Profile Card
                            </button>

                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} style={{ position: 'absolute', zIndex: 100, bottom: '100px', left: '50%', transform: 'translateX(-50%)' }}>
                                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme} />
                                </div>
                            )}
                        </section>

                        {/* 3. Status Selection */}
                        <section>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                <Circle size={12} /> Presence Status
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                {statusOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setStatus(opt.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px',
                                            background: status === opt.id ? 'rgba(var(--accent-color-rgb), 0.1)' : 'var(--bg-tertiary)',
                                            border: `1px solid ${status === opt.id ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                            color: status === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: '600'
                                        }}
                                    >
                                        {opt.icon} {opt.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 4. Social Information */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                <ExternalLink size={12} /> Social Information
                            </label>

                            {/* Location */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                    <MapPin size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Your Location (e.g. California, USA)"
                                    style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', outline: 'none', height: '44px', fontSize: '13px' }}
                                />
                            </div>

                            {/* Instagram */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                    <Instagram size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="Instagram Username"
                                    style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', outline: 'none', height: '44px', fontSize: '13px' }}
                                />
                            </div>

                            {/* Telegram */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                    <Send size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={telegram}
                                    onChange={(e) => setTelegram(e.target.value)}
                                    placeholder="Telegram Username"
                                    style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', outline: 'none', height: '44px', fontSize: '13px' }}
                                />
                            </div>

                            {/* Link */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                    <LinkIcon size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="Personal Link (Portfolio, etc.)"
                                    style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', outline: 'none', height: '44px', fontSize: '13px' }}
                                />
                            </div>

                            {/* Facebook */}
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                    <Facebook size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={facebook}
                                    onChange={(e) => setFacebook(e.target.value)}
                                    placeholder="Facebook Profile Link"
                                    style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px 12px 40px', color: 'var(--text-primary)', outline: 'none', height: '44px', fontSize: '13px' }}
                                />
                            </div>
                        </section>

                        {/* 5. Appearance & Wallpaper */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: '700' }}>Dark Mode</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Toggle site theme</div>
                                </div>
                                <button onClick={onToggleTheme} style={{ width: '46px', height: '26px', borderRadius: '20px', background: theme === 'dark' ? 'var(--accent-color)' : 'var(--border-color)', border: 'none', padding: '3px', cursor: 'pointer' }}>
                                    <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)', transition: '0.2s' }} />
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '14px' }}>
                                    <ImageIcon size={12} /> Chat Wallpaper
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                                    {[
                                        { id: 'none', label: 'Default', v: '' },
                                        { id: 'sunset', label: 'Sunset', v: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)' },
                                        { id: 'ocean', label: 'Ocean', v: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
                                        { id: 'midnight', label: 'Midnight', v: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
                                        { id: 'lush', label: 'Lush', v: 'linear-gradient(to top, #d299c2 0%, #fef9d7 100%)' },
                                        { id: 'royal', label: 'Royal', v: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)' },
                                        { id: 'rose', label: 'Rose', v: 'linear-gradient(to top, #f43b47 0%, #453a94 100%)' },
                                        { id: 'cosmic', label: 'Cosmic', v: 'linear-gradient(to top, #09203f 0%, #537895 100%)' },
                                        { id: 'sky', label: 'Sky', v: 'linear-gradient(to top, #4facfe 0%, #00f2fe 100%)' },
                                        { id: 'aurora', label: 'Aurora', v: 'linear-gradient(to top, #43e97b 0%, #38f9d7 100%)' }
                                    ].map(wp => (
                                        <motion.button
                                            key={wp.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setPendingWallpaper(wp.v)}
                                            style={{
                                                aspectRatio: '2/3',
                                                borderRadius: '10px',
                                                background: wp.v || 'var(--bg-tertiary)',
                                                border: pendingWallpaper === wp.v ? '3px solid var(--accent-color)' : '2px solid var(--border-color)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s'
                                            }}
                                            title={wp.label}
                                        >
                                            {pendingWallpaper === wp.v && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    background: 'var(--accent-color)',
                                                    borderRadius: '50%',
                                                    padding: '2px',
                                                    display: 'flex',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    <Check size={10} color="white" />
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                            >
                                {hasChanges ? 'Cancel' : 'Close'}
                            </button>

                            {hasChanges && (
                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={handleUpdateAll}
                                    disabled={isSavingAll}
                                    style={{
                                        flex: 2,
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: '0 8px 16px rgba(var(--accent-color-rgb), 0.3)'
                                    }}
                                >
                                    {isSavingAll ? 'Saving...' : 'Save Changes'}
                                    {!isSavingAll && <Check size={18} />}
                                </motion.button>
                            )}
                        </div>

                        <button
                            onClick={() => { onLogout(); onClose(); }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '12px',
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid transparent',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: 0.8,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                e.currentTarget.style.opacity = 1;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.opacity = 0.8;
                            }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </motion.div>

                <ImageEditorModal
                    isOpen={!!croppingImage}
                    image={croppingImage}
                    aspect={1}
                    shape="round"
                    onCancel={() => setCroppingImage(null)}
                    onSave={async (blob) => {
                        const previewUrl = URL.createObjectURL(blob);
                        setLocalPreview(previewUrl);
                        setPendingFile(blob);
                        setCroppingImage(null);
                    }}
                />
            </div>
        </AnimatePresence>
    );
};

export default SettingsModal;
