const { defineConfig } = require("cypress");

module.exports = defineConfig({

  viewportWidth: 1366,
  viewportHeight: 768,
  defaultCommandTimeout: 60000,
  requestTimeout: 45000,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  video: false,
  retries: 2,
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    charts: true,
    reportPageTitle: 'Automation test report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false
  },

  e2e: {
    baseUrl: 'https://ui.dev.slate.ai/login',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    experimentalRunAllSpecs: true,

    setupNodeEvents(on, config) {
      // implement node event listeners here
      return require('./cypress/support/plugin.js')(on, config)
    }
  },

  env: {
    ENV : 'dev',
    graphQlEndpoint: 'https://hasura.service.dev.slate.ai/v1/graphql',
    email: 'dailylogcypress@gmail.com',
    password: 'Letmein@7209',
    projectName_1: 'DLAcceptChanges',
    projectName_2: 'DLCreation'
  },
});
