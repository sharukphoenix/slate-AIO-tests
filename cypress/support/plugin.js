/// <reference types="cypress" />
/**
 * @type {Cypress.PluginConfig}
 */

module.exports = (on, config) => {
  const items = {}
  require('cypress-mochawesome-reporter/plugin')(on);
  const fs = require('fs');
  const fse = require('fs-extra');
  const path = require('path');
  const exportsDir = path.resolve('cypress/exports');
  fs.mkdirSync(exportsDir, { recursive: true });

  /* cy.task() requires returning a Promise or anything BUT undefined to signal that the task is finished
   see https://on.cypress.io/task */

  //Printing logs to CLI. on the spec file type cy.task('log', this is test log)
  on('task', {
    log(message) {
      console.log(message)

      return null
    },

    getLatestFile(folder) {
      if (!fs.existsSync(folder)) {
        return null;
      }
      const files = fs.readdirSync(folder).filter(f => !f.endsWith('.crdownload') && !f.endsWith('.tmp') && !f.endsWith('.part') && !f.endsWith('.htm'));

      if (!files.length) {
        return null;
      }

      const latestFile = files
        .map(name => ({
          name,
          time: fs.statSync(path.join(folder, name)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)[0];

      return latestFile.name;
    }
  })

  //Setting/Getting Variables
  on('task', {
    setItem({ name, value }) {
      console.log(`setting ${name}`)

      if (typeof value === 'undefined') {
        // since we cannot return undefined from the cy.task
        // let's not allow storing undefined
        throw new Error(`Cannot store undefined value for item "${name}"`)
      }

      items[name] = value

      return null
    },

    getItem(name) {
      if (name in items) {
        console.log('returning item %s', name)

        return items[name]
      }

      const msg = `Missing item "${name}"`

      console.error(msg)
      throw new Error(msg)
    }
  })

  //Recording video only for fail test cases and cleaning export folder
  on("after:spec", (spec, results) => {
    // Ensure exports folder is empty after each spec
    console.log("Ensuring exports folder is empty...");
    fse.emptyDirSync("cypress/exports");

    if (results && results.video) {
      // Do we have failures for any retry attempts?
      const failures = results.tests.some((test) => {
        return test.attempts.some((attempt) => attempt.state === "failed");
      });
      if (!failures && fs.existsSync(results.video)) {
        // delete the video if the spec passed and no tests retried
        return fs.unlinkSync(results.video);
      }
    }
  });

}