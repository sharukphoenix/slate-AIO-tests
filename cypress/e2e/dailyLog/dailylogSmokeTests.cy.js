import homePage from "../../support/pageObject/homePage";
import dailyLogPage from "../../support/pageObject/dailyLogPage";
import schedulerPage from "../../support/pageObject/schedulerPage";
import {default as addDailyLogTestData} from "../../fixtures/addDailyLogTestData.json";
import {default as addNewTaskTestData} from "../../fixtures/addNewTaskTestData.json";

const homepage = new homePage()
const dailylogpage = new dailyLogPage()
const schedulerpage = new schedulerPage()

describe('Verify DailyLog status updates', () => {
    
    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailUserA').split('@')[0]
    const deleteTask = true
    const tenantNameONX = "ONX"
    const tenantNameAdmin = "Admin"
    let taskList
    let progressDL,progressScheduler,planneddatesDL,planneddatesScheduler
    let notStartedComment
    let isCommentAdded = false  // Set to true after first comment is added to the task today

    beforeEach(function () {
        // These tests require Admin login; everything else runs as ONX
        const adminTests = new Set([
            'upload schedule and assignee tasks to loggedin user',
            'Reupload the schedule'
        ])
        const isAdminTest = adminTests.has(this.currentTest?.title)
        const tenantName = isAdminTest ? tenantNameAdmin : tenantNameONX
        cy.loginToUI(projectName, tenantName) // Log in to the UI
    })

    
    it('upload schedule and assignee tasks to loggedin user', () => {
        cy.visit('/')
        // Intercept the GraphQL login request
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        homepage.navigateToScheduler()
        cy.log("in the scheduler page")
        schedulerpage.clearAcceptChanges()
        //schedulerpage.uploadSchedule('1001AddDL.xml')
        schedulerpage.uploadSchedule('/addDL.xml')
        cy.get('@scheduleTasks').then((taskName)=>{
            cy.log("task name list is: " + JSON.stringify(taskName))
            taskList = taskName
            cy.log("task name list is: " + JSON.stringify(taskList))
            schedulerpage.updateTaskField('assignee', assignee, ...taskList)
            schedulerpage.openScheduleinEditMode()
            schedulerpage.updatePlannedStartDate(taskList[0], -3)
            schedulerpage.openScheduleinEditMode()
            schedulerpage.updatePlannedStartDate(taskList[1], 5)
        })
    })
    it('verify task is displayed under assigned activity', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.verifyTaskInDailyLog("assignedActivity",taskList[0])
    })
    it('verify task is displayed under upcoming activity', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.verifyTaskInDailyLog("upcomingActivity",taskList[1])
    })
    it('add daily log for given task with Not Started status', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        notStartedComment = `  Task not started status entered by ${Cypress.env('emailUserA')}`
        dailylogpage.addCommentsToDL(addDailyLogTestData.notStartedStatus.taskname, notStartedComment, isCommentAdded)
        isCommentAdded = true
        dailylogpage.addPhotoToDL(addDailyLogTestData.notStartedStatus.taskname,'cypress/fixtures/image1.jpg')
    })

    it('add daily log for given task with inProgressDelayed status', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.selectStatusFromDropDown(addDailyLogTestData.inprogressDelayedStatus.status,taskList[0]);
    })
    it('add daily log for given task with inProgressOnTrack status', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.selectStatusFromDropDown(addDailyLogTestData.inprogressOntrackStatus.status,taskList[0]);
    })  
    it('add daily log for given task with completed status', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        // dailylogpage.selectStatusFromDropDown(addDailyLogTestData.completedStatus.status,taskList[0]);
        dailylogpage.updateStatusWithFutureDates(addDailyLogTestData.completedStatus.status,taskList[0],'0');
    })
    it('verify user is able to change status from COMPLETED to NOT STARTED', () =>{
        cy.visit("/")
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.updateStatusWithFutureDates(addDailyLogTestData.notStartedStatus.status,taskList[0],'0');
        // dailylogpage.selectStatusFromDropDown(addDailyLogTestData.notStartedStatus.status,taskList[0]);
    })
    it('verify percent progress value in scheduler after entering dailylog and accepting changes',()=>{
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.selectStatusFromDropDown(addNewTaskTestData.assignedActivity.status,taskList[0])
        dailylogpage.getPercentProgressDL(taskList[0])
        cy.get('@percentProgressDL').then((progress)=>{
          progressDL = progress
          cy.log(`daily log percent progress is : ${progressDL}`)
          // switch to Admin user for scheduler part
          cy.logoutUI()
          cy.loginToUI(projectName, tenantNameAdmin)   // uses Admin tenant
          cy.visit('/')
          homepage.navigateToScheduler()
          schedulerpage.viewandAcceptScheduleChanges(taskList[0],addNewTaskTestData.assignedActivity.userAction)
          schedulerpage.selectAdditionalColumns(['Progress'])
          schedulerpage.getPercencentProgressScheduler(taskList[0])
          cy.get('@percentProgressScheduler').then((progress)=>{
                progressScheduler = progress
                cy.log(`daily log percent progress is : ${progressScheduler}`)
                cy.wrap(progressDL).should('eq',progressScheduler)
            })
        })  
    })
    it('Reupload the schedule',()=>{
        cy.visit('/') // Visit the home page
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.uploadCentroSchedule('/addDL.xml', 'msp') // Upload schedule
    })

    it('Verify percent progress,Status and assignee value in scheduler after reupload',()=>{
        cy.visit('/') // Visit the home page
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.getPercentProgressDL(taskList[0])
        cy.get('@percentProgressDL').then((progress)=>{
            progressDL = progress
            cy.log(`daily log percent progress is : ${progressDL}`)
            // switch to Admin user for scheduler part
            cy.logoutUI()
            cy.loginToUI(projectName, tenantNameAdmin)   // uses Admin tenant
            cy.visit('/')
            homepage.navigateToScheduler()
            cy.wait(3000)
            schedulerpage.selectAdditionalColumns(['Progress','Assignee','Status'])
            schedulerpage.getPercencentProgressScheduler(taskList[0])
            cy.get('@percentProgressScheduler').then((progress)=>{
                  progressScheduler = progress
                  cy.log(`daily log percent progress is : ${progressScheduler}`)
                  cy.wrap(progressDL).should('eq',progressScheduler)
              })
          }) 
    })

    it('Navigate to dailylog and verify entry is present for today',()=>{
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.isDailyLogAddedToday()
    })
})