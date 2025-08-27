function createColabNotebookFromFolderNew(folderUrl, testCasesJSON) {
  var folderId = extractFolderIdFromUrl(folderUrl);
  var folder = DriveApp.getFolderById(folderId);
  var folderName = folder.getName();
  console.log("Folder Name",folderName);

  var notebookName = folderName.split(" Download")[0].trim();
  if(folderName.endsWith(".zip")){
    // Need to unzip first. So lets do that.
    folder = unzipFileToParent(folder.getId(),true);
    renameFileTruncatingAfterString(folder.getId(),"Download");
    folderName = folder.getName();
    // Add the docker file to the parent directory for easy grading
    dockerContent = fetchDockerFile();
    folder.createFile("Dockerfile", dockerContent);
  }

  var colabNotebook = {
    cells: [],
    metadata: {
      colab: { name: notebookName, version: "0.3.2" },
      kernelspec: { display_name: "Python 3", language: "python3", name: "python3" },
      language_info: { name: "python" }
    },
    nbformat: 4,
    nbformat_minor: 0
  };

  let isPythonAssignment = false;
  let isZippedAssignment = false;
  var studentFolders = folder.getFolders();
  var folderArray = [];
  while (studentFolders.hasNext()) {
    var studentFolder = studentFolders.next();
    if (studentFolder.getName().indexOf("-") === -1) continue;
    folderArray.push(studentFolder);
  }

  folderArray.sort((a, b) =>
    a.getName().split(" - ")[1].split(" ")[1]
      .localeCompare(b.getName().split(" - ")[1].split(" ")[1])
  );

  folderArray.forEach(studentFolder => {
    console.log("Processing Folder", studentFolder.getName())
    var studentName = studentFolder.getName().split(" - ")[1].trim();
    var firstName = studentName.split(" ")[0];  // Extract the first name
    var functionName = `run_${studentName.replace(/\s+/g, '_').toLowerCase()}`;

    // Markdown section for the student
    colabNotebook.cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [`# ${studentName}\n`]
    });
    var assignmentFiles = studentFolder.getFiles();
    while (assignmentFiles.hasNext()) {
      var assignmentFile = assignmentFiles.next();
      if (assignmentFile.getName().endsWith('.py')) {
        isPythonAssignment = true;
        var content = assignmentFile.getBlob().getDataAsString();

        // Place %reset -f outside the function definition
        var wrappedCode = `%reset -f\n\n` +
                          `def ${functionName}():\n` +
                          content.split('\n').map(line => '    ' + line).join('\n');

        // Add the function definition with the reset command as a code cell
        colabNotebook.cells.push({
          cell_type: "code",
          metadata: {},
          source: wrappedCode.split('\n').map(line => line + '\n'),
          execution_count: null,
          outputs: []
        });

        // Code to run all test cases in a loop
        colabNotebook.cells.push({
          cell_type: "code",
          metadata: {},
          source: [
            `import json, os, traceback\n`,
            `# Initialize or load test results as a dictionary (map)\n`,
            `file_name = "${studentName}_test_results.json"\n`,
            `if os.path.exists(file_name):\n`,
            `    with open(file_name, "r") as f:\n`,
            `        test_results = json.load(f)\n`,
            `else:\n`,
            `    test_results = {}\n`,
            `print(f"Loaded {len(test_results)} tests from disk.")\n`,

            `# Run all test cases in a loop\n`,
            `for i, testCase in enumerate(${JSON.stringify(testCasesJSON)}, start=1):\n`,
            `    test_id = f"test_{i}"\n`,
            `    print("\\n----------------------------------------")\n`,

            `    # Ask if the test should be skipped\n`,
            `    if input(f"Do you want to skip {testCase['description']}? (y/n): ").lower() == 'y':\n`,
            `        print(f"Skipping {test_id}...")\n`,
            `        continue\n`,

            `    # Print input and expected output neatly\n`,
            `    print(f"Running {testCase['description']}...")\n`, 
            `    print("  Inputs:")\n`,
            `    for inp in testCase['input']:\n`,
            `        print(f"    - {inp}")\n`, 
            `    print("  Expected Outputs:")\n`,
            `    for out in testCase['expected_output']:\n`,
            `        print(f"    - {out}")\n`,

            `    try:\n`,
            `        # Call the student's function\n`,
            `        ${functionName}()\n`,
            `        print("Execution completed.")\n`,

            `        # Ask if we received the expected output\n`,
            `        expected = input("Did you receive the expected output? (y/n): ")\n`,
            `        if expected.lower() == 'y':\n`,
            `            print(f"Test {test_id} passed.")\n`,
            `            test_results[test_id] = {\n`,
            `                "description": testCase["description"],\n`,
            `                "input": testCase["input"],\n`,
            `                "expected_output": testCase["expected_output"],\n`,
            `                "status": "passed",\n`,
            `                "score": testCase["score"]\n`,
            `            }\n`,
            `        else:\n`,
            `            raise Exception("Unexpected output.")\n`,

            `    except Exception as e:\n`,
            `        print(f"Test {test_id} failed with exception: {str(e)}")\n`,
            `        print("Traceback:")\n`,
            `        traceback.print_exc()\n`,
            `        reason = input("Explain the issue: ")\n`,
            `        test_results[test_id] = {\n`,
            `            "description": testCase["description"],\n`,
            `            "input": testCase["input"],\n`,
            `            "expected_output": testCase["expected_output"],\n`,
            `            "status": "failed",\n`,
            `            "reason": reason,\n`,
            `            "score": testCase["score"]\n`,
            `        }\n`,

            `    finally:\n`,
            `        # Save test results to disk\n`,
            `        with open(file_name, "w") as f:\n`,
            `            json.dump(test_results, f)\n`,
            `        print(f"Saved {len(test_results)} tests to disk.")\n`,

            `# Recalculate the total score and points deducted\n`,
            `total_score = 0\n`,
            `total_points_deducted = 0\n`,
            `print("\\n###################################")\n`,
            `print(f"Hey {firstName},")\n`,
            `print("So I ran the following test cases on your code.")\n`,
            `print("Here are the ones that didn't pass:")\n`,

            // Check if any failed tests exist
            `failed_tests = [details for details in test_results.values() if details['status'] == 'failed']\n`,

            `if not failed_tests:\n`,
            `    print("  crickets, cricket...")\n`,
            `    print("That's right... your code passed everything I threw at it.")\n`,
            `    print("Noice Job!")\n`,
            `else:\n`,
            `    for test_id, details in test_results.items():\n`,
            `        if details['status'] == 'passed':\n`,
            `            total_score += details['score']\n`,
            `        elif details['status'] == 'failed':\n`,
            `            print(f"Test Case Description: {details['description']}")\n`,
            `            print("  Inputs:")\n`,
            `            for inp in details['input']:\n`,
            `                print(f"    - {inp}")\n`,
            `            print("  Expected Outputs:")\n`,
            `            for out in details['expected_output']:\n`,
            `                print(f"    - {out}")\n`,
            `            print(f"  Reason: {details['reason']}")\n`,
            `            print(f"  Points Deducted: {details['score']}")\n`,
            `            total_points_deducted += details['score']\n`,

            `print("###################################")\n`,
            `print(f"Total Points Awarded: {total_score}")\n`,
            `print(f"Total Points Deducted: {total_points_deducted}")\n`
            /*
            `# Recalculate the total score and points deducted\n`,
            `total_score = 0\n`,
            `total_points_deducted = 0\n`,
            `print("\\n###################################")\n`,
            `print(f"Hey ${firstName},")\n`,
            `print("So I ran the following test cases on your code.")\n`,
            `print("Here are the ones that didn't pass:")\n`,

            `for test_id, details in test_results.items():\n`,
            `    if details['status'] == 'passed':\n`,
            `        total_score += details['score']\n`,
            `    elif details['status'] == 'failed':\n`,
            `        print(f"Test Case Description: {details['description']}")\n`,
            `        print("  Inputs:")\n`,
            `        for inp in details['input']:\n`,
            `            print(f"    - {inp}")\n`,
            `        print("  Expected Outputs:")\n`,
            `        for out in details['expected_output']:\n`,
            `            print(f"    - {out}")\n`,
            `        print(f"  Reason: {details['reason']}")\n`,
            `        print(f"  Points Deducted: {testCase['score']}")\n`,
            `        total_points_deducted += details['score']\n`,

            `print("###################################")\n`,
            `print(f"Total Points Awarded: {total_score}")\n`,
            `print(f"Total Points Deducted: {total_points_deducted}")\n`*/
          ],
          execution_count: null,
          outputs: []
        });
      }else if(assignmentFile.getName().endsWith(".zip")){
        isZippedAssignment = true;
        console.log("Found assignenmt for "+ studentName);
        unzipFileToParent(assignmentFile.getId());
        studentFolder.setName(studentName);
      }
    }
  });
  if(isPythonAssignment){
    var notebookBlob = Utilities.newBlob(JSON.stringify(colabNotebook, null, 2), 'application/json', `${notebookName}.ipynb`);
    var notebookFile = folder.createFile(notebookBlob);
    return notebookFile.getUrl();
  }
  if(isZippedAssignment){
    return 
  }
}

function extractFolderIdFromUrl(url) {
  var match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
