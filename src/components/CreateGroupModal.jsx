
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, Check, Camera, Plus } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, users, currentUser, onCreateGroup, theme }) => {
    const [groupName, setGroupName] = useState('');
    const [search, setSearch] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const filteredUsers = users.filter(u =>
        u.uid !== currentUser?.uid &&
        (u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const toggleUser = (user) => {
        if (selectedUsers.find(u => u.uid === user.uid)) {
            setSelectedUsers(selectedUsers.filter(u => u.uid !== user.uid));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) {
            alert("Please provide a group name and select at least one member.");
            return;
        }

        setIsCreating(true);
        try {
            await onCreateGroup({
                name: groupName.trim(),
                members: [currentUser.uid, ...selectedUsers.map(u => u.uid)],
                createdBy: currentUser.uid,
                createdAt: new Date(),
                type: 'group'
            });
            onClose();
            setGroupName('');
            setSelectedUsers([]);
        } catch (error) {
            console.error(error);
            alert("Failed to create group.");
        } finally {
            setIsCreating(false);
        }
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
                        maxWidth: '500px',
                        maxHeight: '85vh',
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
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--bg-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Plus size={18} color="var(--accent-color)" />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>New Group Chat</h2>
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
                            <X size={22} />
                        </button>
                    </div>

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                        {/* Group Name Input */}
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Group Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Enter group name..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        color: 'var(--text-primary)',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Search & Members Selection */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Add Members ({selectedUsers.length} selected)
                            </label>

                            {/* Selected Members Mini List */}
                            {selectedUsers.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    marginBottom: '12px',
                                    padding: '4px'
                                }}>
                                    {selectedUsers.map(user => (
                                        <motion.div
                                            key={user.uid}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                border: '1px solid var(--accent-color)'
                                            }}
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-color)' }}>
                                                {user.displayName || user.email.split('@')[0]}
                                            </span>
                                            <X
                                                size={14}
                                                color="var(--accent-color)"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleUser(user)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <div style={{
                                position: 'relative',
                                marginBottom: '12px'
                            }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '10px 12px 10px 40px',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <style>{`.create-group-scroll::-webkit-scrollbar { display: none; }`}</style>
                                {filteredUsers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                                        No users found
                                    </div>
                                ) : (
                                    filteredUsers.map(user => {
                                        const isSelected = selectedUsers.find(u => u.uid === user.uid);
                                        return (
                                            <div
                                                key={user.uid}
                                                onClick={() => toggleUser(user)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'transparent',
                                                    transition: 'all 0.2s',
                                                    border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none',
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold',
                                                        color: 'var(--accent-color)'
                                                    }}>
                                                        {!user.photoURL && (user.displayName || user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{user.displayName || user.email.split('@')[0]}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '22px',
                                                    height: '22px',
                                                    borderRadius: '6px',
                                                    border: `2px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                                    backgroundColor: isSelected ? 'var(--accent-color)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {isSelected && <Check size={14} color="white" />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        backgroundColor: 'var(--bg-tertiary)'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || !groupName.trim() || selectedUsers.length === 0}
                            style={{
                                padding: '10px 24px',
                                borderRadius: '12px',
                                background: 'var(--accent-color)',
                                border: 'none',
                                color: 'white',
                                fontWeight: '700',
                                cursor: (isCreating || !groupName.trim() || selectedUsers.length === 0) ? 'not-allowed' : 'pointer',
                                opacity: (isCreating || !groupName.trim() || selectedUsers.length === 0) ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isCreating ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateGroupModal;
