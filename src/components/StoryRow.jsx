import React, { useRef, useState, useEffect } from 'react';
import { Plus, X, Send, Type, Smile, Trash2 } from 'lucide-react';
import { uploadStory, deleteStory } from '../services/storyService';
import EmojiPicker from 'emoji-picker-react';

const StoryRow = ({ currentUser, users, stories, onStoryClick, userSettings }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [storyText, setStoryText] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const previewContainerRef = useRef(null);
    const [textPosition, setTextPosition] = useState({ x: 50, y: 80 }); // x, y as percentages
    const [isDragging, setIsDragging] = useState(false);

    // Group stories by user
    const userStories = {};
    stories.forEach(story => {
        if (!userStories[story.userId]) {
            userStories[story.userId] = [];
        }
        userStories[story.userId].push(story);
    });

    // current user stories
    const myStories = userStories[currentUser?.uid] || [];

    const currentUserProfile = users.find(u => u.id === currentUser?.uid || u.uid === currentUser?.uid);
    const blockedByMe = currentUserProfile?.blockedUsers || [];

    // get valid users with stories (excluding current user and blocked users)
    const usersWithStories = Object.keys(userStories)
        .filter(id => {
            if (id === currentUser?.uid) return false;
            
            // Filter if I blocked them
            if (blockedByMe.includes(id)) return false;
            
            // Filter if they blocked me
            const otherUserProfile = users.find(u => u.id === id || u.uid === id);
            if (otherUserProfile?.blockedUsers?.includes(currentUser?.uid)) return false;
            
            return true;
        })
        .map(id => {
            const user = users.find(u => u.id === id);
            return {
                id,
                user: user || { id, name: 'Unknown' }, // Fallback if user not found in list
                stories: userStories[id].sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
                    const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
                    return aTime - bTime;
                }),
                hasUnviewed: userStories[id].some(s => !s.viewers.includes(currentUser?.uid))
            };
        })
        // Sort users: unviewed first, then by latest story
        .sort((a, b) => {
            if (a.hasUnviewed && !b.hasUnviewed) return -1;
            if (!a.hasUnviewed && b.hasUnviewed) return 1;

            const aLatest = a.stories[a.stories.length - 1].createdAt?.toMillis?.() || a.stories[a.stories.length - 1].createdAt?.seconds * 1000 || 0;
            const bLatest = b.stories[b.stories.length - 1].createdAt?.toMillis?.() || b.stories[b.stories.length - 1].createdAt?.seconds * 1000 || 0;

            return bLatest - aLatest;
        });

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
            setShowEmojiPicker(false);
        }
    }, [selectedFile]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert("Please upload a video file for your story.");
            return;
        }

        setSelectedFile(file);
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const fileToUpload = selectedFile;
        const textToUpload = storyText;
        const positionToUpload = textPosition;

        // Reset local state for modal
        setSelectedFile(null);
        setStoryText('');
        setTextPosition({ x: 50, y: 80 });

        try {
            await uploadStory(currentUser.uid, fileToUpload, textToUpload, positionToUpload, (prog) => {
                setUploadProgress(prog);
            });
        } catch (err) {
            console.error("Story upload failed", err);
            alert("Failed to upload story.");
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDrag = (e) => {
        if (!isDragging || !previewContainerRef.current) return;

        const rect = previewContainerRef.current.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        let x = ((clientX - rect.left) / rect.width) * 100;
        let y = ((clientY - rect.top) / rect.height) * 100;

        // Constraint within bounds
        x = Math.max(10, Math.min(90, x));
        y = Math.max(10, Math.min(90, y));

        setTextPosition({ x, y });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const renderAvatar = (userObj, isMe, hasUnviewed, type) => {
        let photo = userObj?.photoURL;
        let color = 'var(--accent-color)';
        if (userSettings && userSettings[userObj?.id]?.themeColor) {
            color = userSettings[userObj.id].themeColor;
        }

        const gradientBorder = hasUnviewed
            ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
            : 'var(--border-color)';

        return (
            <div style={{
                position: 'relative',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                padding: '3px',
                background: type === 'addStory' ? 'transparent' : gradientBorder,
                cursor: 'pointer',
                flexShrink: 0
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: photo ? `url("${photo}") center/cover` : color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '20px', fontWeight: 'bold',
                    border: '2px solid var(--bg-primary)'
                }}>
                    {!photo && (userObj?.name?.charAt(0) || 'U').toUpperCase()}
                </div>
                {type === 'addStory' && (
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        background: 'var(--accent-color)',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-primary)',
                        color: 'white'
                    }}>
                        <Plus size={14} />
                    </div>
                )}
                {uploading && type === 'addStory' && (
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '10px'
                    }}>
                        {Math.round(uploadProgress)}%
                    </div>
                )}
            </div>
        );
    };

    const handleDeleteMyStories = async (e) => {
        e.stopPropagation();
        if (myStories.length === 0) return;

        const confirmDelete = window.confirm(`Delete all ${myStories.length} of your active stories?`);
        if (!confirmDelete) return;

        try {
            for (const story of myStories) {
                await deleteStory(story.id, story.storagePath);
            }
        } catch (err) {
            console.error("Failed to delete stories", err);
            alert("Failed to delete some stories.");
        }
    };

    if (!currentUser) return null;

    return (
        <div className="story-scroll" style={{
            display: 'flex',
            padding: '12px 16px',
            gap: '12px',
            overflowX: 'auto',
            borderBottom: '1px solid var(--border-color)',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none',  // IE and Edge
        }}>
            <style>
                {`
            .story-scroll::-webkit-scrollbar {
                display: none;
            }
            `}
            </style>

            {/* Add Story Button (Always visible) */}
            <div
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', maxWidth: '64px', cursor: 'pointer', flexShrink: 0 }}
            >
                {renderAvatar(currentUser, true, false, 'addStory')}
                <span style={{ fontSize: '11px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                    Add Story
                </span>
                <input
                    type="file"
                    accept="video/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                />
            </div>

            {/* Current User's Active Stories (if any) */}
            {myStories.length > 0 && (
                <div
                    onClick={() => onStoryClick({ id: currentUser.uid, user: currentUser, stories: myStories })}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        maxWidth: '64px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        position: 'relative'
                    }}
                    onMouseEnter={e => {
                        const btn = e.currentTarget.querySelector('.story-delete-btn');
                        if (btn) btn.style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                        const btn = e.currentTarget.querySelector('.story-delete-btn');
                        if (btn) btn.style.opacity = '0';
                    }}
                >
                    {renderAvatar(currentUser, false, myStories.some(s => !s.viewers.includes(currentUser.uid)), 'myStory')}
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                        Your Story
                    </span>

                    {/* Delete Shortcut Button */}
                    <button
                        className="story-delete-btn"
                        onClick={handleDeleteMyStories}
                        style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            background: '#ef4444',
                            border: '2px solid var(--bg-primary)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            zIndex: 10,
                            cursor: 'pointer'
                        }}
                        title="Delete all my stories"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            )}

            {/* Other Users */}
            {usersWithStories.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onStoryClick({ ...item })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', maxWidth: '64px', cursor: 'pointer', flexShrink: 0 }}
                >
                    {renderAvatar(item.user, false, item.hasUnviewed, 'other')}
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                        {userSettings?.[item.id]?.nickname || item.user.name || 'User'}
                    </span>
                </div>
            ))}

            {/* Preview & Text Input Modal */}
            {selectedFile && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '450px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Preview Story</h2>
                            <button
                                onClick={() => setSelectedFile(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Video Preview */}
                        <div 
                            ref={previewContainerRef}
                            onMouseMove={handleDrag}
                            onMouseUp={handleDragEnd}
                            onTouchMove={handleDrag}
                            onTouchEnd={handleDragEnd}
                            style={{ 
                                flex: 1, 
                                position: 'relative', 
                                borderRadius: '16px', 
                                overflow: 'hidden', 
                                backgroundColor: '#000', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                userSelect: 'none'
                            }}
                        >
                            <video
                                src={previewUrl}
                                autoPlay
                                loop
                                muted
                                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                            />

                            {/* Overlay Text Preview */}
                            {storyText && (
                                <div 
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    style={{
                                        position: 'absolute',
                                        top: `${textPosition.y}%`,
                                        left: `${textPosition.x}%`,
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center',
                                        color: 'white',
                                        fontSize: '22px', 
                                        fontWeight: 'bold',
                                        textShadow: '0 2px 8px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,0.8)',
                                        padding: '0',
                                        background: 'none',
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        pointerEvents: 'auto',
                                        maxWidth: '85%',
                                        zIndex: 10,
                                        userSelect: 'none'
                                    }}>
                                    {storyText}
                                </div>
                            )}
                        </div>                        {/* Input Area */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '20px', position: 'relative' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Type size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.5)', zIndex: 1 }} />
                                <textarea
                                    value={storyText}
                                    onChange={(e) => setStoryText(e.target.value)}
                                    placeholder="Add a story text..."
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '10px 12px 10px 40px',
                                        color: 'white',
                                        fontSize: '15px',
                                        resize: 'none',
                                        height: '44px',
                                        maxHeight: '120px',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                />
                            </div>

                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    width: '44px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    opacity: 0.8,
                                    transition: 'opacity 0.2s',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                            >
                                <Smile size={24} />
                            </button>

                            {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    style={{
                                        position: 'absolute',
                                        bottom: '80px',
                                        right: '0',
                                        zIndex: 10001,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        borderRadius: '12px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <EmojiPicker
                                        theme="dark"
                                        onEmojiClick={(emojiData) => {
                                            setStoryText(prev => prev + emojiData.emoji);
                                            // Optional: keep it open or close it
                                            // setShowEmojiPicker(false);
                                        }}
                                        width={320}
                                        height={400}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleConfirmUpload}
                                style={{
                                    background: 'var(--accent-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '44px',
                                    height: '44px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryRow;
