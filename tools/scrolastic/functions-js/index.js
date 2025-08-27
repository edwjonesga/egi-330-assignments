/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const {setGlobalOptions} = require("firebase-functions");
const { onCall, onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { formatTemplate } = require("./templating");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

initializeApp();

const options = {
    cors: [
        "http://localhost:5000",
        "http://localhost:5173",
        "https://scrolastic.web.app",
        "https://scrolastic.firebaseapp.com",
        /^https:\/\/n-[\w.-]+\.googleusercontent\.com$/,
        "https://mycourses.ccu.edu"
    ]
};

exports.getAttachmentCode = onCall(options, async (request) => {
    const { templateId, chatId } = request.data;
    const { uid } = request.auth;
    const db = getFirestore();

    const code = uuidv4();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    const attachmentPath = `conversations/${templateId}/${chatId}/${uid}/attachments`;

    await db.collection("attachment_codes").doc(code).set({
        uid,
        path: attachmentPath,
        expires: expiry,
    });

    return { code };
});

exports.uploadAttachment = onRequest(async (req, res) => {
    const { attachmentCode, data } = req.body;
    const db = getFirestore();
    const codeRef = db.collection("attachment_codes").doc(attachmentCode);

    try {
        await db.runTransaction(async (t) => {
            const codeDoc = await t.get(codeRef);

            if (!codeDoc.exists) {
                throw new Error("Invalid attachment code.");
            }

            const codeData = codeDoc.data();

            if (codeData.expires.toDate() < new Date()) {
                throw new Error("Attachment code has expired.");
            }

            const attachmentRef = db.collection(codeData.path).doc();
            t.set(attachmentRef, data);
            t.delete(codeRef);
        });

        res.status(200).send({ success: true });
    } catch (error) {
        logger.error("Error uploading attachment:", error);
        if (error.message === "Invalid attachment code.") {
            res.status(404).send({ error: error.message });
        } else if (error.message === "Attachment code has expired.") {
            res.status(410).send({ error: error.message });
        } else {
            res.status(500).send({ error: "Could not upload attachment." });
        }
    }
});

exports.getConversations = onCall(options, async (request) => {
    const { templateId, chatId } = request.data;
    const { uid } = request.auth;
    const db = getFirestore();
    const conversationsRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/conversations`);
    const snapshot = await conversationsRef.get();
    const conversations = snapshot.docs.map(doc => doc.data());
    return { conversations };
});

exports.getConversationHistory = onCall(options, async (request) => {
    const { templateId, chatId, conversationId } = request.data;
    const { uid } = request.auth;
    const db = getFirestore();
    const messagesRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/conversations/${conversationId}/messages`);
    const snapshot = await messagesRef.orderBy("timestamp").get();
    const messages = snapshot.docs.map(doc => doc.data());
    return { messages };
});

exports.newConversation = onCall(options, async (request) => {
    const { templateId, chatId, message, history, context, jsonContext } = request.data;
    const { uid } = request.auth;
    const db = getFirestore();

    const conversationRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/conversations`).doc();
    const conversationId = conversationRef.id;
    await conversationRef.set({ title: message, id: conversationId });

    const messagesRef = conversationRef.collection("messages");
    await messagesRef.add({ text: message, sender: "user", timestamp: FieldValue.serverTimestamp() });

    const attachmentsRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/attachments`);
    const attachmentsSnapshot = await attachmentsRef.get();
    const attachments = attachmentsSnapshot.docs.map(doc => doc.data());

    const geminiData = {
        message: message,
        user: request.auth,
        history: history,
        context: context,
        jsoncontext: jsonContext,
        attachments: attachments
    };

    const geminiResponse = await exports.getGeminiResponse({
        data: { templateId: templateId, data: geminiData },
        auth: request.auth
    });

    let botMessage = "Sorry, I couldn't process that. Please try again.";
    if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0 &&
        geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts &&
        geminiResponse.candidates[0].content.parts.length > 0 && geminiResponse.candidates[0].content.parts[0].text) {
        botMessage = geminiResponse.candidates[0].content.parts[0].text;
    }

    await messagesRef.add({ text: botMessage, sender: "bot", timestamp: FieldValue.serverTimestamp() });

    return { conversationId, title: message, message: botMessage };
});

exports.continueConversation = onCall(options, async (request) => {
    const { templateId, chatId, conversationId, message, history, context, jsonContext } = request.data;
    const { uid } = request.auth;
    const db = getFirestore();

    const messagesRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/conversations/${conversationId}/messages`);
    await messagesRef.add({ text: message, sender: "user", timestamp: FieldValue.serverTimestamp() });

    const attachmentsRef = db.collection(`conversations/${templateId}/${chatId}/${uid}/attachments`);
    const attachmentsSnapshot = await attachmentsRef.get();
    const attachments = attachmentsSnapshot.docs.map(doc => doc.data());

    const geminiData = {
        message: message,
        user: request.auth,
        history: history,
        context: context,
        jsoncontext: jsonContext,
        attachments: attachments
    };

    const geminiResponse = await exports.getGeminiResponse({
        data: { templateId: templateId, data: geminiData },
        auth: request.auth
    });

    let botMessage = "Sorry, I couldn't process that. Please try again.";
    if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0 &&
        geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts &&
        geminiResponse.candidates[0].content.parts.length > 0 && geminiResponse.candidates[0].content.parts[0].text) {
        botMessage = geminiResponse.candidates[0].content.parts[0].text;
    }

    await messagesRef.add({ text: botMessage, sender: "bot", timestamp: FieldValue.serverTimestamp() });

    return { message: botMessage };
});

exports.getGeminiResponse = async(request) => {
    const { templateId, data } = request.data;
    const db = getFirestore();

    const templateDoc = await db.collection("prompt_templates").doc(templateId).get();
    if (!templateDoc.exists) {
        throw new functions.https.HttpsError("not-found", `Template with ID '${templateId}' not found.`);
    }

    const templateString = templateDoc.data().content;
    if (!templateString) {
        throw new functions.https.HttpsError("failed-precondition", `Template with ID '${templateId}' has no 'template' field.`);
    }

    const formattedPrompt = await formatTemplate(templateString, data);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new functions.https.HttpsError("failed-precondition", "GEMINI_API_KEY environment variable not set.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = { "contents": [{ "parts": [{ "text": formattedPrompt }] }] };
    const headers = { "Content-Type": "application/json" };

    try {
        const response = await axios.post(url, payload, { headers });
        return response.data;
    } catch (error) {
        logger.error("Error calling Gemini API:", error);
        throw new functions.https.HttpsError("internal", "Error calling Gemini API", error);
    }
};
