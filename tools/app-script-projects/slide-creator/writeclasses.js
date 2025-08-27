function createJavaFilesFromString(javaSource, folderId) {
  // Preprocess the source to handle concatenated classes on a single line
  javaSource = javaSource.replace(/\s*(public (class|interface|enum|record|abstract class))/g, '\n$1');

  const folder = DriveApp.getFolderById(folderId);

  if (!folder) {
    throw new Error('Invalid folder ID provided.');
  }

  // Ensure the presence of the 'Main' class
  if (!javaSource.includes('public class Main')) {
    throw new Error("The provided Java source must include a public class named 'Main'.");
  }

  const publicClassRegex = /^\s*public\s+class\s+(\w+).*\{/;
  const publicAbstractClassRegex = /^\s*public\s+abstract\s+class\s+(\w+).*\{/;
  const publicIfcRegex = /^\s*public\s+interface\s+(\w+).*\{/;
  const publicEnumRegex = /^\s*public\s+enum\s+(\w+).*\{/;
  const publicRecordRegex = /^\s*public\s+record\s+(\w+).*\{/;
  const lines = javaSource.split('\n');

  const classContents = {};
  let mainClassContent = "";
  let currentClass = null;
  let braceCount = 0;

  // Buffer to accumulate class content until we close the class
  let classBuffer = "";
  let isMainClass = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for a new public class/interface declaration (ignore if inside another class)
    if (!currentClass) {
      const classMatch = trimmedLine.match(publicClassRegex) || trimmedLine.match(publicIfcRegex) || trimmedLine.match(publicAbstractClassRegex)|| trimmedLine.match(publicEnumRegex) || trimmedLine.match(publicRecordRegex);
      if (classMatch) {
        const className = classMatch[1];

        // If this is a public class Main, redirect to Main.java
        if (className === "Main") {
          isMainClass = true;
          mainClassContent += line + '\n';
        } else {
          currentClass = className;
          classBuffer = line + '\n';  // Start accumulating the new public class content
          braceCount = 1;
        }
        continue;
      }
    }

    if (currentClass) {
      // Accumulate lines into the class buffer
      classBuffer += line + '\n';

      // Track opening and closing braces
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      // If we close the current class
      if (braceCount === 0) {
        classContents[currentClass] = classBuffer;
        currentClass = null;
        classBuffer = "";
      }
    } else {
      // Any lines not part of a separate public class go to Main.java
      mainClassContent += line + '\n';
    }
  }

  // Handle any leftover content in the buffer (shouldn't happen, but just in case)
  if (currentClass && classBuffer) {
    classContents[currentClass] = classBuffer;
  }
  console.log("NEw method done executing ",classContents)
  // Write each public class to its own file except Main
  for (const [className, content] of Object.entries(classContents)) {
    const javaFileName = `${className}.java`;
    folder.createFile(javaFileName, content);
  }

  // Write all content to Main.java
  if (mainClassContent.trim()) {
    folder.createFile('Main.java', mainClassContent);
  }
}


function testCreateJavaFiles() {
  const folderId = '19CKVY_eg0XevML2FtXl68jQ-T8uCTmzc';
  const javaSource = `
    public class Main extends List{
        class Inner {
            // This class stays within Main.java
        }
        public static void main(String[] args) {
            System.out.println("Hello from Main");
        }
    }

    public class OtherClass implements List {
        public void doSomething() {
          if (true) {
            System.out.println("Doing something");
          }
        }
    }

    class NoFile {
        public void helperMethod() {
            System.out.println("Helper method in NoFile");
        }
    }
  `;

  createJavaFilesFromString(javaSource, folderId);
}
