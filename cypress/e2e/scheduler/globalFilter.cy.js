import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import formPage from "../../support/pageObject/formPage";
import { default as scheduleTestData } from "../../fixtures/scheduleTestData.json"
import * as storedFormQuery from '../../support/queries/formQueries'
import projectSettingPage from "../../support/pageObject/projectSettingPage";

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const formpage = new formPage()
const projectsettingpage = new projectSettingPage()

describe('Verify global filters in schedule', () => {
    const env = Cypress.env('ENV')
    const projectName = Cypress.env('projectName_2')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    const tenantName = "ONX"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })

    // Creating UserGroup
     it("Create usergroup", () => {
        cy.visit('/')
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName,'User Group Setup')
        projectsettingpage.verifyAndCreateUserGroup('design', [Cypress.env('emailUserA')])
    })

    it('Upload schedule and update assignee, User Group, planned start date', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.uploadCentroSchedule('/addSchedule02.xml', 'msp') // Upload schedule
        schedulerpage.updateTaskField('assignee', scheduleTestData.addTask4.taskname)
        schedulerpage.updateTaskField('usergroup','design', scheduleTestData.addTask2.taskname)
        schedulerpage.openScheduleinEditMode()
        schedulerpage.updatePlannedStartDate(scheduleTestData.addTask2.taskname, 0)
      })
  

    it('Verify global filter by selecting planned start date and assignee', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.verifyFilterMenuItems() //verify global filter
      schedulerpage.applyGlobalFilter(["Assignee","Planned Start Date"]) //apply filter
      schedulerpage.verifyFilerApplied(scheduleTestData.addTask2.taskname,'2',true)
      schedulerpage.clearGlobalFilter()
    })

    it('Verify gloabl filter by selecting usergroup',() => {
      cy.visit('/')//Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.verifyFilterMenuItems() //verify global filter
      schedulerpage.applyGlobalFilter(["User Group"]) //apply filter
      schedulerpage.verifyFilerApplied(scheduleTestData.addTask2.taskname,'1',true)
      schedulerpage.clearGlobalFilter()

    })

    it('Verify global filter by selecting actual start date by setting limits', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.verifyFilterMenuItems() //verify global filter
        schedulerpage.applyGlobalFilter(["Actual Start Date"]) //apply filter
        schedulerpage.verifyFilerApplied(scheduleTestData.addTask2.taskname,'1',false)
        schedulerpage.clearGlobalFilter()
      })

    after(() => {

    })
  })