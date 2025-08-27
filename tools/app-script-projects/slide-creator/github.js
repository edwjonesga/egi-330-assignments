function fetchGitHubFile(repo, filePath) {
  var baseUrl = "https://raw.githubusercontent.com/edwjonesga/";
  var url = baseUrl + repo + "/refs/heads/main/" + filePath;
  
  try {
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    if (response.getResponseCode() === 200) {
      return response.getContentText();
    } else {
      Logger.log("Error: " + response.getResponseCode() + " - " + response.getContentText());
      return null;
    }
  } catch (e) {
    Logger.log("Exception: " + e.toString());
    return null;
  }
}

// Example usage:
function fetchInstructionsHtml() {
  var repo = "assignment-tools"; // Replace with your repo name
  var filePath = "exampleinstructions.html"; // Replace with the path to your file
  var content = fetchGitHubFile(repo, filePath);
  
  if (content) {
    Logger.log(content);
    return content;
  } else {
    Logger.log("Failed to retrieve file content.");
  }

}

// Example usage:
function fetchInstructionsMd() {
  var repo = "assignment-tools"; // Replace with your repo name
  var filePath = "exampleinstructions.md"; // Replace with the path to your file
  var content = fetchGitHubFile(repo, filePath);
  
  if (content) {
    Logger.log(content);
    return content;
  } else {
    Logger.log("Failed to retrieve file content.");
  }
}


// Example usage:
function fetchDockerFile() {
  var repo = "assignment-tools"; // Replace with your repo name
  var filePath = "Dockerfile"; // Replace with the path to your file
  var content = fetchGitHubFile(repo, filePath);
  
  if (content) {
    Logger.log(content);
    return content;
  } else {
    Logger.log("Failed to retrieve file content.");
  }
}
