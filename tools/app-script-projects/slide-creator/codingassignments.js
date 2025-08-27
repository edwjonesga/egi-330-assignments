/**
 * Creates a combined Brightspace assignment package.
 * 
 * This function takes a single JSON spec that contains:
 * 
 * {
 *   "assignmentName": "Name of the assignment",
 *   "instructionsText": "<p>Assignment instructions as HTML</p>",
 *   "dockerAssignment": {
 *       // Either a Google Drive file id for a Dockerfile…
 *       "dockerFileId": "fileId_here",
 *       // …or a Dockerfile text:
 *       "dockerFileText": "FROM openjdk:11\n...",
 *       "mainJava": "public class Main { ... }",
 *       "mainTestJava": "import org.junit.Test; ... "
 *   }
 * }
 *
 * The package includes:
 *   - Brightspace XML files: imsmanifest.xml, dropbox_d2l.xml, orgunitconfig/orgunitconfig.xml.
 *   - An attachment folder (_attachment_dropbox/1) that contains the docker assignment zipped.
 *
 * @param {Object} spec The complete assignment specification JSON.
 * @return {Blob} A zipped blob containing the assignment package.
 */
function createCombinedBrightspaceAssignmentPackage(spec) {
  // This function now only operates in a standalone mode.
  // The complex job-based logic has been removed as per the new simplified workflow.

  if (!spec.assignmentName) {
    throw new Error("The spec must include 'assignmentName'.");
  }
  if (!spec.dockerAssignment || !spec.dockerAssignment.mainJava || !spec.dockerAssignment.mainTestJava) {
    throw new Error("The spec must include 'dockerAssignment' with 'mainJava' and 'mainTestJava'.");
  }

  spec.instructionFileId = spec.instructionFileId || '1P463dKmyGi5zvCCjFSuFWMhxYbdcI2D9';

  if (!spec.instructionsText) {
    try {
      spec.instructionsText = DriveApp.getFileById(spec.instructionFileId).getBlob().getDataAsString();
    } catch (e) {
      console.log("Failed to read instruction text from file ID: " + spec.instructionFileId, e);
    }
  }
  spec.instructionsTextHtml = fetchInstructionsHtml();
  spec.instructionsTextMd = fetchInstructionsMd();

  spec.instructionsText = fillTemplate(spec.instructionsText, spec);
  spec.instructionsTextMd = fillTemplate(spec.instructionsTextMd, spec);
  spec.instructionsTextHtml = fillTemplate(spec.instructionsTextHtml, spec);

  const resourceCode = Utilities.getUuid();
  const rootFolder = DriveApp.createFolder(`${spec.assignmentName.replace(/\s/g, '_')}_${new Date().getTime()}`);
  
  const dropboxContent =
    `<dropbox xmlns:d2l_2p0="http://desire2learn.com/xsd/d2lcp_v2p0">` +
      `<folder name="${spec.assignmentName}" id="1" submission_type="0" allow_text_submission="False" completion_type="0" allowable_file_type="0" folder_type="2" sort_order="38" folder_is_retricted="false" files_per_submission="0" submissions="2" ai_human_origin="0" resource_code="${resourceCode}" is_hidden="true">` +
        `<instructions text_type="text/html"><text>${escapeHtml(markdownToHtml(spec.instructionsTextHtml))}</text></instructions>` +
        `<attachment_set><links /></attachment_set>` +
      `</folder>` +
    `</dropbox>`;
  rootFolder.createFile("dropbox_d2l.xml", dropboxContent);
  
  const attachmentDropboxFolder = rootFolder.createFolder("_attachment_dropbox");
  const attachmentSubFolder = attachmentDropboxFolder.createFolder("1");
  
  const javaAssignmentZipBlob = createJavaAssignmentZipFromJson(spec.dockerAssignment, spec);
  attachmentSubFolder.createFile(javaAssignmentZipBlob).setName(`${spec.assignmentName.replace(/\s+/g, "_")}Files.zip`);
  
  const orgunitIdentifier = Utilities.getUuid();
  const manifestIdentifier = Utilities.getUuid();

  const orgunitFolder = rootFolder.createFolder("orgunitconfig");
  orgunitFolder.createFile("orgunitconfig.xml", `<orgunit identifier="${orgunitIdentifier}" default_nav="CUS Default Course Navbar"/>`);

  const imsmanifestContent =
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${manifestIdentifier}" xmlns:d2l_2p0="http://desire2learn.com/xsd/d2lcp_v2p0" xmlns:scorm_1p2="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1">
    <resources>
        <resource identifier="${orgunitIdentifier}" type="webcontent" d2l_2p0:material_type="orgunitconfig" d2l_2p0:link_target="" href="orgunitconfig/orgunitconfig.xml" title="" />
        <resource identifier="res_dropbox" type="webcontent" d2l_2p0:material_type="d2ldropbox" d2l_2p0:link_target="" href="dropbox_d2l.xml" title="" />
    </resources>
</manifest>`;
  rootFolder.createFile("imsmanifest.xml", imsmanifestContent);

  const packageZipBlob = zipFolder(rootFolder);
  const file = DriveApp.createFile(packageZipBlob).setName(`${spec.assignmentName.replace(/\s/g, "_")}.zip`);
  rootFolder.setTrashed(true);

  Logger.log("Standalone Brightspace assignment package created successfully!");
  return file.getUrl();
}


/**
 * Creates a Java assignment ZIP package from a JSON specification.
 *
 * The JSON spec for a Docker/Java assignment should have these properties:
 * {
 *   // Either the Drive file ID for a Dockerfile…
 *   "dockerFileId": "Optional Google Drive file ID for Dockerfile",
 *   // …or the Dockerfile text directly.
 *   "dockerFileText": "Optional Dockerfile text",
 *   "mainJava": "Required: Contents for src/Main.java",
 *   "mainTestJava": "Required: Contents for test/MainTest.java"
 * }
 *
 * @param {Object} spec The JSON specification for the Docker/Java assignment.
 * @return {Blob} A zip blob containing the Dockerfile, src/Main.java, and test/MainTest.java.
 */
function createJavaAssignmentZipFromJson(spec, fullSpec) {
  // Validate required properties.
  if (!spec.mainJava || !spec.mainTestJava) {
    throw new Error("Docker assignment spec must include 'mainJava' and 'mainTestJava'."+JSON.stringify(spec));
  }
  console.log("Creating java assignent")
  // Get Dockerfile content from a Drive file ID or text.
  var dockerContent = "";
  spec.dockerFileId = spec.dockerFileId?spec.dockerFileId:'1ue-IvpaByECuq3GwAzEZdAbYyotYqJjA';
  if (spec.dockerFileId && !spec.dockerFileText) {
    try {
      var dockerFile = DriveApp.getFileById(spec.dockerFileId);
      dockerContent = fetchDockerFile();
      dockerContent = fillTemplate(dockerContent,spec)
    } catch (e) {
      throw new Error("Could not retrieve Dockerfile from Drive ID: " + spec.dockerFileId);
    }
  } else if (spec.dockerFileText) {
    dockerContent = spec.dockerFileText;
  } else {
    throw new Error("Docker assignment spec must include either 'dockerFileId' or 'dockerFileText' for the Dockerfile.");
  }
  let parentFolder = DriveApp.getFolderById('16LsX0b6LXpZCRhjLHqGlcJaWLjZntnxq');
  // Create a temporary folder to assemble the Docker/Java assignment.
  var tempFolder = parentFolder.createFolder(fullSpec.assignment_short_name);
  
  // Create Dockerfile.
  tempFolder.createFile("Dockerfile", dockerContent);

  // Create Readme File.
  tempFolder.createFile("README.md", (fullSpec.instructionsTextMd));
  
  // Create src/Main.java.
  var srcFolder = tempFolder.createFolder("src");
  //srcFolder.createFile("Main.java", spec.mainJava);
  createJavaFilesFromString(spec.mainJava, srcFolder.getId())
  // Create test/MainTest.java.
  var testFolder = tempFolder.createFolder("test");
  testFolder.createFile("MainTest.java", spec.mainTestJava);
  
  // Zip the folder structure.
  var zipBlob = zipFolder(tempFolder);
  
  // (Optional) Save the Java assignment zip to Drive.
  DriveApp.createFile(zipBlob).setName("JavaAssignmentPackage.zip");
  
  // (Optional) Clean-up the temporary folder.
  // tempFolder.setTrashed(true);
  
  Logger.log("Docker/Java assignment package created successfully!");
  return zipBlob;
}


/**
 * Helper function to escape special characters for XML.
 *
 * @param {string} str The string to escape.
 * @return {string} The escaped string.
 */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}


/**
 * Recursively packages a folder (and its subfolders) into a zip blob,
 * preserving the file paths.
 *
 * @param {Folder} folder The root folder to zip.
 * @return {Blob} A zipped blob of the folder contents.
 */
function zipFolder(folder) {
  var filesMap = {};
  
  /**
   * Recursively add files from the folder and subfolders to filesMap.
   * 
   * @param {Folder} currentFolder The current folder to process.
   * @param {string} path The relative path inside the zip.
   */
  function addFiles(currentFolder, path) {
    // Add files in the current folder.
    var files = currentFolder.getFiles();
    while (files.hasNext()) {
      var file = files.next();
      filesMap[path + file.getName()] = file.getBlob();
    }
    // Process subfolders.
    var folders = currentFolder.getFolders();
    while (folders.hasNext()) {
      var childFolder = folders.next();
      addFiles(childFolder, path + childFolder.getName() + "/");
    }
  }
  
  addFiles(folder, "");
  
  // Build an array of blobs with names set to their relative paths.
  var blobArray = [];
  for (var relativePath in filesMap) {
    blobArray.push(filesMap[relativePath].setName(relativePath));
  }
  
  return Utilities.zip(blobArray, folder.getName() + ".zip");
}

function fillTemplate(template, context) {
  return template.replace(/\${(.*?)}/g, (match, variable) => context[variable.trim()] || match);
}
function test(){
// Example usage
let template = "Hello, ${name}! Welcome to ${place}.";
let context = { name: "Edward", place: "Colorado" };
let filledString = fillTemplate(template, context);

console.log(filledString); // Output: "Hello, Edward! Welcome to Colorado."
}
/**
 * Test function that builds the combined Brightspace assignment package using a sample JSON spec.
 */
function testCreateCombinedBrightspaceAssignmentPackage() {
  // Sample JSON spec combining assignment details and Docker/Java assignment.
  var combinedSpec = {
  "assignmentName": "GCD Implementations and Fraction Sum with Docker",
  "assignment_short_name":"gcd-assignment",
  "dockerAssignment": {
    "mainJava": "public class Main {\n\n    // Method to calculate GCD using the brute-force method\n    // TODO: Implement the brute-force GCD algorithm\n    public static int gcdBruteForce(int a, int b) {\n        return 0; // Placeholder\n    }\n\n    // Method to calculate GCD using the subtraction method\n    // TODO: Implement the subtraction GCD algorithm\n    public static int gcdSubtraction(int a, int b) {\n        return 0; // Placeholder\n    }\n\n    // Method to calculate GCD using the binary GCD method\n    // TODO: Implement the binary GCD algorithm\n    public static int gcdBinary(int a, int b) {\n        return 0; // Placeholder\n    }\n\n    // Method to calculate GCD using Euclid's algorithm\n    // TODO: Implement Euclid's GCD algorithm\n    public static int gcdEuclid(int a, int b) {\n        return 0; // Placeholder\n    }\n\n    // Fraction class\n    public static class Fraction {\n        private int numerator;\n        private int denominator;\n\n        public Fraction(int numerator, int denominator) {\n            this.numerator = numerator;\n            this.denominator = denominator;\n        }\n\n        // TODO: Implement the method to add three fractions\n        public static Fraction sumFractions(Fraction f1, Fraction f2, Fraction f3) {\n            return new Fraction(0, 1); // Placeholder\n        }\n    }\n}\n",
    "mainTestJava": "import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class MainTest {\n\n    @Test\n    public void testGcdBruteForce() {\n        // TODO: Add test cases for gcdBruteForce\n    }\n\n    @Test\n    public void testGcdSubtraction() {\n        // TODO: Add test cases for gcdSubtraction\n    }\n\n    @Test\n    public void testGcdBinary() {\n        // TODO: Add test cases for gcdBinary\n    }\n\n    @Test\n    public void testGcdEuclid() {\n        // TODO: Add test cases for gcdEuclid\n    }\n\n    @Test\n    public void testSumFractions() {\n        // TODO: Add test cases for sumFractions\n    }\n}\n"
  }
}

  
  var zipBlob = createCombinedBrightspaceAssignmentPackage(combinedSpec);
  Logger.log("Combined package created: " + zipBlob);
}

function htmlToMarkdown(html) {
  html = html.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
  html = html.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
  html = html.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');
  html = html.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n');
  html = html.replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n');
  html = html.replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n');
  html = html.replace(/<p>(.*?)<\/p>/gi, '$1\n');
  html = html.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  html = html.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  html = html.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  html = html.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
  html = html.replace(/<img src="(.*?)" alt="(.*?)"\/?>/gi, '![$2]($1)');
  html = html.replace(/<ul>\s*(.*?)\s*<\/ul>/gis, (match, items) => {
    return items.replace(/<li>(.*?)<\/li>/gi, '- $1');
  });
  html = html.replace(/<ol>\s*(.*?)\s*<\/ol>/gis, (match, items) => {
    let counter = 0;
    return items.replace(/<li>(.*?)<\/li>/gi, () => {
      counter++;
      return `${counter}. $1`;
    });
  });

  return html.replace(/\n{2,}/g, '\n').trim(); // Normalize excessive newlines
}

function testHtmlToMarkdown() {
  var html = "<h1>Hello World</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p>";
  var markdown = htmlToMarkdown(html);
  Logger.log(markdown);
}
function markdownToHtml(markdown) {
  // Convert headings
  markdown = markdown.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  markdown = markdown.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  markdown = markdown.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Convert bold and italic
  markdown = markdown.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>'); // Bold + Italic
  markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Bold
  markdown = markdown.replace(/\*(.*?)\*/g, '<i>$1</i>'); // Italic

  // Convert inline code
  markdown = markdown.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert block code
  markdown = markdown.replace(/```([^`]+)```/gs, '<pre><code>$1</code></pre>');

  // Convert lists (unordered)
  markdown = markdown.replace(/^\s*-\s(.*)$/gm, '<li>$1</li>');
  markdown = markdown.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

  // Convert lists (ordered)
  markdown = markdown.replace(/^\s*\d+\.\s(.*)$/gm, '<li>$1</li>');
  markdown = markdown.replace(/(<li>.*<\/li>)/gms, '<ol>$1</ol>');

  // Convert links
  markdown = markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert images
  markdown = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>');

  // Convert line breaks
  markdown = markdown.replace(/\n{2,}/g, '</p><p>'); // Convert double line breaks into paragraph breaks
  markdown = `<p>${markdown}</p>`; // Wrap everything in paragraphs
  markdown = markdown.replace(/<\/ul><ul>/g, ''); // Remove extra <ul> tags
  markdown = markdown.replace(/<\/ol><ol>/g, ''); // Remove extra <ol> tags

  return markdown.trim();
}

