import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import formPage from "../../support/pageObject/formPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import pivotTablePage from "../../support/pageObject/pivotTablePage";
import { default as centroScheduleTestdata } from "../../fixtures/centroScheduleTestdata.json"
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const projectsettingpage = new projectSettingPage()

describe('Upload centro schedule and verify', () => {
  const env = Cypress.env('ENV')
  const projectName = Cypress.env('projectName_10')
  let assignee = Cypress.env('emailUserA').split('@')[0]
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

  describe("Centro Schedule tests", () => {
    beforeEach(() => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      cy.wait(5000)
      schedulerpage.ensureTaskDetailsClosed()
    })
    it('upload a centro schedule and verify', () => {
      schedulerpage.verifySchedulerPage() // Verify that the scheduler page is displayed correctly
      schedulerpage.uploadCentroSchedule('/centroSchedule2.mpp', 'msp', true) // Upload a schedule file in MSP format
    })

    it('Upload schedule and update all fields for single task', () => {
      schedulerpage.ensureActivityPanelOpen()
      schedulerpage.ensureScheduleExpanded()
      const tasks = [
          centroScheduleTestdata.Task4.taskname
      ];
      tasks.forEach(taskName => {
          schedulerpage.searchTaskByName(taskName);
          schedulerpage.clickAndUpdateAllMatchingTasks(taskName, assignee);
      });
      schedulerpage.searchTaskByName(centroScheduleTestdata.Task4.taskname)
      schedulerpage.openTaskDetails([centroScheduleTestdata.Task4.taskname],1) // Open the task details view
      // schedulerpage.addCompanyName('test')
      schedulerpage.selectTaskDetailTab('variances',' Variances') // Navigate to the "Variances" tab
      schedulerpage.addVariances()
      schedulerpage.selectTaskDetailTab('constraints',' Constraints') // Navigate to the "constraints" tab
      schedulerpage.addConstraints()
      schedulerpage.selectTaskDetailTab('data',' Data') // Navigate to the "data" tab 
      schedulerpage.attachFileToDataTab('/picture.png')
      schedulerpage.closeTaskDetails()
    })

    it('Start a task and Accept changes', () => {
      schedulerpage.ensureActivityPanelOpen()
      schedulerpage.ensureScheduleExpanded()
      schedulerpage.searchTaskByName(centroScheduleTestdata.Task4.taskname)
      schedulerpage.openTaskDetails([centroScheduleTestdata.Task4.taskname],0) // Open the task details view
      schedulerpage.startTask() // Start the task
      schedulerpage.acceptChanges("Accept") // Accept the changes made
    })

    it('verify copy-paste of task', () => {
      schedulerpage.ensureActivityPanelOpen()
      schedulerpage.ensureScheduleExpanded()
      schedulerpage.searchTaskByName(centroScheduleTestdata.Task4.taskname)
      schedulerpage.openScheduleinEditMode()
      schedulerpage.copypasteTask() //copy pastes the task to wbs
      schedulerpage.verifyIdofTaskPasted()
      schedulerpage.getFloatIncrement()
      cy.get('@floatIncrement').then((inc) => {
          const totalFloat = String(244 + inc)          // 244 = base float from 15-Apr-25 to 09-Mar-26; "inc" adjusts for working days between 09-Mar-26 and today minus 4 days
          schedulerpage.assertTaskColumnValuesSequential(
            centroScheduleTestdata.Task4.taskname,
            centroScheduleTestdata.Task4.taskid,
            ['15-Apr-25','18-Apr-25','4 days',
              '-','-','','-','','Task',
              totalFloat,'','','0','',
              'To Do','','-','-','','',''])
      })
    })

  })

  describe("Post-test cleanup", () => {
    it('upload schedule three and clear the project ', () => {
      cy.visit('/')
      homepage.navigateToScheduler()
      cy.wait(30000)
      schedulerpage.uploadCentroSchedule('/addDL.xml', 'msp')
      schedulerpage.verifyNoOfTasks(3)
    })
  })

  describe("Create Pull Plan Test cases",() => {
  
      it('Verify Create Pull Plan Event in scheduler, validations of the fields', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page   
      schedulerpage.verifyCreatePullPlanEventInScheduler()
      })
  
      it('Start Pull plan event',() => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page   
      schedulerpage.verifyStartPullPlanEvent()
      })

      it('Verify Plans tab on Scheduler Page',() =>{
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page 
        schedulerpage.verifyRightPanelPlansTab()
        })
  
      it('Stop Pull plan event',() => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page   
      schedulerpage.verifyStopPullPlanEvent()
      })
  })

})