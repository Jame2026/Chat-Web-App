
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User as UserIcon, MessageSquare } from 'lucide-react';

const UsersModal = ({ isOpen, onClose, users, onSelectUser, currentUser, theme }) => {
    const [search, setSearch] = React.useState('');

    if (!isOpen) return null;

    const filteredUsers = users.filter(u =>
        u.uid !== currentUser?.uid &&
        (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()))
    );

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
                        maxWidth: '500px',
                        maxHeight: '80vh',
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
                        backgroundColor: 'var(--bg-tertiary)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MessageSquare size={20} color="var(--accent-color)" />
                            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Directory</h2>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '16px 24px' }}>
                        <div style={{
                            position: 'relative',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 14px'
                        }}>
                            <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '10px' }} />
                            <input
                                type="text"
                                placeholder="Find people..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 12px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                    }}>
                        {filteredUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                No users found
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.uid}
                                    onClick={() => {
                                        onSelectUser(user.uid);
                                        onClose();
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '12px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        backgroundColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{
                                        width: 'var(--avatar-size-lg)',
                                        height: 'var(--avatar-size-lg)',
                                        borderRadius: '50%',
                                        backgroundImage: user.photoURL ? `url("${user.photoURL}")` : 'none',
                                        backgroundColor: 'var(--accent-color)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        marginRight: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>
                                        {!user.photoURL && (user.displayName || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{user.displayName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {user.online ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                    <button style={{
                                        padding: '8px 16px',
                                        borderRadius: '100px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--accent-color)',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        Message
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UsersModal;
