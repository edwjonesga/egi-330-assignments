import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

const call = (name, data) => httpsCallable(functions, name)(data).then(result => result.data);

export const chatService = (templateId, chatId, contextData) => {
  const getConversations = () => call('getConversations', { templateId, chatId });
  const getConversationHistory = (conversationId) => call('getConversationHistory', { templateId, chatId, conversationId });
  const newConversation = (message, history) => call('newConversation', { templateId, chatId, message, history, ...contextData });
  const continueConversation = (conversationId, message, history) => call('continueConversation', { templateId, chatId, conversationId, message, history, ...contextData });
  const getAttachmentCode = () => call('getAttachmentCode', { templateId, chatId });

  return {
    getConversations,
    getConversationHistory,
    newConversation,
    continueConversation,
    getAttachmentCode,
  };
};
