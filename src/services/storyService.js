import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, arrayUnion, arrayRemove, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export const uploadStory = (userId, file, text = '', textPosition = null, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `stories/${userId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
            },
            (error) => reject(error),
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

                    const storyData = {
                        userId,
                        videoUrl: downloadURL,
                        text,
                        textPosition, // Store the position of the text
                        storagePath: uploadTask.snapshot.ref.fullPath,
                        createdAt: serverTimestamp(),
                        expiresAt: expiresAt.getTime(), // Store as JS timestamp for easy querying
                        viewers: []
                    };

                    const docRef = await addDoc(collection(db, 'stories'), storyData);
                    resolve({ id: docRef.id, ...storyData });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
};

export const subscribeToStories = (callback) => {
    const now = Date.now();
    const q = query(
        collection(db, 'stories'),
        where('expiresAt', '>', now)
    );

    return onSnapshot(q, (snapshot) => {
        const stories = [];
        snapshot.forEach((doc) => {
            stories.push({ id: doc.id, ...doc.data() });
        });

        // Sort in memory because we are already filtering on expiresAt
        stories.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return aTime - bTime;
        });

        callback(stories);
    }, (error) => {
        console.error("Error subscribing to stories:", error);
        callback([]);
    });
};

export const markStoryAsViewed = async (storyId, viewerId) => {
    try {
        const storyRef = doc(db, 'stories', storyId);
        await updateDoc(storyRef, {
            viewers: arrayUnion(viewerId)
        });
    } catch (error) {
        console.error("Error marking story as viewed:", error);
    }
};

export const deleteStory = async (storyId, storagePath) => {
    try {
        if (storagePath) {
            try {
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
            } catch (storageErr) {
                console.warn("Storage deletion warning (file may not exist):", storageErr);
            }
        }
        await deleteDoc(doc(db, 'stories', storyId));
    } catch (error) {
        console.error("Error deleting story:", error);
        throw error;
    }
};

export const reactToStory = async (storyId, viewerId, emoji) => {
    try {
        const storyRef = doc(db, 'stories', storyId);
        const storyDoc = await getDocs(query(collection(db, 'stories'), where('__name__', '==', storyId)));
        if (storyDoc.empty) return;

        const data = storyDoc.docs[0].data();
        const reactions = data.reactions || {};

        let updates = {};
        let alreadyHasThisEmoji = false;

        Object.keys(reactions).forEach(e => {
            if (reactions[e] && reactions[e].includes(viewerId)) {
                if (e === emoji) alreadyHasThisEmoji = true;
                updates[`reactions.${e}`] = arrayRemove(viewerId);
            }
        });

        if (!alreadyHasThisEmoji) {
            updates[`reactions.${emoji}`] = arrayUnion(viewerId);
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(storyRef, updates);
        }
    } catch (error) {
        console.error("Error reacting to story:", error);
    }
};

export const cleanupExpiredStories = async (userId) => {
    if (!userId) return;
    try {
        const now = Date.now();
        const q = query(
            collection(db, 'stories'),
            where('userId', '==', userId),
            where('expiresAt', '<=', now)
        );

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(storyDoc => {
            const data = storyDoc.data();
            return deleteStory(storyDoc.id, data.storagePath);
        });

        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`Cleaned up ${deletePromises.length} expired stories for user ${userId}.`);
        }
    } catch (error) {
        console.error("Error cleaning up expired stories:", error);
    }
};
