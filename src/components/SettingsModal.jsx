
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Camera, Check, LogOut, Settings, User as UserIcon, Type, FileText, Circle, Smile, Image as ImageIcon, ExternalLink, MapPin, Instagram, Github, Facebook, Link as LinkIcon, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

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
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
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
    }, [isOpen, user, userBio, currentStatus, userWallpaper]);

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

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleApplyCrop = async () => {
        try {
            const croppedBlob = await getCroppedImg(croppingImage, croppedAreaPixels);
            const previewUrl = URL.createObjectURL(croppedBlob);
            setLocalPreview(previewUrl);
            setPendingFile(croppedBlob);
            setCroppingImage(null);
        } catch (e) {
            console.error(e);
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
                        <section style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '28px',
                                        backgroundImage: localPreview ? `url("${localPreview}")` : (userPhotoURL ? `url("${userPhotoURL}")` : 'none'),
                                        backgroundColor: 'var(--accent-color)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '44px',
                                        fontWeight: '900',
                                        color: 'white',
                                        cursor: 'pointer',
                                        border: '4px solid var(--bg-tertiary)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {!localPreview && !userPhotoURL && (user?.displayName || 'U').charAt(0).toUpperCase()}
                                    <div className="photo-overlay" style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'all 0.3s ease', gap: '10px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenProfile({
                                                    ...user,
                                                    displayName: newName,
                                                    bio: newBio,
                                                    photoURL: localPreview || userPhotoURL,
                                                    status: status
                                                });
                                            }}
                                            style={{
                                                background: 'white', border: 'none', color: 'black', padding: '6px 14px',
                                                borderRadius: '20px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', width: '80px', justifyContent: 'center'
                                            }}
                                        >
                                            <UserIcon size={14} /> VIEW
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRef.current.click();
                                            }}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                                                color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '11px',
                                                fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                gap: '6px', width: '80px', justifyContent: 'center'
                                            }}
                                        >
                                            <Camera size={14} /> CHANGE
                                        </button>
                                    </div>
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: '5px', right: '5px', width: '22px', height: '22px',
                                    borderRadius: '50%', backgroundColor: statusOptions.find(o => o.id === status)?.color,
                                    border: '3px solid var(--bg-secondary)'
                                }} />
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                            </div>
                            <style>{`.photo-overlay:hover { opacity: 1 !important; }`}</style>
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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--accent-color)';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(var(--accent-color-rgb), 0.1)';
                                    e.currentTarget.style.color = 'var(--accent-color)';
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
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    <ImageIcon size={12} /> Chat Wallpaper
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    {[
                                        { id: 'none', v: '' },
                                        { id: 'sunset', v: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%)' },
                                        { id: 'ocean', v: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
                                        { id: 'midnight', v: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' }
                                    ].map(wp => (
                                        <button
                                            key={wp.id}
                                            onClick={() => setPendingWallpaper(wp.v)}
                                            style={{
                                                aspectRatio: '1', borderRadius: '8px', background: wp.v || 'var(--bg-tertiary)',
                                                border: pendingWallpaper === wp.v ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            {pendingWallpaper === wp.v && <Check size={16} color={wp.v ? 'white' : 'var(--accent-color)'} />}
                                        </button>
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
            </div>

            {/* Image Cropper Overlay */}
            <AnimatePresence>
                {croppingImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'black',
                            zIndex: 3000,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ position: 'relative', flex: 1, backgroundColor: '#111' }}>
                            <Cropper
                                image={croppingImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            style={{
                                padding: '40px 20px',
                                backgroundColor: 'var(--bg-secondary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                alignItems: 'center',
                                borderTop: '1px solid var(--border-color)',
                                borderTopLeftRadius: '32px',
                                borderTopRightRadius: '32px'
                            }}
                        >
                            <div style={{ width: '100%', maxWidth: '300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ZOOM</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-color)' }}>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    style={{
                                        width: '100%',
                                        accentColor: 'var(--accent-color)',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '300px' }}>
                                <button
                                    onClick={() => setCroppingImage(null)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: '1px solid var(--border-color)',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyCrop}
                                    style={{
                                        flex: 2,
                                        padding: '14px',
                                        borderRadius: '16px',
                                        backgroundColor: 'var(--accent-color)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 20px rgba(var(--accent-color-rgb), 0.3)'
                                    }}
                                >
                                    Apply & Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

export default SettingsModal;
