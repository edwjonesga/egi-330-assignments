function normalize(str) {
  return str.toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function graderDoGet(e) {
  const folderId = e.parameter.folderId;
  if (!folderId) {
    return HtmlService.createHtmlOutput("Missing folderId parameter in URL");
  }
  const template = HtmlService.createTemplateFromFile("grading_ui_and_script");
  template.folderId = folderId;
  return template.evaluate()
    .setTitle("Grading Tool")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function processFilesRecursively(folder, fileList, path = [], assignment = null, student = null) {
  const currentPath = [...path, folder.getName()];
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    fileList.push({
      name: file.getName(),
      path: file.getId(),
      fullPath: currentPath.join("/"),
      assignment: assignment,
      student: student,
      comments: getCommentFile(folder, file.getName())
    });
  }
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    processFilesRecursively(sub, fileList, currentPath, assignment, student);
  }
}

function getAssignmentFiles(folderId) {
  console.log("Getting assignments from :"+folderId);
  folderId = folderId ? folderId : '1RMm9mlMQAJNitGJMbUA9nyKBufvHXcfM';
  const parentFolder = DriveApp.getFolderById(folderId);
  const files = parentFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
  if (!files.hasNext()) {
    throw new Error("No spreadsheet found in folder");
  }
  const sheetFile = files.next();
  const sheet = SpreadsheetApp.open(sheetFile).getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let firstNameIndex = -1;
  let lastNameIndex = -1;
  headers.forEach((h, i) => {
    const normalized = normalize(h);
    if (normalized === 'firstname') firstNameIndex = i;
    if (normalized === 'lastname') lastNameIndex = i;
  });
  if (firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error("Could not find 'First Name' and 'Last Name' columns");
  }

  const students = data.slice(1).map(row => ({
    first: row[firstNameIndex],
    last: row[lastNameIndex]
  }));

  const folders = parentFolder.getFolders();
  const fileList = [];

  while (folders.hasNext()) {
    const folder = folders.next();
    const folderName = folder.getName();
    const matchHeader = headers.find(h => normalize(h).startsWith(normalize(folderName)));
    if (!matchHeader) continue;

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      const studentFolder = subfolders.next();
      const name = studentFolder.getName().trim();
      const [first, ...lastParts] = name.split(" ");
      const last = lastParts.join(" ");
      const studentMatch = students.find(s => normalize(s.first) === normalize(first) && normalize(s.last) === normalize(last));
      if (!studentMatch) continue;

      processFilesRecursively(studentFolder, fileList, [folderName, name], folderName, name);
    }
  }
  return fileList;
}

function getFileContent(fileId) {
  return DriveApp.getFileById(fileId).getBlob().getDataAsString();
}

function getCommentFile(folder, fileName) {
  const commentsName = fileName + ".comments";
  const files = folder.getFilesByName(commentsName);
  return files.hasNext() ? files.next().getBlob().getDataAsString() : "";
}

function saveGradeAndComments(fileObj, grade, comment, folderId) {
  folderId = folderId ? folderId : '1RMm9mlMQAJNitGJMbUA9nyKBufvHXcfM';
  const parentFolder = DriveApp.getFolderById(folderId);
  const files = parentFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
  if (!files.hasNext()) {
    throw new Error("No spreadsheet found in folder");
  }
  const sheetFile = files.next();
  const sheet = SpreadsheetApp.open(sheetFile).getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let firstNameIndex = -1;
  let lastNameIndex = -1;
  headers.forEach((h, i) => {
    const normalized = normalize(h);
    if (normalized === 'firstname') firstNameIndex = i;
    if (normalized === 'lastname') lastNameIndex = i;
  });
  if (firstNameIndex === -1 || lastNameIndex === -1) {
    throw new Error("Could not find 'First Name' and 'Last Name' columns");
  }

  const folderName = fileObj.assignment;
  const studentName = fileObj.student;
  const fileName = fileObj.name;
  const [first, ...lastParts] = studentName.split(" ");
  const last = lastParts.join(" ");

  const colIndex = headers.findIndex(h => normalize(h).startsWith(normalize(folderName)));
  if (colIndex === -1) return;

  const rowIndex = data.findIndex((r, i) =>
    i > 0 &&
    normalize(r[lastNameIndex]) === normalize(last) &&
    normalize(r[firstNameIndex]) === normalize(first)
  );
  if (rowIndex === -1) return;

  const maxPointsMatch = headers[colIndex].match(/<Numeric MaxPoints:(\d+)>/);
  const maxPoints = maxPointsMatch ? parseInt(maxPointsMatch[1]) : null;

  if (maxPoints !== null && grade > maxPoints) {
    throw new Error("Grade exceeds max points");
  }

  sheet.getRange(rowIndex + 1, colIndex + 1).setValue(grade);

  const assignmentFolder = parentFolder.getFoldersByName(folderName).next();
  const studentFolder = assignmentFolder.getFoldersByName(studentName).next();

  studentFolder.createFile(fileName + ".comments", comment, MimeType.PLAIN_TEXT);
  return true;
}
