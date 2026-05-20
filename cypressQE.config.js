const { defineConfig } = require("cypress");
const { registerAIOTestsPlugin } = require('cypress-aiotests-reporter/src');

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

  e2e: {
    baseUrl: 'https://ui.qe.slate.ai/login',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    downloadsFolder: "cypress/exports",
    experimentalRunAllSpecs: true,

    setupNodeEvents(on, config) {
      console.log("AIO Plugin Registration Started");
      // Register AIO plugin
      registerAIOTestsPlugin(on, config);
      console.log("AIO Plugin Registration Completed");
      return config;
    }
  },


  env: {
    aioTests: {
      enableReporting: true,
      cloud: {
        apiKey: process.env.AIO_API_KEY || 'NjlkN2ViNDEtMmM4Mi0zNzdjLTg5YWQtYjI4NzU5YWEyYjgwLmQwYzA5MzZmLTlkN2YtNDU5NC1hMjIwLTNmNzE4Zjc5Mjk0NQ=='
      },
      jiraProjectId: "PLA",
      cycleDetails: {
        createNewCycle: false,
        cycleKey: "PLA-CY-Adhoc"
      },
      addNewRun: true,
      addAttachmentToFailedCases: true
    },

    ENV : 'qe',
    graphQlEndpoint: 'https://hasura.service.qe.slate.ai/v1/graphql',
    emailDPR: 'cocav10983@mobilesm.com',
    passwordDPR: 'Quick@123',
    emailAdmin: 'onx2025qe_up@proton.me',
    passwordAdmin: 'Quick@123!',
    emailUserA: 'pefeg83689@hazhab.com',
    passwordUserA: 'Quick@123',
    emailUserB: 'layija8987@deusa7.com',
    passwordUserB: 'Quick@123',
    emailTest: 'slateauto3105@outlook.com',
    passwordTest: 'Slateauto@05',
    projectName_1: '0805AutoProj01', //Dailylog, Forms
    projectName_2: '0805AutoProj02', //Globalfilter,scheduleViews,verifyTaskDetails
    projectName_3: '0805AutoProj03', //Recipe
    projectName_4: '1202DPRProj01',//uploadFilesDPR
    projectName_5: '1202DPRProj02',//manageFilesDPR
    projectName_6: '0805AutoProj04', //verifyReports
    projectName_7: '0805AutoProj05', //overWriteSchedule
    projectName_8: '0805AutoProj06', //DRA User group DL
    projectName_9: '0805AutoProj07', // addSchedule
    projectName_10: '0805AutoProj08', // verifyCentroSchedule
    projectName_11: '0805AutoProj09', // dailylogMultiUserTests
    projectName_12: '0805AutoProj10', // dailylogBOQTests,

    projectName_13: 'scheduleTest',
    emailSharuk: 'sharukeshwar.p@slate.ai',
    passwordSharuk: 'Sharuk312@26'
  }
});
