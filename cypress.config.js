const { defineConfig } = require("cypress");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const fs = require('fs');
const path = require('path');
const userData = require('./cypress/fixtures/users.json');
const productData = require('./cypress/fixtures/products.json');
require('dotenv').config();


module.exports = defineConfig({
  projectId: "22i3v2",
  e2e: {
    specPattern: "**/*.feature",
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      
      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      on('task', {
        listFiles() {
          const downloadsFolder = path.join(__dirname, 'cypress/downloads');
          if (!fs.existsSync(downloadsFolder)) {
            fs.mkdirSync(downloadsFolder, { recursive: true });
            return [];
          }
          return fs.readdirSync(downloadsFolder);
        },
        deleteDownloads() {
          const downloadsFolder = path.join(__dirname, 'cypress/downloads');
          if (fs.existsSync(downloadsFolder)) {
            fs.readdirSync(downloadsFolder).forEach(file => {
              fs.unlinkSync(path.join(downloadsFolder, file));
            });
          }
          return null;
        },
        waitForDownload(filePattern, timeout = 10000) {
          return new Promise((resolve, reject) => {
            const downloadsFolder = path.join(__dirname, 'cypress/downloads');
            
            // Start time for timeout tracking
            const startTime = Date.now();
            
            // Check function that will be called repeatedly
            const checkForFile = () => {
              // Check if timeout exceeded
              if (Date.now() - startTime > timeout) {
                return reject(new Error(`Timed out waiting for download: ${filePattern}`));
              }
              
              // List files in downloads folder
              if (fs.existsSync(downloadsFolder)) {
                const files = fs.readdirSync(downloadsFolder);
                const matchingFile = files.find(filename => {
                  return filename.includes(filePattern) || 
                         new RegExp(filePattern).test(filename);
                });
                
                if (matchingFile) {
                  // File found! Wait a bit more to ensure it's fully written
                  setTimeout(() => {
                    resolve(matchingFile);
                  }, 500);
                  return;
                }
              }
              
              // File not found yet, check again after a delay
              setTimeout(checkForFile, 500);
            };
            
            // Start checking
            checkForFile();
          });
        },
        // Check if file exists in downloads folder
        checkFileExists(filename) {
          const filePath = path.join(__dirname, 'cypress/downloads', filename);
          return fs.existsSync(filePath);
        },
        
      });

      return config;
    },
    // Rest of your config remains the same
    "chromeWebSecurity": false,
    // other settings...
    "viewportWidth": 1280,
    "viewportHeight": 720,
    "defaultCommandTimeout": 10000, // Global Time Out Period
    "download": {
      "directory": "./cypress/downloads"
    },
    "video": false,
    "screenshotOnRunFailure": true,
    "trashAssetsBeforeRuns": true,
    "pageLoadTimeout": 30000,
    "env": {
        "BASE_URL": process.env.BASE_URL,
        "DEFAULT_USER_EMAIL": process.env.DEFAULT_USER_EMAIL,
        "DEFAULT_USER_PASSWORD": process.env.DEFAULT_USER_PASSWORD,
        "SMTP_USER":process.env.SMTP_USER,
        "SMTP_PASS": process.env.SMTP_PASS,
        "SMTP_PORT": process.env.SMTP_PORT,
        "SMTP_HOST": process.env.SMTP_HOST,
        "REPORT_RECIPIENTS": process.env.REPORT_RECIPIENTS,
        "CLOUD_URL": process.env.CLOUD_URL,
    },
  },
});