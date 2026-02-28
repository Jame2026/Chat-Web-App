import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Eye, Send, Paperclip, Heart, Smile, Mic } from 'lucide-react';
import { markStoryAsViewed, deleteStory, reactToStory } from '../services/storyService';
import EmojiPicker from 'emoji-picker-react';

const STORY_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏', '🙌', '💯', '✨', '😍', '🎉', '🤯', '🙏', '🎈'];

const StoryViewer = ({ storyUser, onClose, currentUserId, users = [], onReply }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
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
    const [replyText, setReplyText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const recordingIntervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const startTimeRef = useRef(0);
    const isRecordingCancelled = useRef(false);

    const stories = storyUser.stories || [];
    const currentStory = stories[currentIndex];

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

    const captureThumbnail = React.useCallback(async () => {
        try {
            if (videoRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/jpeg', 0.5);
            }
        } catch (err) {
            console.error("Could not capture story thumbnail:", err);
        }
        return null;
    }, []);

    const handleSendReply = React.useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!replyText.trim()) return;

        const thumbnail = await captureThumbnail();

        if (onReply) {
            onReply(storyUser.id, currentStory, replyText, thumbnail);
            setReplyText('');
        }
    }, [replyText, onReply, storyUser.id, currentStory, captureThumbnail]);

    const startRecording = React.useCallback(async () => {
        isRecordingCancelled.current = false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                if (isRecordingCancelled.current) return;

                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const currentDuration = Math.round((Date.now() - startTimeRef.current) / 1000) || 0;

                if (audioBlob.size > 100 && onReply) {
                    const thumbnail = await captureThumbnail();
                    onReply(storyUser.id, currentStory, "", thumbnail, audioBlob, currentDuration);
                }
            };

            setMediaRecorder(recorder);
            audioChunksRef.current = [];
            startTimeRef.current = Date.now();
            recorder.start(200);
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Mic error:", err);
            alert("Microphone error: " + err.message);
        }
    }, [onReply, storyUser.id, currentStory, captureThumbnail]);

    const stopRecording = React.useCallback(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    }, [mediaRecorder]);

    const cancelRecording = React.useCallback(() => {
        isRecordingCancelled.current = true;
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        audioChunksRef.current = [];
    }, [mediaRecorder]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {storyUser.id === currentUserId && (
                            <button
                                onClick={handleDelete}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#ff4d4d',
                                    cursor: 'pointer',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Player Area */}
            <div
                className="story-video-container"
                style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <video
                    ref={videoRef}
                    src={currentStory.videoUrl}
                    crossOrigin="anonymous"
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

                {/* Story Text Backdrop & Content */}
                {currentStory.text && (
                    <div style={{
                        position: 'absolute',
                        bottom: storyUser.id === currentUserId ? '80px' : '100px',
                        left: '20px',
                        right: '20px',
                        textAlign: 'center',
                        zIndex: 9,
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '12px 20px',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '500',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {currentStory.text}
                        </div>
                    </div>
                )}
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
                .story-video-container {
                    max-width: 100%;
                }
                .story-footer-container {
                    max-width: 95%;
                }
                @media (min-width: 480px) {
                    .story-video-container {
                        max-width: 450px;
                    }
                    .story-footer-container {
                        max-width: 560px;
                    }
                }
                @media (min-width: 1024px) {
                    .story-video-container {
                        max-width: 550px;
                    }
                    .story-footer-container {
                        max-width: 660px;
                    }
                }
                @media (min-width: 1440px) {
                    .story-video-container {
                        max-width: 650px;
                    }
                    .story-footer-container {
                        max-width: 760px;
                    }
                }
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
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

            {/* Footer Area (Viewer: Private Reply Style) */}
            {storyUser.id !== currentUserId && !showViewers && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        bottom: '30px',
                        left: '0',
                        right: '0',
                        padding: '0 20px',
                        display: 'flex',
                        justifyContent: 'center',
                        zIndex: 10
                    }}
                >
                    <div
                        className="story-footer-container"
                        style={{
                            width: '100%',
                            background: '#2d323e',
                            borderRadius: '40px',
                            padding: '10px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            transition: 'all 0.3s',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        {/* Attachment Icon */}
                        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
                            <Paperclip size={22} style={{ transform: 'rotate(45deg)' }} />
                        </button>

                        {/* Reply Input */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Reply privately..."
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '16px',
                                    fontWeight: '400',
                                    opacity: 0.9
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendReply();
                                    }
                                }}
                            />
                        </div>

                        {/* Right Action Icons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94a3b8', flexShrink: 0, position: 'relative' }}>
                            {/* Emoji Picker Modal */}
                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '60px', right: '0', zIndex: 100 }}>
                                    <EmojiPicker
                                        onEmojiClick={(emojiData) => {
                                            handleReact({ stopPropagation: () => { } }, emojiData.emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        theme="dark"
                                        lazyLoadEmojis={true}
                                    />
                                </div>
                            )}

                            {replyText.trim() ? (
                                <button
                                    onClick={handleSendReply}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-color)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Send size={22} fill="currentColor" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={(e) => handleReact(e, '❤️')}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Heart size={22} />
                                    </button>
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        style={{ background: 'none', border: 'none', color: showEmojiPicker ? 'var(--accent-color)' : '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Smile size={22} />
                                    </button>
                                    <button
                                        onClick={startRecording}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Mic size={22} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Recording Overlay */}
                        {isRecording && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: '#2d323e',
                                borderRadius: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 20px',
                                zIndex: 11
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-color)' }}>
                                    <div style={{ width: '8px', height: '8px', background: '#ff4d4d', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{formatTime(recordingTime)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <button
                                        onClick={cancelRecording}
                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        style={{
                                            background: 'var(--accent-color)',
                                            border: 'none',
                                            color: 'white',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Send size={18} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Viewers List Modal */}
            {
                showViewers && (
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
                )
            }
        </div >
    );
};

export default StoryViewer;
