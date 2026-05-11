import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import formPage from "../../support/pageObject/formPage";
import weatherPage from "../../support/pageObject/weatherPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import { default as scheduleTestData } from "../../fixtures/scheduleTestData.json"
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const formpage = new formPage()
const weatherpage = new weatherPage()
const projectsettingpage = new projectSettingPage()

describe('Verify task details page in schedule', () => {
    const env = Cypress.env('ENV')
    const projectName = Cypress.env('projectName_2')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    let tenantName = "ONX"
  
    beforeEach(function () {
      const adminTests = new Set([
        'Capture weather template values and verify in task details weather tab'
      ])
      const title = this.currentTest?.title
      if (adminTests.has(title)) {
        // Ensure we don't reuse an existing cy.session login
        cy.clearCookies()
        cy.clearLocalStorage()
        cy.loginToUIWithoutSession(projectName, tenantName = 'Admin')
      } else {
        cy.loginToUI(projectName,tenantName) // Log in to the UI
      }
    })

    it('Creating an open RFI with only mandatory fields', () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        formpage.createRFIForm()
        formpage.searchForm('RFI-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })

    it('Add project materials from project settings', () => {
        cy.visit('/')  
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName, 'Project Material Master')
        projectsettingpage.addProjectMaterial()
    })

    describe('Verify variance and constraint operations', () => {       // Nested describe block to group related tests
        beforeEach(() => {      //Common steps for all the tests in this block
            cy.visit('/')
            homepage.navigateToScheduler() // Navigate to the scheduler page
            cy.wait(5000)
            schedulerpage.ensureTaskDetailsClosed() // Ensure task details is closed before each test    
        })
  
        it('should upload schedule and perform autoschedule', () => {
        schedulerpage.uploadCentroSchedule('/addSchedule02.xml', 'msp') // Upload schedule
        schedulerpage.clickOnAutoSchedule() // Perform autoschedule
        })

        it('Verify Variances Tab and add variance', () => {
            // schedulerpage.addNewTask(projectName, assignee, [scheduleTestData.addTask1]) // Add a new task to the project
            cy.wait(5000)
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('variances',' Variances') // Navigate to the "Variances" tab
            schedulerpage.addVariances()
            schedulerpage.closeTaskDetails()
        })

        it('Add constaints to task', () => {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('constraints',' Constraints') // Navigate to the "constraints" tab
            schedulerpage.addConstraints()
            schedulerpage.verifyConstraintAdded()
        })

        it('Verify constraints is added in data tab and create link', ()=> {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab  
            schedulerpage.verifyAndUncheckConstraint('RFI','constraints01')
            schedulerpage.verifyConstraintDeleted()
        })

        it('remove link and add link',()=>{
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab  
            schedulerpage.removeLink()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab  
            schedulerpage.addLink()

        })
        it('add constraints from data link',()=>{
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()   
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab  
            schedulerpage.checkAddToConstraint('RFI','RFI-01')
            schedulerpage.verifyConstraintAdded()
        })

        // it('add constraints and variances for schedule task',()=>{
        //     cy.visit('/') // Visit the home page
        //     homepage.navigateToScheduler() // Navigate to the scheduler page
        //     schedulerpage.ensureActivityPanelOpen()
        //     schedulerpage.openTaskDetails(['Level 1 Mechanical Ducts']) // Open the task details view
        //     schedulerpage.selectTaskDetailTab('constraints',' Constraints') // Navigate to the "constraints" tab
        //     schedulerpage.addConstraints()
        //     schedulerpage.openTaskDetails(['Level 1 Mechanical Ducts']) // Open the task details view
        //     schedulerpage.selectTaskDetailTab('variances',' Variances') // Navigate to the "Variances" tab
        //     schedulerpage.addVariances()
        //     schedulerpage.closeTaskDetails()
        // })

        it('Reupload the schedule',()=>{
            schedulerpage.uploadCentroSchedule('/addSchedule02.xml', 'msp') // Upload schedule
        })

        it('Verify constraints and varience retained after reuploading schedule',()=>{
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.verifyConstraintAdded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.verifyVarianceAdded()
        })

        it('delete constraints',()=>{
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('constraints',' Constraints') // Navigate to the "constraints" tab  
            schedulerpage.deleteConstraint()
            schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab  
            schedulerpage.removeLink()
        })

        it('Delete variance', () => {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('variances',' Variances') // Navigate to the "Variances" tab
            schedulerpage.deleteVariances()
        })

        it('Capture weather template values and verify in task details weather tab', () => {
            homepage.navigateToWeatherTemplate()
            weatherpage.verifyWeatherTemplateValuesandCapture()
            homepage.navigateToScheduler()
            schedulerpage.ensureTaskDetailsClosed()            
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('weather',' Weather') // Navigate to the "weather" tab
            schedulerpage.verifyWeatherTabInTaskDetails()
            schedulerpage.closeTaskDetails()
        })

        it('Verify tag tab in task details', () => {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('tag',' Tag') // Navigate to the "tags" tab
            schedulerpage.verifyTagsTabInTaskDetails()
            schedulerpage.closeTaskDetails()
        })

        it('Verify Resources tab in task details', () => {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('resources','Resources') // Navigate to the "resources" tab
            schedulerpage.verifyResourcesTabInTaskDetails()
            schedulerpage.closeTaskDetails()
        })
        it('Verfiy delete resources from task details', () => {
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
            schedulerpage.selectTaskDetailTab('resources','Resources') // Navigate to the "resources" tab
            schedulerpage.deleteResources()
            schedulerpage.closeTaskDetails()
        })

    })

    describe('Post-test Cleanup', () => {
        it("Delete all RFI forms", () => {
            cy.visit('/')  
            homepage.navigateToForms()
            formpage.selectForm('RFI')
            cy.deleteALLForms(storedFormQuery.rfiID)
            cy.reload()
            cy.task('log', 'This will be output to the terminal')
        })
        it('Clear project materials from project settings', () => {
            cy.visit('/')  
            homepage.navigateToProjectSettings()
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Project Material Master')
            projectsettingpage.clearProjectMaterial()
        })
    })
    after(() => {
        // Clean up tasks after the test
        // const taskNamesToDelete = [scheduleTestData.addTask1.taskname] // Replace with actual task names
        // cy.visit('/') // Visit the home page
        // homepage.navigateToScheduler() // Navigate to the scheduler page
        // schedulerpage.deleteTask(taskNamesToDelete)
    })
  })