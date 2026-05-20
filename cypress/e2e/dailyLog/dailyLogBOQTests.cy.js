import homePage from "../../support/pageObject/homePage";
import dailyLogPage from "../../support/pageObject/dailyLogPage";
import projectSettingPage from "../../support/pageObject/projectSettingPage";
import schedulerPage from "../../support/pageObject/schedulerPage";
import { default as DLBOQTestData } from "../../fixtures/DL_BOQ_Test_Data.json";

const homepage = new homePage();
const dailylogpage = new dailyLogPage();
const projectsettingpage = new projectSettingPage();
const schedulerpage = new schedulerPage();

const tasks = [
    DLBOQTestData.Task1,
    DLBOQTestData.Task2,
    DLBOQTestData.Task3,
    DLBOQTestData.Task4
];

describe('Daily Log BOQ Tests', () => {
    
    const projectName = Cypress.env('projectName_13');
    const tenantName = "Sharuk";
    const assignee = Cypress.env('emailSharuk').split('@')[0];

    beforeEach(() => {
        cy.loginToUI(projectName, tenantName);
    });

    describe('Test Setup block', () => {
        
        it('Import classification code', () => {
            cy.visit('/');
            homepage.navigateToProjectSettings();
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Classification Code');
            projectsettingpage.verifyAndUploadClassificationcode('classificationCode_withUoM.xlsx');
        });

        it('Upload schedule', () => {
            cy.visit('/');
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.ensureTaskDetailsClosed();
            schedulerpage.uploadCentroSchedule('/DRASchedule.mpp', 'msp');
            cy.wait(5000);
            schedulerpage.ensureActivityPanelOpen();
            schedulerpage.ensureScheduleExpanded();
        });

        it('Update assignees for tasks', () => {
            cy.visit('/');
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.ensureActivityPanelOpen();
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            tasks.forEach(task => {
                schedulerpage.searchTaskByName(task.taskname);
                // Update assignee
                schedulerpage.updateTaskFieldByIndex('assignee', assignee, task.taskname, 2);
            });
        });
    });
    
    describe('Verify Actual Quantity and UoM', () => {
        it('Import BOQ', () => {
            cy.visit('/');
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.ensureTaskDetailsClosed();
            schedulerpage.importBOQ('/DL_BOQ_Template.xlsx');
            cy.wait(5000);
            schedulerpage.ensureActivityPanelOpen();
            schedulerpage.ensureScheduleExpanded();
        })

        it('Verify in Schedule columns', () => {
            cy.visit('/');
            homepage.navigateToScheduler();
            schedulerpage.ensureActivityPanelOpen();
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            cy.wait(5000);
            schedulerpage.selectAdditionalColumns(['Classification Code', 'Planned Quantity'])
            tasks.forEach(task => {
                schedulerpage.searchTaskByName(task.taskname);
                schedulerpage.verifyBOQColumns(2, task.taskname, task.classificationCode, task.classificationCodeName, task.plannedQuantity, task.UoM);
            });
            schedulerpage.deselectAdditionalColumns(['Classification Code', 'Planned Quantity'])
        });

        it('Verify in task details', () => {
            cy.visit('/');
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.ensureActivityPanelOpen();
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            tasks.forEach(task => {
                schedulerpage.searchTaskByName(task.taskname);
                schedulerpage.openTaskDetails([task.taskname], 2)
                schedulerpage.selectTaskDetailTab('productivity','Productivity')
                schedulerpage.verifyProductivity(task)
                schedulerpage.closeTaskDetails()
            })
        })
    })

    describe('Daily log tests', () => {
        it('Set decimal precision to 0', () => {
            cy.visit('/');
            homepage.navigateToProjectSettings();
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Schedule Settings');
            projectsettingpage.setDecimalPrecision('0');
        });
        it('Task 2 - BOQ Quantity update to 10% progress', () => {
            const task = DLBOQTestData.Task2;
            cy.visit('/');
            homepage.navigatetoDailyJob();
            dailylogpage.addDailyLog();
            dailylogpage.selectBOQStatusFromDropDown(
                task.status,             // 'inProgressOnTrack'
                task.taskname,           // 'Column Reinforcement'
                task.progress,           // '10'
                task.plannedQuantity,    // '137'
                task.plannedDuration,    // '20'
                task.decimalPrecision,   // '0'
                task.todayQuantity,      // '13.7'
                task.UoM                 // 'kg'
            );
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.verifyBOQAcceptChanges(
                task.taskname,
                task.progress,
                'Accept'
            );
            schedulerpage.selectAdditionalColumns(['Progress']);
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            schedulerpage.searchTaskByName(task.taskname);
            schedulerpage.getPercencentProgressScheduler(task.taskname, task.taskid);
            cy.get('@percentProgressScheduler').should('eq', task.progress);
        });

        it('Set decimal precision to 1', () => {
            cy.visit('/');
            homepage.navigateToProjectSettings();
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Schedule Settings');
            projectsettingpage.setDecimalPrecision('1');
        });

        it.only('PLA-TC-5984 - BOQ Quantity update as in progress delayed', () => {
            const task = DLBOQTestData.Task3;
            cy.visit('/');
            homepage.navigatetoDailyJob();
            dailylogpage.addDailyLog();
            dailylogpage.selectBOQStatusFromDropDown(
                task.status,             // 'inProgressDelayed'
                task.taskname,           // 'Retaining Wall Reinforcement-1st Lift'
                task.progress,           // '6.8%'
                task.plannedQuantity,    // '176'
                task.plannedDuration,    // '10'
                task.decimalPrecision,   // '1'
                task.todayQuantity,      // '12'
                task.UoM,               // 'kg'
                true                    // fillVariance
            );
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.verifyBOQAcceptChanges(
                task.taskname,
                task.progress,
                'Accept'
            );
            // schedulerpage.selectAdditionalColumns(['Progress']);
            // schedulerpage.ensureScheduleExpanded();
            // schedulerpage.resizeColumn('Activity Name', 350);
            // schedulerpage.searchTaskByName(task.taskname);
            // schedulerpage.getPercencentProgressScheduler(task.taskname, task.taskid);
            // cy.get('@percentProgressScheduler').should('eq', task.progress);
        });

        it('Set decimal precision to 2', () => {
            cy.visit('/');
            homepage.navigateToProjectSettings();
            projectsettingpage.navigateToProjectSettingOption(projectName, 'Schedule Settings');
            projectsettingpage.setDecimalPrecision('2');
        });

        it('Task 4 - BOQ Quantity update as in progress delayed', () => {
            const task = DLBOQTestData.Task4;
            cy.visit('/');
            homepage.navigatetoDailyJob();
            dailylogpage.addDailyLog();
            dailylogpage.selectBOQStatusFromDropDown(
                task.status,             // 'inProgressDelayed'
                task.taskname,           // 'Grade Slab PCC'
                task.progress,           // '95.24%'
                task.plannedQuantity,    // '210'
                task.plannedDuration,    // '1'
                task.decimalPrecision,   // '2'
                task.todayQuantity,      // '200'
                task.UoM                 // 'Ton'
            );
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.verifyBOQAcceptChanges(
                task.taskname,
                task.progress,
                'Accept'
            );
            schedulerpage.selectAdditionalColumns(['Progress']);
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            schedulerpage.searchTaskByName(task.taskname);
            schedulerpage.getPercencentProgressScheduler(task.taskname, task.taskid);
            cy.get('@percentProgressScheduler').should('eq', task.progress);
        });

        it('Task 5 - BOQ Quantity update as completed', () => {
            const task = DLBOQTestData.Task5;
            cy.visit('/');
            homepage.navigatetoDailyJob();
            dailylogpage.addDailyLog();
            dailylogpage.selectBOQStatusFromDropDown(
                task.status,             // 'completed'
                task.taskname,           // 'Waterproofing'
                task.progress,           // '8%'
                task.plannedQuantity,    // '100'
                task.plannedDuration,    // '20'
                task.decimalPrecision,   // '0'
                task.todayQuantity,      // '8'
                task.UoM                 // 'LS'
            );
            homepage.navigateToScheduler();
            cy.wait(5000);
            schedulerpage.verifyBOQAcceptChanges(
                task.taskname,
                task.progress,
                'Accept',
                true
            );
            schedulerpage.selectAdditionalColumns(['Progress']);
            schedulerpage.ensureScheduleExpanded();
            schedulerpage.resizeColumn('Activity Name', 350);
            schedulerpage.searchTaskByName(task.taskname);
            schedulerpage.getPercencentProgressScheduler(task.taskname, task.taskid);
            cy.get('@percentProgressScheduler').should('eq', task.progress);
        });

    });
    describe("Post-test cleanup", () => {
        it('Upload new schedule and clear the project', () => {
            cy.visit('/')
            homepage.navigateToScheduler()
            cy.wait(5000)
            schedulerpage.ensureTaskDetailsClosed()
            schedulerpage.clearAcceptChanges()
            schedulerpage.uploadCentroSchedule('/addschedule01.xml', 'msp')
        });
    });
});