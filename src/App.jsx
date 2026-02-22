
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import UserSettingsModal from './components/UserSettingsModal';
import ProfileModal from './components/ProfileModal';
import UsersModal from './components/UsersModal';
import CreateGroupModal from './components/CreateGroupModal';
import GroupMembersModal from './components/GroupMembersModal';
import ImageEditorModal from './components/ImageEditorModal';
import Auth from './components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

import { auth, db, storage } from './firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch, collection, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { sendMessage, subscribeToMessages, subscribeToUsers, toggleReaction, editMessage, setSharedTheme, subscribeToSharedTheme, subscribeToAllMessages, markAsSeen, toggleBlockUser, kickUserFromGroup, leaveGroup, updateGroupMetadata, deleteMessage } from './services/firebaseService';
import { Bell } from 'lucide-react';
import { useRef, useMemo } from 'react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [theme, setTheme] = useState(() => localStorage.getItem('chat-app-theme') || 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userBio, setUserBio] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [userInstagram, setUserInstagram] = useState('');
  const [userTelegram, setUserTelegram] = useState('');
  const [userLink, setUserLink] = useState('');
  const [userFacebook, setUserFacebook] = useState('');
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [currentSharedTheme, setCurrentSharedTheme] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [isUsersDirectoryOpen, setIsUsersDirectoryOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [userSettings, setUserSettings] = useState({});
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeNotification, setActiveNotification] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [groupMembersTab, setGroupMembersTab] = useState('members');
  const [channels, setChannels] = useState([]);
  const sessionStartTime = useRef(Date.now());

  useEffect(() => {
    if (currentUser) {
      const userSettingsRef = doc(db, 'users', currentUser.uid, 'settings', 'profiles');
      const unsubscribe = onSnapshot(userSettingsRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserSettings(docSnap.data());
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  const [userStatus, setUserStatus] = useState('active');
  const [userPhotoURL, setUserPhotoURL] = useState('');
  const [userWallpaper, setUserWallpaper] = useState('');

  // Fetch Current User Profile Data (Name, Bio, Status)
  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.displayName || currentUser.displayName || 'User');
        setUserBio(data.bio || '');
        setUserPhotoURL(data.photoURL || currentUser.photoURL || '');
        setUserLocation(data.location || '');
        setUserInstagram(data.instagram || '');
        setUserTelegram(data.telegram || '');
        setUserLink(data.link || '');
        setUserFacebook(data.facebook || '');
        if (data.status) setUserStatus(data.status);
        if (data.wallpaper) setUserWallpaper(data.wallpaper);
        if (data.blockedUsers) setBlockedUsers(data.blockedUsers);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || user.email);
        setAuthLoading(false);
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            online: true,
            lastSeen: serverTimestamp()
          });
        } catch (err) {
          console.error("Error updating online status:", err);
        }
      } else {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Presence & Heartbeat Tracking
  useEffect(() => {
    if (!currentUser) return;

    const setOnline = async () => {
      if (!currentUser?.uid) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          online: true,
          lastSeen: serverTimestamp()
        });
      } catch (e) {
        // Ignore permission-denied errors which are common during auth state changes
        if (e.code !== 'permission-denied') {
          console.error("Error updating online status:", e);
        }
      }
    };

    if (currentUser?.uid) {
      setOnline();
    }

    const heartbeat = setInterval(() => {
      if (currentUser?.uid) setOnline();
    }, 30000);

    const setOffline = async () => {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          online: false,
          lastSeen: serverTimestamp()
        });
      } catch (e) { console.error(e); }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') setOnline();
    };

    window.addEventListener('beforeunload', setOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', setOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Update User Settings In Firestore
  const updateUserSettings = async (friendId, settings) => {
    if (!currentUser) return;

    const newSettings = {
      ...userSettings,
      [friendId]: { ...(userSettings[friendId] || {}), ...settings }
    };

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'profiles'), newSettings);
      setUserSettings(newSettings);

      if (settings.themeColor || settings.wallpaper !== undefined) {
        const convId = [currentUser.uid, friendId].sort().join('_');
        await setSharedTheme(convId, {
          themeColor: settings.themeColor,
          wallpaper: settings.wallpaper
        });
      }
    } catch (error) {
      console.error("Error updating friend settings:", error);
    }
  };

  // Subscribe to all users
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToUsers(setUsers);
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const q = query(
        collection(db, 'groups'),
        where('members', 'array-contains', currentUser.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedGroups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setChannels(fetchedGroups);
      }, (error) => {
        console.error("Group fetch error:", error);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const conversationId = activeChannel || (activeUser ? [currentUser.uid, activeUser].sort().join('_') : 'general');
      const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
        setMessages(newMessages);
        // Mark as seen if we are looking at the conversation and window is active
        if (document.visibilityState === 'visible') {
          markAsSeen(conversationId, currentUser.uid);
        }
      });
      return () => unsubscribe();
    }
  }, [activeChannel, activeUser, currentUser]);

  // Handle marking as seen when window becomes visible or conversation changes
  useEffect(() => {
    const triggerMarkAsSeen = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        const conversationId = activeChannel || (activeUser ? [currentUser.uid, activeUser].sort().join('_') : 'general');
        markAsSeen(conversationId, currentUser.uid);
      }
    };

    triggerMarkAsSeen(); // Call immediately on change

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') triggerMarkAsSeen();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeChannel, activeUser, currentUser]);

  useEffect(() => {
    let unsubscribe = () => { };
    if (!currentUser) return;

    let convId = null;
    if (activeChannel) convId = activeChannel;
    else if (activeUser) convId = [currentUser.uid, activeUser].sort().join('_');

    if (convId) unsubscribe = subscribeToSharedTheme(convId, setCurrentSharedTheme);
    else setCurrentSharedTheme(null);
    return () => unsubscribe();
  }, [activeChannel, activeUser, currentUser]);

  // Global Notification Listener
  useEffect(() => {
    if (currentUser) {
      if (Notification.permission === 'default') Notification.requestPermission();

      const unsubscribe = subscribeToAllMessages((msg) => {
        if (msg.senderId === currentUser.uid) return;
        const isPrivateForMe = msg.conversationId.includes(currentUser.uid);
        const isPublicChannel = ['general', 'random', 'design', 'development'].includes(msg.conversationId);
        if (!isPrivateForMe && !isPublicChannel) return;

        const msgTime = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : Date.now();
        if (msgTime < sessionStartTime.current - 2000) return;

        const currentChatId = activeChannel || (activeUser ? [currentUser.uid, activeUser].sort().join('_') : null);
        if (msg.conversationId === currentChatId && document.visibilityState === 'visible') return;

        const sender = users.find(u => u.uid === msg.senderId);
        const senderName = sender?.displayName || sender?.email?.split('@')[0] || 'Someone';

        setActiveNotification({
          ...msg,
          senderName,
          senderPhoto: sender?.photoURL
        });

        setTimeout(() => setActiveNotification(null), 5000);

        if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
          const systemNotif = new Notification(`New message from ${senderName}`, {
            body: msg.text || "📷 Sent an image",
            icon: sender?.photoURL || '/logo192.png',
            tag: msg.senderId
          });

          systemNotif.onclick = () => {
            window.focus();
            handleSelectUser(msg.senderId);
            systemNotif.close();
          };
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser, users, activeChannel, activeUser]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileView('chat');
    };
    if (window.innerWidth <= 768) setMobileView('list');
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleViewProfile = (userObj) => {
    if (!userObj) return;

    // Safety guard: Don't open profile for channels/groups
    if (userObj.type === 'channel') {
      return;
    }

    const isMe =
      (userObj.uid === currentUser?.uid) ||
      (userObj.id === currentUser?.uid) ||
      (userObj === currentUser);

    if (isMe) {
      setProfileUser({
        ...currentUser,
        displayName: userName,
        photoURL: userPhotoURL,
        bio: userBio,
        status: userStatus,
        wallpaper: userWallpaper,
        location: userLocation,
        instagram: userInstagram,
        telegram: userTelegram,
        link: userLink,
        facebook: userFacebook
      });
    } else {
      setProfileUser(userObj);
    }
    setIsProfileOpen(true);
  };

  useEffect(() => {
    localStorage.setItem('chat-app-theme', theme);
  }, [theme]);

  const handleCreateGroup = async (groupData) => {
    try {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...groupData,
        createdAt: serverTimestamp()
      });
      handleSelectChannel(docRef.id);
      setMobileView('chat');
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  };

  const handleKickUser = async (userId) => {
    if (!activeChannel) return;
    try {
      await kickUserFromGroup(activeChannel, userId);
    } catch (error) {
      console.error("Error kicking user:", error);
      alert("Failed to kick user.");
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeChannel || !currentUser) return;
    try {
      await leaveGroup(activeChannel, currentUser.uid);
      setActiveChannel(null);
      setMobileView('list');
    } catch (error) {
      console.error("Error leaving group:", error);
      alert("Failed to leave group.");
    }
  };

  const handleUpdateGroup = async (groupId, updateData) => {
    try {
      let finalUpdate = { ...updateData };

      // Handle photo upload if a file is provided
      if (updateData.photoFile) {
        const file = updateData.photoFile;
        let compressedBlob;
        try {
          compressedBlob = await compressImage(file);
        } catch {
          compressedBlob = file;
        }

        const fileName = `group_photo_${Date.now()}.jpg`;
        const storageRef = ref(storage, `groups/${groupId}/${fileName}`);
        const uploadTask = await uploadBytes(storageRef, compressedBlob);
        const downloadURL = await getDownloadURL(uploadTask.ref);

        finalUpdate.photoURL = downloadURL;
        delete finalUpdate.photoFile;
      }

      await updateGroupMetadata(groupId, finalUpdate);
    } catch (error) {
      console.error("Error updating group:", error);
      alert("Failed to update group information.");
      throw error;
    }
  };

  const handleUpdateName = async (newName) => {
    if (!currentUser) return;
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: newName }, { merge: true });
      setUserName(newName);
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleUpdateBio = async (newBio) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { bio: newBio });
      setUserBio(newBio);
    } catch (error) {
      console.error("Error updating bio:", error);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(new Error("Image load failed: " + err));
      };
      reader.onerror = (err) => reject(new Error("FileReader failed: " + err));
    });
  };

  const handleUpdatePhoto = async (file) => {
    if (!currentUser || !file) {
      console.log("❌ No user or file provided");
      alert("Please sign in to upload a photo");
      return;
    }

    console.log("📸 Starting photo upload...", { fileName: file.name, fileSize: file.size, fileType: file.type });
    console.log("👤 Current user:", currentUser.uid, currentUser.email);

    try {
      console.log("🔄 Compressing image...");
      let compressedBlob;
      try {
        compressedBlob = await compressImage(file);
        console.log("✅ Image compressed", { originalSize: file.size, compressedSize: compressedBlob.size });
      } catch (compErr) {
        console.error("Compression failed, falling back to original file:", compErr);
        compressedBlob = file; // Fallback to original file
      }

      console.log("⬆️ Uploading to Firebase Storage...");
      const fileName = `avatar_${Date.now()}.jpg`;
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${fileName}`);

      // Use uploadBytesResumable for better error handling
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
        contentType: 'image/jpeg'
      });

      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress:', progress.toFixed(0) + '%');
          },
          (error) => {
            console.error("❌ Upload error:", error);
            reject(error);
          },
          () => {
            console.log("✅ Upload complete");
            resolve();
          }
        );
      });

      console.log("🔗 Getting download URL...");
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      console.log("✅ Download URL obtained:", downloadURL);

      console.log("👤 Updating Firebase Auth profile...");
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      console.log("✅ Auth profile updated");

      console.log("💾 Updating Firestore...");
      await setDoc(doc(db, 'users', currentUser.uid), { photoURL: downloadURL, updatedAt: serverTimestamp() }, { merge: true });
      console.log("✅ Firestore updated");

      // Force refresh the current user to get the updated photo
      console.log("🔄 Reloading auth user...");
      await auth.currentUser.reload();
      // Only update local state, don't spread the auth user object directly as it's complex
      setCurrentUser(auth.currentUser);
      setUserPhotoURL(downloadURL);
      console.log("✅ Photo update complete!");

      return downloadURL;
    } catch (err) {
      console.error("❌ Error updating photo:", err);
      console.error("Error details:", { code: err.code, message: err.message, stack: err.stack });

      let errorMessage = "Upload failed: " + (err.message || "Unknown error");

      if (err.code === 'storage/unauthorized') {
        errorMessage = "Upload failed: unauthorized. Please check your storage rules.";
      } else if (err.message && err.message.includes('CORS')) {
        errorMessage = "Upload failed: CORS error. Please check your storage CORS configuration.";
      }

      alert(errorMessage);
      throw err;
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { status: newStatus });
      setUserStatus(newStatus);
    } catch (error) { console.error(error); }
  };

  const handleUpdateWallpaper = async (wallpaper) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { wallpaper });
      setUserWallpaper(wallpaper);
    } catch (error) { console.error(error); }
  };

  const handleUpdateSocials = async (socials) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), socials);
      if (socials.location !== undefined) setUserLocation(socials.location);
      if (socials.instagram !== undefined) setUserInstagram(socials.instagram);
      if (socials.telegram !== undefined) setUserTelegram(socials.telegram);
      if (socials.link !== undefined) setUserLink(socials.link);
      if (socials.facebook !== undefined) setUserFacebook(socials.facebook);
    } catch (error) { console.error("Error updating socials:", error); }
  };

  const handleDeleteUser = (userId) => {
    if (activeUser === userId) setActiveUser(null);
  };

  const handleSendMessage = async (text, file = null, voiceBlob = null, scheduledDate = null, audioDuration = null) => {
    if (!currentUser) return;

    // Check if recipient has blocked us
    if (activeUser) {
      const recipient = usersMap[activeUser];
      if (recipient?.blockedUsers?.includes(currentUser.uid)) {
        alert("You cannot send messages to this user because they have blocked you.");
        return;
      }
    }

    const conversationId = activeChannel || (activeUser ? [currentUser.uid, activeUser].sort().join('_') : 'general');
    let imageURL = null;
    let voiceURL = null;
    let videoURL = null;

    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          let compressedBlob;
          try {
            compressedBlob = await compressImage(file);
          } catch (e) {
            console.warn("Compression failed for chat image, using original:", e);
            compressedBlob = file;
          }
          const storageRef = ref(storage, `chat_images/${conversationId}/${Date.now()}_${currentUser.uid}`);
          const uploadTask = await uploadBytes(storageRef, compressedBlob);
          imageURL = await getDownloadURL(uploadTask.ref);
        } catch (error) {
          console.error("Image upload error:", error);
          alert("Failed to upload image: " + error.message);
          return;
        }
      } else if (file.type.startsWith('video/')) {
        try {
          const storageRef = ref(storage, `chat_videos/${conversationId}/${Date.now()}_${currentUser.uid}`);
          // For videos, use resumable upload as they can be large
          const uploadTask = uploadBytesResumable(storageRef, file);

          await uploadTask; // Wait for completion
          videoURL = await getDownloadURL(uploadTask.snapshot.ref);
        } catch (error) {
          console.error("Video upload error:", error);
          alert("Failed to upload video: " + error.message);
          return;
        }
      } else {
        alert("Unsupported file type. Please select an image or video.");
        return;
      }
    }

    if (voiceBlob) {
      try {
        const extension = 'webm'; // Enforce webm for consistency
        const fileName = `voice_${Date.now()}_${currentUser.uid}.${extension}`;
        const storageRef = ref(storage, `chat_audio/${conversationId}/${fileName}`);

        console.log("⬆️ Starting upload:", fileName, "Size:", voiceBlob.size);

        if (voiceBlob.size === 0) throw new Error("Voice recording is empty!");

        const metadata = {
          contentType: 'audio/webm',
        };

        const sizeInKB = (voiceBlob.size / 1024).toFixed(2);
        console.log(`⬆️ Uploading ${sizeInKB} KB...`);

        // Use resumable upload to track progress and debug "heaviness"
        const uploadTask = uploadBytesResumable(storageRef, voiceBlob, metadata);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error("Upload error:", error);
            alert(`Upload Failed: ${error.message} (Code: ${error.code})`);
            // We need to reject the promise here but we are in a listener. 
            // Since we can't easily await this event listener in the current flow without wrapping, 
            // we will let the await below catch the final failure implicitly or handle it via the task promise.
          }
        );

        // Await the completion
        await uploadTask;

        voiceURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log("✅ Upload complete:", voiceURL);
      } catch (error) {
        console.error("Voice upload msg:", error);
        alert(`Upload Failed: ${error.message}\n(Code: ${error.code || 'unknown'})`);
        throw error;
      }
    }

    const textToSend = typeof text === 'string' ? text : '';
    console.log("📨 Preparing to send:", { textToSend, imageURL, voiceURL });

    if (textToSend.trim() || imageURL || voiceURL || videoURL) {
      try {
        const currentUserSettings = userSettings[currentUser.uid] || {};
        const senderMetadata = {
          name: userName,
          photoURL: userPhotoURL,
          themeColor: currentUserSettings.themeColor || 'var(--accent-color)'
        };
        console.log("📨 Sender Metadata:", senderMetadata);

        await sendMessage(
          conversationId,
          currentUser.uid,
          textToSend,
          imageURL,
          voiceURL,
          senderMetadata,
          scheduledDate,
          audioDuration,
          videoURL
        );
        console.log("✅ Message sent successfully!");
      } catch (error) {
        console.error("❌ sendMessage error:", error);
        throw error;
      }
    } else {
      console.warn("📨 Nothing to send (empty content)");
    }
  };


  const handleReaction = async (messageId, emoji) => {
    if (!currentUser) return;
    await toggleReaction(messageId, currentUser.uid, emoji);
  };

  const handleEditMessage = async (messageId, newText) => {
    if (!currentUser) return;
    await editMessage(messageId, newText);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!currentUser) return;
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  const handleToggleBlock = async (targetUserId) => {
    if (!currentUser || !targetUserId) return;
    const isCurrentlyBlocked = blockedUsers.includes(targetUserId);
    const newIsBlocked = !isCurrentlyBlocked;

    // Update local state for immediate UI feedback
    setBlockedUsers(prev =>
      isCurrentlyBlocked
        ? prev.filter(id => id !== targetUserId)
        : [...prev, targetUserId]
    );

    // Update Firestore for persistence
    await toggleBlockUser(currentUser.uid, targetUserId, newIsBlocked);
  };

  const handleSelectChannel = (id) => {
    setActiveChannel(id);
    setActiveUser(null);
    setMobileView('chat');
  };

  const handleSelectUser = (id) => {
    setActiveUser(id);
    setActiveChannel(null);
    setMobileView('chat');
  };

  const handleClearChat = async () => {
    if (!currentUser) return;
    const conversationId = activeChannel || (activeUser ? [currentUser.uid, activeUser].sort().join('_') : 'general');
    if (!window.confirm("Clear all messages? This will also remove images and voice notes from the database.")) return;
    try {
      const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
      const snapshot = await getDocs(q);

      const storageDeletions = [];
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Collect storage files to delete
        const mediaURLs = [data.imageURL, data.voiceURL, data.videoURL].filter(url => !!url);
        mediaURLs.forEach(url => {
          try {
            const storageRef = ref(storage, url);
            storageDeletions.push(deleteObject(storageRef).catch(e => console.warn("Storage deletion failed:", e)));
          } catch (e) { console.warn(e); }
        });

        batch.delete(doc.ref);
      });

      // Execute storage deletions first (or concurrently)
      if (storageDeletions.length > 0) {
        await Promise.all(storageDeletions);
      }

      await batch.commit();
      setMessages([]);
      console.log("✅ Chat cleared thoroughly (Firestore + Storage)");
    } catch (error) { console.error("Error clearing chat:", error); }
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { online: false, lastSeen: serverTimestamp() });
      } catch (e) { console.error(e); }
    }
    auth.signOut();
  };

  // Performance Optimization: Create a user map for faster lookups
  const usersMap = useMemo(() => {
    const map = {};
    users.forEach(u => map[u.uid] = u);
    return map;
  }, [users]);

  if (authLoading) return <div className="loading-screen">Loading Chat...</div>;
  if (!currentUser) return <Auth onAuthSuccess={() => { }} theme={theme} />;

  const currentConversation = activeChannel
    ? { ...channels.find(c => c.id === activeChannel), type: 'channel' }
    : activeUser ? (() => {
      const foundUser = usersMap[activeUser];
      if (!foundUser) return null;
      return {
        ...foundUser,
        id: foundUser.uid,
        name: foundUser.displayName || foundUser.email?.split('@')[0] || 'User',
        type: 'user',
        nickname: userSettings[activeUser]?.nickname,
        themeColor: currentSharedTheme?.themeColor || userSettings[activeUser]?.themeColor,
        wallpaper: currentSharedTheme?.wallpaper || userSettings[activeUser]?.wallpaper
      };
    })() : null;

  return (
    <div className={`app-container ${mobileView === 'list' ? 'view-sidebar' : 'view-chat'} ${theme === 'light' ? 'light-theme' : ''}`}>
      <div className="sidebar-container">
        <Sidebar
          channels={channels}
          users={users.filter(u => u.uid !== currentUser.uid).map(u => ({ ...u, name: u.displayName, id: u.uid }))}
          activeChannel={activeChannel}
          activeUser={activeUser}
          onSelectChannel={handleSelectChannel}
          onSelectUser={handleSelectUser}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => handleViewProfile(currentUser)}
          blockedUsers={blockedUsers}
          onToggleBlock={handleToggleBlock}
          userSettings={userSettings}
          onDeleteUser={handleDeleteUser}
          userName={userName}
          userPhotoURL={userPhotoURL}
          user={currentUser}
          userStatus={userStatus}
          onOpenDirectory={() => setIsUsersDirectoryOpen(true)}
          onCreateGroup={() => setIsCreateGroupOpen(true)}
        />
      </div>

      <div className="chat-container">
        {currentConversation && <ChatArea
          activeConversation={currentConversation}
          messages={messages.map(m => {
            const isMe = m.senderId === currentUser.uid;
            const senderUser = usersMap[m.senderId];
            const nickname = userSettings[m.senderId]?.nickname;
            const senderName = isMe ? 'me' : (nickname || m.senderName || senderUser?.displayName || 'User');

            return {
              ...m,
              senderName,
              sender: senderName,
              senderThemeColor: userSettings[m.senderId]?.themeColor || m.senderThemeColor || senderUser?.themeColor,
              senderPhotoURL: isMe ? userPhotoURL : (m.senderPhotoURL || senderUser?.photoURL),
              hasReactedLove: m.reactions?.['❤️']?.includes(currentUser.uid)
            };
          })}
          onSendMessage={handleSendMessage}
          onBack={() => setMobileView('list')}
          theme={theme}
          isBlocked={blockedUsers.includes(activeUser)}
          isBlockedByThem={activeUser ? usersMap[activeUser]?.blockedUsers?.includes(currentUser.uid) : false}
          onToggleBlock={() => handleToggleBlock(activeUser)}
          onOpenUserSettings={() => setIsUserSettingsOpen(true)}
          themeColor={currentSharedTheme?.themeColor || userSettings[activeUser]?.themeColor}
          wallpaper={activeChannel ? currentConversation?.wallpaper : (currentSharedTheme?.wallpaper !== undefined ? currentSharedTheme.wallpaper : (userSettings[activeUser]?.wallpaper !== undefined ? userSettings[activeUser]?.wallpaper : userWallpaper))}
          onDeleteMessage={handleDeleteMessage}
          onReaction={handleReaction}
          onEditMessage={handleEditMessage}
          onClearChat={handleClearChat}
          onViewProfile={() => handleViewProfile(currentConversation)}
          onOpenGroupMembers={(tab = 'members') => { setGroupMembersTab(tab); setIsGroupMembersOpen(true); }}
          currentUserId={currentUser.uid}
        />
        }
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        user={currentUser}
        onUpdateName={handleUpdateName}
        userBio={userBio}
        onUpdateBio={handleUpdateBio}
        userLocation={userLocation}
        userInstagram={userInstagram}
        userTelegram={userTelegram}
        userLink={userLink}
        userFacebook={userFacebook}
        onUpdateSocials={handleUpdateSocials}
        onUpdatePhoto={handleUpdatePhoto}
        onOpenProfile={handleViewProfile}
        onLogout={handleLogout}
        userPhotoURL={userPhotoURL}
        status={userStatus}
        onUpdateStatus={handleUpdateStatus}
        userWallpaper={userWallpaper}
        onUpdateWallpaper={handleUpdateWallpaper}
      />

      <UserSettingsModal
        key={isUserSettingsOpen ? `user-settings-${currentConversation?.id}` : 'user-settings-closed'}
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
        user={currentConversation?.type === 'user' ? currentConversation : null}
        onUpdateSettings={(id, s) => updateUserSettings(id, s)}
        theme={theme}
        isBlocked={blockedUsers.includes(activeUser)}
        onToggleBlock={() => handleToggleBlock(activeUser)}
        onDeleteUser={() => handleDeleteUser(activeUser)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={profileUser}
        theme={theme}
        isCurrentUser={profileUser?.uid === currentUser?.uid || profileUser?.id === currentUser?.uid}
        onOpenSettings={() => { setIsProfileOpen(false); setIsSettingsOpen(true); }}
        isBlocked={blockedUsers.includes(profileUser?.id || profileUser?.uid)}
        onToggleBlock={() => handleToggleBlock(profileUser?.id || profileUser?.uid)}
      />

      <UsersModal
        isOpen={isUsersDirectoryOpen}
        onClose={() => setIsUsersDirectoryOpen(false)}
        users={users}
        onSelectUser={handleSelectUser}
        currentUser={currentUser}
        theme={theme}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        users={users}
        currentUser={currentUser}
        onCreateGroup={handleCreateGroup}
      />

      <GroupMembersModal
        isOpen={isGroupMembersOpen}
        onClose={() => setIsGroupMembersOpen(false)}
        group={channels.find(c => c.id === activeChannel)}
        users={users}
        currentUser={currentUser}
        onKickUser={handleKickUser}
        onLeaveGroup={handleLeaveGroup}
        onUpdateGroup={handleUpdateGroup}
        initialTab={groupMembersTab}
      />

      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            onClick={() => { handleSelectUser(activeNotification.senderId); setActiveNotification(null); }}
            className="notification-toast"
            style={{
              position: 'fixed', top: 0, left: '50%', zIndex: 9999, width: '90%', maxWidth: '400px',
              background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)', borderRadius: '20px',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              cursor: 'pointer', backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px', backgroundImage: `url(${activeNotification.senderPhoto})`,
              backgroundColor: 'var(--accent-color)', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px'
            }}>
              {!activeNotification.senderPhoto && activeNotification.senderName.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Bell size={12} color="var(--accent-color)" />
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>New Message</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeNotification.senderName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeNotification.text || "📷 Sent an image"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default App;
