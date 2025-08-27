/**
 * @fileoverview Backend functions for the template editor.
 */

/**
 * Gets all prompt templates.
 * This is a wrapper for the function in prompt_templates.js.
 * @returns {object} An object containing all the prompt templates.
 */
function getTemplates() {
  return getAllPromptTemplates();
}

/**
 * Saves a prompt template.
 * This is a wrapper for the function in prompt_templates.js.
 * @param {string} templateName - The name of the template to save.
 * @param {string} content - The content of the template to save.
 */
function saveTemplate(templateName, content) {
  savePromptTemplate(templateName, content);
}

/**
 * Resets a template to its default value by deleting the user-saved version.
 * @param {string} templateName - The name of the template to reset.
 */
function resetTemplateToDefault(templateName) {
  deletePromptTemplate(templateName);
}

/**
 * Gets the documentation for the prompt templates.
 * @returns {object} An object containing the documentation for the templates.
 */
function getTemplateDocumentation() {
  return {
    'GENERATE_OUTLINE': {
      'chapterSummary': 'The summary of the chapter content.',
      'planForClass': 'The plan for the class.',
      'exampleOutlineSyntax': 'The example JSON syntax for the outline.'
    },
    'CLEAN_UP_OUTLINE': {
      'outline': 'The initial outline to be cleaned up.',
      'chapterSummary': 'The summary of the chapter content.',
      'plan': 'The plan for the class.',
      'exampleOutlineSyntax': 'The example JSON syntax for the outline.'
    },
    'ADD_LEARNING_OBJECTIVES': {
      'outline': 'The outline to add learning objectives to.',
      'chapterSummary': 'The summary of the chapter content.',
      'exampleOutlineOutcomeSyntax': 'The example JSON syntax for the outcome.'
    },
    'IMPROVE_LEARNING_OBJECTIVES': {
      'withObjectives': 'The outline with initial learning objectives.',
      'chapterSummary': 'The summary of the chapter content.',
      'exampleOutlineOutcomeSyntax': 'The example JSON syntax for the outcome.'
    },
    'GENERATE_SLIDES': {
      'slideSyntax': 'The JSON syntax for a single slide.',
      'prompt': 'The specific prompt for the slide generation.',
      'memeSyntax': 'The syntax for generating memes.',
      'generatedSlides': 'The slides that have been generated so far.'
    },
    'REVIEW_SLIDES': {
      'slide': 'The slide content to be reviewed.',
      'chapterSummary': 'The summary of the chapter content.',
      'slideSyntax': 'The JSON syntax for a single slide.'
    },
    'GENERATE_PROMPTS': {
      'chapterSummary': 'The summary of the chapter content.',
      'section': 'The section of the outline to generate a prompt for.'
    },
    'FIX_JSON': {
      'errorMessage': 'The error message from the JSON parsing.',
      'jsonString': 'The JSON string that failed to parse.'
    },
    'FINALIZE_DECK': {
      'weekOutline': 'The high-level outline for the week\'s lecture.',
      'slideCount': 'The target number of slides for the final deck.',
      'slideDeckJson': 'The JSON representation of the entire slide deck to be refined.',
      'slideSyntax': 'An example of the expected JSON format for a single slide.'
    }
  };
}
