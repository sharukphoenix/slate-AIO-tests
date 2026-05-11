import homePage from "../../support/pageObject/homePage";
import dailyLogPage from "../../support/pageObject/dailyLogPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import schedulerPage from "../../support/pageObject/schedulerPage";
import {default as addDailyLogTestData} from "../../fixtures/addDailyLogTestData.json";
import {default as DRAScheduleTestdata} from "../../fixtures/DRAScheduleTestdata.json";

const homepage = new homePage()
const dailylogpage = new dailyLogPage()
const projectsettingpage = new projectSettingPage()
const schedulerpage = new schedulerPage()

describe('Daily Log multi-user tests', () => {

    const projectName = Cypress.env('projectName_11')
    const tenantNameAdmin = "Admin"
    const tenantNameDLUser1 = "ONX"
    const tenantNameDLUser2 = "ONXB"
    const tenantNameUserA = "Test"

    // User group member emails
    const flooringMembers = [Cypress.env('emailAdmin'), Cypress.env('emailTest')]
    const designMembers = [Cypress.env('emailAdmin'), Cypress.env('emailUserA'), Cypress.env('emailUserB')]

    const taskList = [
        DRAScheduleTestdata.Task5.taskname,
        DRAScheduleTestdata.Task3.taskname
    ]
    const taskIdList = [
        DRAScheduleTestdata.Task5.taskid,
        DRAScheduleTestdata.Task3.taskid
    ]
    const multiUserComment = addDailyLogTestData.multiUser.comment
    const multiUserStatus = addDailyLogTestData.multiUser.status
    const multiUserProgress = addDailyLogTestData.multiUser.progressValue
    const multiUserBComment = addDailyLogTestData.multiUserB.comment
    const multiUserBStatus = addDailyLogTestData.multiUserB.status
    const multiUserBProgress = addDailyLogTestData.multiUserB.progressValue

    let isCommentAdded = false  // Set to true after first comment is added to the task today
    let changesAccepted = false // To prevent finding "Accept Changes" button after the first attempt

    beforeEach(function () {
        const adminTests = new Set([
            'Admin sets up user groups and members',
            'Admin uploads schedule and assigns user group to tasks',
            'Admin rejects User A changes',
            'Admin accepts User B changes',
            'Admin enables variance toggle',
            'Admin verifies variance in scheduler task details',
            'Upload new schedule and clear the project',
            'Delete user groups and reset schedule settings'
        ])
        const userATests = new Set([
            'Verify that a task associated with a user group is visible to only users within that group',
            'Verify that variance is not mandatory for on-time task'
        ])
        const userBTests = new Set([
            'User B updates daily log with different progress and comment'
        ])
        const title = this.currentTest?.title
        let tenantName
        if (adminTests.has(title)) {
            tenantName = tenantNameAdmin
        } else if (userATests.has(title)) {
            tenantName = tenantNameUserA
        } else if (userBTests.has(title)) {
            tenantName = tenantNameDLUser2
        } else {
            tenantName = tenantNameDLUser1
        }
        cy.loginToUI(projectName, tenantName)
    })

    it('Admin sets up user groups and members', () => {
        cy.visit('/')
        homepage.navigateToProjectSettings()
        projectsettingpage.navigateToProjectSettingOption(projectName, 'User Group Setup')
        projectsettingpage.verifyAndCreateUserGroup('design', designMembers)
        projectsettingpage.verifyAndCreateUserGroup('flooring', flooringMembers)
        projectsettingpage.navigateToProjectSettingOption(projectName, 'DailyLog Settings')
        projectsettingpage.enableUserGroup()
    })

    it('Admin uploads schedule and assigns user group to tasks', () => {
        cy.visit('/')
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        homepage.navigateToScheduler()
        cy.wait(5000)
        schedulerpage.ensureTaskDetailsClosed()
        schedulerpage.clearAcceptChanges()
        schedulerpage.uploadCentroSchedule('/DRASchedule.mpp', 'msp')
        cy.wait(5000)
        schedulerpage.ensureActivityPanelOpen()
        schedulerpage.ensureScheduleExpanded()
        cy.log("task list: " + JSON.stringify(taskList))
        schedulerpage.rightClickAndUpdateUsergroup(taskList[0], taskIdList[0], 'usergroup', 'flooring')
        schedulerpage.rightClickAndUpdateUsergroup(taskList[1], taskIdList[1], 'usergroup', 'design')
        schedulerpage.openScheduleinEditMode()
        schedulerpage.updatePlannedStartDate(taskList[0], taskIdList[0], 0)
        schedulerpage.openScheduleinEditMode()
        schedulerpage.updatePlannedStartDate(taskList[1], taskIdList[1], -3)
    })

    it('Verify that a task associated with a user group is visible to only users within that group', () => {
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.verifyTaskInDailyLog('assignedActivity', taskList[0])
        dailylogpage.verifyTaskNotInDailyLog('assignedActivity', taskList[1])
        cy.logoutUI()
        cy.loginToUI(projectName, tenantNameDLUser1)
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.verifyTaskInDailyLog('assignedActivity', taskList[1])
        dailylogpage.verifyTaskNotInDailyLog('assignedActivity', taskList[0])
    })
    it('Verify if user-group ownership is enabled for a project, assignee ownership shall not work', () => {
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.verifyTaskInDailyLog('assignedActivity', taskList[1])
        dailylogpage.verifyTaskNotInDailyLog('assignedActivity', taskList[0])

        // Verify status label transition "Update today's status --> Updated status"
        dailylogpage.checkStatusLabel(taskList[1], "Update today's status")
        dailylogpage.selectStatusFromDropDown(multiUserStatus, taskList[1])
        dailylogpage.checkStatusLabel(taskList[1], "Updated status")
    })

    it('Verify that variance is not mandatory when "Variance Required" toggle is OFF', () => {
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        // inProgressDelayed WITHOUT filling variance - should succeed since toggle is OFF
        dailylogpage.selectStatusFromDropDown('inProgressDelayed', taskList[1], 10, false)
    })

    it('Verify that variance is not mandatory for on-time task', () => {
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        // task01 planned start = today → on schedule → variance not mandatory
        dailylogpage.selectStatusFromDropDown('inProgressDelayed', taskList[0], 10, false)
    })

    it('Verify that userA can update daily log and userB can verify the changes', () => {
        //User A: update daily log
        cy.visit("/")
        const userAComment = `User A: ${multiUserComment}`
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.selectStatusFromDropDown(multiUserStatus, taskList[1])
        dailylogpage.addCommentsToDL(taskList[1], userAComment, isCommentAdded)
        isCommentAdded = true
        dailylogpage.addPhotoToDL(taskList[1], 'cypress/fixtures/image1.jpg')
        //Switch to User B
        cy.logoutUI()
        cy.loginToUI(projectName, tenantNameDLUser2)
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.checkStatus(taskList[1], multiUserStatus)
        dailylogpage.checkProgress(taskList[1], multiUserProgress)
        dailylogpage.checkComment(taskList[1], userAComment)
        dailylogpage.checkPhotoAttached(taskList[1])
        cy.then(() => {         //cy.getUserName() is asynchronous so we need to use .then()
            const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
            cy.log('Verifying submitted-by for: ' + fullName)
            dailylogpage.checkSubmittedByInfo(taskList[1], fullName)
        })
    })

    it('Verify that userB can delete comment and photos and userA can verify deletion', () => {
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        const userAComment = `User A: comment to be deleted`
        dailylogpage.addCommentsToDL(taskList[1], userAComment, isCommentAdded)
        dailylogpage.addPhotoToDL(taskList[1], 'cypress/fixtures/image1.jpg')

        cy.logoutUI()
        cy.loginToUI(projectName, tenantNameDLUser2)
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.deleteCommentsInDL(taskList[1])
        dailylogpage.deleteAllPhotosInDL(taskList[1])
        //Switch back to User A: verify deletions
        cy.logoutUI()
        cy.loginToUI(projectName, tenantNameDLUser1)
        cy.visit("/")
        homepage.navigatetoDailyJob()
        dailylogpage.addDailyLog()
        dailylogpage.checkCommentEmpty(taskList[1])
        dailylogpage.checkNoPhoto(taskList[1])
        dailylogpage.checkStatus(taskList[1], multiUserStatus)
        cy.then(() => {
            const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
            dailylogpage.checkSubmittedByInfo(taskList[1], fullName)
        })
    })

    describe('Verify that latest Status is visible after multiple users make changes', () => {

        it('User A updates daily log', () => {
            cy.visit("/")
            homepage.navigatetoDailyJob()
            dailylogpage.addDailyLog()
            const userAComment = `User A: ${multiUserComment}`
            cy.log('User A sets status to ' + multiUserStatus + ' with progress ' + multiUserProgress)
            dailylogpage.selectStatusFromDropDown(multiUserStatus, taskList[1], parseInt(multiUserProgress))
            dailylogpage.addCommentsToDL(taskList[1], userAComment, isCommentAdded)
        })

        it('Admin rejects User A changes', () => {
            cy.visit('/')
            homepage.navigateToScheduler()
            cy.log('Admin rejecting User A changes for ' + taskList[1])
            schedulerpage.clearAcceptChanges()
            cy.logoutUI()
        })

        it('User B updates daily log with different progress and comment', () => {
            cy.visit("/")
            homepage.navigatetoDailyJob()
            dailylogpage.addDailyLog()
            dailylogpage.deleteCommentsInDL(taskList[1])
            const userBComment = `User B: ${multiUserBComment}`
            dailylogpage.addCommentsToDL(taskList[1], userBComment, true)
            cy.log('User B sets status to ' + multiUserBStatus + ' with progress ' + multiUserBProgress)
            dailylogpage.selectStatusFromDropDown(multiUserBStatus, taskList[1], parseInt(multiUserBProgress))
        })

        it('Admin accepts User B changes', () => {
            cy.visit('/')
            homepage.navigateToScheduler()
            cy.log('Admin accepting User B changes for ' + taskList[1])
            schedulerpage.viewandAcceptScheduleChanges(taskList[1], 'Accept')
        })

        it('User A verifies accepted changes in scheduler', () => {
            cy.visit('/')
            homepage.navigatetoDailyJob()
            dailylogpage.addDailyLog()
            dailylogpage.getPercentProgressDL(taskList[1])
            cy.get('@percentProgressDL').then((progressDL) => {
                cy.log('Daily log percent progress: ' + progressDL)
                // Navigate to scheduler and compare
                cy.visit('/')
                homepage.navigateToScheduler(false)
                cy.wait(3000)
                schedulerpage.selectAdditionalColumns(['Progress', 'Status'])
                schedulerpage.getPercencentProgressScheduler(taskList[1], taskIdList[1])
                cy.get('@percentProgressScheduler').then((progressScheduler) => {
                    cy.log('Scheduler percent progress: ' + progressScheduler)
                    cy.wrap(progressDL).should('eq', progressScheduler)
                })
            })
        })
    })

    describe('Verify that variance is mandatory field when "Variance Required" toggle is ON', () => {
        it('Admin enables variance toggle', () => {
            cy.visit('/')
            homepage.navigateToProjectSettings()
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Schedule Settings')
            projectsettingpage.toggleVarianceControl(true)
        })

        it('Variance mandatory for task where actual end date is different from planned end date', () => {
            cy.visit("/")
            homepage.navigatetoDailyJob()
            dailylogpage.addDailyLog()
            // Select inProgressDelayed and completed WITH variance -> verify mandatory(*) markers
            dailylogpage.selectStatusFromDropDown('inProgressDelayed', taskList[1], 10, true, true)
            dailylogpage.selectStatusFromDropDown('completed', taskList[1], true, true)
        })

        it('Admin verifies variance in scheduler task details', () => {
            cy.visit('/')
            homepage.navigateToScheduler()
            // cy.wait(5000)
            // schedulerpage.ensureTaskDetailsClosed()
            changesAccepted ? schedulerpage.viewandAcceptScheduleChanges(taskList[1], 'Accept') : cy.log("Changes accepted already")
            schedulerpage.ensureActivityPanelOpen()
            schedulerpage.ensureScheduleExpanded()
            schedulerpage.openTaskDetails([taskList[1]], 0, taskIdList[1])
            schedulerpage.selectTaskDetailTab('variances',' Variances')
            schedulerpage.verifyVarianceAdded()
        })
    })

    describe("Post-test cleanup", () => {
        it('Upload new schedule and clear the project', () => {
            cy.visit('/')
            homepage.navigateToScheduler()
            cy.wait(5000)
            schedulerpage.ensureTaskDetailsClosed()
            schedulerpage.clearAcceptChanges()
            schedulerpage.uploadCentroSchedule('/addschedule01.xml', 'msp')
        })
        it("Delete user groups and reset schedule settings", () => {
            cy.visit('/')
            homepage.navigateToProjectSettings()
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Schedule Settings')
            projectsettingpage.toggleVarianceControl(false)
            projectsettingpage.navigateToProjectSettingOption(projectName, 'DailyLog Settings')
            projectsettingpage.enableUserGroup(false)

            projectsettingpage.navigateToProjectSettingOption(projectName, 'User Group Setup')
            projectsettingpage.deleteAllUserGroups()
        })
    })
})
