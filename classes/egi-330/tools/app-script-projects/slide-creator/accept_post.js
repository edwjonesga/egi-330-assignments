// Command router - maps string to function
const COMMANDS = {
  "hello": handleHello,
  "sum": handleSum,
  // Add more handlers here
};

// Main entry point for POST requests
function doPost(e) {
  console.log("Working");
  try {
    const path = e.parameter["command"];  // e.g., curl -X POST <url>?command=hello
    const body = JSON.parse(e.postData.contents);

    if (!COMMANDS[path]) {
      return ContentService.createTextOutput(`Unknown command: ${path}`).setMimeType(ContentService.MimeType.TEXT);
    }

    const result = COMMANDS[path](body);  // Call the appropriate handler
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(`Error: ${err.message}`).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Sample command: /hello
function handleHello(data) {
  return { message: `Hello, ${data.name || "World"}!` };
}

// Sample command: /sum
function handleSum(data) {
  const numbers = data.numbers || [];
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return { sum };
}
