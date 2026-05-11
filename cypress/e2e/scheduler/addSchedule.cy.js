import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import { default as scheduleTestData } from "../../fixtures/scheduleTestData.json"

const homepage = new homePage()
const schedulerpage = new schedulerPage()

describe('Verify project plan in schedule', () => {
  const env = Cypress.env('ENV')
  const projectName = Cypress.env('projectName_9')
  let assignee = Cypress.env('emailUserA').split('@')[0]   //Update this assignee value if required (Depends on project)
  const deleteTask = true
  const tenantName = "ONX"

  const autoScheduleAndSave = true

  beforeEach(() => {
    cy.loginToUI(projectName,tenantName) // Log in to the UI
  })

  it('verify schedule page and upload schedule in p6 format', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    cy.wait(5000)
    schedulerpage.ensureTaskDetailsClosed()
    schedulerpage.verifySchedulerPage() // Verify that the scheduler page is displayed correctly
    schedulerpage.uploadCentroSchedule('/UploadScheduleP6.xml', 'p6')
    schedulerpage.exportSchedule('p6', projectName)
  })

  it('verify schedule page and upload schedule in PP format', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.verifySchedulerPage() // Verify that the scheduler page is displayed correctly
    schedulerpage.uploadCentroSchedule('/UploadSchedulePP.pp', 'pp', 'binary')
  })

  it('verify schedule page and upload schedule in msp format', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.verifySchedulerPage() // Verify that the scheduler page is displayed correctly
    schedulerpage.uploadCentroSchedule('/addschedule01.xml', 'msp') // Upload a schedule file in MSP format
    schedulerpage.verifyVersionHistoryIcon()
    schedulerpage.verifySuccessStatusVersionHisotry()
    schedulerpage.exportSchedule('msp', projectName)
  })

  it('verify ID coulum in uploaded schedule', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.checkSerialNumberOrder() //verify ID is in increment order
  })

  it('add task and save as baseline version', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.checkAndAddTaskIfBaselineNotPresent(projectName, assignee, [scheduleTestData.addTask3]) // Add a new task to the project
    schedulerpage.selectScheduleVersion('baseline',scheduleTestData.addTask3.taskname)
    schedulerpage.checkSerialNumberOrder()
  })

  it('add task and update assignee from gantt tree', () => {
    cy.visit('/') // Visit the home page
    // cy.getUserName().then(() => {
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
      schedulerpage.checkSerialNumberOrder()
      schedulerpage.addNewTask(projectName, assignee = "", [scheduleTestData.addTask1]) // Add a new task to the project
      schedulerpage.checkSerialNumberOrder()
      schedulerpage.updateTaskField('assignee', Cypress.env('emailUserA').split('@')[0], scheduleTestData.addTask1.taskname) // Update the assignee for the task
      schedulerpage.updateTaskField('location', projectName, scheduleTestData.addTask1.taskname) // Update the location for the task
      // schedulerpage.verifyValuesUpdated(scheduleTestData.addTask1.taskname) // Verify that the task values are updated correctly
      schedulerpage.removeAssinee([scheduleTestData.addTask1.taskname]) // Remove the assignee from the task
    // })
  })

  it('add relation between tasks', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.addNewTask(projectName, assignee, [scheduleTestData.addTask1]) // Add a new task to the project
    schedulerpage.selectAdditionalColumns(['Predecessor','Planned End Date','Planned Duration']) // Select additional columns to display
    schedulerpage.openScheduleinEditMode() //Opens the schedule in edit mode
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask2.taskname) // Retrieve the planned dates for the task
    schedulerpage.addRelationIntoPredecessor([scheduleTestData.addTask1.taskname],'5FS,6FS')  // '5FS,6FS' indicates Finish-to-Start relationships with tasks 5 and 6
    schedulerpage.savePlan(autoScheduleAndSave) //save the changes to schedule and handle autoschedule warning
    schedulerpage.verifyLinksExist()
    schedulerpage.clickOnAutoSchedule() // Perform autoschedule
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask1.taskname)
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask2.taskname) // Retrieve the planned dates for the task
    schedulerpage.verifyPlannedStartDateChanges(scheduleTestData.addTask2.taskname,scheduleTestData.addTask1.taskname) //planned sate of task should get adjusted according to the relation created with other task
    // schedulerpage.deselectAdditionalColumns(['Predecessor','Planned End Date']) // Deselect the additional columns
  })

  it('verify change of planned start date is resetted after autoschedule when Predecessor is present for the task', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    // schedulerpage.selectAdditionalColumns(['Predecessor']) // Select additional columns to display
    schedulerpage.openScheduleinEditMode() //Opens the schedule in edit mode
    schedulerpage.updatePlannedDates([scheduleTestData.addTask1.taskname]) // Update the planned start and end dates for the task
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask2.taskname) // Retrieve the planned dates for the task
    schedulerpage.clickOnAutoSchedule() // Perform autoschedule
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask1.taskname) // Retrieve the planned dates for the task
    schedulerpage.verifyPlannedStartDateChanges(scheduleTestData.addTask2.taskname,scheduleTestData.addTask1.taskname) //planned sate of task should get adjusted according to the relation created with other task
  })

  it('Verify related tasks tab in task details', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.ensureActivityPanelOpen()
    schedulerpage.ensureScheduleExpanded()
    schedulerpage.openTaskDetails([scheduleTestData.addTask2.taskname],0) // Open the task details view
    schedulerpage.selectTaskDetailTab('relatedTasks','Related Tasks') // Navigate to the "related tasks" tab
    schedulerpage.verifyRelatedTasksTabInTaskDetails()
    schedulerpage.closeTaskDetails()
})

  it('update planned startdate and planned enddate', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.addNewTask(projectName, assignee, [scheduleTestData.addTask1]) // Add a new task to the project
    schedulerpage.checkSerialNumberOrder()
    schedulerpage.selectAdditionalColumns(['Planned End Date']) // Select additional columns to display
    schedulerpage.updatePlannedDates([scheduleTestData.addTask1.taskname]) // Update the planned start and end dates for the task
  })


  it('update task type to Milestone', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.selectAdditionalColumns(['Type','Planned End Date','Planned Duration']) // Select additional columns to display
    schedulerpage.openScheduleinEditMode()
    schedulerpage.changeActivityType([scheduleTestData.addTask2.taskname],'Milestone')
    schedulerpage.savePlan()
    schedulerpage.verifyDurationBasedonType(scheduleTestData.addTask2.taskname,'Milestone')
    schedulerpage.deselectAdditionalColumns(['Type','Planned End Date']) // Deselect the additional columns

  })
  it('update task type to Task', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.selectAdditionalColumns(['Type','Planned End Date','Planned Duration']) // Select additional columns to display
    schedulerpage.openScheduleinEditMode()
    schedulerpage.changeActivityType([scheduleTestData.addTask2.taskname],'Task')
    schedulerpage.savePlan()
    schedulerpage.verifyDurationBasedonType(scheduleTestData.addTask2.taskname,'Task')
    schedulerpage.deselectAdditionalColumns(['Type','Planned End Date']) // Deselect the additional columns

  })
  it('update task Plannedduration', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.selectAdditionalColumns(['Planned Duration']) // Select additional columns to display
    schedulerpage.openScheduleinEditMode() // opens the schedule in edit mode
    schedulerpage.updateDuration([scheduleTestData.addTask2.taskname],scheduleTestData.addTask2.duration) // update task duration to diffrent value
    schedulerpage.savePlan(autoScheduleAndSave) // saves changes to schedule
  })
  it('update TaskName', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname]) // Clear existing tasks and notifications
    schedulerpage.checkSerialNumberOrder()
    schedulerpage.addNewTask(projectName, assignee, [scheduleTestData.addTask1]) // Add a new task to the project
    schedulerpage.checkSerialNumberOrder()
    schedulerpage.updateTaskName([scheduleTestData.addTask1.taskname]) // Update the task name
    cy.wait(5000) // Wait for the update to take effect
    schedulerpage.deleteTask(["UpdatedTaskName"]) // Delete the task with the updated name
    schedulerpage.checkSerialNumberOrder()
    cy.wait(5000) // Wait for the deletion to complete
  })

  it('Manage Task Lifecycle and Verify Status Updates', () => {
    cy.visit('/') // Visit the home page
    cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
    homepage.navigateToScheduler() // Navigate to the scheduler page
    cy.wait(5000)
    schedulerpage.ensureTaskDetailsClosed()
    schedulerpage.clearTasksandNotification(deleteTask, [scheduleTestData.addTask1.taskname], true) // Clear existing tasks and notifications
    schedulerpage.addNewTask(projectName, "" , [scheduleTestData.addTask1]) // Add a new task to the project
    schedulerpage.selectAdditionalColumns(['Planned Duration', 'Planned End Date', 'Total Float']) // Select additional columns to display
    schedulerpage.getToDoStatusValues(scheduleTestData.addTask1.taskname) // Retrieve the to-do status values for the task
    schedulerpage.deselectAdditionalColumns(['Planned Duration', 'Planned End Date', 'Total Float']) // Deselect the additional columns
    schedulerpage.clickOnTodayBtn()
    schedulerpage.openTaskDetails([scheduleTestData.addTask1.taskname],0) // Open the task details view
    schedulerpage.verifyTaskdetailsPage(scheduleTestData.addTask1.taskname) // Verify the task details page
    schedulerpage.getToDoStatusValuesFromTaskDetail() // Retrieve status values from the task detail view
    schedulerpage.startTask() // Start the task
    schedulerpage.acceptChanges("Accept") // Accept the changes made
    schedulerpage.selectAdditionalColumns(['Actual Start Date', 'Estimated End', 'Estimated Duration']) // Select additional columns to display
    schedulerpage.getActualStartDate(scheduleTestData.addTask1.taskname) // Retrieve the actual start date for the task
    schedulerpage.deselectAdditionalColumns(['Estimated End', 'Estimated Duration']) // Deselect the additional columns
    schedulerpage.clickOnTodayBtn()
    schedulerpage.openTaskDetails([scheduleTestData.addTask1.taskname],0) // Open the task details view
    schedulerpage.verifyActualstartdate() // Verify the actual start date
    schedulerpage.completeTask() // Complete the task
    schedulerpage.acceptChanges("Accept") // Accept the changes made
    schedulerpage.selectAdditionalColumns(['Actual End Date', 'Actual Duration']) // Select additional columns to display
    schedulerpage.getActualTaskCompletionValues(scheduleTestData.addTask1.taskname) // Retrieve the actual task completion values
    schedulerpage.deselectAdditionalColumns(['Actual Start Date', 'Actual End Date', 'Actual Duration']) // Deselect the additional columns
    schedulerpage.clickOnTodayBtn()
    schedulerpage.openTaskDetails([scheduleTestData.addTask1.taskname],0) // Open the task details view
    schedulerpage.verifyActualTaskCompletionValues() // Verify the actual task completion values
    schedulerpage.closeTaskDetails()
    // schedulerpage.selectTaskStatus("In Progress") // Set the task status to "In Progress"
    // schedulerpage.acceptChanges("Accept") // Accept the changes made
  })

  it('Verify schedule export after changes', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    cy.wait(5000)
    schedulerpage.exportSchedule('msp', projectName)
  })

  describe('Creating New version of a schedule and verifying it in version history, deleting the same',() =>{ 
    it('Create and Save a new version', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.ensureEditPlanMode()
      schedulerpage.verifyProjectPlanDownArrow()
      schedulerpage.verifyCreateAndSaveNewVersion() 
    })

    it('Delete the created version', () => {
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      schedulerpage.verifyVersionHistoryIcon()
      schedulerpage.verifyDeleteVersion() 
    })
  })

describe('Uploading an invalid file,verifying the import logs in Version History',() =>{ 
    it('Upload.xml(p6) as an .xml(MSP) file in the scheduler',() =>{
      cy.visit('/') // Visit the home page
      homepage.navigateToScheduler() // Navigate to the scheduler page
      cy.wait(5000)
      schedulerpage.uploadCentroSchedule('/InvalidfileUpload.xml', 'msp')
      schedulerpage.verifyVersionHistoryIcon()
      schedulerpage.verifyFailedStatusVersionHistory()
    })
})

describe('Verify Filtering the Version History data',() =>{
  it('Verify the filtering icon in the Version history',() =>{
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    cy.wait(5000)
    schedulerpage.verifyVersionHistoryIcon()
    schedulerpage.verifyFilteringVersionHistory()
  })
})

})