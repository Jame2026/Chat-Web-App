
import React, { useState, useMemo } from 'react';
import { Search, Plus, Users, Settings as SettingsIcon } from 'lucide-react';
import StoryRow from './StoryRow';

const Sidebar = ({
  channels, users, activeChannel, activeUser,
  onSelectUser, onOpenSettings, onOpenProfile,
  blockedUsers, userSettings, userName, userPhotoURL, userStatus,
  onOpenDirectory, onSelectChannel, onCreateGroup,
  lastMessages = {}, currentUserId,
  stories = [], onStoryClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    const diffDays = Math.floor(diffInSeconds / 86400);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Build a unified sorted list of all conversations
  const combinedList = useMemo(() => {
    const list = [];

    users.forEach(user => {
      const convId = [currentUserId, user.id].sort().join('_');
      const lastMsg = lastMessages[convId];
      list.push({
        id: user.id,
        type: 'user',
        name: userSettings[user.id]?.nickname || user.name,
        photoURL: user.photoURL,
        themeColor: userSettings[user.id]?.themeColor || 'var(--accent-color)',
        online: user.online,
        lastSeen: user.lastSeen,
        lastMsgAt: lastMsg?.createdAt || null,
        lastMsgText: lastMsg?.text || '',
        lastMsgSenderId: lastMsg?.senderId || null,
        convId,
        isBlocked: blockedUsers.includes(user.id),
      });
    });

    channels.forEach(channel => {
      const lastMsg = lastMessages[channel.id];
      list.push({
        id: channel.id,
        type: 'group',
        name: channel.name,
        photoURL: channel.photoURL,
        themeColor: channel.themeColor || 'var(--accent-color)',
        memberCount: Array.isArray(channel.members) ? channel.members.length : (channel.members || 0),
        lastMsgAt: lastMsg?.createdAt || channel.createdAt || null,
        lastMsgText: lastMsg?.text || '',
        lastMsgSenderId: lastMsg?.senderId || null,
        lastMsgSenderName: lastMsg?.senderName || '',
        convId: channel.id,
        isBlocked: false,
      });
    });

    list.sort((a, b) => {
      const aTime = a.lastMsgAt?.toDate ? a.lastMsgAt.toDate().getTime() : (a.lastMsgAt ? new Date(a.lastMsgAt).getTime() : 0);
      const bTime = b.lastMsgAt?.toDate ? b.lastMsgAt.toDate().getTime() : (b.lastMsgAt ? new Date(b.lastMsgAt).getTime() : 0);
      if (bTime !== aTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [users, channels, lastMessages, userSettings, blockedUsers, currentUserId]);

  const filtered = combinedList.filter(item => {
    const q = searchQuery.toLowerCase();
    return !q || item.name.toLowerCase().includes(q);
  });

  const isActive = (item) =>
    item.type === 'user' ? activeUser === item.id : activeChannel === item.id;

  const handleSelect = (item) => {
    if (item.type === 'user') onSelectUser(item.id);
    else onSelectChannel(item.id);
  };

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-primary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Chats</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenDirectory}
            title="People Directory"
            style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Users size={20} />
          </button>
          <button
            onClick={onCreateGroup}
            title="Create Group"
            style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
          />
        </div>
      </div>

      <StoryRow
        currentUser={{ uid: currentUserId, name: userName, photoURL: userPhotoURL }}
        users={users}
        stories={stories}
        onStoryClick={onStoryClick}
        userSettings={userSettings}
      />

      {/* Combined Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {filtered.length === 0 && searchQuery && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
            No results for &quot;{searchQuery}&quot;
          </div>
        )}

        {filtered.map(item => {
          const active = isActive(item);

          // Build preview text
          let previewText = item.lastMsgText;
          if (previewText && item.lastMsgSenderId === currentUserId) {
            previewText = `You: ${previewText}`;
          } else if (previewText && item.type === 'group' && item.lastMsgSenderName) {
            previewText = `${item.lastMsgSenderName.split(' ')[0]}: ${previewText}`;
          }

          // hasUnread = last message was from someone else (not me)
          const hasUnread = !!item.lastMsgAt && !!item.lastMsgSenderId && item.lastMsgSenderId !== currentUserId;

          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '14px',
                marginBottom: '2px',
                cursor: 'pointer',
                backgroundColor: active
                  ? 'var(--bg-tertiary)'
                  : hasUnread
                    ? 'rgba(var(--accent-color-rgb, 99,102,241), 0.07)'
                    : 'transparent',
                transition: 'background-color 0.15s',
                gap: '12px',
                borderLeft: hasUnread && !active ? '3px solid var(--accent-color)' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = hasUnread ? 'rgba(var(--accent-color-rgb, 99,102,241), 0.12)' : 'var(--bg-tertiary)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = hasUnread ? 'rgba(var(--accent-color-rgb, 99,102,241), 0.07)' : 'transparent'; }}
            >
              {/* Avatar with unread dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 'var(--avatar-size-lg)',
                  height: 'var(--avatar-size-lg)',
                  borderRadius: '50%',
                  background: item.photoURL ? `url("${item.photoURL}") center/cover` : item.themeColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '18px', fontWeight: '600',
                  boxShadow: hasUnread ? '0 0 0 2.5px var(--accent-color)' : '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {!item.photoURL && (
                    item.type === 'group'
                      ? (item.name ? item.name.charAt(0).toUpperCase() : <Users size={20} />)
                      : item.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Online dot for users */}
                {item.type === 'user' && item.online && !hasUnread && (
                  <div style={{
                    position: 'absolute', bottom: '2px', right: '2px',
                    width: '12px', height: '12px', borderRadius: '50%',
                    backgroundColor: 'var(--success-color)',
                    border: '2px solid var(--bg-primary)',
                  }} />
                )}

                {/* Pulsing unread dot — shown when there's a new incoming message */}
                {hasUnread && (
                  <div style={{
                    position: 'absolute', bottom: '0px', right: '0px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    backgroundColor: 'var(--accent-color)',
                    border: '2.5px solid var(--bg-primary)',
                    animation: 'unread-pulse 1.8s ease-in-out infinite',
                  }} />
                )}

                {/* Group badge (only when no unread) */}
                {item.type === 'group' && !hasUnread && (
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    backgroundColor: 'var(--accent-color)',
                    borderRadius: '50%', width: '16px', height: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-primary)',
                  }}>
                    <Users size={8} color="white" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  {/* Name */}
                  <div style={{
                    fontSize: '14px',
                    fontWeight: hasUnread ? '800' : '700',
                    color: item.isBlocked ? 'var(--text-secondary)' : hasUnread ? 'var(--text-primary)' : 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '140px',
                  }}>
                    {item.name}
                    {item.isBlocked && (
                      <span style={{ fontSize: '9px', marginLeft: '6px', color: '#ff4444', border: '1px solid #ff4444', padding: '0 3px', borderRadius: '4px', textTransform: 'uppercase' }}>Blocked</span>
                    )}
                  </div>

                  {/* Timestamp — accent color + bold when unread */}
                  {item.lastMsgAt && (
                    <span style={{
                      fontSize: '10px',
                      color: hasUnread ? 'var(--accent-color)' : 'var(--text-secondary)',
                      fontWeight: hasUnread ? '700' : '500',
                      flexShrink: 0,
                      marginLeft: '6px',
                    }}>
                      {formatRelativeTime(item.lastMsgAt)}
                    </span>
                  )}
                </div>

                {/* Preview row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    fontSize: '12px',
                    color: hasUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: hasUnread ? '600' : '400',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1,
                  }}>
                    {item.isBlocked
                      ? 'You blocked this user'
                      : previewText
                        ? previewText
                        : item.type === 'group'
                          ? `${item.memberCount} members`
                          : (() => {
                            const lastSeenDate = item.lastSeen?.toDate ? item.lastSeen.toDate() : new Date(item.lastSeen);
                            const isTrulyOnline = item.online && (new Date() - lastSeenDate) < 60000;
                            return isTrulyOnline ? 'Active now' : item.lastSeen ? `Active ${formatRelativeTime(item.lastSeen)} ago` : '';
                          })()
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unread pulse keyframe injected once */}
      <style>{`
        @keyframes unread-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }
      `}</style>

      {/* Self profile footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'var(--bg-primary)',
      }}>
        <div
          onClick={onOpenProfile}
          title="View My Profile"
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, gap: '12px', padding: '4px', borderRadius: '12px', transition: 'background-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: 'var(--avatar-size-lg)', height: 'var(--avatar-size-lg)', borderRadius: '50%',
            backgroundImage: userPhotoURL ? `url("${userPhotoURL}")` : 'none',
            backgroundColor: 'var(--accent-color)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: 'white', flexShrink: 0,
          }}>
            {!userPhotoURL && (userName?.charAt(0) || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
            <div style={{
              fontSize: '10px', fontWeight: '600',
              color: userStatus === 'active' ? 'var(--success-color)' : userStatus === 'away' ? '#f59e0b' : userStatus === 'busy' ? '#ef4444' : 'var(--text-secondary)',
            }}>
              {userStatus === 'active' ? 'Active Now' : userStatus === 'away' ? 'Away' : userStatus === 'busy' ? 'Do Not Disturb' : 'Invisible'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenSettings(); }}
            title="Settings"
            style={{ background: 'var(--bg-tertiary)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
