import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Eye } from 'lucide-react';
import { markStoryAsViewed, deleteStory, reactToStory } from '../services/storyService';

const STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

const StoryViewer = ({ storyUser, onClose, currentUserId, users = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(() => {
        // Initialize with first unviewed story if not owner
        if (storyUser.id !== currentUserId && storyUser.stories && storyUser.stories.length > 0) {
            const firstUnviewed = storyUser.stories.findIndex(s => !s.viewers.includes(currentUserId));
            return firstUnviewed !== -1 ? firstUnviewed : 0;
        }
        return 0;
    });
    const videoRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showViewers, setShowViewers] = useState(false);
    const [floatingEmojis, setFloatingEmojis] = useState([]);

    const stories = storyUser.stories || [];
    const currentStory = stories[currentIndex];

    useEffect(() => {
        if (!currentStory) return;

        // Mark as viewed
        if (!currentStory.viewers.includes(currentUserId) && storyUser.id !== currentUserId) {
            markStoryAsViewed(currentStory.id, currentUserId);
        }
    }, [currentStory, currentUserId, storyUser.id]);

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            if (duration > 0) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleVideoEnd = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const nextStory = (e) => {
        e.stopPropagation();
        if (showViewers) return;
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const prevStory = (e) => {
        e.stopPropagation();
        if (showViewers) return;
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const togglePause = () => {
        if (showViewers) return;
        if (videoRef.current) {
            if (isPaused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
            setIsPaused(!isPaused);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!currentStory) return;
        const confirmDelete = window.confirm("Are you sure you want to delete this story?");
        if (confirmDelete) {
            try {
                await deleteStory(currentStory.id, currentStory.storagePath);
                if (stories.length === 1) {
                    onClose();
                } else if (currentIndex === stories.length - 1) {
                    setCurrentIndex(prev => prev - 1);
                } else {
                    setProgress(0);
                }
            } catch (err) {
                console.error("Failed to delete story", err);
                alert("Failed to delete story.");
            }
        }
    };

    const handleReact = async (e, emoji) => {
        e.stopPropagation();
        if (!currentStory || storyUser.id === currentUserId) return;

        try {
            await reactToStory(currentStory.id, currentUserId, emoji);

            // Add a floating emoji to the animation array
            const newFloatingEmoji = { id: crypto.randomUUID(), emoji };
            setFloatingEmojis(prev => [...prev, newFloatingEmoji]);

            // Remove after animation completes (1.5s)
            setTimeout(() => {
                setFloatingEmojis(prev => prev.filter(e => e.id !== newFloatingEmoji.id));
            }, 1500);

            // Local optimistic update
            if (!currentStory.reactions) currentStory.reactions = {};
            currentStory.reactions[currentUserId] = emoji;
        } catch (error) {
            console.error(error);
        }
    };

    if (!currentStory) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            {/* Header / Progress bar */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                padding: '20px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {/* Progress bars */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {stories.map((s, idx) => (
                        <div key={s.id} style={{
                            flex: 1,
                            height: '3px',
                            background: 'rgba(255,255,255,0.3)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                background: '#fff',
                                width: idx === currentIndex ? `${progress}%` : (idx < currentIndex ? '100%' : '0%'),
                                transition: 'width 0.1s linear'
                            }} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: storyUser.user?.photoURL || storyUser.photoURL ? `url("${storyUser.user?.photoURL || storyUser.photoURL}") center/cover` : 'var(--accent-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 'bold'
                        }}>
                            {!(storyUser.user?.photoURL || storyUser.photoURL) && (storyUser.user?.name || storyUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'white', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {storyUser.user?.name || storyUser.name || 'User'}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginLeft: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {currentStory.createdAt ? new Date(currentStory.createdAt.toMillis?.() || currentStory.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        {storyUser.id === currentUserId && (
                            <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <Trash2 size={24} />
                            </button>
                        )}
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Player Area */}
            <div
                style={{ position: 'relative', width: '100%', maxWidth: '450px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <video
                    ref={videoRef}
                    src={currentStory.videoUrl}
                    autoPlay
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnd}
                    onClick={togglePause}
                    style={{
                        width: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000',
                        cursor: 'pointer'
                    }}
                />

                {/* Left navigation area */}
                <div onClick={prevStory} style={{ position: 'absolute', top: '15%', bottom: '15%', left: 0, width: '30%', zIndex: 5, cursor: 'pointer' }} />

                {/* Right navigation area */}
                <div onClick={nextStory} style={{ position: 'absolute', top: '15%', bottom: '15%', right: 0, width: '30%', zIndex: 5, cursor: 'pointer' }} />

                {/* Floating Emojis */}
                {floatingEmojis.map((animObj) => (
                    <div
                        key={animObj.id}
                        className="floating-emoji"
                        style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: '20%',
                            transform: 'translateX(-50%)',
                            fontSize: '60px',
                            zIndex: 8,
                            pointerEvents: 'none'
                        }}
                    >
                        {animObj.emoji}
                    </div>
                ))}
            </div>

            {/* Animation Styles */}
            <style>
                {`
                @keyframes floatUp {
                    0% {
                        transform: translate(-50%, 0) scale(0.5);
                        opacity: 0;
                    }
                    20% {
                        transform: translate(-50%, -20px) scale(1.2);
                        opacity: 1;
                    }
                    80% {
                        transform: translate(-50%, -100px) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -150px) scale(0.8);
                        opacity: 0;
                    }
                }
                .floating-emoji {
                    animation: floatUp 1.5s ease-out forwards;
                }
                `}
            </style>

            {/* View Count Footer (Owner only) */}
            {storyUser.id === currentUserId && !showViewers && (
                <div onClick={(e) => {
                    e.stopPropagation();
                    if (currentStory.viewers?.length > 0) {
                        setShowViewers(true);
                        if (videoRef.current && !isPaused) {
                            videoRef.current.pause();
                            setIsPaused(true);
                        }
                    }
                }} style={{
                    position: 'absolute',
                    bottom: '20px',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '20px',
                    zIndex: 10,
                    cursor: 'pointer'
                }}>
                    <Eye size={16} />
                    <span>{currentStory.viewers?.length || 0} views</span>
                </div>
            )}

            {/* Reactions Bar (Viewer only) */}
            {storyUser.id !== currentUserId && !showViewers && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '12px',
                        padding: '10px 20px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '30px',
                        zIndex: 10,
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    {STORY_REACTIONS.map(emoji => {
                        const hasReacted = currentStory.reactions?.[currentUserId] === emoji;
                        return (
                            <button
                                key={emoji}
                                onClick={(e) => handleReact(e, emoji)}
                                style={{
                                    background: hasReacted ? 'rgba(255,255,255,0.2)' : 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, background-color 0.2s',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={e => e.currentTarget.style.transform = hasReacted ? 'scale(1.1)' : 'scale(1)'}
                            >
                                {emoji}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Viewers List Modal */}
            {showViewers && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowViewers(false);
                        if (videoRef.current && isPaused) {
                            videoRef.current.play();
                            setIsPaused(false);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        zIndex: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        cursor: 'pointer'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-primary)',
                            borderTopLeftRadius: '20px',
                            borderTopRightRadius: '20px',
                            padding: '24px',
                            maxHeight: '60%',
                            overflowY: 'auto',
                            width: '100%',
                            maxWidth: '450px',
                            margin: '0 auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            cursor: 'default',
                            boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 'bold' }}>
                                Viewed by {currentStory.viewers?.length || 0}
                            </h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowViewers(false);
                                    if (videoRef.current && isPaused) {
                                        videoRef.current.play();
                                        setIsPaused(false);
                                    }
                                }}
                                style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {currentStory.viewers?.map(viewerId => {
                                const viewer = users.find(u => u.id === viewerId || u.uid === viewerId);
                                const name = viewer?.displayName || viewer?.name || 'User';
                                const photo = viewer?.photoURL;
                                const userReaction = currentStory.reactions?.[viewerId];

                                return (
                                    <div key={viewerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '12px', transition: 'background-color 0.2s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '44px', height: '44px', borderRadius: '50%',
                                                background: photo ? `url("${photo}") center/cover` : 'var(--accent-color)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
                                                position: 'relative'
                                            }}>
                                                {!photo && name.charAt(0).toUpperCase()}

                                                {/* Reaction badge on avatar */}
                                                {userReaction && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '-4px',
                                                        right: '-4px',
                                                        background: 'var(--bg-primary)',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                    }}>
                                                        {userReaction}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '15px' }}>
                                                {name}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryViewer;
