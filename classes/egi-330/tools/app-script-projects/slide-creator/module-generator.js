/**
 * @fileoverview This script orchestrates the generation of a complete
 * Brightspace weekly module from a Google Slides presentation.
 *
 * It will take a Google Slides URL as input, generate a quiz, a coding
 * assignment, and a chatbot, and then package everything into a
 * Brightspace-compatible zip file.
 */

/**
 * Generates a simplified Brightspace module package from a Google Slides presentation.
 *
 * @param {object} config - The configuration object for the module.
 * @param {string} config.slideUrl - The URL of the Google Slides presentation.
 * @param {string} config.weekNumber - The week number for the module title.
 * @returns {string} The URL of the generated zip file in Google Drive.
 */
function generateModulePackage(config) {
  // Create a temporary folder for the package generation.
  const tempFolderName = `${config.weekNumber}_${new Date().getTime()}`;
  const tempFolder = DriveApp.createFolder(tempFolderName);

  try {
    // 1. Get slide text.
    const slideText = extractSlideDeckText(config.slideUrl);

    // 2. Generate AI summary if no description is provided.
    let description = config.weekDescription;
    if (!description || description.trim() === '') {
      description = generateSummaryFromText(slideText);
    }

    // 3. Generate chatbot HTML and save it.
    const chatbotHtml = generateChatbotHtml(config);
    tempFolder.createFile('chatbot.html', chatbotHtml, MimeType.HTML);

    // 4. Create orgunitconfig.xml.
    const orgUnitConfigFolder = tempFolder.createFolder('orgunitconfig');
    orgUnitConfigFolder.createFile('orgunitconfig.xml', '<orgunit identifier="D2L_ORG" default_nav="CUS Default Course Navbar" default_homepage="CUS Default Course Homepage"/>');

    // 5. Populate the imsmanifest.xml template.
    let manifestContent = getSimplifiedManifestTemplate();
    const scriptUrl = ScriptApp.getService().getUrl();
    const quizGeneratorUrl = `${scriptUrl}?page=quizgeneratorpage&slideUrl=${encodeURIComponent(config.slideUrl)}`;
    const escapedQuizGeneratorUrl = quizGeneratorUrl.replace(/&/g, '&amp;');

    const escapedDescription = escapeHtml(description);

    manifestContent = manifestContent.replace(/\${week-number}/g, config.weekNumber || 'Weekly Module');
    manifestContent = manifestContent.replace(/\${week-description}/g, escapedDescription);
    manifestContent = manifestContent.replace(/\${slides-url}/g, config.slideUrl);
    manifestContent = manifestContent.replace(/\${quiz-generator-url}/g, escapedQuizGeneratorUrl);

    // Replace all UUID placeholders with new UUIDs
    while (manifestContent.includes('${uuid_placeholder}')) {
      manifestContent = manifestContent.replace('${uuid_placeholder}', Utilities.getUuid());
    }

    tempFolder.createFile('imsmanifest.xml', manifestContent);

    // 6. Zip the folder.
    const finalZipBlob = zipFolder(tempFolder);

    // 7. Save the final package.
    let finalPackagesFolder;
    const folders = DriveApp.getFoldersByName("BrightspaceFinalPackages");
    if (folders.hasNext()) {
      finalPackagesFolder = folders.next();
    } else {
      finalPackagesFolder = DriveApp.createFolder("BrightspaceFinalPackages");
    }
    const finalFile = finalPackagesFolder.createFile(finalZipBlob).setName(`${config.weekNumber}_Module.zip`);

    console.log(`Successfully created simplified module package: ${finalFile.getUrl()}`);
    return finalFile.getUrl();

  } finally {
    // 8. Clean up the temporary folder.
    tempFolder.setTrashed(true);
  }
}

/**
 * Uses an LLM to generate a concise summary from slide text.
 * @param {string} slideText - The text content of the Google Slides.
 * @returns {string} A summary of the text.
 */
function generateSummaryFromText(slideText) {
  const prompt = `
    Summarize the following text from a slide deck in a single, well-written paragraph.
    This summary will be used as a description for a week's module in a course.
    Focus on the key concepts and learning objectives.

    Slide Text:
    ---
    ${slideText}
    ---
  `;

  let summary = callGemini(prompt);
  return summary;
}

function getSimplifiedManifestTemplate() {
  return `
<manifest xmlns:d2l_2p0="http://desire2learn.com/xsd/d2lcp_v2p0" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" identifier="D2L_z_\${uuid_placeholder}">
<metadata>
<schema>IMS Content</schema>
<schemaversion>1.1.3</schemaversion>
</metadata>
<organizations default="default_org">
<organization identifier="default_org">
<item identifier="\${uuid_placeholder}" identifierref="res_module" isvisible="true">
<title>\${week-number}</title>
<d2l_2p0:description>\${week-description}</d2l_2p0:description>
<item identifier="\${uuid_placeholder}" identifierref="res_chatbot" isvisible="true">
<title>Chatbot</title>
</item>
<item identifier="\${uuid_placeholder}" identifierref="res_slides" isvisible="true">
<title>Slides</title>
</item>
<item identifier="\${uuid_placeholder}" identifierref="res_quiz_generator" isvisible="false">
<title>Generate quiz</title>
</item>
</item>
</organization>
</organizations>
<resources>
<resource identifier="res_module" type="webcontent" d2l_2p0:material_type="contentmodule" href="" title="\${week-number}"/>
<resource identifier="res_chatbot" type="webcontent" d2l_2p0:material_type="content" href="chatbot.html" title="Chatbot"/>
<resource identifier="res_slides" type="webcontent" d2l_2p0:material_type="contentlink" d2l_2p0:link_target="_blank" href="\${slides-url}" title="Slides"/>
<resource identifier="res_quiz_generator" type="webcontent" d2l_2p0:material_type="contentlink" d2l_2p0:link_target="_blank" href="\${quiz-generator-url}" title="Quiz Generator"/>
<resource identifier="D2L_ORG" type="webcontent" d2l_2p0:material_type="orgunitconfig" href="orgunitconfig/orgunitconfig.xml" title="OrgUnitConfig"/>
</resources>
</manifest>
`;
}



/**
 * Generates the full HTML content for a standalone chatbot page.
 * @param {object} config - The overall module configuration.
 * @returns {string} The complete HTML for the chatbot page.
 */
function generateChatbotHtml(config) {
  const chatbotTitle = config.weekNumber ? `${config.weekNumber} Chatbot` : "Chatbot";

  const slideIdMatch = config.slideUrl.match(/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (!slideIdMatch || !slideIdMatch[1]) {
    throw new Error("Could not extract slide ID from URL: " + config.slideUrl);
  }
  const slideId = slideIdMatch[1];

  // Use templateId from config, with a fallback to "default".
  const templateId = config.templateId || "default";
  // Use the slide ID as the chat ID for persistent conversations.
  const chatId = slideId;
  const contextUrl = `https://script.google.com/macros/s/AKfycbxWR0s5_k_pBo01mP4wfdsFjpLgEFWhWcnRGC9Y6EsBoLtHGriYmMy1RSs7yyyauOGM/exec?id=${slideId}`;


  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${chatbotTitle}</title>
        <base target="_top">
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <script src="https://scrolastic.firebaseapp.com/bundle.js"></script>
        <chat-box
          chat-title="${chatbotTitle}"
          style="height: 90vh;"
          chat-id="${chatId}"
          template-id="${templateId}">
          <context src="${contextUrl}"></context>
        </chat-box>
      </body>
    </html>
  `;
  return htmlContent;
}

/**
 * Test function for the simplified module generation process.
 */
function testSimplifiedModuleGeneration() {
  const testConfig = {
    slideUrl: "https://docs.google.com/presentation/d/1xRXu88TRawJCAUNVRgmqUeFyXCZOscWLJADH3WY4iaA/edit",
    weekNumber: "Week 1 - Test"
  };

  try {
    const resultUrl = generateModulePackage(testConfig);
    Logger.log("Test successful! Final package URL:");
    Logger.log(resultUrl);
  } catch (e) {
    Logger.log("Test failed with error:");
    Logger.log(e);
  }
}
