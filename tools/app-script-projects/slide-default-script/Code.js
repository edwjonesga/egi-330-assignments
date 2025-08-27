/**
 * Gets the template ID from the presentation's title.
 * The title is expected to be in the format "templateName: Other Text".
 * @returns {string} The extracted and cleaned template name.
 */
function getTemplateId() {
  const name = SlidesApp.getActivePresentation().getName();
  const parts = name.split(":");
  const templateName = parts[0].toLowerCase().replace(/ /g, "");
  return templateName;
}

/**
 * Creates a 'Chatbot' menu in the UI when the presentation is opened.
 */
function onOpen() {
  SlideCreator.onOpen();
}

/**
 * Shows the chatbot in the sidebar.
 * This function handles setting the template ID just-in-time.
 * Authorization will be triggered implicitly by Google Apps Script if needed.
 */
function showSidebarChat() {
  const templateId = getTemplateId();
  if (templateId) {
    SlideCreator.setChatbotTemplateId(templateId);
  }
  SlideCreator.showSidebarChat();
}

/**
 * Shows the chatbot in a dialog.
 * This function handles setting the template ID just-in-time.
 * Authorization will be triggered implicitly by Google Apps Script if needed.
 */
function showDialogChat() {
  const templateId = getTemplateId();
  if (templateId) {
    SlideCreator.setChatbotTemplateId(templateId);
  }
  SlideCreator.showDialogChat();
}
