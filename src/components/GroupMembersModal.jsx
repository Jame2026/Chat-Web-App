import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserMinus, LogOut, Crown, Settings, Users, Camera, Check, Image as ImageIcon } from 'lucide-react';
import ImageEditorModal from './ImageEditorModal';

const GroupMembersModal = ({ isOpen, onClose, group, users, currentUser, onKickUser, onLeaveGroup, onUpdateGroup, initialTab = 'members' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [newName, setNewName] = useState(group?.name || '');
    const [newTheme, setNewTheme] = useState(group?.themeColor || 'var(--accent-color)');
    const [messageSize, setMessageSize] = useState(group?.messageSize || 14);
    const [selectedWallpaper, setSelectedWallpaper] = useState(group?.wallpaper || '');
    const [photoFile, setPhotoFile] = useState(null);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [imageForEditing, setImageForEditing] = useState(null);
    const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Sync state when group changes or modal opens
    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
        if (group) {
            setNewName(group.name || '');
            setNewTheme(group.themeColor || 'var(--accent-color)');
            setMessageSize(group.messageSize || 14);
            setSelectedWallpaper(group.wallpaper || '');
            setPhotoFile(null);
            setPreviewPhoto(null);
        }
    }, [group, isOpen, initialTab]);

    if (!isOpen || !group) return null;

    const isOwner = group.createdBy === currentUser.uid;

    const handleUpdateInfo = async () => {
        if (!newName.trim()) return;
        try {
            const updateData = {
                name: newName,
                themeColor: newTheme,
                messageSize: messageSize,
                wallpaper: selectedWallpaper
            };
            if (photoFile) {
                updateData.photoFile = photoFile;
            }
            await onUpdateGroup(group.id, updateData);
            setPhotoFile(null);
            setPreviewPhoto(null);
        } catch (error) {
            console.error("Error updating group info:", error);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageForEditing(reader.result);
            setIsImageEditorOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleSaveEditedPhoto = (blob) => {
        const file = new File([blob], "group_photo.jpg", { type: "image/jpeg" });
        setPhotoFile(file);
        setPreviewPhoto(URL.createObjectURL(blob));
        setIsImageEditorOpen(false);
        setImageForEditing(null);
    };

    const handleCancelEdit = () => {
        setIsImageEditorOpen(false);
        setImageForEditing(null);
    };

    const themeColors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#ec4899', '#06b6d4', '#71717a'
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

    const memberDetails = group.members.map(memberId => {
        const foundUser = users.find(u => u.uid === memberId);
        return foundUser || { uid: memberId, displayName: 'Unknown User' };
    });

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
                zIndex: 2600,
                backdropFilter: 'blur(8px)',
                padding: '20px'
            }} onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    style={{
                        width: '100%',
                        maxWidth: '420px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '85vh'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Tabs */}
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'linear-gradient(to bottom, var(--bg-tertiary), transparent)',
                        opacity: 0.9
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                                    {activeTab === 'members' ? <Users size={20} color={group.themeColor} /> : <Settings size={20} color={group.themeColor} />}
                                </div>
                                <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>{activeTab === 'members' ? 'Group Members' : 'Group Settings'}</h2>
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
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '24px' }}>
                            <button
                                onClick={() => setActiveTab('members')}
                                style={{
                                    paddingBottom: '12px',
                                    borderBottom: activeTab === 'members' ? `2px solid ${group.themeColor || 'var(--accent-color)'}` : '2px solid transparent',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === 'members' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Members
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                style={{
                                    paddingBottom: '12px',
                                    borderBottom: activeTab === 'settings' ? `2px solid ${group.themeColor || 'var(--accent-color)'}` : '2px solid transparent',
                                    background: 'none',
                                    border: 'none',
                                    color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{
                        padding: '24px',
                        overflowY: 'auto',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        scrollbarWidth: 'none'
                    }} className="settings-content">
                        {activeTab === 'members' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {memberDetails.map(member => {
                                    const isMemberMe = member.uid === currentUser.uid;
                                    const isMemberOwner = member.uid === group.createdBy;

                                    return (
                                        <div
                                            key={member.uid}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    backgroundColor: group.themeColor || 'var(--accent-color)',
                                                    backgroundImage: member.photoURL ? `url(${member.photoURL})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '16px',
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                }}>
                                                    {!member.photoURL && (member.displayName || member.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                                                        {member.displayName || member.email?.split('@')[0]}
                                                        {isMemberMe && <span style={{ fontSize: '10px', backgroundColor: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', opacity: 0.7 }}>You</span>}
                                                        {isMemberOwner && <Crown size={14} color="#f59e0b" />}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                        {isMemberOwner ? 'Admin' : 'Member'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {isOwner && !isMemberMe && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Kick ${member.displayName || 'this user'} from the group?`)) {
                                                                onKickUser(member.uid);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                )}
                                                {isMemberMe && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to leave this group?')) {
                                                                onLeaveGroup();
                                                                onClose();
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '8px 12px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                                            border: '1px solid rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        <LogOut size={16} />
                                                        Leave
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {/* Group Image Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            width: '90px',
                                            height: '90px',
                                            borderRadius: '30px',
                                            backgroundColor: newTheme,
                                            backgroundImage: previewPhoto ? `url("${previewPhoto}")` : (group.photoURL ? `url("${group.photoURL}")` : 'none'),
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '36px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            boxShadow: `0 10px 20px -5px ${newTheme}44`,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {!previewPhoto && !group.photoURL && (newName || group.name).charAt(0).toUpperCase()}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            style={{
                                                position: 'absolute',
                                                bottom: '-4px',
                                                right: '-4px',
                                                backgroundColor: newTheme,
                                                border: '4px solid var(--bg-secondary)',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <Camera size={16} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handlePhotoChange}
                                            accept="image/*"
                                            hidden
                                        />
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        {photoFile ? 'New Photo Selected' : 'Change Group Photo'}
                                    </span>
                                </div>

                                {/* Group Name Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                        Group Name
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            style={{
                                                flex: 1,
                                                padding: '12px 14px',
                                                borderRadius: '12px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                outline: 'none',
                                                transition: 'all 0.2s',
                                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = newTheme}
                                        />
                                    </div>
                                </div>

                                {/* Message Size Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                        Group Message Size
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aa</span>
                                        <input
                                            type="range"
                                            min="12"
                                            max="24"
                                            step="1"
                                            value={messageSize}
                                            onChange={(e) => setMessageSize(parseInt(e.target.value))}
                                            style={{
                                                flex: 1,
                                                accentColor: newTheme,
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <span style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 'bold' }}>Aa</span>
                                        <span style={{ minWidth: '32px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>{messageSize}px</span>
                                    </div>
                                </div>

                                {/* Group Wallpaper Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                        <ImageIcon size={12} /> Group Wallpaper
                                    </label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(5, 1fr)',
                                        gap: '10px'
                                    }}>
                                        {wallpapers.map(wp => (
                                            <button
                                                key={wp.id}
                                                onClick={() => setSelectedWallpaper(wp.value)}
                                                style={{
                                                    aspectRatio: '2/3',
                                                    borderRadius: '10px',
                                                    background: wp.value || 'var(--bg-tertiary)',
                                                    border: selectedWallpaper === wp.value ? `3px solid ${newTheme}` : '2px solid var(--border-color)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    padding: 0,
                                                    overflow: 'hidden',
                                                    position: 'relative'
                                                }}
                                                title={wp.label}
                                            >
                                                {selectedWallpaper === wp.value && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        backgroundColor: newTheme,
                                                        borderRadius: '50%',
                                                        padding: '2px',
                                                        display: 'flex'
                                                    }}>
                                                        <Check size={10} color="white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Group Theme Section */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                                        Group Theme Color
                                    </label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '14px'
                                    }}>
                                        {themeColors.map(color => (
                                            <motion.button
                                                key={color}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setNewTheme(color)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    borderRadius: '14px',
                                                    backgroundColor: color,
                                                    border: newTheme === color ? '3px solid white' : 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '0',
                                                    boxShadow: newTheme === color ? `0 8px 16px ${color}66` : '0 4px 6px rgba(0,0,0,0.1)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {newTheme === color && <Check size={18} color="white" />}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div style={{
                        padding: '20px 24px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '12px',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderBottomLeftRadius: '24px',
                        borderBottomRightRadius: '24px'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateInfo}
                            disabled={newName === group.name && newTheme === group.themeColor && messageSize === group.messageSize && selectedWallpaper === (group.wallpaper || '') && !photoFile}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: newTheme,
                                color: 'white',
                                cursor: (newName === group.name && newTheme === group.themeColor && messageSize === group.messageSize && selectedWallpaper === (group.wallpaper || '') && !photoFile) ? 'not-allowed' : 'pointer',
                                opacity: (newName === group.name && newTheme === group.themeColor && messageSize === group.messageSize && selectedWallpaper === (group.wallpaper || '') && !photoFile) ? 0.6 : 1,
                                fontWeight: '700',
                                fontSize: '14px',
                                boxShadow: `0 4px 12px ${newTheme}44`,
                                transition: 'all 0.2s'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </div>
            <ImageEditorModal
                isOpen={isImageEditorOpen}
                image={imageForEditing}
                aspect={1}
                shape="round"
                onCancel={handleCancelEdit}
                onSave={handleSaveEditedPhoto}
            />
        </AnimatePresence>
    );
};

export default GroupMembersModal;
