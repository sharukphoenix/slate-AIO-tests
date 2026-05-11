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

describe('Verify task details page in schedule', () => {
    const env = Cypress.env('ENV')
    const projectName = Cypress.env('projectName_7')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    const tenantName = "ONX"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })

    describe("Test setup", () => {
        beforeEach(() => {
            cy.visit('/')
            homepage.navigateToProjectSettings()
        })
        it("Create usergroup", () => {
            projectsettingpage.navigateToProjectSettingOption(projectName,'User Group Setup')
            projectsettingpage.verifyAndCreateUserGroup('design', [Cypress.env('emailUserA')])
        })

        it("Create location", () => {
            projectsettingpage.navigateToProjectSettingOption(projectName,'Location Management')
            projectsettingpage.verifyAndCreateLocation()
        })

        it("Upload classcode file", () => {
            projectsettingpage.navigateToProjectSettingOption(projectName,'Classification Code')
            projectsettingpage.verifyAndUploadClassificationcode()
        })
    })

    describe("Overwriting Schedule", () => {
        beforeEach(() => {      //Common steps for all the tests in this block
            cy.visit('/')
            homepage.navigateToScheduler() // Navigate to the scheduler page
            cy.wait(5000)
            schedulerpage.ensureTaskDetailsClosed() // Ensure task details is closed before each test    
        })

        it('Upload schedule and update all fields for multiple tasks', () => {
            schedulerpage.uploadCentroSchedule('/centroSchedule1.mpp', 'msp') // Upload schedule
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
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
            schedulerpage.selectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.captureAlwaysOverwriteValuesBeforeReupload(centroScheduleTestdata.Task1.taskname,2)
            schedulerpage.deselectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.selectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.captureAlwaysRetainedValuesBeforeReupload(centroScheduleTestdata.Task1.taskname,2)
            schedulerpage.deselectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.selectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
            schedulerpage.captureOverwriteWhenSelectedValuesBeforeReupload(centroScheduleTestdata.Task1.taskname,2)
            schedulerpage.deselectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
            schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],2) // Open the task details view
            schedulerpage.captureAlwaysRetainedValuesInTaskDetailsBeforeReupload(centroScheduleTestdata.Task1.taskname)
            schedulerpage.uploadCentroSchedule('/centroSchedule2.mpp', 'msp') // ReUpload schedule without overwrite option checked
            cy.wait(10000)
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
            schedulerpage.selectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.compareOverwriteValuesAfterReupload(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],1) // Open the task details view
            schedulerpage.captureAlwaysRetainedValuesInTaskDetailsBeforeReupload(centroScheduleTestdata.Task1.taskname)
            schedulerpage.selectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.compareAlwaysRetainedValuesAfterReupload(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.selectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
            schedulerpage.compareOverwriteWhenSelectedValuesAfterReupload(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
            schedulerpage.uploadCentroSchedule('/centroSchedule2.mpp', 'msp', true) // ReUpload schedule with overwrite option checked 
            cy.wait(10000)
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.searchTaskByName(centroScheduleTestdata.Task1.taskname)
            schedulerpage.selectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.compareOverwriteValuesAfterReupload(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Baseline Duration'])
            schedulerpage.openTaskDetails([centroScheduleTestdata.Task1.taskname],1) // Open the task details view
            schedulerpage.captureAlwaysRetainedValuesInTaskDetailsBeforeReupload(centroScheduleTestdata.Task1.taskname)
            schedulerpage.selectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.compareAlwaysRetainedValuesAfterReupload(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Type','Assignee','User Group','Location','Classification Code','Predecessor'])
            schedulerpage.selectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
            schedulerpage.compareOverwriteWhenSelectedValuesAfterReuploadWithTrue(centroScheduleTestdata.Task1.taskname,0)
            schedulerpage.deselectAdditionalColumns(['Actual Start Date','Actual End Date','Estimated End','Progress','Status'])
        })

        it('upload schedule three and clear the project ', () => {
            cy.visit('/')
            homepage.navigateToScheduler() // Navigate to the scheduler page
            cy.wait(30000)
            schedulerpage.uploadCentroSchedule('/addDL.xml', 'msp')
            schedulerpage.verifyNoOfTasks(3)
        })

    })
    // after(() => {
    //     // Clean up tasks after the test
    // })
})