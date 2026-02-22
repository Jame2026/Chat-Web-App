
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Type, Check, Shield, Trash2, Heart, User, Smile, Image as ImageIcon } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const UserSettingsModal = ({ isOpen, onClose, user, onUpdateSettings, theme, isBlocked, onToggleBlock, onDeleteUser }) => {
    const [nickname, setNickname] = useState(user?.nickname || '');
    const [selectedColor, setSelectedColor] = useState(user?.themeColor || 'var(--accent-color)');
    const [selectedWallpaper, setSelectedWallpaper] = useState(user?.wallpaper || '');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    if (!isOpen || !user) return null;

    const colors = [
        '#3b82f6', // Messenger Blue
        '#ef4444', // Red
        '#10b981', // Green
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#71717a'  // Zinc
    ];

    const wallpapers = [
        { id: 'none', label: 'Default', value: '' },
        { id: 'sunset', label: 'Sunset', value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)' },
        { id: 'ocean', label: 'Ocean', value: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' },
        { id: 'midnight', label: 'Midnight', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
        { id: 'lush', label: 'Lush', value: 'linear-gradient(to top, #d299c2 0%, #fef9d7 100%)' },
        { id: 'royal', label: 'Royal', value: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)' },
        { id: 'rose', label: 'Rose', value: 'linear-gradient(to top, #f43b47 0%, #453a94 100%)' },
        { id: 'cosmic', label: 'Cosmic', value: 'linear-gradient(to top, #09203f 0%, #537895 100%)' },
        { id: 'sky', label: 'Sky', value: 'linear-gradient(to top, #4facfe 0%, #00f2fe 100%)' },
        { id: 'aurora', label: 'Aurora', value: 'linear-gradient(to top, #43e97b 0%, #38f9d7 100%)' }
    ];

    const handleSave = () => {
        onUpdateSettings(user.id, {
            nickname: nickname.trim(),
            themeColor: selectedColor,
            wallpaper: selectedWallpaper
        });
        onClose();
    };

    const onEmojiClick = (emojiData) => {
        setNickname((prev) => prev + emojiData.emoji);
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1100,
                backdropFilter: 'blur(8px)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    style={{
                        width: '94%',
                        maxWidth: '420px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(to bottom, var(--bg-tertiary), transparent)',
                        opacity: 0.9
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                                <Palette size={20} color={selectedColor} />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>Chat Settings</h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'var(--bg-tertiary)',
                                border: 'none',
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
                                e.currentTarget.style.color = 'var(--text-primary)';
                                e.currentTarget.style.backgroundColor = 'var(--border-color)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{
                        padding: '24px',
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        scrollbarWidth: 'none'
                    }} className="settings-content">
                        {/* Profile Section */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '32px',
                            textAlign: 'center'
                        }}>
                            <motion.div
                                layoutId={`avatar-${user.id}`}
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '30px',
                                    background: `linear-gradient(135deg, ${selectedColor} 0%, ${selectedColor}dd 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '36px',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                    marginBottom: '16px',
                                    boxShadow: `0 10px 20px -5px ${selectedColor}66`,
                                    position: 'relative',
                                    transition: 'background 0.3s ease'
                                }}
                            >
                                {(nickname || user.name || '?').charAt(0).toUpperCase()}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: user.online ? '#10b981' : '#94a3b8',
                                    border: '4px solid var(--bg-secondary)',
                                }} title={user.online ? "Online" : "Offline"} />
                            </motion.div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{user.name}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Member since Jan 2024</p>
                        </div>

                        {/* Nickname Input */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--text-secondary)',
                                marginBottom: '10px',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <Type size={12} /> Personalized Nickname
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder={`e.g. ${user.name}...`}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '12px 48px 12px 14px',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontSize: '15px',
                                        transition: 'all 0.2s',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = selectedColor;
                                        e.target.style.boxShadow = `0 0 0 3px ${selectedColor}22`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'var(--border-color)';
                                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
                                    }}
                                />
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '4px',
                                        borderRadius: '50%',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = selectedColor}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    <Smile size={20} />
                                </button>

                                <AnimatePresence>
                                    {showEmojiPicker && (
                                        <motion.div
                                            ref={emojiPickerRef}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: '8px',
                                                zIndex: 1000,
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                                borderRadius: '12px',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <EmojiPicker
                                                theme={theme}
                                                onEmojiClick={onEmojiClick}
                                                width={320}
                                                height={350}
                                                searchDisabled
                                                skinTonesDisabled
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Wallpaper Section */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--text-secondary)',
                                marginBottom: '16px',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <ImageIcon size={12} /> Chat Wallpaper
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '10px'
                            }}>
                                {wallpapers.map((wp) => (
                                    <motion.button
                                        key={wp.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedWallpaper(wp.value)}
                                        style={{
                                            aspectRatio: '2/3',
                                            borderRadius: '10px',
                                            border: selectedWallpaper === wp.value ? `3px solid ${selectedColor}` : '2px solid var(--border-color)',
                                            background: wp.value || 'var(--bg-tertiary)',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title={wp.label}
                                    >
                                        {selectedWallpaper === wp.value && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                backgroundColor: selectedColor,
                                                borderRadius: '50%',
                                                padding: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        )}
                                        {!wp.value && (
                                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '800', opacity: 0.6 }}>NONE</div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Color Selection */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--text-secondary)',
                                marginBottom: '14px',
                                gap: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <Palette size={12} /> Chat Theme Color
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '14px'
                            }}>
                                {colors.map(color => (
                                    <motion.button
                                        key={color}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '14px',
                                            backgroundColor: color,
                                            border: selectedColor === color ? '3px solid white' : 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0',
                                            boxShadow: selectedColor === color ? `0 8px 16px ${color}66` : '0 4px 6px rgba(0,0,0,0.1)',
                                            transition: 'border 0.2s'
                                        }}
                                    >
                                        {selectedColor === color && <Check size={18} color="white" />}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone Section */}
                        <div style={{
                            marginTop: '40px',
                            padding: '16px',
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '16px',
                            border: '1px solid rgba(239, 68, 68, 0.1)'
                        }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#ef4444',
                                marginBottom: '14px',
                                gap: '8px',
                                textTransform: 'uppercase'
                            }}>
                                <Shield size={12} /> Privacy & Actions
                            </label>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button
                                    onClick={onToggleBlock}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid ' + (isBlocked ? 'var(--accent-color)' : '#ef4444'),
                                        backgroundColor: isBlocked ? 'var(--accent-color)' : 'transparent',
                                        color: isBlocked ? 'white' : '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Shield size={14} />
                                    {isBlocked ? 'Unblock User' : 'Block User'}
                                </button>

                                <button
                                    onClick={() => {
                                        if (window.confirm(`Are you sure you want to delete your conversation with ${user.name}? This will remove them from your list.`)) {
                                            onDeleteUser();
                                            onClose();
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid transparent',
                                        backgroundColor: 'transparent',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Delete Conversation
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        padding: '20px 24px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '12px',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: selectedColor,
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '14px',
                                boxShadow: `0 4px 12px ${selectedColor}44`,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = `0 6px 15px ${selectedColor}66`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = `0 4px 12px ${selectedColor}44`;
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
export default UserSettingsModal;
