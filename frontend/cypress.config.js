const { defineConfig } = require("cypress");

module.exports = defineConfig({
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports",
    charts: true,
    reportPageTitle: "Reporte QA - Transferencias Internacionales Bank Simulator",
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
      return config;
    },
  },
});