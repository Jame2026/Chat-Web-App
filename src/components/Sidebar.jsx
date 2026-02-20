
import React, { useState } from 'react';
import { Search, Plus, Hash, User, Users, Settings as SettingsIcon } from 'lucide-react';

const Sidebar = ({ channels, users, activeUser, onSelectUser, onOpenSettings, onOpenProfile, blockedUsers, userSettings, userName, userPhotoURL, userStatus, onOpenDirectory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredUserId, setHoveredUserId] = useState(null);

  const filteredUsers = users.filter(user => {
    const nickname = userSettings[user.id]?.nickname || '';
    return user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nickname.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = filteredUsers.length > 0 || filteredChannels.length > 0;

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Offline';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '0'
    }}>
      {/* Sidebar Header */}
      <div style={{ padding: '16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Chats</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenDirectory}
            title="People Directory"
            style={{
              background: 'var(--bg-tertiary)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={20} />
          </button>
          <button style={{
            background: 'var(--bg-tertiary)',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0 16px 16px', position: 'relative' }}>
        <div style={{
          position: 'relative',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px'
        }}>
          <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {!hasResults && searchQuery && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No results found for "{searchQuery}"
          </div>
        )}

        {/* Users List Styled like Messenger */}
        {filteredUsers.map(user => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            onMouseEnter={() => setHoveredUserId(user.id)}
            onMouseLeave={() => setHoveredUserId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: '12px',
              marginBottom: '4px',
              cursor: 'pointer',
              backgroundColor: activeUser === user.id ? 'var(--bg-tertiary)' : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredUserId === user.id ? 'scale(1.02) translateY(-2px)' : 'scale(1) translateY(0)',
              boxShadow: hoveredUserId === user.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', marginRight: '12px' }}>
              <div style={{
                width: 'var(--avatar-size-lg)',
                height: 'var(--avatar-size-lg)',
                borderRadius: '50%',
                background: user.photoURL ? `url(${user.photoURL}) center/cover` : (userSettings[user.id]?.themeColor || 'var(--accent-color)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                {!user.photoURL && (userSettings[user.id]?.nickname || user.name).charAt(0).toUpperCase()}
              </div>
              {user.online && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-color)',
                  border: '2px solid var(--bg-primary)'
                }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: blockedUsers.includes(user.id) ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                {userSettings[user.id]?.nickname || user.name}
                {blockedUsers.includes(user.id) && <span style={{ fontSize: '10px', marginLeft: '8px', color: '#ff4444', border: '1px solid #ff4444', padding: '0 4px', borderRadius: '4px', textTransform: 'uppercase' }}>Blocked</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(() => {
                  if (blockedUsers.includes(user.id)) return 'You have blocked this user';

                  // Verification: Check if heartbeat is recent (within 60s)
                  const lastSeenDate = user.lastSeen?.toDate ? user.lastSeen.toDate() : new Date(user.lastSeen);
                  const isTrulyOnline = user.online && (new Date() - lastSeenDate) < 60000;

                  return isTrulyOnline ? 'Active now' : `Active ${formatRelativeTime(user.lastSeen)}`;
                })()}
              </div>
            </div>
          </div>
        ))}

        {/* Channels removed as requested */}
      </div>

      {/* User Profile at Bottom */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div
          onClick={onOpenProfile}
          title="View My Profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flex: 1,
            gap: '12px',
            padding: '4px',
            borderRadius: '12px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: 'var(--avatar-size-lg)',
            height: 'var(--avatar-size-lg)',
            borderRadius: '50%',
            backgroundImage: userPhotoURL ? `url("${userPhotoURL}")` : 'none',
            backgroundColor: 'var(--accent-color)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0
          }}>
            {!userPhotoURL && (userName?.charAt(0) || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
            <div style={{
              fontSize: '10px', color:
                userStatus === 'active' ? 'var(--success-color)' :
                  userStatus === 'away' ? '#f59e0b' :
                    userStatus === 'busy' ? '#ef4444' :
                      'var(--text-secondary)',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {userStatus === 'active' ? 'Active Now' :
                userStatus === 'away' ? 'Away' :
                  userStatus === 'busy' ? 'Do Not Disturb' :
                    'Invisible'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
            title="Settings"
            style={{
              background: 'var(--bg-tertiary)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
