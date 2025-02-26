import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const buildPath = path.resolve(__dirname, '../dist');
const targetPath = path.resolve(__dirname, '../../data');
const cppWebServerFilePath = path.resolve(__dirname, '../../src/WebServer.cpp');

// Function to copy files
async function copyFiles(src, dest) {
    await fs.mkdir(dest, { recursive: true });

    const entries = await fs.readdir(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyFiles(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

function replaceBundlePathInCppFile(filePath, jsFileName, cssFileName) {
    fs.readFile(filePath, 'utf8').then((data) => {
        //replace line starts with: "const char INDEX_JS[] PROGMEM = " and "const char INDEX_CSS[] PROGMEM = "
        const newFileData = data.replace(/const char INDEX_JS\[\] PROGMEM = \"\/.*\";/g, `const char INDEX_JS[] PROGMEM = "/assets/${jsFileName}";`)
            .replace(/const char INDEX_CSS\[\] PROGMEM = \"\/.*\";/g, `const char INDEX_CSS[] PROGMEM = "/assets/${cssFileName}";`);
        fs.writeFile(filePath, newFileData, 'utf8');
    }).finally(() => {
        console.log('Cpp file updated successfully.');
    });
}


exec('npm run build', async (error, stdout, stderr) => {
    if (error) {
        console.error(`Error during build: ${error.message}`);
        return;
    }

    if (stderr) {
        console.warn(`Build warnings: ${stderr}`); // Only show warnings without interrupting
    }

    console.log(`Build stdout: ${stdout}`);

    // Verify if the last line of stdout confirms that the build was done correctly
    const stdoutLines = stdout.trim().split("\n");
    const lastLine = stdoutLines[stdoutLines.length - 1];

    if (!lastLine.includes("built in")) {
        console.error("Error: The build did not complete successfully.");
        console.log("Last line of stdout:", lastLine);
        return;
    }

    console.log("The build completed successfully.");

    //delete the old folder (just content, not the folder itself)
    await fs.rm(targetPath, { recursive: true});

    // Copy the generated files
    await copyFiles(buildPath, targetPath);
    console.log('Files copied successfully.');
    
    const jsFileName = stdout.match(/index-.*\.js/)?.[0];
    const cssFileName = stdout.match(/index-.*\.css/)?.[0];

    if (!jsFileName || !cssFileName) {
        console.error("Error: JS or CSS files were not found in the build output.");
        return;
    }

    // Replace paths in the C++ file
    replaceBundlePathInCppFile(cppWebServerFilePath, jsFileName, cssFileName);
});
