import {
    collection,
    addDoc,
    query,
    orderBy,
    where,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    setDoc,
    doc,
    getDoc,
    getDocs,
    arrayUnion,
    arrayRemove,
    limit,
    deleteDoc
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

const MESSAGES_COLLECTION = "messages";

/**
 * Sends a message to a specific conversation
 */
export const sendMessage = async (conversationId, senderId, text, imageURL = null, voiceURL = null, senderMetadata = {}, scheduledDate = null, audioDuration = null, videoURL = null) => {
    const messageText = text || "";
    if (!messageText.trim() && !imageURL && !voiceURL && !videoURL) return;

    if (!conversationId) {
        alert("Bug: Conversation ID is missing!");
        throw new Error("Missing conversationId");
    }

    console.log("📤 Sending to Firestore:", { conversationId, senderId, messageText, imageURL, voiceURL, audioDuration, videoURL });

    try {
        const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
            conversationId: conversationId,
            senderId: senderId || 'unknown',
            text: messageText,
            imageURL: imageURL || null,
            voiceURL: voiceURL || null,
            videoURL: videoURL || null,
            audioDuration: audioDuration || null,
            senderName: senderMetadata.name || 'Unknown',
            senderPhotoURL: senderMetadata.photoURL || null,
            senderThemeColor: senderMetadata.themeColor || null,
            createdAt: scheduledDate ? scheduledDate : serverTimestamp(),
            scheduledAt: scheduledDate ? scheduledDate : null,
            status: scheduledDate ? 'scheduled' : 'sent',
            seenBy: [] // Initialize empty array for tracking readers
        });
        console.log("✅ Saved! ID:", docRef.id);
    } catch (error) {
        console.error("❌ Firestore Write Error:", error.code, error.message);
        if (error.code === 'permission-denied') {
            alert("SECURITY ERROR: Firebase is still blocking you. Please double-check your 'Rules' tab and click 'Publish'!");
        } else {
            alert("Error: " + error.message);
        }
        throw error; // Rethrow so the caller knows it failed
    }
};

/**
 * Edits an existing message
 */
export const editMessage = async (messageId, newText) => {
    if (!newText.trim()) return;
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    try {
        await updateDoc(messageRef, {
            text: newText,
            edited: true,
            editedAt: serverTimestamp()
        });
        console.log("✅ Message edited!");
    } catch (error) {
        console.error("❌ Error editing message:", error);
    }
};

/**
 * Listens for real-time messages
 */
export const subscribeToMessages = (conversationId, callback) => {
    console.log("👂 Listening for messages in:", conversationId);

    const q = query(
        collection(db, MESSAGES_COLLECTION),
        where("conversationId", "==", conversationId),
        orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("📦 Data updated! Documents:", snapshot.docs.length);
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Removed the hardcoded "me" comparison here as it's better handled in UI with currentUserId
                time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'
            };
        });
        callback(messages);
    }, (error) => {
        console.error("❌ Firestore Read Error:", error.code, error.message);
    });

    return unsubscribe;
};

/**
 * Listens for all registered users
 */
export const subscribeToUsers = (callback) => {
    return onSnapshot(collection(db, "users"), (snapshot) => {
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id, // Ensure uid is available for lookups
            ...doc.data()
        }));
        callback(users);
    });
};
/**
 * Toggles a reaction on a message
 */
export const toggleReaction = async (messageId, userId, emoji = '❤️') => {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    try {
        const msgDoc = await getDoc(messageRef);
        if (!msgDoc.exists()) return;

        const data = msgDoc.data();
        const reactions = data.reactions || {};
        const userReactions = reactions[emoji] || [];

        if (userReactions.includes(userId)) {
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: arrayRemove(userId)
            });
        } else {
            await updateDoc(messageRef, {
                [`reactions.${emoji}`]: arrayUnion(userId)
            });
        }
    } catch (error) {
        console.error("Error toggling reaction:", error);
    }
};

/**
 * Sets a shared theme for a conversation
 */
export const setSharedTheme = async (conversationId, themeData) => {
    const themeRef = doc(db, 'shared_themes', conversationId);
    try {
        await setDoc(themeRef, {
            ...themeData,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("❌ Error setting shared theme:", error);
    }
};

/**
 * Subscribes to shared theme updates
 */
export const subscribeToSharedTheme = (conversationId, callback) => {
    const themeRef = doc(db, 'shared_themes', conversationId);
    return onSnapshot(themeRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
};
/**
 * Listen for any new messages (system-wide) for notifications
 */
export const subscribeToAllMessages = (callback) => {
    const q = query(
        collection(db, MESSAGES_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(5) // Just look at the most recent few
    );

    return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                callback({ id: change.doc.id, ...data });
            }
        });
    });
};

/**
 * Marks messages in a conversation as seen
 */
export const markAsSeen = async (conversationId, currentUserId) => {
    if (!conversationId || !currentUserId) return;

    try {
        const q = query(
            collection(db, MESSAGES_COLLECTION),
            where("conversationId", "==", conversationId),
            orderBy("createdAt", "desc"),
            limit(40) // Only mark recent messages as seen
        );

        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs
            .filter(doc => {
                const data = doc.data();
                return data.senderId !== currentUserId && (!data.seenBy || !data.seenBy.includes(currentUserId));
            })
            .map(messageDoc => {
                const messageRef = doc(db, MESSAGES_COLLECTION, messageDoc.id);
                return updateDoc(messageRef, {
                    seenBy: arrayUnion(currentUserId),
                    status: 'seen', // keep for legacy/simple tracking
                    seenAt: serverTimestamp()
                });
            });

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(`👁️ Marked ${updatePromises.length} messages as seen by ${currentUserId}`);
        }
    } catch (error) {
        console.error("❌ Error marking messages as seen:", error);
    }
};
/**
 * Toggles blocking status for a user
 */
export const toggleBlockUser = async (currentUserId, targetUserId, isBlocking) => {
    if (!currentUserId || !targetUserId) return;
    const userRef = doc(db, 'users', currentUserId);
    try {
        await updateDoc(userRef, {
            blockedUsers: isBlocking ? arrayUnion(targetUserId) : arrayRemove(targetUserId)
        });
        console.log(`✅ User ${targetUserId} ${isBlocking ? 'blocked' : 'unblocked'}!`);
    } catch (error) {
        console.error("❌ Error toggling block status:", error);
    }
};
/**
 * Removes a user from a group
 */
export const kickUserFromGroup = async (groupId, userId) => {
    if (!groupId || !userId) return;
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, {
            members: arrayRemove(userId)
        });
        console.log(`✅ User ${userId} kicked from group ${groupId}`);
    } catch (error) {
        console.error("❌ Error kicking user:", error);
        throw error;
    }
};

/**
 * Adds a user to a group
 */
export const addMemberToGroup = async (groupId, userId) => {
    if (!groupId || !userId) return;
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, {
            members: arrayUnion(userId)
        });
        console.log(`✅ User ${userId} added to group ${groupId}`);
    } catch (error) {
        console.error("❌ Error adding user to group:", error);
        throw error;
    }
};

/**
 * Removes the current user from a group
 */
export const leaveGroup = async (groupId, userId) => {
    if (!groupId || !userId) return;
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, {
            members: arrayRemove(userId)
        });
        console.log(`✅ User ${userId} left group ${groupId}`);
    } catch (error) {
        console.error("❌ Error leaving group:", error);
        throw error;
    }
};
/**
 * Updates group metadata (name, photo, theme)
 */
export const updateGroupMetadata = async (groupId, data) => {
    if (!groupId) return;
    const groupRef = doc(db, 'groups', groupId);
    try {
        await updateDoc(groupRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        console.log(`✅ Group ${groupId} metadata updated`);
    } catch (error) {
        console.error("❌ Error updating group metadata:", error);
        throw error;
    }
};

/**
 * Deletes a message (and its associated media from storage)
 */
export const deleteMessage = async (messageId) => {
    if (!messageId) return;
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);
    try {
        // Fetch message data to check for media URLs
        const msgDoc = await getDoc(messageRef);
        if (msgDoc.exists()) {
            const data = msgDoc.data();
            const mediaURLs = [data.imageURL, data.voiceURL, data.videoURL].filter(url => !!url);

            // Delete media from Storage
            for (const url of mediaURLs) {
                try {
                    // Extract path from download URL or use simple ref if structure is known
                    // Download URLs look like: .../o/path%2Fto%2Ffile?alt=media...
                    // But we can also get the ref directly if they are stored in a predictable way
                    // Alternatively, we can use the URL directly in ref(storage, url) which works in newer Firebase JS SDK
                    const storageRef = ref(storage, url);
                    await deleteObject(storageRef);
                    console.log("✅ Media deleted from storage");
                } catch (stErr) {
                    console.warn("⚠️ Failed to delete media from storage (it might already be gone):", stErr.message);
                }
            }
        }

        await deleteDoc(messageRef);
        console.log("✅ Message deleted from Firestore!");
    } catch (error) {
        console.error("❌ Error deleting message:", error);
        throw error;
    }
};
