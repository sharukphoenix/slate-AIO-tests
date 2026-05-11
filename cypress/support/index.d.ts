/// <reference types="cypress" />

declare module 'uuid'

declare namespace Cypress {
  interface Chainable<Subject> {

    loginToUI(
      //login into slate web from UI side.
    ): Chainable<any>

    selectProject(
      //This command will switch the project. 
      projectName:string
    ):Chainable<any>

  }
}
