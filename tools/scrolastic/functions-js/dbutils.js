const { getFirestore } = require("firebase-admin/firestore");

/**
 * Gets a value from Firestore at a given path.
 * @param {string} path The path to the value in Firestore.
 * @returns {Promise<*>} The value at the given path, or undefined if it doesn't exist.
 */
async function getFromDb(path) {
    const db = getFirestore();
    const parts = path.split(/[\.\[\]]/).filter(Boolean);
    let currentRef = db;
    let isCollection = true;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (currentRef === null || currentRef === undefined) {
            return undefined;
        }

        if (isCollection) {
            currentRef = currentRef.collection(part);
            isCollection = false;
        } else {
            const match = part.match(/(\w+)=(.+)/);
            if (match) {
                const [_, key, value] = match;
                const snapshot = await currentRef.where(key, "==", value).get();
                if (snapshot.empty) {
                    return undefined;
                }
                // This assumes a unique result, may need adjustment
                currentRef = snapshot.docs[0].ref;
            } else {
                currentRef = currentRef.doc(part);
            }
            isCollection = true;
        }
    }

    if (isCollection) { // We ended on a collection path
        const snapshot = await currentRef.get();
        return snapshot.docs.map(doc => doc.data());
    } else { // We ended on a document path
        const doc = await currentRef.get();
        return doc.exists ? doc.data() : undefined;
    }
}

module.exports = { getFromDb };
