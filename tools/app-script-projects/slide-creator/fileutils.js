function zipDirectoryContents(folderIdOrUrl, zipFileLocation) {
  // Get the folder by ID or URL
  let folder;
  if (folderIdOrUrl.includes("https://")) {
    const folderId = folderIdOrUrl.split('/').pop();
    console.log("Filder id",folderId)
    folder = DriveApp.getFolderById(folderId);
  } else {
    folder = DriveApp.getFolderById(folderIdOrUrl);
  }

  const blobs = [];

  // Recursive function to traverse folders and collect file blobs
  function addFolderContentsToBlobs(currentFolder, path) {
    const files = currentFolder.getFiles();
    const folders = currentFolder.getFolders();

    // Add files in the current folder
    while (files.hasNext()) {
      const file = files.next();
      const filePath = path ? `${path}/${file.getName()}` : file.getName();
      const fileBlob = file.getBlob().setName(filePath); // Set the full path as the blob name
      blobs.push(fileBlob);
    }

    // Recursively handle subfolders
    while (folders.hasNext()) {
      const subFolder = folders.next();
      const subFolderPath = path ? `${path}/${subFolder.getName()}` : subFolder.getName();
      addFolderContentsToBlobs(subFolder, subFolderPath);
    }
  }

  // Start adding contents from the root folder
  addFolderContentsToBlobs(folder, "");

  // Create the ZIP file with the collected blobs
  const zipBlob = Utilities.zip(blobs, folder.getName() + '.zip');

  // Save the ZIP file to the specified location
  const zipFolder = DriveApp.getFolderById(zipFileLocation);
  zipFolder.createFile(zipBlob);

  Logger.log('ZIP file created: ' + zipBlob.getName());
}

function unzipFileToParent(fileId, createFolder = false) {
  try {
    // Get the ZIP file by ID
    var zipFile = DriveApp.getFileById(fileId);
    var parentFolder = zipFile.getParents().next(); // Get the parent folder
    var blob = zipFile.getBlob();
    
    // Get the ZIP file name without extension
    var zipFileName = zipFile.getName().replace(/\.zip$/i, "");

    // Determine the extraction folder
    var extractionFolder = parentFolder;
    if (createFolder) {
      // Check if the folder already exists, if not create it
      var folders = parentFolder.getFoldersByName(zipFileName);
      extractionFolder = folders.hasNext() ? folders.next() : parentFolder.createFolder(zipFileName);
    }

    // Unzip the contents while maintaining directory structure
    var unzippedFiles = Utilities.unzip(blob);

    unzippedFiles.forEach(function (fileBlob) {
      var fileName = fileBlob.getName();
      var filePathParts = fileName.split('/'); // Handle subdirectories

      var currentFolder = extractionFolder; // Start from the root extraction folder

      // If the file is inside subfolders, create the necessary folder structure
      if (filePathParts.length > 1) {
        for (var i = 0; i < filePathParts.length - 1; i++) {
          var folderName = filePathParts[i];
          var folders = currentFolder.getFoldersByName(folderName);
          currentFolder = folders.hasNext() ? folders.next() : currentFolder.createFolder(folderName);
        }
      }

      // Save the file in the appropriate folder
      currentFolder.createFile(fileBlob.setName(filePathParts[filePathParts.length - 1]));
    });

    Logger.log("Files extracted successfully to: " + extractionFolder.getName());
    return extractionFolder;
  } catch (e) {
    Logger.log("Error: " + e.toString());
  }
}

function renameFileTruncatingAfterString(fileId, truncateAfter) {
  try {
    // Get the file by ID
    var file = DriveApp.getFileById(fileId);
    var originalName = file.getName();
    
    // Find the position of the truncate string
    var truncateIndex = originalName.indexOf(truncateAfter);
    
    if (truncateIndex !== -1) {
      // Truncate the name and trim whitespace
      var newName = originalName.substring(0, truncateIndex).trim();
      
      // Rename the file
      file.setName(newName);
      Logger.log("File renamed to: " + newName);
    } else {
      Logger.log("The specified string was not found in the file name.");
    }
  } catch (e) {
    Logger.log("Error: " + e.toString());
  }
}


function zipDirectoryContents1(folderIdOrUrl,zipfilelocation) {
  // Get the folder by ID or URL
  let folderId;
  if (folderIdOrUrl.includes("https://")) {
    folderId = DriveApp.getFolderById(folderIdOrUrl.split('/').pop());
  } else {
    folderId = DriveApp.getFolderById(folderIdOrUrl);
  }

  // Get all files in the folder
  const folder = folderId
  const files = folder.getFiles();
  const zipBlob = Utilities.newBlob('', 'application/zip', folder.getName() + '.zip');

  const blobs = [];

  // Loop through all files and add their blobs to the blobs array
  while (files.hasNext()) {
    const file = files.next();
    blobs.push(file.getBlob());
  }

  // Create the ZIP file with the contents of the directory
  const zipFile = Utilities.zip(blobs, folder.getName() + '.zip');

  // Save the ZIP file to the root of Google Drive or a specific folder
  const zipFolder = DriveApp.getRootFolder();
  zipfilelocation.createFile(zipFile);

  Logger.log('ZIP file created: ' + zipFile.getName());
}
function test(){
  zipDirectoryContents('1jcp_HFnOYtMvzf_FJhEw9fIehGyt_8EV','1jcp_HFnOYtMvzf_FJhEw9fIehGyt_8EV')
}