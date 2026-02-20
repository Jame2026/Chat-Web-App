
import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Smile, MoreHorizontal, ArrowLeft, Trash2, User, Heart, Pencil, Check, X as CloseIcon, Mic, Square, Play, Pause, Volume2, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';

const ChatArea = ({ activeConversation, messages, onSendMessage, onBack, theme, isBlocked, isBlockedByThem, onToggleBlock, onOpenUserSettings, themeColor, wallpaper, onDeleteMessage, onReaction, onEditMessage, onClearChat, onViewProfile, currentUserId }) => {
    const [inputValue, setInputValue] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const moreMenuRef = useRef(null);
    const [hoveredMessageId, setHoveredMessageId] = useState(null);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
    const fileInputRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const recordingIntervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const startTimeRef = useRef(0);
    const isRecordingCancelled = useRef(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [currentTime, setCurrentTime] = useState(Date.now());
    const scheduleButtonRef = useRef(null);


    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'Recently';
        try {
            const date = (timestamp && typeof timestamp.toDate === 'function') ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'Recently';
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) return 'Just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return 'Recently';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
                setReactionPickerMessageId(null);
            }
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update current time every 30 seconds to refresh message visibility
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
        return () => clearInterval(interval);
    }, []);

    // Close schedule picker when clicking outside
    useEffect(() => {
        const handleClickOutsideSchedule = (event) => {
            if (scheduleButtonRef.current && !scheduleButtonRef.current.contains(event.target)) {
                // Check if the click is inside the popover itself (which might be rendered outside if using Portal, but here it's inline)
                // For simplified logic, assume inline rendering
                setShowSchedule(false);
            }
        };
        if (showSchedule) {
            document.addEventListener('mousedown', handleClickOutsideSchedule);
        }
        return () => document.removeEventListener('mousedown', handleClickOutsideSchedule);
    }, [showSchedule]);

    const handleSend = () => {
        if (inputValue.trim()) {
            let scheduleDateObj = null;
            if (scheduledDate) {
                scheduleDateObj = new Date(scheduledDate);
            }
            onSendMessage(inputValue, null, null, scheduleDateObj);
            setInputValue('');
            setShowEmojiPicker(false);
            setScheduledDate('');
            setShowSchedule(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const onEmojiClick = (emojiData) => {
        if (reactionPickerMessageId) {
            onReaction(reactionPickerMessageId, emojiData.emoji);
            setReactionPickerMessageId(null);
            setShowEmojiPicker(false);
        } else {
            setInputValue((prev) => prev + emojiData.emoji);
        }
    };

    const startEditing = (msg) => {
        setEditingMessageId(msg.id);
        setEditValue(msg.text);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditValue('');
    };

    const saveEdit = (msgId) => {
        if (editValue.trim()) {
            onEditMessage(msgId, editValue);
        }
        cancelEditing();
    };

    const handleEditKeyPress = (e, msgId) => {
        if (e.key === 'Enter') saveEdit(msgId);
        if (e.key === 'Escape') cancelEditing();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // We pass the file up to App.jsx to handle the storage upload
            // Since ChatArea doesn't have storage access directly passed as prop but App does
            await onSendMessage("", file); // Pass empty text and the file
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to send image");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const startRecording = async () => {
        console.log("🎤 startRecording called");
        isRecordingCancelled.current = false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Detect supported MIME type (prefer Opus for better compression)
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/ogg';

            console.log("🎤 Mic access granted. MIME:", mimeType);

            // Use 32kbps for faster upload (sufficient for voice)
            const options = { mimeType, audioBitsPerSecond: 32000 };
            const recorder = new MediaRecorder(stream, options);
            setMediaRecorder(recorder);
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                // Stop mic tracks immediately so the user knows recording is done
                stream.getTracks().forEach(track => track.stop());

                if (isRecordingCancelled.current) {
                    console.log("🎤 Recording cancelled by user.");
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                console.log("🎤 Final Blob Size:", audioBlob.size);

                // Calculate duration
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000) || 0;

                if (audioBlob.size < 100) {
                    alert("Recording was too short or empty. Please try again.");
                    return;
                }

                setIsUploading(true);
                try {
                    await onSendMessage("", null, audioBlob, null, duration);
                } catch (err) {
                    console.error("Voice send error:", err);
                    alert(`Failed to send: ${err.message}`);
                } finally {
                    setIsUploading(false);
                }
            };

            startTimeRef.current = Date.now();
            recorder.start(200); // 200ms timeslice ensures dataavailable fires frequently
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            console.log("🎤 Recorder started with 200ms timeslice");
        } catch (error) {
            console.error("❌ Error in startRecording:", error);
            if (error.name === 'NotAllowedError' || error.message.toLowerCase().includes('permission')) {
                alert("⚠️ Microphone blocked. Please click the 🔒 lock icon in your browser address bar and choose 'Allow' for Microphone.");
            } else {
                alert("Microphone error: " + error.message);
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        console.log("🎤 Cancelling recording...");
        isRecordingCancelled.current = true;
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
        audioChunksRef.current = [];
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const VoicePlayer = ({ url, isMe, initialDuration }) => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const [duration, setDuration] = useState(initialDuration || 0);
        const audioRef = useRef(null);

        if (!audioRef.current) {
            audioRef.current = new Audio(url);
        }

        useEffect(() => {
            const audio = new Audio(url);
            audioRef.current = audio;

            const updateProgress = () => setProgress(audio.currentTime);
            const onLoadedMetadata = () => {
                if (audio.duration && Number.isFinite(audio.duration)) {
                    setDuration(audio.duration);
                }
            };
            const onEnded = () => {
                setIsPlaying(false);
                setProgress(0);
            };

            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('loadedmetadata', onLoadedMetadata);
            audio.addEventListener('ended', onEnded);

            // Handle cases where duration is metadata might already be available
            if (audio.readyState >= 1 && Number.isFinite(audio.duration)) {
                setDuration(audio.duration);
            }

            return () => {
                audio.pause();
                audio.removeEventListener('timeupdate', updateProgress);
                audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                audio.removeEventListener('ended', onEnded);
            };
        }, [url]);

        const togglePlay = () => {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(err => console.error("Playback failed:", err));
            }
            setIsPlaying(!isPlaying);
        };

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '220px',
                padding: '4px 0',
                userSelect: 'none'
            }}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'var(--accent-color)',
                        border: isMe ? '1px solid rgba(255,255,255,0.3)' : 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
                </motion.button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                            Voice message
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7 }}>
                            <Volume2 size={12} />
                            <span style={{ fontSize: '10px' }}>{formatTime(Math.floor(duration || 0))}</span>
                        </div>
                    </div>
                    <div style={{
                        height: '6px',
                        backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                        borderRadius: '3px',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer'
                    }} onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const pct = x / rect.width;
                        audioRef.current.currentTime = pct * audioRef.current.duration;
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${(progress / (duration || 1)) * 100}%`,
                            backgroundColor: isMe ? '#fff' : 'var(--accent-color)',
                            transition: 'width 0.1s linear',
                            borderRadius: '3px'
                        }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
            {/* Header */}
            <div style={{
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-primary)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                minHeight: '64px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        className="back-button"
                        onClick={onBack}
                        style={{
                            marginRight: '12px',
                            padding: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={22} color="var(--accent-color)" />
                    </button>

                    <div style={{
                        width: 'var(--avatar-size-lg)',
                        height: 'var(--avatar-size-lg)',
                        borderRadius: '50%',
                        background: activeConversation?.photoURL ? `url(${activeConversation.photoURL}) center/cover` : (activeConversation?.themeColor || 'var(--accent-color)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                    }}>
                        {!activeConversation?.photoURL && (activeConversation?.nickname || activeConversation?.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                            {activeConversation?.nickname || activeConversation?.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {(() => {
                                if (activeConversation?.type === 'channel') return `${activeConversation.members || 0} members`;

                                // Heartbeat verification
                                const lastSeenDate = activeConversation?.lastSeen?.toDate ? activeConversation.lastSeen.toDate() : new Date(activeConversation?.lastSeen);
                                const isTrulyOnline = activeConversation?.online && (new Date() - lastSeenDate) < 60000;

                                return isTrulyOnline ? 'Active now' : `Active ${formatRelativeTime(activeConversation?.lastSeen)}`;
                            })()}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '8px' }}
                    >
                        <MoreHorizontal size={24} />
                    </button>

                    <AnimatePresence>
                        {showMoreMenu && (
                            <motion.div
                                ref={moreMenuRef}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    minWidth: '150px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    zIndex: 100
                                }}
                            >
                                {activeConversation.type === 'user' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                onViewProfile();
                                                setShowMoreMenu(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                textAlign: 'left',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            className="menu-item"
                                        >
                                            <User size={16} />
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                onOpenUserSettings();
                                                setShowMoreMenu(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                textAlign: 'left',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                            className="menu-item"
                                        >
                                            Settings
                                        </button>
                                        <button
                                            onClick={() => {
                                                onToggleBlock();
                                                setShowMoreMenu(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                textAlign: 'left',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: isBlocked ? 'var(--accent-color)' : '#ff4444',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            className="menu-item"
                                        >
                                            <Shield size={16} />
                                            {isBlocked ? 'Unblock User' : 'Block User'}
                                        </button>
                                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to clear this entire chat history?')) {
                                                    onClearChat();
                                                    setShowMoreMenu(false);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '8px 12px',
                                                textAlign: 'left',
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#ff4444',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            className="menu-item"
                                        >
                                            <Trash2 size={16} />
                                            Clear Chat
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {/* Messages Area with Wallpaper */}
            <div style={{
                flex: 1,
                padding: '16px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                background: wallpaper || 'var(--bg-primary)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
            }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <AnimatePresence>
                        {(() => {
                            const lastMyMessageId = messages.slice().reverse().find(m => m.senderId === currentUserId)?.id;
                            const isThreadLastMessageMine = messages.length > 0 && messages[messages.length - 1].senderId === currentUserId;
                            return messages.map((msg) => {
                                const isMe = msg.senderId === currentUserId;

                                // Check for scheduled status
                                const scheduledMs = msg.scheduledAt?.toDate ? msg.scheduledAt.toDate().getTime() : (msg.scheduledAt ? new Date(msg.scheduledAt).getTime() : 0);
                                const isScheduled = msg.status === 'scheduled' && scheduledMs > currentTime;

                                // Hide scheduled messages from recipient until ready
                                if (isScheduled && !isMe) return null;

                                const isMediaOnly = (msg.imageURL || msg.videoURL) && !msg.text && !msg.voiceURL;

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: isMe ? 20 : -20 }}
                                        transition={{ duration: 0.2 }}
                                        onMouseEnter={() => {
                                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                            hoverTimeoutRef.current = setTimeout(() => {
                                                setHoveredMessageId(msg.id);
                                            }, 2000);
                                        }}
                                        onMouseLeave={() => {
                                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                            setHoveredMessageId(null);
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            marginBottom: '8px',
                                            position: 'relative',
                                            paddingRight: isMe ? '0' : '40px',
                                            paddingLeft: isMe ? '40px' : '0'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                            alignItems: 'flex-end',
                                            maxWidth: '90%',
                                            gap: '8px',
                                            position: 'relative'
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: 'var(--avatar-size-sm)',
                                                height: 'var(--avatar-size-sm)',
                                                borderRadius: '50%',
                                                backgroundImage: msg.senderPhotoURL ? `url("${msg.senderPhotoURL}")` : 'none',
                                                backgroundColor: msg.senderThemeColor || (isMe ? (themeColor || 'var(--accent-color)') : 'var(--bg-tertiary)'),
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                                marginBottom: '4px',
                                                color: '#ffffff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {!msg.senderPhotoURL && (isMe ? 'Me' : (msg.senderName || 'Other')).charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                {!isMe && (
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        marginBottom: '4px',
                                                        marginLeft: '4px',
                                                        fontWeight: '600',
                                                        opacity: 0.9
                                                    }}>
                                                        {msg.senderName || 'Other'}
                                                    </div>
                                                )}
                                                <div
                                                    className={`premium-bubble ${isMe ? 'premium-bubble-me' : 'premium-bubble-other'}`}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.15)';
                                                        if (!isMediaOnly) e.currentTarget.style.animation = 'bubble-glow 2s infinite ease-in-out';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                                        e.currentTarget.style.animation = 'none';
                                                    }}
                                                    style={{
                                                        padding: isMediaOnly ? '0' : '10px 14px',
                                                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: isMediaOnly ? 'transparent' : (isMe
                                                            ? `linear-gradient(135deg, ${themeColor || 'var(--bubble-me)'} 0%, ${themeColor ? themeColor + 'dd' : 'var(--accent-hover)'} 100%)`
                                                            : 'var(--bubble-other)'),
                                                        backdropFilter: (!isMe && !isMediaOnly) ? 'blur(8px)' : 'none',
                                                        border: (!isMe && !isMediaOnly) ? '1px solid var(--border-color)' : 'none',
                                                        color: isMe ? '#ffffff' : 'var(--text-primary)',
                                                        fontSize: '14px',
                                                        lineHeight: '1.4',
                                                        boxShadow: isMediaOnly ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                                                        wordWrap: 'break-word',
                                                        overflowWrap: 'break-word',
                                                        position: 'relative',
                                                        minWidth: editingMessageId === msg.id ? '220px' : 'auto',
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    {isScheduled && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: isMe ? 'rgba(255,255,255,0.9)' : 'var(--accent-color)',
                                                            marginBottom: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontStyle: 'italic',
                                                            fontWeight: 'bold',
                                                            backgroundColor: 'rgba(0,0,0,0.1)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            width: 'fit-content'
                                                        }}>
                                                            <Clock size={12} />
                                                            Scheduled: {new Date(scheduledMs).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    {msg.voiceURL && (
                                                        <div style={{ marginBottom: msg.text ? '8px' : '0' }}>
                                                            <VoicePlayer url={msg.voiceURL} isMe={isMe} initialDuration={msg.audioDuration} />
                                                        </div>
                                                    )}
                                                    {msg.videoURL && (
                                                        <div style={{ marginBottom: msg.text || msg.voiceURL || msg.imageURL ? '8px' : '0' }}>
                                                            <video
                                                                src={msg.videoURL}
                                                                controls
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: '850px',
                                                                    borderRadius: '12px',
                                                                    display: 'block',
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.imageURL && (
                                                        <div style={{ marginBottom: msg.text || msg.voiceURL || msg.videoURL ? '8px' : '0' }}>
                                                            <img
                                                                src={msg.imageURL}
                                                                alt="Attached"
                                                                style={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: '850px',
                                                                    borderRadius: '12px',
                                                                    display: 'block',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => window.open(msg.imageURL, '_blank')}
                                                            />
                                                        </div>
                                                    )}
                                                    {editingMessageId === msg.id ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <input
                                                                autoFocus
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => handleEditKeyPress(e, msg.id)}
                                                                style={{
                                                                    width: '100%',
                                                                    background: 'rgba(255,255,255,0.2)',
                                                                    border: 'none',
                                                                    borderRadius: '8px',
                                                                    padding: '6px 10px',
                                                                    color: '#fff',
                                                                    outline: 'none',
                                                                    fontSize: '14px'
                                                                }}
                                                            />
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                                <button onClick={cancelEditing} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.8, cursor: 'pointer' }}><CloseIcon size={14} /></button>
                                                                <button onClick={() => saveEdit(msg.id)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Check size={14} /></button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {msg.text}
                                                            {msg.edited && (
                                                                <span style={{
                                                                    fontSize: '10px',
                                                                    opacity: 0.6,
                                                                    marginLeft: '6px',
                                                                    fontStyle: 'italic',
                                                                    display: 'inline-block',
                                                                    verticalAlign: 'middle'
                                                                }}>(edited)</span>
                                                            )}
                                                        </>
                                                    )}
                                                    {/* Reactions Display */}
                                                    {msg.reactions && Object.keys(msg.reactions).some(emoji => msg.reactions[emoji].length > 0) && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '-12px',
                                                            [isMe ? 'right' : 'left']: '4px',
                                                            display: 'flex',
                                                            gap: '2px',
                                                            zIndex: 2
                                                        }}>
                                                            {Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                                                                <motion.div
                                                                    key={emoji}
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    style={{
                                                                        backgroundColor: 'var(--bg-secondary)',
                                                                        border: '1px solid var(--border-color)',
                                                                        borderRadius: '10px',
                                                                        padding: '1px 4px',
                                                                        fontSize: '10px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '2px',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                        cursor: 'default'
                                                                    }}
                                                                >
                                                                    <span>{emoji}</span>
                                                                    {users.length > 1 && <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{users.length}</span>}
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons (Pencil/Reactions) */}
                                            {hoveredMessageId === msg.id && (
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '4px',
                                                    alignItems: 'center',
                                                    paddingBottom: '20px'
                                                }}>
                                                    {!isMe && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.8, x: isMe ? 5 : -5 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            style={{
                                                                display: 'flex',
                                                                gap: '4px',
                                                                backgroundColor: 'var(--bg-secondary)',
                                                                padding: '4px 8px',
                                                                borderRadius: '20px',
                                                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                                                border: '1px solid var(--border-color)',
                                                                zIndex: 5
                                                            }}
                                                        >
                                                            {['❤️', '😂', '👍', '😮', '😢', '🔥', '✨', '👏'].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => onReaction(msg.id, emoji)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        fontSize: '18px',
                                                                        cursor: 'pointer',
                                                                        padding: '2px',
                                                                        transition: 'transform 0.1s',
                                                                        opacity: msg.reactions?.[emoji]?.includes(currentUserId) ? 1 : 0.7
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    setReactionPickerMessageId(msg.id);
                                                                    setShowEmojiPicker(true);
                                                                }}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    fontSize: '16px',
                                                                    cursor: 'pointer',
                                                                    padding: '2px',
                                                                    color: 'var(--text-secondary)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                            >
                                                                +
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                    {isMe && (
                                                        <motion.button
                                                            initial={{ opacity: 0, scale: 0.8, x: 5 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            onClick={() => startEditing(msg)}
                                                            style={{
                                                                background: 'var(--bg-tertiary)',
                                                                border: 'none',
                                                                color: 'var(--text-secondary)',
                                                                padding: '6px',
                                                                borderRadius: '50%',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                        >
                                                            <Pencil size={14} />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            )}
                                            {isMe && msg.id === lastMyMessageId && isThreadLastMessageMine && msg.status === 'seen' && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{
                                                        alignSelf: 'flex-end',
                                                        marginRight: '4px',
                                                        marginTop: '2px'
                                                    }}
                                                    title={`Seen by ${activeConversation?.nickname || activeConversation?.name}`}
                                                >
                                                    <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '50%',
                                                        backgroundImage: activeConversation?.photoURL ? `url("${activeConversation.photoURL}")` : 'none',
                                                        backgroundColor: activeConversation?.themeColor || 'var(--accent-color)',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '8px',
                                                        fontWeight: '800',
                                                        color: 'white',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                        border: '1px solid var(--bg-primary)'
                                                    }}>
                                                        {!activeConversation?.photoURL && (activeConversation?.nickname || activeConversation?.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            });
                        })()}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Sending Overlay */}
                <AnimatePresence>
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            style={{
                                position: 'sticky',
                                bottom: '10px',
                                right: '0',
                                alignSelf: 'flex-end',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 5,
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                fontWeight: '600',
                                backdropFilter: 'blur(8px)',
                                marginBottom: '10px'
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ width: '16px', height: '16px', border: '2px solid var(--accent-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
                            />
                            Sending content...
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Emoji Picker Popover */}
            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div
                        ref={emojiPickerRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '24px',
                            zIndex: 100,
                            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    >
                        <EmojiPicker
                            theme={theme}
                            onEmojiClick={onEmojiClick}
                            width={320}
                            height={400}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Schedule Picker Popover */}
            <AnimatePresence>
                {showSchedule && (
                    <motion.div
                        ref={scheduleButtonRef}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '70px',
                            zIndex: 100,
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            padding: '16px',
                            width: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} />
                                Schedule Message
                            </h3>
                            <button onClick={() => setShowSchedule(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <CloseIcon size={16} />
                            </button>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Pick a time to send this message:
                        </div>

                        <input
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                outline: 'none',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    d.setHours(9, 0, 0, 0);
                                    const offset = d.getTimezoneOffset() * 60000;
                                    const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
                                    setScheduledDate(localISOTime);
                                }}
                                style={{
                                    flex: 1,
                                    fontSize: '11px',
                                    padding: '8px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                            >
                                Tmrw 9:00 AM
                            </button>
                            <button
                                onClick={() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    d.setHours(13, 0, 0, 0);
                                    const offset = d.getTimezoneOffset() * 60000;
                                    const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16);
                                    setScheduledDate(localISOTime);
                                }}
                                style={{
                                    flex: 1,
                                    fontSize: '11px',
                                    padding: '8px',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-primary)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                            >
                                Tmrw 1:00 PM
                            </button>
                        </div>
                        {scheduledDate && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSend()}
                                style={{
                                    marginTop: '8px',
                                    padding: '10px 12px',
                                    background: 'var(--gradient-primary, linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover, var(--accent-color)) 100%))',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(var(--accent-rgb, 0,0,0), 0.3)'
                                }}
                            >
                                <Clock size={14} />
                                Schedule Send
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input and Blocked Overlay */}
            <div style={{ padding: '12px 24px 24px', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
                {isBlocked ? (
                    <div style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        border: '1px solid var(--border-color)'
                    }}>
                        You have blocked this user. <button onClick={onToggleBlock} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}>Unblock</button> to send messages.
                    </div>
                ) : isBlockedByThem ? (
                    <div style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        border: '1px solid var(--border-color)'
                    }}>
                        This user has blocked you. You cannot send messages to them.
                    </div>
                ) : (
                    <div style={{
                        position: 'relative',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '24px',
                        padding: '2px 10px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {isRecording ? (
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '24px',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                                    <motion.div
                                        animate={{ opacity: [1, 0.4, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}
                                    />
                                    <span style={{ fontWeight: '600', fontSize: '13px' }}>Recording... {formatTime(recordingTime)}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={cancelRecording}
                                        disabled={isUploading}
                                        title="Cancel Recording"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#ef4444',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            cursor: isUploading ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        disabled={isUploading}
                                        title="Send Voice Message"
                                        style={{
                                            background: isUploading ? 'var(--text-secondary)' : '#ef4444',
                                            border: 'none',
                                            color: 'white',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            cursor: isUploading ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                                        }}
                                    >
                                        {isUploading ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                                style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
                                            />
                                        ) : (
                                            <Send size={18} fill="white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    style={{
                                        padding: '8px',
                                        background: 'none',
                                        border: 'none',
                                        color: isUploading ? 'var(--text-secondary)' : 'var(--accent-color)',
                                        cursor: isUploading ? 'default' : 'pointer'
                                    }}
                                >
                                    <FileText size={20} />
                                </button>
                                <button
                                    onClick={() => setShowSchedule(!showSchedule)}
                                    title="Schedule message"
                                    style={{
                                        padding: '8px',
                                        background: 'none',
                                        border: 'none',
                                        color: (showSchedule || scheduledDate) ? 'var(--accent-color)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    <Clock size={20} />
                                    {scheduledDate && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '6px',
                                            right: '6px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--accent-color)',
                                            border: '1px solid var(--bg-tertiary)'
                                        }} />
                                    )}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*,video/*"
                                />
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Aa"
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        padding: '8px 4px',
                                        outline: 'none',
                                        resize: 'none',
                                        height: '36px',
                                        fontFamily: 'inherit',
                                        minWidth: 0,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                />
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    style={{
                                        padding: '8px',
                                        background: 'none',
                                        border: 'none',
                                        color: themeColor || 'var(--accent-color)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Smile size={20} />
                                </button>
                                {inputValue.trim() ? (
                                    <button
                                        onClick={handleSend}
                                        style={{
                                            padding: '8px',
                                            background: 'none',
                                            border: 'none',
                                            color: themeColor || 'var(--accent-color)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Send size={20} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        style={{
                                            padding: '8px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--accent-color)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        <Mic size={20} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default ChatArea;
