/**
 * @constant {object} PROMPT_TEMPLATES
 * @description Default prompt templates.
 */
const PROMPT_TEMPLATES = {
  GENERATE_OUTLINE: 'You are a computer science professor at a christian university. Use this chapter summary ${chapterSummary} to generate an outline for a 1.5 hr lecture covering this content\n${planForClass}Generate in JSON format Using the following JSON as an example to follow ${exampleOutlineSyntax}',
  CLEAN_UP_OUTLINE: 'You are a computer science professor at a christian university, Take this outline:${outline} and modify it so that it most accurately represents a comprehensive outline for a 1.5hr lecture that uses this chapter summary ${chapterSummary} as the basis to cover this material: ${plan} Generate in JSON format Using the following JSON as an example to follow ${exampleOutlineSyntax}',
  ADD_LEARNING_OBJECTIVES: 'You are a computer science professor at a christian university, take this outline:${outline} and modify it to add learning objectives for the students for each of the topics.  Use this chapter summary: ${chapterSummary} as a guide.  If you generate code favor psudeo code over any specific language. Otherwise use java as a first choice. Follow this JSON syntax exactly: ${exampleOutlineOutcomeSyntax}',
  IMPROVE_LEARNING_OBJECTIVES: 'You are a computer science professor and you\'ve been given the following outline for a course: ${withObjectives} scrutanize this and make it better making sure that it covers all the required key items of the topic. Use this chapter summary: ${chapterSummary} as a guide.  If you generate code favor psudeo code over any specific language. Otherwise use java as a first choice. Be sure that it still follows this JSON syntax exactly: ${exampleOutlineOutcomeSyntax}',
  GENERATE_SLIDES: '${slideSyntax} ${prompt} generate somewhere between 3 and 8 slides using the JSON slide syntax with no preamble or anything. Just the JSON. Do not generate more than 8 slides. Not too many bullets on each page... 6 should be the maximum. Where appropriate and amusing use this ${memeSyntax} to generate images from the memes that align perfectly with the content of the slide. These can be added as images. Not too many though. Just enough to make things interesting. And only when they match the social understanding of the meme perfectly. \nHere are the slides generated so far: ${generatedSlides} Just continue from here and Don\'t worry about introducing the topic unless the prompt specifically calls for it, that is done else where just focus on generating the content requested in the prompt.  Of course please be sure to generate valid JSON so that it can be correctly parsed. Do not generate unparsable JSON please make sure it it valid.',
  REVIEW_SLIDES: 'Here are some Slides: ${slide}. Review these slides and modify where appropriate. You have two main goals, make sure they are accurate based on this summary: ${chapterSummary} and also making sure to keep the JSON syntax in tact and matching this syntax: ${slideSyntax}. Of course please be sure to generate valid JSON so that it can be correctly parsed.',
  GENERATE_PROMPTS: 'You are a computer science professor and an expert at prompt engineering. Take this outline item along with the planned learning objectives and generate a prompt for an LLM that can generate slides to cover this content making sure that the undergraduate students at the end will understand the content enough to satisfy the objective. Use this chapter summary as a guide for validating your content: ${chapterSummary}. If you generate code favor psudeo code over any specific language. Otherwise use java as a first choice. Here is the outline and objectives in JSON format: ${section} enclose the prompt using three backticks followed by the word prompt so it can be easily extracted. Only generate a prompt for this outline. Other outlines e.g. introductions and preambles are generated elsewhere so just focus on this specific outline.',
  FIX_JSON: 'I am getting this error: ${errorMessage} when I try to parse the following JSON:\n${jsonString}\nPlease fix the syntax errors while keeping the format and content the same. Don\'t give an explanation of the fix, just return the fixed JSON in a JSON code block.',
  FINALIZE_DECK: 'You are an expert in curriculum design and presentation at a Christian university. Your task is to refine the following slide deck JSON to be cleaner, more streamlined, and thematically cohesive. Use the following week outline as a guide for the overall structure and goals:\n\n**Week Outline:**\n${weekOutline}\n\nHere are your instructions:\n\n**Audience and Tone:** The content should be academic and professional. Assume students have a foundational understanding of programming concepts. The material should be presented as a logical progression of ideas, building from foundational concepts to more advanced topics.\n\n**Thematic Cohesion:** Structure the deck to tell a cohesive story. Identify the core theme of the provided content and build a narrative around it. Begin by introducing fundamental concepts, then explore intermediate and advanced topics, and conclude with a synthesis of the material. Integrate themes of service and stewardship from a Christian worldview where they naturally apply to the lecture topic.\n\n**Concise and Focused:** Condense the material to fit within the ${slideCount} slide limit. Eliminate repetition and consolidate related points. Each slide should convey a single, clear idea or a related set of ideas without extraneous detail.\n\n**Clear Segmentation:** Use distinct slide titles to create clear breaks between major sections. Identify logical breaks in the source material, such as transitions from definitions to examples, or from foundational theory to practical application.\n\n**Meme Handling:** Review any images that are memes. You may modify them to be more appropriate and applicable, or remove them entirely if they do not fit the content well.\n\n**JSON Format:** It is crucial that you maintain the exact JSON structure of the slide deck provided. Do not add, remove, or rename any keys. The expected format for a single slide is as follows:\n${slideSyntax}\n\nHere is the slide deck JSON to refine:\n${slideDeckJson}'
};

/**
 * Retrieves a prompt template from UserProperties, or sets it to a default value if it doesn't exist.
 * @param {string} templateName - The name of the template to retrieve.
 * @returns {string} The prompt template.
 */
function getPromptTemplate(templateName) {
  const properties = PropertiesService.getUserProperties();
  let template = properties.getProperty(templateName);
  if (!template) {
    template = PROMPT_TEMPLATES[templateName];
    properties.setProperty(templateName, template);
  }
  return template;
}

/**
 * Retrieves all prompt templates from UserProperties.
 * @returns {object} An object containing all the prompt templates.
 */
function getAllPromptTemplates() {
  const properties = PropertiesService.getUserProperties();
  const templates = {};
  for (const key in PROMPT_TEMPLATES) {
    templates[key] = getPromptTemplate(key);
  }
  return templates;
}

/**
 * Saves a prompt template to UserProperties.
 * @param {string} templateName - The name of the template to save.
 * @param {string} content - The content of the template to save.
 */
function savePromptTemplate(templateName, content) {
  const properties = PropertiesService.getUserProperties();
  properties.setProperty(templateName, content);
}

/**
 * Deletes a prompt template from UserProperties.
 * @param {string} templateName - The name of the template to delete.
 */
function deletePromptTemplate(templateName) {
  const properties = PropertiesService.getUserProperties();
  properties.deleteProperty(templateName);
}
