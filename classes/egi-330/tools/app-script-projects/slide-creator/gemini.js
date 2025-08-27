/**
 * Calls Gemini Pro via Google AI API
 * @param {string} prompt The prompt to send to Gemini
 * @return {string} The model's response
 */
function callGemini(prompt, printPrompt=false, rateLimit = 0) {
  if(printPrompt){
    console.log(prompt);
  }
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  Utilities.sleep(rateLimit*1000);
  try {
    return json.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Error: " + (json.error?.message || "Unknown error");
  }
}
var jsonquizsyntax=`
Remember this JSON Quiz Syntax
      {
        "quiz": {
          "id": "unique_id",
          "title": "Quiz Title",
          "ident": "quiz_ident",
          "resource_code": "resource_code",
          "description": "Quiz description here.",
          "grade_item": {
            "resource_code": "grade_item_resource_code",
            "id": "grade_item_id"
          },
          "questions": [
            {
              "label": "Question 1",
              "type": "Multiple Choice",
              "text": "Question 1 text here.",
              "response": {
                "options": [
                  { "text": "Option 1", "correct": true },
                  { "text": "Option 2", "correct": false }
                ]
              }
            },
            {
              "label": "Question 2",
              "type": "Multi-Select",
              "text": "Question 2 text here.",
              "response": {
                "options": [
                  { "text": "Option 1", "correct": true },
                  { "text": "Option 2", "correct": false },
                  { "text": "Option 3", "correct": true }
                ]
              }
            },
            {
              "label": "Question 3",
              "type": "True/False",
              "text": "Question 3 text here.",
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
      And generate 10 quiz questions of reasonable difficulty using this content only.

      `
function testGemini() {
  const response = callGemini('What do you remember?');
  Logger.log(response);
}
