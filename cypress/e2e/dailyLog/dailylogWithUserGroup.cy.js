import homePage from "../../support/pageObject/homePage";
import dailyLogPage from "../../support/pageObject/dailyLogPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import schedulerPage from "../../support/pageObject/schedulerPage"
import { default as DRAScheduleTestdata } from "../../fixtures/DRAScheduleTestdata.json"

const homepage = new homePage()
const dailylogpage = new dailyLogPage()
const projectsettingpage = new projectSettingPage()
const schedulerpage = new schedulerPage()
let checkLabel = true
let taskList = [
            DRAScheduleTestdata.Task2.taskname,
            DRAScheduleTestdata.Task3.taskname,
            DRAScheduleTestdata.Task4.taskname,
            DRAScheduleTestdata.Task5.taskname
        ]

describe.skip('Verify DailyLog status updates by assigning tasks to User group', () => {
    
    const projectName = Cypress.env('projectName_8')
    let tenantName

    it('login as adminUser to set up the project users', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'Admin') // Log in to the UI as admin user
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName,'User Group Setup')
        projectsettingpage.verifyAndCreateUserGroup('design', [Cypress.env('emailUserA')])
        projectsettingpage.navigateToProjectSettingOption(projectName,'Schedule Settings')
        projectsettingpage.enableUserGroup()
        projectsettingpage.navigateToProjectSettingOption(projectName,'Teams')
        projectsettingpage.addUsersIntoTeams(Cypress.env('emailUserA'))
        projectsettingpage.addUsersIntoTeams(Cypress.env('emailUserB'))
        projectsettingpage.navigateToProjectSettingOption(projectName,'User Group Setup')
        projectsettingpage.addUsersIntoUserGroup()
        cy.logoutUI() //Log out from UI as admin user
    })

    it('login as userA and update usergroup', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        // Intercept the GraphQL login request
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.log("in the scheduler page")
        schedulerpage.uploadCentroSchedule('/DRASchedule.mpp','msp') // Upload schedule
        cy.wait(5000)
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        //Process each task individually with its corresponding task ID
        const tasks = [
            { name: DRAScheduleTestdata.Task1.taskname, id: DRAScheduleTestdata.Task1.taskid },
            { name: DRAScheduleTestdata.Task2.taskname, id: DRAScheduleTestdata.Task2.taskid },
            { name: DRAScheduleTestdata.Task3.taskname, id: DRAScheduleTestdata.Task3.taskid },
            { name: DRAScheduleTestdata.Task4.taskname, id: DRAScheduleTestdata.Task4.taskid },
            { name: DRAScheduleTestdata.Task5.taskname, id: DRAScheduleTestdata.Task5.taskid }
        ];
        
        tasks.forEach(task => {
            schedulerpage.rightClickAndUpdateUsergroup(task.name, task.id, 'usergroup', 'design')
        });
        cy.logoutUI() //Log out from UI
    })

    it('login as userA and update plannedstartdate', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        //Process each task individually with its corresponding task ID
        const tasks = [
            { name: DRAScheduleTestdata.Task1.taskname, id: DRAScheduleTestdata.Task1.taskid },
            { name: DRAScheduleTestdata.Task2.taskname, id: DRAScheduleTestdata.Task2.taskid },
            { name: DRAScheduleTestdata.Task3.taskname, id: DRAScheduleTestdata.Task3.taskid },
            { name: DRAScheduleTestdata.Task4.taskname, id: DRAScheduleTestdata.Task4.taskid },
            { name: DRAScheduleTestdata.Task5.taskname, id: DRAScheduleTestdata.Task5.taskid }
        ];
        tasks.forEach(taskID => {
            schedulerpage.openScheduleinEditMode()
            schedulerpage.updatePlannedStartDateAfterSearchingTaskByID(taskID.id,-1)
        })
        cy.logoutUI() //Log out from UI
    })

    it('login as userA and update plannedstartdate', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigateToScheduler() // Navigate to the scheduler page
        cy.wait(5000)
        //Process each task individually with its corresponding task ID
        const tasks = [
            { name: DRAScheduleTestdata.Task1.taskname, id: DRAScheduleTestdata.Task1.taskid },
            { name: DRAScheduleTestdata.Task2.taskname, id: DRAScheduleTestdata.Task2.taskid },
            { name: DRAScheduleTestdata.Task3.taskname, id: DRAScheduleTestdata.Task3.taskid },
            { name: DRAScheduleTestdata.Task4.taskname, id: DRAScheduleTestdata.Task4.taskid },
            { name: DRAScheduleTestdata.Task5.taskname, id: DRAScheduleTestdata.Task5.taskid }
        ];
        schedulerpage.selectAdditionalColumns(['Planned End Date','Baseline Start Date','Baseline End Date','Actual Start Date','Progress','Status'])
        // tasks.forEach(taskID => {
        // })
        // cy.logoutUI() //Log out from UI
    })

    it('verify task is displayed under assigned activity', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.verifyTaskInDailyLog("assignedActivity",taskList[0])
        cy.logoutUI() //Log out from UI
    })

    it.skip('verify add dailylog and update dailylog button in DL page', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.verifyAddOrUpdateDailyLogButton()
        cy.logoutUI() //Log out from UI
    })
    it('verify taskdetails displayed in dailylog page before adding DL', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.isDailyLogAddedToday()
        dailylogpage.addDailyLog();
        cy.get('@runTests').then((runTests)=>{
            checkLabel = runTests.runTest
            if(checkLabel){
                dailylogpage.verifyStatusSelectorLabel(checkLabel)
                cy.log(`daily log not added today hence check for Update Today's Log label: ${checkLabel}`)
            }else{
                dailylogpage.verifyStatusSelectorLabel(checkLabel)
               cy.log(`daily log not added today hence check for Updated status label: ${checkLabel}`) 
            }
        })
        // cy.logoutUI() //Log out from UI
    })
    it('add daily log for given task with inProgressDelayed status', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.selectStatusFromDropDown(DRAScheduleTestdata.Task3.status,DRAScheduleTestdata.Task3.taskname);
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task3.taskname,`  Task delayed status entered by ${Cypress.env('emailUserA')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task3.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it('add daily log for given task with inProgressOnTrack status', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.selectStatusFromDropDown(DRAScheduleTestdata.Task4.status,DRAScheduleTestdata.Task4.taskname);
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task4.taskname,`  Task on track status entered by ${Cypress.env('emailUserA')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task4.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })  
    it('add daily log for given task with completed status', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.updateStatusWithFutureDates(DRAScheduleTestdata.Task5.status,DRAScheduleTestdata.Task5.taskname,'3');
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task5.taskname,`  Task completed status entered by ${Cypress.env('emailUserA')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task5.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it('add comment and photo for a inprogress task', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task2.taskname,`  Task ontrack status entered by ${Cypress.env('emailUserA')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task2.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })  
    it('Accept the daily log changes from schedule', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigateToScheduler();
        schedulerpage.viewandAcceptScheduleChanges(DRAScheduleTestdata.Task3.taskname, "Accept")
        schedulerpage.viewandAcceptScheduleChanges(DRAScheduleTestdata.Task4.taskname, "Accept")
        schedulerpage.viewandAcceptScheduleChanges(DRAScheduleTestdata.Task5.taskname, "Reject")
        cy.logoutUI() //Log out from UI
    }) 
    it.skip('Login as userB verify taskdetails displayed in dailylog page before adding DL', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONXB') // Log in to the UI as user B
        homepage.navigatetoDailyJob();
        dailylogpage.isDailyLogAddedToday()
        dailylogpage.addDailyLog();
        cy.get('@runTests').then((runTests)=>{
            checkLabel = runTests.runTest
            if(checkLabel){
                dailylogpage.verifyStatusSelectorLabel(checkLabel)
                cy.log(`daily log not added today hence check for Update Today's Log label: ${checkLabel}`)
            }else{
                dailylogpage.verifyStatusSelectorLabel(checkLabel)
               cy.log(`daily log not added today hence check for Updated status label: ${checkLabel}`) 
            }
        })
        cy.logoutUI() //Log out from UI
    })
    it('Login as userB add comment and photo to task3', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONXB') // Log in to the UI as user B
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        // dailylogpage.selectStatusFromDropDown(DRAScheduleTestdata.Task3.status,DRAScheduleTestdata.Task3.taskname);
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task3.taskname,`  Task delayed status entered by ${Cypress.env('emailUserB')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task3.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it('Login as userB add comment and photo to task4', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONXB') // Log in to the UI as user B
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task4.taskname,`  Task on track status entered by ${Cypress.env('emailUserB')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task4.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it('Login as userB update status from completed to inprogress delayed', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONXB') // Log in to the UI as user B
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.selectStatusFromDropDown(DRAScheduleTestdata.Task3.status,DRAScheduleTestdata.Task5.taskname);
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task5.taskname,`  Task completed status entered by ${Cypress.env('emailUserB')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task5.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it('Login as userB add comment and photo to task2', () =>{
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONXB') // Log in to the UI as user B
        homepage.navigatetoDailyJob();
        dailylogpage.addDailyLog();
        dailylogpage.addCommentsToDL(DRAScheduleTestdata.Task2.taskname,`  Task ontrack status entered by ${Cypress.env('emailUserB')}`)
        dailylogpage.addPhotoToDL(DRAScheduleTestdata.Task2.taskname,'cypress/fixtures/image1.jpg')
        cy.logoutUI() //Log out from UI
    })
    it.skip('login as userA and reset the schedule', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigateToScheduler() // Navigate to the scheduler page
        schedulerpage.viewandAcceptScheduleChanges(DRAScheduleTestdata.Task5.taskname, "Reject")
        cy.wait(5000)
        //Process each task individually with its corresponding task ID
        const tasks = [
            { name: DRAScheduleTestdata.Task3.taskname, id: DRAScheduleTestdata.Task3.taskid },
            { name: DRAScheduleTestdata.Task4.taskname, id: DRAScheduleTestdata.Task4.taskid },
            { name: DRAScheduleTestdata.Task5.taskname, id: DRAScheduleTestdata.Task5.taskid }
        ];
        tasks.forEach(taskID => {
            schedulerpage.openScheduleinEditMode()
            schedulerpage.updateStatusOfTaskInSchedule(taskID.id,"to-do")
        })
    })
    it('upload schedule three and clear the project ', () => {
        cy.loginToUIWithoutSession(projectName,tenantName = 'ONX') // Log in to the UI as user A
        homepage.navigateToScheduler() // Navigate to the scheduler page
        // schedulerpage.viewandAcceptScheduleChanges(DRAScheduleTestdata.Task5.taskname, "Reject")
        cy.wait(5000)
        schedulerpage.uploadCentroSchedule('/addDL.xml', 'msp')
        schedulerpage.verifyNoOfTasks(3)
    })
})   
            