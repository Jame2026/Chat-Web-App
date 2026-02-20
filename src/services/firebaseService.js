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
    limit
} from "firebase/firestore";
import { db } from "../firebase";

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
            where("status", "==", "sent")
        );

        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs
            .filter(doc => doc.data().senderId !== currentUserId)
            .map(messageDoc => {
                const messageRef = doc(db, MESSAGES_COLLECTION, messageDoc.id);
                return updateDoc(messageRef, {
                    status: 'seen',
                    seenAt: serverTimestamp()
                });
            });

        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
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
