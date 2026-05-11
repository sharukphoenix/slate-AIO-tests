import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import formPage from "../../support/pageObject/formPage";
import { default as scheduleTestData } from "../../fixtures/scheduleTestData.json"
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const formpage = new formPage()

describe('Verify diffrent schedule views', () => {
    const env = Cypress.env('ENV')
    const projectName = Cypress.env('projectName_2')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    const tenantName = "ONX"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })

    it('Upload schedule', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.uploadCentroSchedule('/addSchedule02.xml', 'msp') // Upload schedule
      })
  

    it('Verify default view', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.selectDropdownValue('default')     // Select a view from the dropdown
    })

    it('Verify weeklyPlan view', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.selectDropdownValue('weeklyPlan')     // Select a view from the dropdown
        schedulerpage.verifyWeeklyPlanAndWeekBefore('Weekly Plan -', 'Week Before -')
        cy.wait(3000)
        schedulerpage.selectDropdownValue('default')
    })
    it('Verify lookahead view', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.selectDropdownValue('lookahead')     // Select a view from the dropdown
        schedulerpage.verifyWeekSpanText('week - LOOK AHEAD View -')
        cy.wait(3000)
        schedulerpage.selectDropdownValue('default')
    })
    it('Verify Zoom Actions in scheduler', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page   
      schedulerpage.verifyZoomActionsInScheduler()
    })
    it('Verify Critical Path icon',() =>{
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page   
      schedulerpage.verifyCriticalPathInScheduler()
    })

    after(() => {

    })
  })