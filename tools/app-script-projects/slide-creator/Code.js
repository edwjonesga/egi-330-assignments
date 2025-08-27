
function createQuizFiles(quiz) {
  // This function now only creates a standalone quiz package.
  // The complex job-based logic has been removed.
  const parentFolder = DriveApp.getFolderById("1cNRpOC1LptPSC83bbQR8NBEj_BGneT_U");
  const folderName = `${quiz.title} - quizz_${quiz.id}`;
  const orgUnitConfigDirName = 'orgunitconfig';
  const orgUnitConfigFileName = 'orgunitconfig.xml';
  const quizFileName = `quiz_d2l_${quiz.id}.xml`;
  const imsManifestFileName = 'imsmanifest.xml';

  const mainFolder = parentFolder.createFolder(folderName);
  console.log(mainFolder.getUrl());

  const orgUnitConfigDir = mainFolder.createFolder(orgUnitConfigDirName);
  orgUnitConfigDir.createFile(orgUnitConfigFileName,
    `<orgunit identifier="f0bc7138-fa77-4082-8e50-ac938c6193c0" default_nav="CUS Default Course Navbar" default_homepage="CUS Default Course Homepage"/>`
  );

  mainFolder.createFile(quizFileName, jsonToBrightspaceXML(quiz));

  const imsManifestContent = `
<manifest xmlns:d2l_2p0="http://desire2learn.com/xsd/d2lcp_v2p0" xmlns:scorm_1p2="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" identifier="D2L_${quiz.id}">
  <metadata>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="en-us">${quiz.className}</imsmd:langstring>
        </imsmd:title>
        <imsmd:keyword>
          <imsmd:langstring xml:lang="en-us">${quiz.className}</imsmd:langstring>
        </imsmd:keyword>
        <imsmd:language>en-us</imsmd:language>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <resources>
    <resource identifier="f0bc7138-fa77-4082-8e50-ac938c6193c0" type="webcontent" d2l_2p0:material_type="orgunitconfig" d2l_2p0:link_target="" href="orgunitconfig/orgunitconfig.xml" title=""/>
    <resource identifier="res_quiz_${quiz.id}" type="webcontent" d2l_2p0:material_type="d2lquiz" d2l_2p0:link_target="" href="${quizFileName}" title="${quiz.title}"/>
  </resources>
</manifest>`;

    mainFolder.createFile(imsManifestFileName, imsManifestContent);
    zipDirectoryContents(mainFolder.getId(), mainFolder.getId());
    return mainFolder.getUrl();
}

// Example usage
const exampleQuiz = {
    "quiz": {
        "id": "4s5d4s",
        "title": "Programming Fundamentals Quiz 2",
        "ident": "quiz_02",
        "resource_code": "PFQ2",
        "description": "This quiz tests your understanding of programming basics, including control structures, data types, and boolean logic.",
        "grade_item": {
            "resource_code": "GI_PFQ2",
            "id": "grade_item_02"
        },
        "questions": [
            {
                "label": "Question 1",
                "type": "Multiple Choice",
                "text": "Which of the following is a valid Python loop?",
                "response": {
                    "options": [
                        { "text": "for i in range(10):", "correct": true },
                        { "text": "while i &lt; 10 then", "correct": false },
                        { "text": "loop i = 0 to 10", "correct": false },
                        { "text": "repeat until i == 10", "correct": false }
                    ]
                }
            },
            {
                "label": "Question 2",
                "type": "Multi-Select",
                "text": "Select all the immutable data types in Python:",
                "response": {
                    "options": [
                        { "text": "List", "correct": false },
                        { "text": "Tuple", "correct": true },
                        { "text": "Dictionary", "correct": false },
                        { "text": "String", "correct": true }
                    ]
                }
            },
            {
                "label": "Question 3",
                "type": "True/False",
                "text": "In Python, the '==' operator checks for equality between two values.",
                "response": {
                    "options": [
                        { "text": "True", "correct": true },
                        { "text": "False", "correct": false }
                    ]
                }
            }
        ]
    }
}

function xmlEscape(str) {
  console.log("escaping a string")
  if (typeof str !== 'string') return str;
  let newStr = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
  if(newStr != str){
    console.log("Changed:"+str+" to "+newStr);
  }
  return newStr;
}

function escapeXmlInObject(obj) {
  if (typeof obj === 'string') {
    return xmlEscape(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => escapeXmlInObject(item));
  } else if (obj !== null && typeof obj === 'object') {
    let escapedObj = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        escapedObj[key] = escapeXmlInObject(obj[key]);
      }
    }
    return escapedObj;
  }
  return obj; // If it's a number, boolean, or null, return as is.
}

function testQuiz(){
  createQuizFiles(exampleQuiz.quiz);
}

function jsonToBrightspaceXML(quizin) {
    quiz = escapeXmlInObject(quizin); 
    const xmlParts = [];
    
    xmlParts.push(`<questestinterop xmlns:d2l_2p0="http://desire2learn.com/xsd/d2lcp_v2p0">`);
    xmlParts.push(`<assessment d2l_2p0:id="${quiz.id || `quiz_${quiz.title.replace(/\s+/g, '_').toLowerCase()}`}" title="${quiz.title}" ident="res_quiz_${quiz.ident || `ident_${quiz.title.replace(/\s+/g, '_').toLowerCase()}`}" d2l_2p0:resource_code="${quiz.resource_code || 'auto_generated_resource_code'}">`);

    // Rubric
    xmlParts.push(`<rubric>`);
    xmlParts.push(`<flow_mat>`);
    xmlParts.push(`<material>`);
    xmlParts.push(`<mattext d2l_2p0:isdisplayed="yes" texttype="text/html"><p>${quiz.description}</p></mattext>`);
    xmlParts.push(`</material>`);
    xmlParts.push(`</flow_mat>`);
    xmlParts.push(`</rubric>`);

    // Assessment control
    xmlParts.push(`<assessmentcontrol hintswitch="no" solutionswitch="yes" feedbackswitch="no"/>`);

    // Presentation material
    xmlParts.push(`<presentation_material>`);
    xmlParts.push(`<flow_mat>`);
    xmlParts.push(`<material label="page header">`);
    xmlParts.push(`<mattext d2l_2p0:isdisplayed="yes" texttype="text/html"/>`);
    xmlParts.push(`</material>`);
    xmlParts.push(`<material label="page footer">`);
    xmlParts.push(`<mattext d2l_2p0:isdisplayed="yes" texttype="text/html"/>`);
    xmlParts.push(`</material>`);
    xmlParts.push(`</flow_mat>`);
    xmlParts.push(`</presentation_material>`);

    // Assess process extension
    xmlParts.push(`<assess_procextension>`);
    xmlParts.push(`<d2l_2p0:intro_message d2l_2p0:isdisplayed="no" texttype="text/plain"/>`);
    xmlParts.push(`<grade_item d2l_2p0:is_autoexport="yes" resource_code="${quiz.grade_item?.resource_code || 'auto_generated_grade_item_resource_code'}">${quiz.grade_item?.id || 'auto_generated_grade_item_id'}</grade_item>`);
    xmlParts.push(`<d2l_2p0:disable_right_click>no</d2l_2p0:disable_right_click>`);
    xmlParts.push(`<d2l_2p0:disable_pager_access>no</d2l_2p0:disable_pager_access>`);
    xmlParts.push(`<is_active>no</is_active>`);
    xmlParts.push(`<d2l_2p0:date_start/>`);
    xmlParts.push(`<d2l_2p0:date_end/>`);
    xmlParts.push(`<d2l_2p0:date_due/>`);
    xmlParts.push(`<d2l_2p0:has_schedule_event>no</d2l_2p0:has_schedule_event>`);
    xmlParts.push(`<d2l_2p0:is_attempt_Rldb>no</d2l_2p0:is_attempt_Rldb>`);
    xmlParts.push(`<d2l_2p0:is_subview_Rldb>no</d2l_2p0:is_subview_Rldb>`);
    xmlParts.push(`<d2l_2p0:time_limit>0</d2l_2p0:time_limit>`);
    xmlParts.push(`<d2l_2p0:show_clock>no</d2l_2p0:show_clock>`);
    xmlParts.push(`<d2l_2p0:enforce_time_limit>no</d2l_2p0:enforce_time_limit>`);
    xmlParts.push(`<d2l_2p0:quiz_start_type>no</d2l_2p0:quiz_start_type>`);
    xmlParts.push(`<d2l_2p0:grace_period>0</d2l_2p0:grace_period>`);
    xmlParts.push(`<d2l_2p0:late_limit>0</d2l_2p0:late_limit>`);
    xmlParts.push(`<d2l_2p0:attempts_allowed>0</d2l_2p0:attempts_allowed>`);
    xmlParts.push(`<d2l_2p0:attempt_restrictions/>`);
    xmlParts.push(`<d2l_2p0:mark_calculation_type>1</d2l_2p0:mark_calculation_type>`);
    xmlParts.push(`<d2l_2p0:is_forward_only>no</d2l_2p0:is_forward_only>`);
    xmlParts.push(`<d2l_2p0:paging_type_id>0</d2l_2p0:paging_type_id>`);
    xmlParts.push(`</assess_procextension>`);

    // Assess feedback
    xmlParts.push(`<assessfeedback>`);
    xmlParts.push(`<rubric>`);
    xmlParts.push(`<flow_mat>`);
    xmlParts.push(`<material>`);
    xmlParts.push(`<mattext texttype="no"/>`);
    xmlParts.push(`</material>`);
    xmlParts.push(`</flow_mat>`);
    xmlParts.push(`</rubric>`);
    xmlParts.push(`<d2l_2p0:duration>0</d2l_2p0:duration>`);
    xmlParts.push(`<d2l_2p0:response_display_type_id>4</d2l_2p0:response_display_type_id>`);
    xmlParts.push(`<d2l_2p0:show_correct_answers>no</d2l_2p0:show_correct_answers>`);
    xmlParts.push(`<d2l_2p0:submission_restrictip>no</d2l_2p0:submission_restrictip>`);
    xmlParts.push(`<d2l_2p0:show_class_average>no</d2l_2p0:show_class_average>`);
    xmlParts.push(`<d2l_2p0:show_score_distribution>no</d2l_2p0:show_score_distribution>`);
    xmlParts.push(`</assessfeedback>`);

    // Section and Questions
    xmlParts.push(`<section ident="CONTAINER_SECTION">`);
    quiz.questions.forEach((question, index) => {
        const itemIdent = `item_${index + 1}`;
        const responseIdent = `response_${index + 1}`;
        
        xmlParts.push(`<item ident="${itemIdent}" label="${question.label || `Question ${index + 1}`}" d2l_2p0:page="1">`);
        question.mandatory == question.mandatory==undefined?true:question.mandatory;
        // Item metadata
        xmlParts.push(`<itemmetadata>`);
        xmlParts.push(`<qtimetadata>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_computerscored</fieldlabel><fieldentry>yes</fieldentry></qti_metadatafield>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_questiontype</fieldlabel><fieldentry>${question.type || 'Multiple Choice'}</fieldentry></qti_metadatafield>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_weighting</fieldlabel><fieldentry>1</fieldentry></qti_metadatafield>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_globalid</fieldlabel><fieldentry>${itemIdent}</fieldentry></qti_metadatafield>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_displayid</fieldlabel><fieldentry>${itemIdent}</fieldentry></qti_metadatafield>`);
        xmlParts.push(`<qti_metadatafield><fieldlabel>qmd_aihumanorigin</fieldlabel><fieldentry>HumanGenerated</fieldentry></qti_metadatafield>`);
        xmlParts.push(`</qtimetadata>`);
        xmlParts.push(`</itemmetadata>`);

        // Item process extension
        xmlParts.push(`<itemproc_extension>`);
        xmlParts.push(`<d2l_2p0:difficulty>3</d2l_2p0:difficulty>`);
        xmlParts.push(`<d2l_2p0:isbonus>no</d2l_2p0:isbonus>`);
        xmlParts.push(`<d2l_2p0:ismandatory>${question.mandatory?"yes":"no"}</d2l_2p0:ismandatory>`);
        xmlParts.push(`</itemproc_extension>`);

        // Presentation
        xmlParts.push(`<presentation>`);
        xmlParts.push(`<flow>`);
        xmlParts.push(`<material>`);
        xmlParts.push(`<mattext texttype="text/html"><p>${question.text}</p></mattext>`);
        xmlParts.push(`</material>`);

        // Response extension
        xmlParts.push(`<response_extension>`);
        xmlParts.push(`<d2l_2p0:display_style>2</d2l_2p0:display_style>`);
        xmlParts.push("<d2l_2p0:enumeration>6</d2l_2p0:enumeration>");
        xmlParts.push("<d2l_2p0:grading_type>0</d2l_2p0:grading_type>");
        //xmlParts.push(`<d2l_2p0:random_order>no</d2l_2p0:random_order>`);          
        xmlParts.push(`</response_extension>`);

        // Response
        xmlParts.push(`<response_lid ident="${responseIdent}" rcardinality="${question.type == "Multi-Select"?"Multiple":"Single"}" >`);
        xmlParts.push(`<render_choice shuffle="Yes">`);
        question.response.options.forEach((option, optIndex) => {
            const optionIdent = `response_${index + 1}_option_${optIndex + 1}`;
            xmlParts.push(`<flow_label class="Block">`);
            xmlParts.push(`<response_label ident="${optionIdent}" >`);
            xmlParts.push(`<flow_mat>`);
            xmlParts.push(`<material>`);
            xmlParts.push(`<mattext texttype="text/html"><p>${option.text}</p></mattext>`);
            xmlParts.push(`</material>`);
            xmlParts.push(`</flow_mat>`);
            xmlParts.push(`</response_label>`);
            xmlParts.push(`</flow_label>`);
        });
        xmlParts.push(`</render_choice>`);
        xmlParts.push(`</response_lid>`);

        xmlParts.push(`</flow>`);
        xmlParts.push(`</presentation>`);

        // Resprocessing
        xmlParts.push(`<resprocessing>`);

        if(question.type == "Multi-Select"){
          console.log("FOUND MULTISELECT!!!");
          // Outcomes
          xmlParts.push(`<outcomes>`);
          xmlParts.push(`<decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>`);
          xmlParts.push(`</outcomes>`);
        }
        // Respcondition
        if(question.type == "Multi-Select"){
          let correctVars = [];
          let incorrectVars = [];

          question.response.options.forEach((option, optIndex) => {
              const optionIdent = `response_${index + 1}_option_${optIndex + 1}`;
              let curVar = `<varequal respident="${responseIdent}">${optionIdent}</varequal>`;
              if(option.correct){
                correctVars.push(curVar);
              }else{
                incorrectVars.push(curVar);
              }
          });

          xmlParts.push(`<respcondition title="Scoring for the correct answers" continue="yes">`); 
          xmlParts.push(`<conditionvar>`);
          xmlParts.push(correctVars.join("\n"));
          xmlParts.push("<not>");
          xmlParts.push(incorrectVars.join("\n"));
          xmlParts.push("</not>")
          xmlParts.push(`</conditionvar>`);
          xmlParts.push(`<setvar action="Add">1</setvar>`);
          xmlParts.push(`</respcondition>`);

          xmlParts.push(`<respcondition title="Scoring for the incorrect answers" continue="yes">`); 
          xmlParts.push(`<conditionvar>`);
          xmlParts.push("<and>");
          xmlParts.push("<not>");
          xmlParts.push(correctVars.join("\n"));
          xmlParts.push("<not>");
          xmlParts.push(incorrectVars.join("\n"));
          xmlParts.push("</not>")
          xmlParts.push("</not>")
          xmlParts.push("</and>");
          xmlParts.push(`</conditionvar>`);
          xmlParts.push(`<setvar action="Add">0</setvar>`);
          xmlParts.push(`</respcondition>`);
        }
        else{
          question.response.options.forEach((option, optIndex) => {
              const optionIdent = `response_${index + 1}_option_${optIndex + 1}`;
              xmlParts.push(`<respcondition>`);  // Removed "continue" attribute
              xmlParts.push(`<conditionvar>`);
              xmlParts.push(`<varequal respident="${responseIdent}">${optionIdent}</varequal>`);
              xmlParts.push(`</conditionvar>`);
              xmlParts.push(`<setvar action="Set">${option.correct ? '100' : '0'}</setvar>`);

              const feedbackIdent = `feedback_${index + 1}_option_${optIndex + 1}`;
              xmlParts.push(`<displayfeedback feedbacktype="Response" linkrefid="${feedbackIdent}"/>`)
              xmlParts.push(`</respcondition>`);
          });
        }
        xmlParts.push(`</resprocessing>`);
        question.response.options.forEach((option, optIndex) => {
          const feedbackIdent = `feedback_${index + 1}_option_${optIndex + 1}`;
          xmlParts.push(`<itemfeedback ident="${feedbackIdent}">`);  // Removed "continue" attribute
          xmlParts.push(`<material>`);
          xmlParts.push(`<mattext texttype="text/plain"/>`);
          xmlParts.push(`</material>`);
          xmlParts.push(`</itemfeedback>`);
        });
        xmlParts.push(`</item>`);
    });
    xmlParts.push(`</section>`);

    xmlParts.push(`</assessment>`);
    xmlParts.push(`</questestinterop>`);

    return xmlParts.join('');
}

function getScriptUrl() {
  var url = ScriptApp.getService().getUrl();
  return url;
}

function doGet(e) {
  var htmlOutput;
  var page = e.parameter.page || 'dashboard'; // Default to 'dashboard' if no parameter is provided

  if (page === 'content') {
    var slideId = e.parameter.id;
    if (slideId) {
      var textContent = extractSlideDeckTextFromId(slideId);
      return ContentService.createTextOutput(textContent)
        .setMimeType(ContentService.MimeType.TEXT);
    } else {
      return ContentService.createTextOutput("Error: 'id' parameter is missing.")
        .setMimeType(ContentService.MimeType.TEXT);
    }
  }

  if(page == 'graderpage'){
    htmlOutput = graderDoGet(e)
  } else if (page === 'module-generator-wizard') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('module-generator-wizard');
  } else if (page === 'TemplateEditor') {
    htmlOutput = HtmlService.createHtmlOutputFromFile('TemplateEditor');
  }
  else{
    let template = HtmlService.createTemplateFromFile(page)
    if(page == 'dashboard'){
      template.scriptUrl = getScriptUrl();
    }
    htmlOutput = template.evaluate();
  }
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  return htmlOutput;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet5() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Google Slides Utility</h1>
        <textarea id="jsonInput" rows="20" cols="50" placeholder="Enter your JSON data here..."></textarea><br>
        <input type="text" id="deckUrl" placeholder="Optional: Paste existing deck URL here"><br>
        <input type="checkbox" id="extractTextOnly"> Extract Slide Text Only<br>
        <button onclick="createOrUpdateSlides()">Create/Update Slides</button>
        <button onclick="extractJSONOrText()">Extract JSON/Text from Slide Deck</button>
        <button onclick="createQuizFiles()">Create Quiz Files from Text/JSON</button>
        <div id="link"></div>
        <script>
          function createOrUpdateSlides() {
            var jsonInput = document.getElementById("jsonInput").value;
            var deckUrl = document.getElementById("deckUrl").value;
            document.getElementById("link").innerHTML = 'Generating...';
            google.script.run.withSuccessHandler(displayLink)
                             .createSlideDeckFromJSON(jsonInput, deckUrl);
          }
          
          function extractJSONOrText() {
            var deckUrl = document.getElementById("deckUrl").value;
            var extractTextOnly = document.getElementById("extractTextOnly").checked;
            if (deckUrl) {
              document.getElementById("link").innerHTML = extractTextOnly ? 'Extracting Text...' : 'Extracting JSON...';
              if (extractTextOnly) {
                google.script.run.withSuccessHandler(displayText)
                                 .extractSlideDeckText(deckUrl);
              } else {
                google.script.run.withSuccessHandler(displayJSON)
                                 .extractSlideDeckJSON(deckUrl);
              }
            } else {
              document.getElementById("link").innerHTML = 'Please enter a deck URL.';
            }
          }

          function createQuizFiles() {
            var jsonInput = document.getElementById("jsonInput").value;
            try {
              var quizData = JSON.parse(jsonInput);
              document.getElementById("link").innerHTML = 'Creating quiz files...';
              google.script.run.withSuccessHandler(displayQuizFolderLink)
                               .createQuizFiles(quizData.quiz);
            } catch (e) {
              document.getElementById("link").innerHTML = 'Error parsing JSON: ' + e.message;
            }
          }

          function displayLink(presentationUrl) {
            console.log(presentationUrl);
            document.getElementById("link").innerHTML = 
              '<a href="' + presentationUrl + '" target="_blank">Download Slide Deck</a>';
          }
          
          function displayJSON(jsonData) {
            console.log(jsonData);
            document.getElementById("jsonInput").value = jsonData;
            document.getElementById("link").innerHTML = 'JSON extracted successfully!';
          }

          function displayText(textData) {
            console.log(textData);
            document.getElementById("jsonInput").value = textData;
            document.getElementById("link").innerHTML = 'Text extracted successfully!';
          }

          function displayQuizFolderLink(folderUrl) {
            console.log(folderUrl);
            document.getElementById("link").innerHTML = 
              '<a href="' + folderUrl + '" target="_blank">View Quiz Files</a>';
          }
        </script>
      </body>
    </html>
  `);
}


function doGet4() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Google Slides Utility</h1>
        <textarea id="jsonInput" rows="20" cols="50" placeholder="Enter your JSON data here..."></textarea><br>
        <input type="text" id="deckUrl" placeholder="Optional: Paste existing deck URL here"><br>
        <input type="checkbox" id="extractTextOnly"> Extract Slide Text Only<br>
        <button onclick="createOrUpdateSlides()">Create/Update Slides</button>
        <button onclick="extractJSONOrText()">Extract JSON/Text from Slide Deck</button>
        <div id="link"></div>
        <script>
          function createOrUpdateSlides() {
            var jsonInput = document.getElementById("jsonInput").value;
            var deckUrl = document.getElementById("deckUrl").value;
            document.getElementById("link").innerHTML = 'Generating...';
            google.script.run.withSuccessHandler(displayLink)
                             .createSlideDeckFromJSON(jsonInput, deckUrl);
          }
          
          function extractJSONOrText() {
            var deckUrl = document.getElementById("deckUrl").value;
            var extractTextOnly = document.getElementById("extractTextOnly").checked;
            if (deckUrl) {
              document.getElementById("link").innerHTML = extractTextOnly ? 'Extracting Text...' : 'Extracting JSON...';
              if (extractTextOnly) {
                google.script.run.withSuccessHandler(displayText)
                                 .extractSlideDeckText(deckUrl);
              } else {
                google.script.run.withSuccessHandler(displayJSON)
                                 .extractSlideDeckJSON(deckUrl);
              }
            } else {
              document.getElementById("link").innerHTML = 'Please enter a deck URL.';
            }
          }

          function displayLink(presentationUrl) {
            console.log(presentationUrl);
            document.getElementById("link").innerHTML = 
              '<a href="' + presentationUrl + '" target="_blank">Download Slide Deck</a>';
          }
          
          function displayJSON(jsonData) {
            console.log(jsonData);
            document.getElementById("jsonInput").value = jsonData;
            document.getElementById("link").innerHTML = 'JSON extracted successfully!';
          }

          function displayText(textData) {
            console.log(textData);
            document.getElementById("jsonInput").value = textData;
            document.getElementById("link").innerHTML = 'Text extracted successfully!';
          }
        </script>
      </body>
    </html>
  `);
}


function doGetokd3() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Google Slides JSON Utility</h1>
        <textarea id="jsonInput" rows="20" cols="50" placeholder="Enter your JSON data here..."></textarea><br>
        <input type="text" id="deckUrl" placeholder="Optional: Paste existing deck URL here"><br>
        <button onclick="createOrUpdateSlides()">Create/Update Slides</button>
        <button onclick="extractJSON()">Extract JSON from Slide Deck</button>
        <div id="link"></div>
        <script>
          function createOrUpdateSlides() {
            var jsonInput = document.getElementById("jsonInput").value;
            var deckUrl = document.getElementById("deckUrl").value;
            document.getElementById("link").innerHTML = 'Generating...';
            google.script.run.withSuccessHandler(displayLink)
                             .createSlideDeckFromJSON(jsonInput, deckUrl);
          }
          
          function extractJSON() {
            var deckUrl = document.getElementById("deckUrl").value;
            if (deckUrl) {
              document.getElementById("link").innerHTML = 'Extracting JSON...';
              google.script.run.withSuccessHandler(displayJSON)
                               .extractSlideDeckJSON(deckUrl);
            } else {
              document.getElementById("link").innerHTML = 'Please enter a deck URL.';
            }
          }

          function displayLink(presentationUrl) {
            console.log(presentationUrl);
            document.getElementById("link").innerHTML = 
              '<a href="' + presentationUrl + '" target="_blank">Download Slide Deck</a>';
          }
          
          function displayJSON(jsonData) {
            console.log(jsonData);
            document.getElementById("jsonInput").value = jsonData;
            document.getElementById("link").innerHTML = 'JSON extracted successfully!';
          }
        </script>
      </body>
    </html>
  `);
}


function createSlideDeckFromJSON(jsonData, existingDeckUrl = null, replaceTitle = false) {
  const pageWidth = 600;
  try {
    jsonData = jsonData ? jsonData : testdata;
    console.log("Parsing JSON data...");
    var data = JSON.parse(jsonData);
    let defaultTitle = data.title;

    var presentation;

    if (existingDeckUrl ) {
      console.log("Opening existing presentation...");
      
      presentation = SlidesApp.openByUrl(existingDeckUrl);
    } 
    if(!existingDeckUrl) {
      console.log("Creating new presentation...");
      presentation = SlidesApp.create(data.title);
    }
    if(replaceTitle && data.title){
      // Use the default title slide and set title and subtitle if creating a new presentation
      var titleSlide = presentation.getSlides()[0];
      console.log("Setting title slide...");
      titleSlide.getPlaceholders()[1].asShape().getText().setText(data.title);
      data.subtitle && titleSlide.getPlaceholders()[0].asShape().getText().setText(data.subtitle);
    }

    // Add content slides
    data.slides.forEach(function(slideData, index) {
      try {
        slideData.title = slideData.title?slideData.title:defaultTitle;
        console.log(`Creating slide ${index + 1}: ${slideData.title}`);
        var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

        // Set the title of the slide
        slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(slideData.title);

        var hasImage = slideData.content.some(c => c.type === 'image');
        var hasChartOrTable = slideData.content.some(c => c.type === 'chart' || c.type === 'table');

        // Flag to check if the slide has text or bullets
        var hasText = slideData.content.some(function(content) {
          return content.type === 'text' || content.type === 'bullets' || content.type === 'code';
        });

        // Process content for the slide
        slideData.content.forEach(function(content) {
          switch (content.type) {
            case 'code':
            case 'text':
              console.log("Adding text...");
              var bodyShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
              var bodyText = bodyShape.getText();

              let insertedText = bodyText.appendParagraph(content.text);

              // Resize the text box if there is an image, chart, or table
              if (hasImage) {
                bodyShape.setWidth(pageWidth * 2 / 3); // 2/3 of the slide width
              } else if (hasChartOrTable) {
                bodyShape.setWidth(pageWidth / 2); // Half the slide width
              }

              if (content.alignment === "center") {
                bodyShape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
                bodyText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
              }

              if (content.resize) {
                adjustTextSize(bodyText);
              }
              if (content.style) {
                console.log("Styling " + insertedText.getRange().asString());
                insertedText.getRange().getTextStyle().setBold(content.style.bold||false).setItalic(content.style.italics||false).setFontSize(content.style.size||20);
              }
              break;

            case 'bullets':
              console.log("Adding bullet points...");
              var bulletShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
              var bulletText = bulletShape.getText();
              content.items.forEach(function(bullet) {
                let bulletParagraph = bulletText.appendParagraph(bullet);
                bulletParagraph.getRange().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
                bulletParagraph.getRange().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.START);
                bulletShape.setContentAlignment(SlidesApp.ContentAlignment.TOP);
                bulletText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.START);

              });

              // Resize the bullet text box if there is an image, chart, or table
              if (hasImage) {
                bulletShape.setWidth(pageWidth * 2 / 3); // 2/3 of the slide width
              } else if (hasChartOrTable) {
                bulletShape.setWidth(pageWidth / 2); // Half the slide width
              }
              if (content.style) {
                bulletText.getTextStyle().setBold(content.style.bold||false).setItalic(content.style.italics||false).setFontSize(content.style.size||18);
              }
              break;

            case 'image':
              console.log("Adding image...");
              var image = slide.insertImage(content.url);
              if (hasText) {
                image.setWidth(pageWidth / 3); // 1/3 of the slide width
                image.setLeft(pageWidth * 2 / 3); // Position on the right side
              } else {
                image.setLeft(50).setTop(50).setWidth(400);
              }
              image.setTop(50);
              break;

            case 'chart':
              console.log("Adding chart...");
              var chart = createChart(content.data);
              var chartImage = slide.insertSheetsChartAsImage(chart);
              if (hasText && !hasImage) {
                chartImage.setWidth(pageWidth / 2); // Half the slide width
                chartImage.setLeft(pageWidth / 2 + 50); // Position on the right side
                chartImage.setTop(50);
              } else {
                chartImage.setLeft(50).setTop(50).setWidth(600).setHeight(300);
              }
              break;

            case 'table':
              console.log("Adding table...");
              var table = slide.insertTable(content.rows, content.columns);
              // Populate the table with data if provided
              content.data.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                  table.getCell(rowIndex, colIndex).getText().setText(cell);
                });
              });

              // Resize the table if there is text or bullets
              if (hasText && !hasImage) {
                table.setLeft(pageWidth / 2 + 50); // Position on the right side
              } else {
                table.setLeft(50).setTop(50);
              }
              break;
            case 'shapes':
              console.log("Adding shapes...");
              insertShapesAndConnectors(slide, content);
              break;
          }
        });
      } catch (e) {
        console.log(e);
      }
    });

    console.log("Slide deck created/appended successfully. Returning URL...");
    return presentation.getUrl();

  } catch (e) {
    console.error("Error: " + e.message);
    return "Error: " + e.message;
  }
}

function extractSlideDeckJSON(slideUrl) {
  try {
    
    let presentation = SlidesApp.openByUrl(slideUrl);

    // Get the presentation title
    let title = presentation.getName();

    // Initialize JSON structure
    let deckJSON = {
      title: title,
      subtitle: "", // Assuming the subtitle is not directly retrievable from the API
      slides: []
    };

    // Get the slides
    let slides = presentation.getSlides();

    slides.forEach((slide, slideIndex) => {
      let slideTitle = slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE);
      if(slideTitle){
        slideTitle = slideTitle.asShape().getText().asString();
      }
      let slideData = {
        title: slideTitle,
        content: []
      };

      let shapes = slide.getShapes();
      shapes.forEach((shape) => {
        let textContent = shape.getText().asString();
        let textStyle = shape.getText().getTextStyle();
        let alignment = shape.getText().getParagraphStyle().getParagraphAlignment();
        let generatedTextContent;
        let bulletContent;
        // Extract text content
        if (textContent && textContent.trim()) {
          generatedTextContent = {
            type: 'text',
            text: textContent,
            alignment: alignment === SlidesApp.ParagraphAlignment.CENTER ? "center" : "left",
            resize: true,
            style: {
              bold: textStyle.isBold(),
              italics: textStyle.isItalic(),
              size: textStyle.getFontSize()
            }
          }
        }

        // Extract bullet points
        let list = shape.getText().getListStyle();
        if (list) {
          let bullets = shape.getText().asString().trim().split('\n');
          if(bullets.length>1){
            bulletContent = {
              type: 'bullets',
              items: bullets,
              style: {
                bold: textStyle.isBold(),
                italics: textStyle.isItalic(),
                size: textStyle.getFontSize()
              }
            };
          }
        }

        if(bulletContent){
          slideData.content.push(bulletContent);
        }else if(generatedTextContent && generatedTextContent.text&& generatedTextContent.text.trim()){
          slideData.content.push(generatedTextContent);
        }
      });



      // Extract images
      /*let images = slide.getImages();
      images.forEach((image) => {
        slideData.content.push({
          type: 'image',
          url: image.getSourceUrl()
        });
      });*/

      // Extract tables
      let tables = slide.getTables();
      tables.forEach((table) => {
        let rows = table.getNumRows();
        let columns = table.getNumColumns();
        let tableData = [];
        for (let i = 0; i < rows; i++) {
          let row = [];
          for (let j = 0; j < columns; j++) {
            row.push(table.getCell(i, j).getText().asString());
          }
          tableData.push(row);
        }
        slideData.content.push({
          type: 'table',
          rows: rows,
          columns: columns,
          data: tableData
        });
      });

      // Assuming charts are rendered as images; you may need to adjust based on how charts are implemented
      /*let charts = slide.getSheetsCharts();
      charts.forEach((chart) => {
        slideData.content.push({
          type: 'chart',
          data: {
            labels: [], // Placeholder as the API doesn't directly expose chart data
            datasets: [] // Placeholder as the API doesn't directly expose chart data
          }
        });
      });*/

      deckJSON.slides.push(slideData);
    });

    return JSON.stringify(deckJSON, null, 2);
  } catch (e) {
    console.error("Error: " + e.message);
    return "Error: " + e.message;
  }
}

function extractSlideDeckText(slideUrl) {
  try {
    // Regular expression to extract the presentation ID from various Google Slides URL formats
    const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
    const match = slideUrl.match(regex);

    if (match && match[1]) {
      const presentationId = match[1];
      return extractSlideDeckTextFromId(presentationId);
    } else {
      // If the regex doesn't match, it might be a malformed URL or just an ID
      console.log("Could not extract ID from URL, attempting to use URL as ID");
      return extractSlideDeckTextFromId(slideUrl);
    }
  } catch (e) {
    console.error("Error in extractSlideDeckText: " + e.message);
    return "Error: " + e.message;
  }
}

function extractSlideDeckTextFromId(slideId) {
  try {
    let presentation = SlidesApp.openById(slideId);

    // Get the presentation title
    let title = presentation.getName();

    // Initialize an array to store the extracted text content
    let extractedText = [];

    // Get the slides
    let slides = presentation.getSlides();

    slides.forEach((slide, slideIndex) => {
      let slideTitleShape = slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE);
      if (slideTitleShape) {
        let slideTitle = slideTitleShape.asShape().getText().asString();
        if(slideTitle.trim()){
          extractedText.push(`Slide ${slideIndex + 1} Title: ${slideTitle.trim()}`);
        }
      }

      let shapes = slide.getShapes();
      shapes.forEach((shape) => {
        // Avoid re-extracting title if it's in a shape that is also a placeholder
        if (shape.getPlaceholderType() !== SlidesApp.PlaceholderType.TITLE) {
          let textContent = shape.getText().asString();

          // Extract text content
          if (textContent && textContent.trim()) {
            extractedText.push(textContent.trim());
          }
        }
      });

      // Extract tables
      let tables = slide.getTables();
      tables.forEach((table) => {
        let rows = table.getNumRows();
        let columns = table.getNumColumns();
        let tableText = "Table:\n";
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < columns; j++) {
            tableText += table.getCell(i, j).getText().asString() + "\t";
          }
          tableText += "\n";
        }
        extractedText.push(tableText.trim());
      });
    });

    // Join all the extracted text content into a single string
    let allText = extractedText.join("\n\n");
    return allText;
  } catch (e) {
    console.error("Error in extractSlideDeckTextFromId: " + e.message);
    return "Error: " + e.message;
  }
}


////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
function testRevEng(){
  console.log(extractSlideDeckJSON("https://docs.google.com/presentation/d/1cBBIcuedMm9i7ISgXXd8IuJ4aJKEJJOg9ufp5x27H_s/edit"));
}

function createSlideDeckFromJSON2(jsonData) {
  const pageWidth = 600;
  try {

    jsonData = jsonData ? jsonData : testdata;
    console.log("Parsing JSON data...");
    var data = JSON.parse(jsonData);

    console.log("Creating new presentation...");
    var presentation = SlidesApp.create(data.title);

    // Use the default title slide and set title and subtitle
    var titleSlide = presentation.getSlides()[0];
    console.log("Setting title slide...");
    titleSlide.getPlaceholders()[1].asShape().getText().setText(data.title);
    titleSlide.getPlaceholders()[0].asShape().getText().setText(data.subtitle);

    // Add content slides
    data.slides.forEach(function(slideData, index) {
      try{
        console.log(`Creating slide ${index + 1}: ${slideData.title}`);
        var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

        // Set the title of the slide
        slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(slideData.title);

        // Flag to check if the slide has image, chart, or table
        var hasImageOrChartOrTable = slideData.content.some(function(content) {
          return content.type === 'image' || content.type === 'chart' || content.type === 'table';
        });

        // Flag to check if the slide has text or bullets
        var hasText = slideData.content.some(function(content) {
          return content.type === 'text' || content.type === 'bullets'|| content.type === 'code';
        });

        // Process content for the slide
        slideData.content.forEach(function(content) {
          switch (content.type) {
            case 'text':
              console.log("Adding text...");
              var bodyShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
              var bodyText = bodyShape.getText();

              let insertedText = bodyText.appendParagraph(content.text);

              // Resize the text box if there is an image, chart, or table
              if (hasImageOrChartOrTable) {
                bodyShape.setWidth(pageWidth / 2); // Half the slide width
                // bodyShape.setLeft(0); // Align text to the left side
              }

              if (content.alignment === "center") {
                bodyShape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
                bodyText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
              }

              if (content.resize) {
                adjustTextSize(bodyText);
              }
              if (content.style) {
                console.log("Styling " + insertedText.getRange().asString());
                insertedText.getRange().getTextStyle().setBold(content.style.bold).setItalic(content.style.italics).setFontSize(content.style.size);
              }
              break;

            case 'bullets':
              console.log("Adding bullet points...");
              var bulletShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
              var bulletText = bulletShape.getText();
              content.items.forEach(function(bullet) {
                let bulletParagraph = bulletText.appendParagraph(bullet);
                bulletParagraph.getRange().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
                bulletParagraph.getRange().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.START);
              });

              // Resize the bullet text box if there is an image, chart, or table
              if (hasImageOrChartOrTable) {
                bulletShape.setWidth(pageWidth / 2); // Half the slide width
                // bulletShape.setLeft(0); // Align bullets to the left side
              }
              if (content.style) {
                bulletText.getTextStyle().setBold(content.style.bold).setItalic(content.style.italics).setFontSize(content.style.size);
              }
              break;

            case 'image':
              console.log("Adding image...");
              var image = slide.insertImage(content.url);
              if (hasText || content.type === 'table') {
                image.setWidth(pageWidth / 2); // Half the slide width
                image.setLeft(pageWidth / 2 + 50); // Position on the right side
              } else {
                image.setLeft(50).setTop(50).setWidth(400);
              }
              image.setTop(50);
              break;

            case 'chart':
              console.log("Adding chart...");
              var chart = createChart(content.data);
              var chartImage = slide.insertSheetsChartAsImage(chart);
              if (hasText || content.type === 'table') {
                chartImage.setWidth(pageWidth / 2); // Half the slide width
                chartImage.setLeft(pageWidth / 2 + 50); // Position on the right side
                chartImage.setTop(50);
              } else {
                chartImage.setLeft(50).setTop(50).setWidth(600).setHeight(300);
              }
              break;

            case 'table':
              console.log("Adding table...");
              var table = slide.insertTable(content.rows, content.columns);
              // Populate the table with data if provided
              content.data.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                  table.getCell(rowIndex, colIndex).getText().setText(cell);
                });
              });

              // Resize the table if there is text or bullets
              if (hasText) {
                //table.setWidth(pageWidth / 2); // Half the slide width
                table.setLeft(pageWidth / 2 + 50); // Position on the right side
              } else {
                table.setLeft(50).setTop(50);
              }
              break;
          }
        });
      }catch(e){
        console.log(e);
      }
    } /* here*/);

    console.log("Slide deck created successfully. Returning URL...");
    return presentation.getUrl();

  } catch (e) {
    console.error("Error: " + e.message);
    return "Error: " + e.message;
  }
}



function adjustTextSize(textBox) {
  console.log("Adjusting text size...");
  var textRange = textBox;
  var fontSize = 30;
  var textLength = textRange.asString().length;
  
  if (textLength > 100) {
    fontSize = 20;
  } else if (textLength > 200) {
    fontSize = 16;
  }
  
  textRange.getTextStyle().setFontSize(fontSize);
}

function applyAnimation(element, type) {
  console.log("Applying animation...");
  if (type === 'click') {
    element.setTransition(SlidesApp.TransitionType.APPEAR_ON_CLICK);
  }
}
function createChart(chartData) {
  console.log("Creating chart...");
  
  // Create a new sheet to store the chart data
  var sheet = SpreadsheetApp.create('tempSheet').getActiveSheet();
  
  // Append the first column with labels as the first row
  chartData.labels.forEach(function(label, index) {
    sheet.appendRow([label].concat(chartData.values.map(value => value[index])));
  });

  // Determine the range dynamically based on the data size
  var numRows = chartData.labels.length;
  var numCols = chartData.values.length + 1; // +1 for the label column
  
  // Create and configure the chart
  var chartBuilder = sheet.newChart();
  chartBuilder.setChartType(Charts.ChartType[chartData.type.toUpperCase()]);
  chartBuilder.addRange(sheet.getRange(1, 1, numRows, numCols)); // Dynamic range selection
  chartBuilder.setPosition(1, 1, 0, 0);

  // Build and insert the chart
  let chart = chartBuilder.build();
  sheet.insertChart(chart);
  
  return chart;
}

function createChart1(chartData) {
  console.log("Creating chart...");
  
  // Create a new sheet to store the chart data
  var sheet = SpreadsheetApp.create('tempSheet').getActiveSheet();
  
  // Append the labels in the first row
  sheet.appendRow([""] .concat(chartData.labels)); // Adding an empty string for the first column
  
  // Append the values, one row at a time
  chartData.values.forEach(function(values, index) {
    // The row label (e.g., "Series 1", "Series 2", etc.) can be generated dynamically
    sheet.appendRow(["Series " + (index + 1)].concat(values));
  });

  // Determine the range dynamically based on the data size
  var numRows = chartData.values.length + 1; // +1 for the labels row
  var numCols = chartData.labels.length + 1; // +1 for the row labels
  
  // Create and configure the chart
  var chartBuilder = sheet.newChart();
  chartBuilder.setChartType(Charts.ChartType[chartData.type.toUpperCase()]);
  chartBuilder.addRange(sheet.getRange(1, 1, numRows, numCols)); // Dynamic range selection
  chartBuilder.setPosition(1, 1, 0, 0);

  // Build and insert the chart
  let chart = chartBuilder.build();
  sheet.insertChart(chart);
  
  return chart;
}

function createChartold(chartData) {
  console.log("Creating chart...");
  var sheet = SpreadsheetApp.create('tempSheet').getActiveSheet();
  sheet.appendRow(chartData.labels);
  sheet.appendRow(chartData.values);
  
  var chartBuilder = sheet.newChart();
  chartBuilder.setChartType(Charts.ChartType[chartData.type.toUpperCase()]);
  chartBuilder.addRange(sheet.getRange("A1:B2"));
  chartBuilder.setPosition(1, 1, 0, 0);
  let chart = chartBuilder.build()
  sheet.insertChart(chart);
  return chart;
}

function doGet2() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Create Google Slides from JSON</h1>
        <textarea id="jsonInput" rows="20" cols="50" placeholder="Enter your JSON data here..."></textarea><br>
        <input type="text" id="deckUrl"  placeholder="Optional: Paste existing deck URL here"><br>
        <button onclick="createSlides()">Create/update Slides</button>
        <div id="link"></div>
        <script>
          function createSlides() {
            var jsonInput = document.getElementById("jsonInput").value;
            var deckUrl = document.getElementById("deckUrl").value;
            document.getElementById("link").innerHTML = 'Generating...';
            google.script.run.withSuccessHandler(displayLink)
                             .createSlideDeckFromJSON(jsonInput, deckUrl);
          }
          
          function displayLink(presentationUrl) {
            console.log(presentationUrl);
            document.getElementById("link").innerHTML = 
              '<a href="' + presentationUrl + '" target="_blank">Download Slide Deck</a>';
          }
        </script>
      </body>
    </html>
  `);
}

function doGet1() {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Create Google Slides from JSON</h1>
        <textarea id="jsonInput" rows="20" cols="50"></textarea><br>
        <button onclick="createSlides()">Create Slides</button>
        <div id="link"></div>
        <script>
          function createSlides() {
            var jsonInput = document.getElementById("jsonInput").value;
            document.getElementById("link").innerHTML = 
              'Generating...';
            google.script.run.withSuccessHandler(displayLink).createSlideDeckFromJSON(jsonInput);
          }
          
          function displayLink(presentationUrl) {
            console.log(presentationUrl)
            document.getElementById("link").innerHTML = 
              '<a href="' + presentationUrl + '" target="_blank">Download Slide Deck</a>';
          }
        </script>
      </body>
    </html>
  `);
}
function createSlideDeckFromJSON1(jsonData) {
  const pageWidth = 600;
  try {
    jsonData = jsonData ? jsonData : testdata;
    console.log("Parsing JSON data...");
    var data = JSON.parse(jsonData);

    console.log("Creating new presentation...");
    var presentation = SlidesApp.create(data.title);

    // Use the default title slide and set title and subtitle
    var titleSlide = presentation.getSlides()[0];
    console.log("Setting title slide...");
    titleSlide.getPlaceholders()[1].asShape().getText().setText(data.title);
    titleSlide.getPlaceholders()[0].asShape().getText().setText(data.subtitle);

    // Add content slides
    data.slides.forEach(function(slideData, index) {
      console.log(`Creating slide ${index + 1}: ${slideData.title}`);
      var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);

      // Set the title of the slide
      slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE).asShape().getText().setText(slideData.title);

      // Flag to check if the slide has image or chart
      var hasImageOrChart = slideData.content.some(function(content) {
        return content.type === 'image' || content.type === 'chart';
      });
      // Flag to check if the slide has image or chart
      var hasText = slideData.content.some(function(content) {
        return content.type === 'text' || content.type === 'bullets';
      });
      // Process content for the slide
      slideData.content.forEach(function(content) {
        switch (content.type) {
          case 'text':
            console.log("Adding text...");
            var bodyShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
            var bodyText = bodyShape.getText();

            let insertedText = bodyText.appendParagraph(content.text);

            // Resize the text box if there is an image or chart
            if (hasImageOrChart) {
              bodyShape.setWidth(pageWidth / 2); // Half the slide width
              //bodyShape.setLeft(0); // Align text to the left side
            }

            if (content.alignment === "center") {
              bodyShape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
              bodyText.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
            }

            if (content.resize) {
              adjustTextSize(bodyText);
            } 
            if(content.style){
              console.log("Styling "+insertedText.getRange().asString());
              insertedText.getRange().getTextStyle().setBold(content.style.bold).setItalic(content.style.italics).setFontSize(content.style.size);
            }
            break;

          case 'bullets':
            console.log("Adding bullet points...");
            var bulletShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY).asShape();
            var bulletText = bulletShape.getText();
            content.items.forEach(function(bullet) {
              let bulletParagraph = bulletText.appendParagraph(bullet);
              bulletParagraph.getRange().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
              bulletParagraph.getRange().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.START);
            });

            // Resize the bullet text box if there is an image or chart
            if (hasImageOrChart) {
              bulletShape.setWidth(pageWidth / 2); // Half the slide width
              //bulletShape.setLeft(0); // Align bullets to the left side
            }
            if(content.style){
              bulletText.getTextStyle().setBold(content.style.bold).setItalic(content.style.italics).setFontSize(content.style.size);
            }
            break;

          case 'image':
            console.log("Adding image..."+hasText);
            var image = slide.insertImage(content.url);
            if(hasText){
              image.setWidth(pageWidth / 2); // Half the slide width
              image.setLeft((pageWidth / 2)+50); // Position on the right side
            }else{
              image.setLeft(50).setTop(50).setWidth(400);
            }
            image.setTop(50);
            break;

          case 'chart':
            console.log("Adding chart..."+hasText);
            var chart = createChart(content.data);
            var chartImage = slide.insertSheetsChartAsImage(chart);
            if(hasText){
              chartImage.setWidth(pageWidth / 2); // Half the slide width
              chartImage.setLeft((pageWidth / 2) + 50); // Position on the right side
              chartImage.setTop(50);
            }else{
              chartImage.setLeft(50).setTop(50).setWidth(600).setHeight(300);
            }
            break;
        }
      });
    });

    console.log("Slide deck created successfully. Returning URL...");
    return presentation.getUrl();

  } catch (e) {
    console.error("Error: " + e.message);
    return "Error: " + e.message;
  }
}

const testdata = `{
  "title": "Test Presentation",
  "subtitle": "A demonstration of slide content",
  "slides": [
    {
      "title": "Introduction",
      "content": [
        {
          "type": "text",
          "text": "Welcome to the presentation!",
          "alignment": "center",
          "resize": true,
          "style": {
            "bold": true,
            "italics": false,
            "size": 24
          }
        },
        {
          "type": "image",
          "url": "https://www.freecodecamp.org/news/content/images/size/w2000/2022/08/pexels-mateusz-dach-2811648.jpg"
        }
      ]
    },
    {
      "title": "Data Overview",
      "content": [
        {
          "type": "bullets",
          "items": [
            "Point 1",
            "Point 2",
            "Point 3"
          ],
          "style": {
            "bold": false,
            "italics": false,
            "size": 18
          }
        },
        {
          "type": "table",
          "rows": 2,
          "columns": 2,
          "data": [
            ["Header 1", "Header 2"],
            ["Value 1", "Value 2"]
          ]
        }
      ]
    },
    {
      "title": "Charts and Images",
      "content": [
        {
          "type": "chart",
          "data": {
            "type": "bar",
            "labels": ["Q1", "Q2", "Q3"],
            "values": [
              [10, 20, 30],
              [15, 25, 35]
            ]
          }
        },
        {
          "type": "image",
          "url": "https://www.freecodecamp.org/news/content/images/size/w2000/2022/08/pexels-mateusz-dach-2811648.jpg"
        }
      ]
    },
    {
      "title": "Final Slide",
      "content": [
        {
          "type": "text",
          "text": "Thank you for your attention!",
          "alignment": "center",
          "resize": true,
          "style": {
            "bold": false,
            "italics": true,
            "size": 20
          }
        },
        {
          "type": "table",
          "rows": 3,
          "columns": 3,
          "data": [
            ["Col 1", "Col 2", "Col 3"],
            ["Data 1", "Data 2", "Data 3"],
            ["Data 4", "Data 5", "Data 6"]
          ]
        }
      ]
    }
  ]
}`

const testdata1 = `{
  "title": "Presentation Title",
  "subtitle": "Presentation Subtitle",
  "slides": [
    {
      "title": "Slide 1: Text and Image",
      "content": [
        {
          "type": "text",
          "text": "This is a centered text with an image on the right.",
          "alignment": "center",
          "style": {
            "bold": true,
            "italics": false,
            "size": 24
          }
        },
        {
          "type": "text",
          "text": "Do italics on this one",
          "alignment": "center",
          "style": {
            "bold": true,
            "italics": true,
            "size": 24
          }
        },
        {
          "type": "image",
          "url": "https://www.freecodecamp.org/news/content/images/size/w2000/2022/08/pexels-mateusz-dach-2811648.jpg"
        }
      ]
    },
    {
      "title": "Slide 2: Text Only",
      "content": [
        {
          "type": "text",
          "text": "A large amount of text with resizing.",
          "resize": true,
          "style": {
            "bold": false,
            "italics": true,
            "size": 18
          }
        }
      ]
    },
    {
      "title": "Slide 3: Bullets",
      "content": [
        {
          "type": "bullets",
          "items": [
            "Bullet point 1",
            "Bullet point 2",
            "Bullet point 3"
          ],
          "style": {
            "bold": false,
            "italics": false,
            "size": 20
          }
        }
      ]
    },
    {
      "title": "Slide 4: Chart",
      "content": [
        {
          "type": "bullets",
          "items": [
            "Bullet point 1",
            "Bullet point 2",
            "Bullet point 3"
          ],
          "style": {
            "bold": false,
            "italics": false,
            "size": 20
          }
        },
        {
          "type": "chart",
          "data": {
            "type": "line",
            "labels": ["Jan", "Feb", "Mar","apr","may","jun"],
            "values": [
              [10, 20, 30,5,54,7,75],
              [15, 25, 35,5,54,7,75]
            ]
          }
        }
      ]
    }
  ]
}`;
