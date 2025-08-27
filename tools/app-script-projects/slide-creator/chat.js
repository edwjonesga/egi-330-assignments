function createChatBoxHtml(slidesId, templateId, chatId, local = false) {
  const slideUrl = `https://docs.google.com/presentation/d/${slidesId}/edit`;
  const slidedeckcontents = extractSlideDeckText(slideUrl);

  const template = HtmlService.createTemplateFromFile('sidebar');
  template.local = local;
  template.chatId = chatId;
  template.templateId = templateId;
  template.slidedeckcontents = slidedeckcontents;
  return template;
}

function showSidebarChat() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const slidesId = SlidesApp.getActivePresentation().getId();
  const templateId = documentProperties.getProperty('templateId') || 'default';

  const chatIdProp = documentProperties.getProperty('chatId');
  const chatId = chatIdProp ? JSON.parse(chatIdProp) : slidesId;

  const localProp = documentProperties.getProperty('local');
  const local = localProp ? JSON.parse(localProp) : false;

  var template = createChatBoxHtml(slidesId, templateId, chatId, local);
  SlidesApp.getUi().showSidebar(template.evaluate().setTitle('Chatbot Side').setWidth(400));
}

function showDialogChat() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const slidesId = SlidesApp.getActivePresentation().getId();
  const templateId = documentProperties.getProperty('templateId') || 'default';

  const chatIdProp = documentProperties.getProperty('chatId');
  const chatId = chatIdProp ? JSON.parse(chatIdProp) : slidesId;

  const localProp = documentProperties.getProperty('local');
  const local = localProp ? JSON.parse(localProp) : false;

  var template = createChatBoxHtml(slidesId, templateId, chatId, local);
  SlidesApp.getUi().showModalDialog(template.evaluate().setWidth(800).setHeight(600), 'Chatbot');
}

/**
 * Sets the Chatbot Template ID in the document properties.
 * This can be called from other scripts or triggers to configure the chatbot.
 * @param {string} templateId The ID of the template to use for the chatbot.
 */
function setChatbotTemplateId(templateId) {
  if (templateId && typeof templateId === 'string') {
    const documentProperties = PropertiesService.getDocumentProperties();
    documentProperties.setProperty('templateId', templateId);
    console.log(`Chatbot template ID set to: ${templateId}`);
  } else {
    console.error('setChatbotTemplateId: Invalid templateId provided. Must be a non-empty string.');
  }
}

function onOpen(templateId = 'default', options = {}) {
  const documentProperties = PropertiesService.getDocumentProperties();

  // Only set the templateId if a specific, non-default value is provided.
  // This prevents overwriting a previously set ID with the default value.
  if (templateId && templateId !== 'default') {
    documentProperties.setProperty('templateId', templateId);
  }

  if (options && typeof options === 'object') {
      for (const [key, value] of Object.entries(options)) {
          documentProperties.setProperty(key, JSON.stringify(value));
      }
  }

  SlidesApp.getUi()
      .createMenu('Chatbot')
      .addItem('Show Sidebar', 'showSidebarChat')
      .addItem('Show Dialog', 'showDialogChat')
      .addToUi();
}
