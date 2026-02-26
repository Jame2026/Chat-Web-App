import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { uploadStory } from '../services/storyService';

const StoryRow = ({ currentUser, users, stories, onStoryClick, userSettings }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

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

    // get valid users with stories (excluding current user)
    const usersWithStories = Object.keys(userStories)
        .filter(id => id !== currentUser?.uid)
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

    const handleUploadStory = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            alert("Please upload a video file for your story.");
            return;
        }

        setUploading(true);
        try {
            await uploadStory(currentUser.uid, file, (prog) => {
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
                    onChange={handleUploadStory}
                />
            </div>

            {/* Current User's Active Stories (if any) */}
            {myStories.length > 0 && (
                <div
                    onClick={() => onStoryClick({ id: currentUser.uid, user: currentUser, stories: myStories })}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', maxWidth: '64px', cursor: 'pointer', flexShrink: 0 }}
                >
                    {renderAvatar(currentUser, false, myStories.some(s => !s.viewers.includes(currentUser.uid)), 'myStory')}
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>
                        Your Story
                    </span>
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
        </div>
    );
};

export default StoryRow;
