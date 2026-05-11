import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import formPage from "../../support/pageObject/formPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import pivotTablePage from "../../support/pageObject/pivotTablePage";
import { default as centroScheduleTestdata } from "../../fixtures/centroScheduleTestdata.json"
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const formpage = new formPage()
const projectsettingpage = new projectSettingPage()
const pivotTablepage = new pivotTablePage()

describe('Verify reports by uploading the schedule', () => {
    const env = Cypress.env('ENV')
    const projectName = Cypress.env('projectName_6')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    const tenantName = "ONX"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })

    it("Create usergroup", () => {
        cy.visit('/')
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName,'User Group Setup')
        projectsettingpage.verifyAndCreateUserGroup('design', [Cypress.env('emailUserA')])
    })

    it("Create location", () => {
        cy.visit('/')  
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName,'Location Management')
        projectsettingpage.verifyAndCreateLocation()
    })

    it("Upload classcode file", () => {
        cy.visit('/')  
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName,'Classification Code')
        projectsettingpage.verifyAndUploadClassificationcode()
    })

    it.only('Upload schedule and update all fields for multiple tasks', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.uploadCentroSchedule('/centroSchedule1.mpp', 'msp') // Upload schedule
        cy.wait(10000)
        schedulerpage.clickOnAutoSchedule() // Perform autoschedule
        cy.wait(5000)
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        const tasks = [
            centroScheduleTestdata.Task1.taskname,
            centroScheduleTestdata.Task2.taskname
        ];
        tasks.forEach(taskName => {
            schedulerpage.searchTaskByName(taskName);
            schedulerpage.clickAndUpdateAllMatchingTasks(taskName, assignee);
        });
        schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
        schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],2) // Open the task details view
        schedulerpage.addCompanyName('test')
        schedulerpage.selectTaskDetailTab('variances',' Variances') // Navigate to the "Variances" tab
        schedulerpage.addVariances()
        schedulerpage.selectTaskDetailTab('constraints',' Constraints') // Navigate to the "constraints" tab
        schedulerpage.addConstraints()
        schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab 
        schedulerpage.attachFileToDataTab('/picture.png')
        schedulerpage.closeTaskDetails()
    })

    it('Verify rententions and changes in diffrent values when schedule is reuploaded without overwrtie option', () => {
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
        schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],2) // Open the task details view
        schedulerpage.captureVarianceDetailsForReports(centroScheduleTestdata.Task1.taskname,2)
        schedulerpage.captureTaskValuesForReports([centroScheduleTestdata.Task1.taskname,centroScheduleTestdata.Task2.taskname])
        homepage.navigateToReports() //Navigate to the reports page
        pivotTablepage.clickUserGroupVsLocationReportCard()
        pivotTablepage.expandUserGroupAndGetTasks()
        pivotTablepage.clickUserGroupVarianceIndicator('design')
        pivotTablepage.clickTaskVarianceIndicator(centroScheduleTestdata.Task1.taskname)
        pivotTablepage.clickTaskWithoutVarianceandVerify(centroScheduleTestdata.Task2.taskname)
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        schedulerpage.uploadCentroSchedule('/centroSchedule2.mpp', 'msp') // ReUpload schedule without overwrite option checked
        cy.wait(5000)
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
        schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],1) // Open the task details view
        schedulerpage.captureVarianceDetailsForReports(centroScheduleTestdata.Task1.taskname,1)
        schedulerpage.captureTaskValuesForReports([centroScheduleTestdata.Task1.taskname,centroScheduleTestdata.Task2.taskname])
        homepage.navigateToReports() //Navigate to the reports page
        pivotTablepage.clickUserGroupVsLocationReportCard()
        pivotTablepage.expandUserGroupAndGetTasks()
        pivotTablepage.clickUserGroupVarianceIndicator('design')
        pivotTablepage.clickTaskVarianceIndicator(centroScheduleTestdata.Task1.taskname)
        pivotTablepage.clickTaskWithoutVarianceandVerify(centroScheduleTestdata.Task2.taskname)
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        schedulerpage.uploadCentroSchedule('/centroSchedule2.mpp', 'msp', true) // ReUpload schedule with overwrite option checked 
        cy.wait(10000)
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
        schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],1) // Open the task details view
        schedulerpage.captureVarianceDetailsForReports(centroScheduleTestdata.Task1.taskname,1)
        schedulerpage.captureTaskValuesForReports([centroScheduleTestdata.Task1.taskname,centroScheduleTestdata.Task2.taskname])
        homepage.navigateToReports() //Navigate to the reports page
        pivotTablepage.clickUserGroupVsLocationReportCard()
        pivotTablepage.expandUserGroupAndGetTasks()
        pivotTablepage.clickUserGroupVarianceIndicator('design')
        pivotTablepage.clickTaskVarianceIndicator(centroScheduleTestdata.Task1.taskname)
        pivotTablepage.clickTaskWithoutVarianceandVerify(centroScheduleTestdata.Task2.taskname)
    })

    it('upload schedule three and clear the project ', () => {
        cy.visit('/')
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.uploadCentroSchedule('/addDL.xml', 'msp')
        schedulerpage.verifyNoOfTasks(3)
        homepage.navigateToReports() //Navigate to the reports page
        pivotTablepage.verifyNoDataToShowInReports()

    })
    after(() => {
        // Clean up tasks after the test
    })
  })