import 'cypress-file-upload'

const autoScheduleAndSave = false;
const forceSave = true;

class schedulerPage {
    pageelements={
        scheduleChangesCheckBox: () => cy.get('input[type="checkbox"]'),
        leftExpandBtn:  () => cy.get('[class="MuiSvgIcon-root gantt-container__left__expand"]'),
        editPlanBtn:    () => cy.get('button[data-testid="edit-plan"]'),
        savePlanBtn:    () => cy.get('button[data-testid="save plan"]')
    }

    verifyAcceptChangesAndClearNotification(dailyLogStatus,userAction){
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
            cy.log("schedule is loaded")
        })
        cy.wait(1000)
        cy.get('.projectPlanHeader__leftAction__accept-changes-count ').then((number) => {
            console.log("Total requests to be accept " + JSON.stringify(number.text()))

        })
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
            cy.log("schedule is loaded")
        })
        cy.document().then((doc)=>{
            const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
            if(leftActionHeader){
                const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                if(collapseBtn){
                    cy.log("schedule is already expanded")
                }else{
                    cy.get('[title="Expand"]').should('be.visible')
                }
            }
        })
        cy.get('[class="projectPlanHeader__leftAction__accept-changes "]').should('be.visible')
        cy.get('[class="projectPlanHeader__leftAction__accept-changes "]').trigger('click')
        // cy.interceptGraphQlRequest("getPartialUpdatedTasks")
        // cy.wait("@getPartialUpdatedTasks").then((req)=>{
        //     cy.log("accept changes dialogue is open")
        // })
        this.pageelements.scheduleChangesCheckBox().check()
        cy.get('.ViewScheduleUpdate__body__item__data__subitem__entry').invoke('text').should("contain",dailyLogStatus)
        cy.xpath(`//span[text()='${userAction}']`).click()
        cy.wait(10000)
    }
    viewandAcceptScheduleChanges(taskName,userAction){
        cy.get('.projectPlanHeader__leftAction__accept-changes-count').then((number) => {
            cy.wait(3000)
            cy.log("Total requests to be accept " + JSON.stringify(number.text()))
            if(parseInt(number.text())>0){
                cy.get('.projectPlanHeader__leftAction__accept-changes').first().then(($a)=>{
                    if($a.next('div.ViewScheduleUpdate').length === 0){
                        cy.wrap($a).click({ force: true })
                    }
                })
            }
        })
        cy.document().then((doc)=>{
            const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
            if(leftActionHeader){
                const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                if(collapseBtn){
                    cy.log("schedule is already expanded")
                }else{
                    cy.get('[title="Expand"]').should('be.visible')
                }
            }
        })
        cy.get('.projectPlanHeader__leftAction__accept-changes').first().should('be.visible')
        cy.get('.ViewScheduleUpdate__body__item__data__subitem', { timeout: 45000 }).contains('span',`${taskName}`)
        .parents('.ViewScheduleUpdate__body__item__data__subitem')
        .find("input[type='checkbox']").check({force:true})
        if(taskName !== "pendingTask"){
            cy.xpath(`//span[text()='${userAction}']`).click()
            cy.wait(6000)
            if(taskName === "acceptTask"){
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), `We'll send an email when your changes are processed.`, 'Schedule changes accepted sucessfully')
                })
                // Use Cypress's built-in wait for the UI to stabilize
                cy.get('.msgtoaster__text').should('not.exist') 
            }
        }   
    }
    verifyBOQAcceptChanges(taskName, expectedProgressValue, userAction, isCompleted = false) {
        cy.get('.projectPlanHeader__leftAction__accept-changes-count').then((number) => {
            cy.wait(3000)
            cy.log("Total requests to be accept " + JSON.stringify(number.text()))
            if(parseInt(number.text())>0){
                cy.get('.projectPlanHeader__leftAction__accept-changes').first().then(($a)=>{
                    if($a.next('div.ViewScheduleUpdate').length === 0){
                        cy.wrap($a).click({ force: true })
                    }
                })
            }
        })
        cy.wait(2000)
        cy.document().then((doc)=>{
            const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
            if(leftActionHeader){
                const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                if(collapseBtn){
                    cy.log("schedule is already expanded")
                }else{
                    cy.get('[title="Expand"]').should('be.visible')
                }
            }
        })
        cy.get('.projectPlanHeader__leftAction__accept-changes').first().should('be.visible')
        cy.get('.ViewScheduleUpdate__body__item__data__subitem', { timeout: 45000 }).contains('span',`${taskName}`)
            .parents('.ViewScheduleUpdate__body__item__data__subitem')
            .within(() => {
                cy.get("input[type='checkbox']").check({force:true})
                cy.get('.ViewScheduleUpdate__body__item__data__subitem__entry').invoke('text').should("contain", (isCompleted ? 'completed' : expectedProgressValue))
            })

        if(taskName !== "pendingTask"){
            cy.xpath(`//span[text()='${userAction}']`).click()
            cy.wait(6000)
            if(taskName === "acceptTask"){
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), `We'll send an email when your changes are processed.`, 'Schedule changes accepted sucessfully')
                })
                cy.get('.msgtoaster__text').should('not.exist') 
            }
        }
    }

    addNewTask(projectName, assignee, [...data],isSaveVersion = false) {
        let startDate
        cy.getDate(0, 'IN').then((date) => {
            startDate = date
            data.forEach((item) => {
                cy.log("Adding new task")
                this.ensureEditPlanMode()
                this.ensureActivityPanelOpen()
                this.ensureScheduleExpanded()
                this.addTaskDetails(projectName, item, startDate, assignee)
                // Conditional save based on isSaveVersion
                if (isSaveVersion) {
                    this.savePlanVersion() // Call savePlanVersion if isSaveVersion is true
                } else {
                    this.savePlan() // Otherwise, call savePlan
                }
                cy.wait(15000)
            })
        })
    }

    ensureActivityPanelOpen() {
        cy.document().then((doc) => {
            const leftContainer = doc.querySelector('div.gantt-container__left')
            if (leftContainer) {
                const activityList = leftContainer.querySelector('div.gantt-container__left__title')
                if (activityList) {
                    this.pageelements.leftExpandBtn().click()
                } else {
                    cy.log("Left activity panel is already open")
                }
            }
        })
    }

    ensureEditPlanMode() {
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button => {
            if ($button.attr("data-testid") === "edit-plan") {
                cy.wrap($button).click()
                cy.log("Edit plan is clicked")
            } else {
                cy.get("[aria-controls='edit-save-mode']").click()
                    .get("ul li").contains('Discard changes').click()
                this.pageelements.editPlanBtn().should('be.visible').click()
            }
        })
    }

    ensureScheduleExpanded() {
        cy.wait(3000)
        cy.document().then((doc) => {
            const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
            if (leftActionHeader) {
                const collapseBtn = leftActionHeader.querySelector('[data-testid="collapse"]')
                if (collapseBtn) {
                    // Button says Collapse → but tree might be partially expanded.
                    // Collapse first, then expand to force a full re-expansion.
                    cy.get('[data-testid="collapse"]').click()
                    cy.wait(2000)
                    cy.get('[data-testid="expand"]').click()
                } else {
                    // Button says Expand → just expand
                    cy.get('[data-testid="expand"]').click()
                }
            }
        })
        cy.wait(3000)
    }

    addTaskDetails(projectName, item, startDate, assignee) {
        // Some screens don't render the gantt_custom_grid_row_highlight wrapper reliably.
        // Locate the row by task name text and then click the add icon inside the same gantt row.
        cy.get('.gantt_grid_data')
            .contains('b', projectName)
            .should('exist')
            .then(($b) => {
                cy.wrap($b)
                    .closest('div.gantt_row')
                    .find('p.ganttCustomAddTak[data-action="add"]')
                    .should('be.visible')
                    .click({ force: true });
            })
        cy.get('select[name="type"]').first().select(item.type)
        cy.xpath("//input[@data-testid='task-name']").type(item.taskname)
        cy.get("[name='start_date']").clear().type(startDate)
        cy.get("[name='duration']").clear().type(item.duration)
        cy.xpath("//span[text()='Add Assignee']").click()
        if (assignee) {
            cy.get("[id='user-usergroup-search']").type(assignee, { delay: 150 })
            cy.wait(500)
            cy.get('.singleUserSelect__option__list__item').click()
            cy.wait(500)
        }
        cy.xpath("//span[text()='Add']").click()
    }
    autoScheduleAndSave(){         //Have to reuse interception from clickOnAutoSchedule()
        const AUTO_SCHEDULE_URL = "https://schedulemaster-api.service.**.slate.ai/v1/projecttask/autoSchedule"
        const ERROR_MESSAGE = "Error while auto scheduling"
        cy.intercept('POST', AUTO_SCHEDULE_URL).as('AutoSchedule')
        cy.get("[data-testid='auto-schedule-and-save']").should('be.visible').click()
        cy.wait('@AutoSchedule').then((interception) => {
            const { statusCode, body } = interception.response
            // Check the status code
            if (statusCode !== 201) {
                throw new Error(`AutoSchedule failed with status code: ${statusCode}`)
            }
            // Check that the response does not contain the error message
            if (body.error && body.error.includes(ERROR_MESSAGE)) {
                throw new Error(`AutoSchedule response contains error: ${ERROR_MESSAGE}`)
            }
    
            cy.log("AutoSchedule completed successfully without errors")
        })
    }
    savePlan(autoScheduleAndSave = false, forceSave = false) {
        const SUCCESS_MESSAGE = 'Saved project plan successfully'
    
        // Set up intercept BEFORE triggering the request
        cy.intercept('PUT', 'https://scheduler.service.qe.slate.ai/V1/taskDetails/update_serialNumber').as('UpdateSerialNumber')
        // Click the save plan button
        this.pageelements.savePlanBtn().should('be.visible').click({force: forceSave}) // Forcing save when Toast Message is covering Save Plan Button
        // Intercept and verify the calendar update
        cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
        //Handling the auto schedule warning
        if(autoScheduleAndSave) {
            this.autoScheduleAndSave()
        }
        cy.wait("@getAllProjectAssociatedCalendar").then((req) => {
            cy.log("Schedule is saved")
        })
        
        // Verify the success message
        cy.get('.msgtoaster__text').should('have.text', SUCCESS_MESSAGE)
    
        // Wait and verify the serial number update with retry
        this.updateSerialNumber()
    
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')
        cy.wait(15000)
    }

    deleteTask([...taskNames]) {
        taskNames.forEach((task) => {
            cy.log(`Deleting task: ${task}`)
            this.ensureSchedulerLoaded()
            this.ensureEditPlanMode()
            this.ensureActivityPanelOpen()
            this.ensureScheduleExpanded()
            this.selectTaskForDeletion(task)
            this.confirmTaskDeletion()
            this.savePlan(autoScheduleAndSave, forceSave)     //forceSave = true
            cy.wait(15000)
        })
    }

    ensureSchedulerLoaded() {
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button) => {
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
    }

    selectTaskForDeletion(task) {
        cy.wait(10000)
        cy.xpath(`//span[contains(@class,"gantt-task-name-text") and text()="${task}"]`).first()
            .scrollIntoView()
            .should('be.visible')
            .click()
        cy.wait(1000)
        cy.get('.gantt_grid_data').click({force: true})
        cy.wait(3000)
        cy.xpath(`//span[contains(@class,"gantt-task-name-text") and text()="${task}"]`).first()
            .scrollIntoView()
            .should('be.visible')
            .rightclick()
        cy.xpath("//span[text()='Delete']").click()
    }

    confirmTaskDeletion() {
        cy.get(".dialog__body p").should('contain', 'All information about this activity will be lost. Are you sure you want to delete the selected item?')
        cy.get("[data-testid='confirm-action']").click()
    }

    isTasksCreated(){
    // Intercept the GraphQL schedule request
    cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
    cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
        cy.log(req.request.body.operationName)
        cy.log("Response", req.response.body)
        cy.wrap(req.response.body.data).should("have.property","tasks")
        if(req.response.body.data.tasks.length === 1){
            cy.log("task is not uploaded")
            return cy.wrap(false).as('taskCreated')
        }else{
            cy.log("task is already uploaded")
            return cy.wrap(true).as('taskCreated')
        }
    })
    }
    addNewTaskForUpcomingActivity(projectName,assignee, [...data]){
        let startDate
        cy.getDate(7, 'US').then((date)=>{
            startDate = date
        data.forEach((item) => {
            cy.log("add new task")
            cy.document().then((doc)=>{
                const leftContainer = doc.querySelector('div.gantt-container__left')
                if(leftContainer){
                    const activityList = leftContainer.querySelector('div.gantt-container__left__title')
                    if(activityList){
                        this.pageelements.leftExpandBtn().click()
                    }else{
                        cy.log("left activity panel is already open")
                    }
                }
            })
            cy.wait(10000)
            //verify if edit plan button is visible
            cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
                if($button.attr("data-testid")==="edit-plan"){
                    //edit plan button is present
                    cy.wrap($button).click()
                    cy.wait(1000)
                    cy.log("edit plan is clicked")
                }else{
                    //save plan button is present
                    cy.get("[aria-controls='edit-save-mode']").click()
                    .get("ul li").contains('Discard changes').click()
                    this.pageelements.editPlanBtn().should('be.visible').click()
                }
            })
            cy.document().then((doc)=>{
                const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
                if(leftActionHeader){
                    const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                    if(collapseBtn){
                        cy.log("schedule is already expanded")
                    }else{
                        cy.get('[title="Expand"]').click()
                    }
                }
            })
            cy.wait(3000)
            cy.get('.gantt_grid_data')
                .contains('b', projectName)
                .should('exist')
                .then(($b) => {
                    cy.wrap($b)
                        .closest('div.gantt_row')
                        .find('p.ganttCustomAddTak[data-action="add"]')
                        .should('be.visible')
                        .click({ force: true });
                })
            cy.get('select[name="type"]').first().select(item.type)
            cy.xpath("//input[@data-testid='task-name']").type(item.taskname)
            cy.get("[name='start_date']").clear().type(startDate)
            cy.get("[name='duration']").clear().type(item.duration)
            cy.xpath("//span[text()='Add Assignee']").click()
            cy.get("[id='user-usergroup-search']").type(assignee,{delay:150})
            cy.wait(500)
            cy.document().its('body').then(($body)=>{ 
                const $bodyJquery = Cypress.$($body)
                if($bodyJquery.find('.singleUserSelect__option__nodata singleUserSelect__option__nodata__width').length>0){
                    cy.log("No assignee found")
                    cy.wait(500)
                    cy.xpath("//span[text()='Add']").click()
                }else{
                    cy.log("assignee found")
                    cy.get('.singleUserSelect__option__list__item').click()
                    cy.wait(500)
                    cy.xpath("//span[text()='Add']").click()
                }
            })
            // Set up intercept BEFORE triggering the request
            cy.intercept('PUT', 'https://scheduler.service.qe.slate.ai/V1/taskDetails/update_serialNumber').as('UpdateSerialNumber')
            this.pageelements.savePlanBtn().should('be.visible').click()
            cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
            cy.wait("@getAllProjectAssociatedCalendar").then((req)=>{
                cy.log("schedule is saved")
            }) 
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
            })   
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist')   
            this.updateSerialNumber()
            cy.wait(10000)
        })
    })
    }    
    getPercencentProgressScheduler(taskName, serialId){
        this.ensureScheduleExpanded()
        if (serialId) {
            // Reuse the same task targeting strategy used by rightClickAndUpdateUsergroup.
            this.selectTaskByNameAndId(taskName, serialId)
            cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${serialId}"]]//div[@data-column-name="progress"]//div`)
                .first()
                .invoke('text')
                .then((text)=>{
                    let percentProgressScheduler = text.trim().replace('%', '');
                    cy.log(percentProgressScheduler)
                    return cy.wrap(percentProgressScheduler).as('percentProgressScheduler')
                })
        } else {
            // Backward-compatible fallback for callers that only pass task name.
            this.searchTaskByName(taskName)
            cy.xpath(`//div[contains(@class,"gantt_cell_tree") and contains(normalize-space(@aria-label),"${taskName}")]/parent::div//div[@data-column-name="progress"]//div`)
                .first()
                .invoke('text')
                .then((text)=>{
                    let percentProgressScheduler = text.trim().replace('%', '');
                    cy.log(percentProgressScheduler)
                    return cy.wrap(percentProgressScheduler).as('percentProgressScheduler')
                })
        }
    }

    selectAdditionalColumns([...values]){
        values.forEach((value) => {
            this.ensureScheduleExpanded()
            cy.document().then((doc)=>{
                const leftContainer = doc.querySelector('div.gantt-container__left')
                if(leftContainer){
                    const activityList = leftContainer.querySelector('div.gantt-container__left__title')
                    if(activityList){
                        this.pageelements.leftExpandBtn().click()
                    }else{
                        cy.log("left activity panel is already open")
                    }
                }
            })
            // Header button selector changed in some builds; try known variants.
            cy.get('body').then(($body) => {
                const menuSelectors = [
                    '.gantt-dropdown img',
                    '.gantt_grid_head_buttons .gantt-dropdown img',
                    'div.gantt_grid_head_buttons img',
                    'div[column_id="buttons"] img'
                ]
                const selector = menuSelectors.find((sel) => $body.find(sel).length > 0)
                expect(selector, 'column dropdown menu icon selector').to.exist
                cy.get(selector).first().should('be.visible').click({ force: true })
            })
            cy.xpath(`//p[text()="${value}"]`).find('svg').invoke('attr','class').then((classname)=>{
                cy.log(classname)
                if(classname.includes('hideTickIcon')){
                    cy.xpath(`//p[text()="${value}"]`).click({force:true})
                    cy.log("already selected")
                }else{
                    cy.log("already selected")
                }
            })
            cy.wait(3000)
            cy.get('[id="simple-popover"] div').first().click({force:true})
            cy.wait(3000)
        })
    }
    deselectAdditionalColumns([...values]){
        values.forEach((value) => {
            // cy.document().then((doc)=>{
            //     const leftContainer = doc.querySelector('div.gantt-container__left')
            //     if(leftContainer){
            //         const activityList = leftContainer.querySelector('div.gantt-container__left__title')
            //         if(activityList){
            //             this.pageelements.leftExpandBtn().click()
            //         }else{
            //             cy.log("left activity panel is already open")
            //         }
            //     }
            // })
            cy.get('.gantt-dropdown img').click({force:true})
            cy.xpath(`//p[text()="${value}"]`).find('svg').invoke('attr','class').then((classname)=>{
                cy.log(classname)
                if(classname.includes('hideTickIcon')){
                    cy.log("already selected")
                }else{
                    cy.xpath(`//p[text()="${value}"]`).click({force:true})
                    cy.log("remove selected")
                }
            })
            cy.wait(3000)
            cy.get('[id="simple-popover"] div').first().click({force:true})
            cy.wait(3000)
        })
    }
    verifySchedulerPage(){
        cy.xpath('//span[text()="Create Pull Plan Event"]').should('be.visible')
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
            }
        })
        cy.wait(3000)
        // cy.get('[data-testid="today"]').should('be.visible')
        cy.get('[data-testid="views-select-dropdown"] div').invoke('text').should('eq','Default')
        cy.get('[title="Click to view a smaller timeline"]').invoke('prop','disabled').should('eq',true)
        cy.get('[title="Click to view a larger timeline"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.get('[title="Show Critical Path"').should('be.visible')  
    }

    getZoomActionButtonsSelectors() {
        const zoomContainer = '.projectPlanHeader__rightAction__zoomaction'
        return {
            zoomContainer,
            smallerTimelineBtn: `${zoomContainer} button[title="Click to view a smaller timeline"]`,
            largerTimelineBtn: `${zoomContainer} button[title="Click to view a larger timeline"]`
        }
    }

    assertZoomButtonsState({ smallerDisabled, largerDisabled }) {
        const { smallerTimelineBtn, largerTimelineBtn } = this.getZoomActionButtonsSelectors()

        cy.get(smallerTimelineBtn).should($btn => {
            expect($btn.prop('disabled')).to.eq(!!smallerDisabled)
        })
        cy.get(largerTimelineBtn).should($btn => {
            expect($btn.prop('disabled')).to.eq(!!largerDisabled)
        })
    }

    clickZoomAction({ action }) {
        const { smallerTimelineBtn, largerTimelineBtn } = this.getZoomActionButtonsSelectors()
        const targetBtn = action === 'smaller' ? smallerTimelineBtn : largerTimelineBtn
        cy.get(targetBtn).click({ force: true })
        
        //cy.wait(6000)
    }

    verifyZoomActionsInScheduler() {
        const { zoomContainer } = this.getZoomActionButtonsSelectors()

        cy.get(zoomContainer).should('be.visible')

        // Initial state: "smaller timeline" is disabled, "larger timeline" is enabled
        this.assertZoomButtonsState({ smallerDisabled: true, largerDisabled: false })

        // Click "larger timeline" -> both buttons become enabled
        this.clickZoomAction({ action: 'larger' })
        cy.get('.projectPlanHeader').click({ force: true }) 
        this.assertZoomButtonsState({ smallerDisabled: false, largerDisabled: false })

        // Click "smaller timeline" -> only "larger timeline" remains enabled
        this.clickZoomAction({ action: 'smaller' })
        cy.get('.projectPlanHeader').click({ force: true }) 
        this.assertZoomButtonsState({ smallerDisabled: true, largerDisabled: false })
    }

    verifyCreatePullPlanEventInScheduler(){
        cy.get('button[data-testid="createPullPlan"]').should('be.visible')
        cy.get('button[data-testid="createPullPlan"]').click()
        cy.get('.pullPlan__header div').should('have.text', 'Hello there!');
        cy.get('label').should('contain.text', 'What do you want to call it?').and('contain.text', '*')
        cy.get('#name').should('have.attr', 'placeholder', 'eg: Phase Pull Planning').type('Automation Pull Plan')
        cy.get('label').should('contain.text', 'Give your team a heads up with a little description?').and('contain.text', '*')
        cy.get('#description').should('have.attr', 'placeholder', 'Description').type('This is a test description for pull plan automation')
        cy.get('label').should('contain.text', 'Pull Plan Event Date').and('contain.text', '*')
        const enterFutureDate = (selector, daysToAdd = 1) => {
            const date = new Date();
            date.setDate(date.getDate() + daysToAdd);
          
            const day = String(date.getDate()).padStart(2, '0');
            const month = date.toLocaleString('en-US', { month: 'short' });
            const year = date.getFullYear();
          
            const formattedDate = `${day} ${month} ${year}`;
          
            cy.get(selector)
              .should('be.visible')
              .click() // focus the field
              .type('{selectall}{backspace}', { force: true }) // 🔥 most reliable clear
              .should('have.value', '') // ensure it's cleared
              .type(formattedDate, { delay: 50 }) // slight delay improves stability
              .should('have.value', formattedDate) // verify typing worked
              .blur() // trigger validation
              .trigger('change'); // for MUI state update
          };
          
          it('Enter tomorrow date reliably', () => {
            enterFutureDate('input[name="eventDate"]', 1);
          });

        cy.get('.pullPlan__right__assignee').within(() => {

            // Section label
            cy.contains('Add your Team here!')
              .should('be.visible')
          
            // Add Assignee button
            cy.get('[data-testid="pullPlan-addAssignee"]')
              .should('be.visible')
          
            // Empty state text
            cy.contains('looks like its lonely out here')
              .should('be.visible')
          
          })

        // Validate Create button initially disabled
    cy.get('[data-testid="pullPlan-create"]')
    .should('be.disabled')

        // Click Cancel
    cy.get('[data-testid="pullPlan-delete"]')
      .should('be.visible')

       // adding assignee
    cy.get('[data-testid="pullPlan-addAssignee"]').click()
    cy.get('#user-usergroup-search')
          .should('be.visible')
          .click()
          .type('First', { delay: 50 }) // 
          .should('have.value', 'First');
    cy.get('[data-testid="pullPlanAssignee-add"]')
          .should('be.visible')
          .and('not.be.disabled')
          .click();
    cy.get('[data-testid="add"]').should('contain.text','Add ').click()

    // Validate Create button is enabled and creating an event
    cy.get('[data-testid="pullPlan-create"]')
    .should('be.enabled')
    .click();
          
    }

    verifyStartPullPlanEvent(){
        // Verify the pull plan "Start" pill is rendered with date, month and event name
        cy.get('.pullPlanButton__start')
          .should('be.visible')
          .within(() => {
            cy.get('.pullPlanButton__start__date')
              .should('be.visible')
              .invoke('text')
              .then(text => {
                const trimmed = text.trim()
                expect(trimmed).to.match(/^\d{2}$/)
              })

            cy.get('.pullPlanButton__start__month')
              .should('be.visible')
              .invoke('text')
              .then(text => {
                const trimmed = text.trim()
                expect(trimmed).to.match(/^[A-Za-z]{3}$/)
              })

            cy.get('.pullPlanButton__start__task')
              .should('be.visible')
              .invoke('text')
              .then(text => {
                const trimmed = text.trim()
                expect(trimmed.length).to.be.greaterThan(0)
              })

            // Validate the Start button + tooltip 
            cy.get('button[data-testid="startPullPlan"]')
              .should('be.visible')
              .and('contain.text', 'Start')
              .and('have.attr', 'aria-label', 'Start Pull Plan Session')
              .and('have.attr', 'title', 'Start Pull Plan Session')
              .click();
              
            });
    }

    verifyStopPullPlanEvent(){
        
               // Verify Date (Day)
            cy.get('.pullPlanButton__start__date')
              .should('be.visible')
              .invoke('text')
              .then((text) => {
                expect(text.trim()).to.match(/\d{2}/); // e.g., 07
              });
          
            // Verify Month
            cy.get('.pullPlanButton__start__month')
              .should('be.visible')
              .invoke('text')
              .then((text) => {
                expect(text.trim()).to.match(/[A-Za-z]{3}/); // Apr
              });
          
            // Verify Task Name
            cy.get('.pullPlanButton__start__task')
              .should('be.visible')
              .and('not.be.empty');
          
            // Verify Stop Button
            cy.get('[data-testid="stopPullPlan"]')
              .should('be.visible')
              .and('not.be.disabled')
              .and('contain.text', 'Stop')
              .click();
          
            // Verify Timer Format (HH : MM : SS)
            cy.get('.pullPlanButton__stopPullPlan__time')
              .should('be.visible')
              .invoke('text')
              .then((text) => {
                const time = text.trim();
                expect(time).to.match(/\d{2}\s:\s\d{2}\s:\s\d{2}/);
              });    
              
              //Verify if the buttons visible 
                cy.get('[data-testid="cancel-action"]')
                  .should('be.visible')
                  .and('contain.text', 'Go Back');
              
                cy.get('[data-testid="confirm-action"]')
                  .should('be.visible')
                  .and('contain.text', 'Yes, Continue').click();
              
            // Verify if the create Pull plan is enabled again.
            cy.get('button[data-testid="createPullPlan"]').should('be.visible')
              
          }
          
    verifyCriticalPathInScheduler(){
        cy.get('[data-testid="cp calculation"]').should('be.visible').click();
        //tasks/lines highlighted
        cy.get('.critical-path').should('exist');
        cy.get('[data-testid="cp calculation"]').click();
        }

        verifyRightPanelPlansTab(){
            cy.get('.RightSideNavbar__options__tab__title.title3').contains('Plans').click();
            const today = new Date();
    
            const formattedDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
            }).replace(',', '');
    
            cy.get('.PullPlanPanel__header__name')
            .should('have.text', 'Automation Pull Plan');
    
            cy.get('.PullPlanPanel__header__body__description')
            .should('have.text', 'This is a test description for pull plan automation');
    
            cy.get('.PullPlanPanel__header__body__time')
            .should('contain.text', formattedDate);
    
            cy.contains('My Activities').should('exist');
            cy.get('.MyPullPlanTask__nodata').should('have.text', 'No activities found. Start adding activities by clicking the + button');
    
            cy.contains('All Activities').should('exist').click();
            cy.get('[data-testid="alltasksearchName"] input').should('be.visible').and('have.attr', 'placeholder', 'Search item by name');
            cy.get('.AllPullPlanTask__nodata').should('be.visible').and('have.text', 'No activities has been submitted yet. Start adding tasks in My Activities section');
    
        }

        verifyProjectPlanDownArrow(){
            cy.get("[aria-controls='edit-save-mode']").click()
            
        }

    verifyCreateAndSaveNewVersion(){

        cy.contains('li', 'Save version', { timeout: 5000 })
        .should('be.visible')
        .click();

        cy.get('.save-baseline-version-popup__title')
        .should('be.visible')
        .within(() => {

        // Validate title text
        cy.get('.save-baseline-version-popup__title-text span')
        .should('be.visible')
        .and('have.text', 'Save Version As');

        // Validate close (X) button
        cy.get('.save-baseline-version-popup__title-close-button')
        .should('be.visible');
        });

        // Wait for modal to appear and scope interactions to it
        cy.get('.save-baseline-version-popup__content', { timeout: 10000 })
        .should('be.visible')
        .as('saveVersionModal');

        // Enter Name
        cy.get('@saveVersionModal').find('[data-testid="baseline-name"]')
        .should('be.visible')
        .clear()
        .type('Version 1')
        .should('have.value', 'Version 1');

        // Enter Description
        cy.get('@saveVersionModal').find('[data-testid="baseline-description"]')
        .should('be.visible')
        .clear()
        .type('Version 1 created using Automation script')
        .should('have.value', 'Version 1 created using Automation script');

        // Select checkbox (optional)
        cy.get('@saveVersionModal').find('input[name="isBaseline"]')
        .should('not.be.checked');

        // Validate action buttons in popup only (not header Save Plan button)
        cy.get('@saveVersionModal').contains('button', /^Save$/)
        .should('be.visible')
        .and('not.be.disabled');
        cy.get('@saveVersionModal').contains('button', /^Cancel$/)
        .should('be.visible')
        .and('not.be.disabled');

        // Click popup Save
        cy.get('@saveVersionModal').contains('button', /^Save$/)
        .click();

        cy.get('.msgtoaster__text')
        .should('be.visible')
        .and('contain', 'Version 1 has been saved successfully');

        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')  
        cy.wait(3000)

        // To Save plan so that schedule dont stays in edit mode.
        cy.get('[data-testid="save plan"]')
        .should('be.visible')
        .click();

        cy.get('.msgtoaster__text')
        .should('be.visible')
        .and('contain', 'Saved project plan successfully');

        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')  
        cy.wait(3000)

    }

    verifyVersionHistoryIcon(){
        //Verify the version icon in the scheduler page and click
        cy.get('[data-testid="view-version-option"]').should('be.visible').click();
        cy.get('.viewVersion__title').should('contain', 'Version History');
        cy.get('[title="Click to filter only file uploads"]').should('be.visible');
        cy.get('tr.viewVersion__container__table__row__header th')
            .then(($headers) => {
                const texts = [...$headers].map(el => el.innerText.trim());

                expect(texts).to.deep.equal([
                '',          // first column (icon column)
                'Name',
                'Date',
                'Saved By',
                'Status',
                'Actions'
                ]);
            });
    }

    verifyDeleteVersion()
    {

        //Validating the date before deleting the version
        const today = new Date();
        const currentDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
            }).replace(',', '');
            
        cy.contains('tr', 'Version 1').within(() => {
        cy.contains(currentDate).should('exist'); // dynamic date check
        cy.contains('Second User').should('exist');});

        //Click 3-dot menu for specific row
        cy.contains('tr', 'Version 1')   // target your row
        .within(() => {
        cy.get('button[aria-label="more"]')
        .should('be.visible')
        .click();
        });

        //// Click Delete version
        cy.get('.MuiPopover-paper', { timeout: 5000 })
        .should('be.visible');

        cy.get('.MuiPopover-paper')
        .contains('Delete version')
        .click({ force: true });

        cy.get('.msgtoaster__text')
        .should('be.visible')
        .and('contain', 'Version deleted successfully');

        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')  
        cy.wait(3000)

    }

    verifyFailedStatusVersionHistory(){
        //Validating the date before deleting the version
        const today = new Date();
        const currentDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
            }).replace(',', '');
            
        cy.contains('tr', 'InvalidfileUpload.xml').within(() => {
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist'); //validate the icon is present  
        cy.contains(currentDate).should('exist'); // dynamic date check
        cy.contains('Second User').should('exist');}); //verify the user
        cy.contains('tr', 'InvalidfileUpload.xml')// failed status icon 
        .within(() => {
        cy.get('.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(211, 47, 47, 0.9)');
        });

    }

    verifySuccessStatusVersionHisotry(){
        //Validating the date before deleting the version
        const today = new Date();
        const currentDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
            }).replace(',', '');
            
        cy.contains('tr', 'addschedule01.xml').within(() => {
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist'); //validate the icon is present  
        cy.contains(currentDate).should('exist'); // dynamic date check
        cy.contains('Second User').should('exist');}); //verify the user
        cy.contains('tr', 'addschedule01.xml')
        .within(() => {
        cy.get('td.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(56, 142, 60, 0.9)');
        });
    }

    verifyFilteringVersionHistory(){
        const today = new Date();
        const currentDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
            }).replace(',', '');
        
        // Row 1 (Failed case)
        cy.get('tr.viewVersion__container__table__row__body').eq(0)
        .within(() => {
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist');
        cy.contains('InvalidfileUpload.xml')
        cy.contains(currentDate)
        cy.contains('Second User')
        cy.contains('tr', 'InvalidfileUpload.xml')// failed status icon 
        .within(() => {
        cy.get('.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(211, 47, 47, 0.9)');
        });
        });

        // Row 2
        cy.get('tr.viewVersion__container__table__row__body').eq(1)
        .should('contain', 'addschedule01.xml')
        .and('contain', currentDate)
        .and('contain', 'Second User');
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist')
        cy.contains('tr', 'addschedule01.xml')
        .within(() => {
        cy.get('td.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(56, 142, 60, 0.9)');
        });


        // Row 3
        cy.get('tr.viewVersion__container__table__row__body').eq(2)
        .should('contain', 'UploadSchedulePP.pp')
        .and('contain', currentDate)
        .and('contain', 'Second User');
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist');
        cy.contains('tr', 'UploadSchedulePP.pp')
        .within(() => {
        cy.get('td.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(56, 142, 60, 0.9)');
        });

        // Row 4
        cy.get('tr.viewVersion__container__table__row__body').eq(3)
        .should('contain', 'UploadScheduleP6.xml')
        .and('contain', currentDate)
        .and('contain', 'Second User');
        cy.get('g[clip-path="url(#clip0_upload)"]').should('exist');
        cy.contains('tr', 'UploadScheduleP6.xml')
        .within(() => {
        cy.get('td.combined-item-4 svg')
        .should('have.css', 'color', 'rgba(56, 142, 60, 0.9)');
        });

    }
    
    clearTasksandNotification(deleteTask,tasknames, isIntercepted = false){
        (!isIntercepted) ? cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks") : cy.log("Intercepted already")
        cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
        const taskNames = req.response.body.data.tasks.slice(1).map((task)=>task.taskName)
        cy.log(taskNames)
        return cy.wrap(taskNames).as('tasks')
        })
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.log("check for schedule pending notifination")
        cy.wait(10000)
        // Open the Accept Changes panel from header link (new UI), then reject pending items if present.
        cy.get('body').then(($body) => {
            const hasAcceptLink = $body.find('.projectPlanHeader__leftAction__accept-changes').length > 0
            if (hasAcceptLink) {
                cy.get('.projectPlanHeader__leftAction__accept-changes').first().then(($link) => {
                    const countText = $link.find('.projectPlanHeader__leftAction__accept-changes-count').text().trim()
                    const pendingCount = parseInt(countText || '0', 10)
                    if (pendingCount > 0) {
                        if ($link.next('div.ViewScheduleUpdate').length === 0) {
                            cy.wrap($link).click({ force: true })
                        }
                        cy.get('.ViewScheduleUpdate', { timeout: 15000 }).should('be.visible')
                        cy.get('.ViewScheduleUpdate input[type="checkbox"]').first().check({ force: true })
                        cy.xpath('//span[text()="Reject"]').click()
                    } else {
                        cy.log("accept changes are not present")
                    }
                })
            } else {
                // Backward compatibility with older panel rendering.
                if ($body.find('.ViewScheduleUpdate__header').length > 0) {
                    cy.log("Total requests to be accept")
                    this.pageelements.scheduleChangesCheckBox().check()
                    cy.xpath('//span[text()="Reject"]').click()
                } else {
                    cy.log("accept changes are not present")
                }
            }
        })
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
            }
        })
        cy.wait(3000)
        cy.get('@tasks').then((taskName)=>{
            if(deleteTask){
                cy.log(`this are from api`+taskName)
                cy.log(typeof taskName)
                cy.log(`this is the task to delete`+tasknames)
                cy.log(typeof tasknames)
                if(taskName.includes(tasknames.toString())){
                    this.deleteTask(tasknames)
                }else{
                    cy.log("task01 is not present to delete")
                }
            }
        })
    }
    uploadSchedule(scheduleFile){
    let isSchedule
    cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
        cy.log(req.request.body.operationName)
        cy.log("Response", req.response.body)
        cy.wrap(req.response.body.data).should("have.property","tasks")
        cy.log(req.response.body.data.tasks.length)
            if(req.response.body.data.tasks.length > 1){
                cy.log(req.response.body.data.tasks.length)
                const taskNames = req.response.body.data.tasks.slice(1).map((task)=>task.taskName)
                cy.log("task names collected are :"+taskNames)
                isSchedule = false
                return cy.wrap(isSchedule).as('isSchedule'),cy.wrap(taskNames).as('scheduleTasks')
            }else{
                isSchedule = true
                return cy.wrap(isSchedule).as('isSchedule')
            }
    })
    cy.get('@isSchedule').then((isScheduleFlag)=>{
        cy.log("schedule falg is set as "+isScheduleFlag)
        if(isScheduleFlag){
            cy.log("schedule is not uploaded")
            cy.wait(5000)
            //verify if edit plan button is visible
            cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
                if($button.attr("data-testid")==="edit-plan"){
                    //edit plan button is present
                    cy.wrap($button).click()
                    cy.wait(1000)
                    cy.log("edit plan is clicked")
                }else{
                    //save plan button is present
                    cy.get("[aria-controls='edit-save-mode']").click()
                    .get("ul li").contains('Discard changes').click()
                    this.pageelements.editPlanBtn().should('be.visible').click()
                }
            })
            cy.get('[data-testid="import-button"]').click()
            // cy.get('[data-testid="three-dot-button"]').click()
            cy.get('[data-testid="import-msp-plan-option"]').click()
            cy.get('.projectPlanImport__planUpload__dropZone').then(($class)=>{
                //cy.wrap($class).find("input[type='file']").selectFile(`cypress\\fixtures\\${scheduleFile}`,{force:true})
                cy.wrap($class).find("input[type='file']").attachFile(scheduleFile);             
                cy.xpath('//span[text()="Import File"]').click({force:true})
            })
            cy.xpath('//span[text()="Yes, Continue"]').click()
            cy.intercept('POST', 'https://hasura.service.**.slate.ai/v1/graphql', (req) => {
                if (req.body.operationName === "getProjectPlanTasksAllTasks") {
                     req.alias = 'getTasks'
                }
            })
            cy.xpath('//span[text()="Sounds Good"]').should('be.visible')
            cy.intercept('https://scheduler.service.qe.slate.ai/V1/projectPlan/check/edit').as('checkEditImport')
            cy.wait('@checkEditImport').then((res) => {
                cy.log(res.response.body)
                cy.log(typeof res.response.body.is_Editable)
                expect(res.response.body.is_Editable).to.be.true
                cy.log('Response at the time of import ' + JSON.stringify(res.response.body))
            })
            cy.wait(1000)
            cy.wait("@getTasks").then((req)=>{
                cy.log(req.request.body.operationName)
                cy.log("Response", req.response.body)
                cy.wrap(req.response.body.data).should("have.property","tasks")
                cy.log(req.response.body.data.tasks.length)
                const taskNames = req.response.body.data.tasks.slice(1).map((task)=>task.taskName)
                cy.log("task names collected are :"+taskNames)
                return cy.wrap(taskNames).as('scheduleTasks')
            })
        }
    })
    }
    verifyScheduleUploadSucess(){
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
            cy.log(req.request.body.operationName)
            cy.log("Response", req.response.body)
            cy.wrap(req.response.body.data).should("have.property","links")
            expect(req.response.body.data.links.length === 0)
            cy.log("task is not uploaded")
        })
    }
    openTaskDetails([...taskname], elementIndex = 0, serialId = null){
        taskname.forEach((task) => {
            const trimmedTask = (task ?? '').toString().trim()
            if (serialId) {
                // Prefer exact row targeting when task ID is available (avoids truncated bar labels).
                this.selectTaskByNameAndId(trimmedTask, String(serialId).trim())
            } else {
                // Name-only: bar text is often truncated; grid "text" column usually has full name.
                const normalizeNameKey = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '')
                const targetKey = normalizeNameKey(trimmedTask)
                const compact = (s) => (s || '').toString().replace(/\s+/g, ' ').trim()
                const nameFromRow = ($row) => {
                    const $nameCell = $row.find('[data-column-name="text"]')
                    if (!$nameCell.length) return false
                    const whole = compact($nameCell.text())
                    const fromTask = compact($nameCell.find('.gantt-task-name-text').first().text())
                    const fromBold = compact($nameCell.find('b').first().text())
                    const fromGridText = compact($nameCell.find('span.gantt-grid-cell-text').first().text())
                    if ([whole, fromTask, fromBold, fromGridText].some((v) => v === trimmedTask)) return true
                    return (
                        normalizeNameKey(whole) === targetKey ||
                        normalizeNameKey(fromTask) === targetKey ||
                        normalizeNameKey(fromBold) === targetKey ||
                        normalizeNameKey(fromGridText) === targetKey
                    )
                }

                this.searchTaskByName(trimmedTask)
                cy.wait(2000)

                cy.get('.gantt_grid_data div.gantt_row').then(($rows) => {
                    const matches = $rows.filter((_, el) => nameFromRow(Cypress.$(el)))
                    expect(
                        matches.length,
                        `task row for '${trimmedTask}' (index ${elementIndex})`
                    ).to.be.greaterThan(elementIndex)

                    cy.wrap(matches.eq(elementIndex))
                        .scrollIntoView({ block: 'center' })
                        .click({ force: true })
                })
            }
            // Use native DOM scrollIntoView to scroll until task name is visible
            cy.get('div.gantt_task_line.gantt_selected .gantt_task_content')
                .first()
                .then($el => {
                    $el[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
                })
            cy.wait(500)
            // Re-query before dblclick to avoid stale element on async re-renders.
            cy.get('div.gantt_task_line.gantt_selected')
                .should('be.visible')
            cy.wait(1000)
            cy.get('div.gantt_task_line.gantt_selected b')
                .dblclick({ force: true })
            cy.wait(1000)
        })
    }
    getToDoStatusValues(taskName){
        this.clearTaskFilter()
        let columnNames = ['plannedStartDate','plannedEndDate','plannedDuration']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`)
                    .invoke('text')
                    .then((text)=>{
                        const trimmed = text.trim()
                        if(column === 'plannedStartDate' || column === 'plannedEndDate'){
                            // Handle formats like "11 Jul", "11-Jul-25", or concatenated "11-Jul-2511-Jul-25"
                            const match = trimmed.match(/(\d{1,2})[-\s]+([A-Za-z]{3})/)
                            nameValues[column] = match ? `${match[1]} ${match[2]}` : trimmed
                        }else{
                            nameValues[column] = trimmed.split(/\s+/)[0]
                        }
                    })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            // Store values with both specific and generic aliases
            cy.wrap(nameValues).as(`taskPlannedValues_${taskName}`)
            cy.wrap(nameValues).as('taskPlannedValues')
            return cy.wrap(nameValues)
        })
        cy.wait(5000)
    }

    // method to validate dates between two tasks
    verifyPlannedStartDateChanges(task1Name, task2Name) {
        cy.get(`@taskPlannedValues_${task1Name}`).then((task1Values) => {
            cy.get(`@taskPlannedValues_${task2Name}`).then((task2Values) => {
                const task1EndDate = task1Values.plannedEndDate;
                const task2StartDate = task2Values.plannedStartDate;
                cy.log(`task1EndDate: ${task1EndDate}`)
                cy.log(`task2StartDate: ${task2StartDate}`)
                function parseDate(dateStr) {
                    if (!dateStr) return null;
                    const [day, month] = dateStr.split(' ');
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthIndex = months.indexOf(month);
                    if (!day || monthIndex === -1) return null;
                    // Always use current year
                    const fullYear = (new Date()).getFullYear();
                    return new Date(fullYear, monthIndex, parseInt(day, 10));
                }

                const endDate = parseDate(task1EndDate);
                const expectedStartDate = endDate ? new Date(endDate) : null;

                if (!endDate) {
                    throw new Error(`Could not parse task1EndDate: "${task1EndDate}"`);
                }

                // If Friday, add 3 days (to Monday), else add 1 day
                if (endDate.getDay() === 5) { // 5 = Friday
                    expectedStartDate.setDate(endDate.getDate() + 3);
                } else {
                    expectedStartDate.setDate(endDate.getDate() + 1);
                }

                const actualStartDate = parseDate(task2StartDate);

                if (!actualStartDate) {
                    throw new Error(`Could not parse task2StartDate: "${task2StartDate}"`);
                }

                // Only compare day and month
                expect(actualStartDate.getDate(), 'Start day').to.equal(expectedStartDate.getDate());
                expect(actualStartDate.getMonth(), 'Start month').to.equal(expectedStartDate.getMonth());
            });
        });
    }

    getToDoStatusValuesFromTaskDetail(){
        const fields = [{name:'plannedStartDate',selector:'[name="planned-start-date"]',type:'value'},{name:'plannedEndDate',selector:'[data-testid="planned-end-date"] input',type:'value'},{name:'plannedDuration',selector:'.edit-task-details__content--left-panel__dates__planned-duration',type:'text'},{name:'Float',selector:'.edit-task-details__content--left-panel__float-log__float',type:'text'}]
        cy.get('@taskPlannedValues').then((values1)=>{
            const startDate = values1['plannedStartDate']
            const endDate = values1['plannedEndDate']
            const duration = values1['plannedDuration']
            cy.wait(3000)
            fields.forEach((field)=>{
                if(field.type === 'value'){
                    cy.get(field.selector).invoke('attr','value').then((value)=>{
                        if(field.name === 'plannedStartDate'){
                            expect(value).to.eq(startDate)
                        }else if(field.name === 'plannedEndDate'){
                            expect(value).to.eq(endDate)
                        }
                    })
                }else if(field.type === 'text'){
                    cy.get(field.selector).invoke('text').then((text)=>{
                        if(field.name === 'plannedDuration'){
                            expect(text.split(/\s+/)[0]).to.eq(duration)
                        }
                    })
                }
            })
        })
    }
    getActualStartDate(taskName){
        let columnNames = ['actualStartDate','estimatedEndDate','estimatedDuration']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`)
                    .invoke('text')
                    .then((text)=>{
                        const trimmed = text.trim()
                        if(column === 'actualStartDate' || column === 'estimatedEndDate'){
                            // Normalize formats like "02 Dec", "02-Dec-25", or "02-Dec-2502-Dec-25" to "02 Dec"
                            const match = trimmed.match(/(\d{1,2})[-\s]+([A-Za-z]{3})/)
                            nameValues[column] = match ? `${match[1]} ${match[2]}` : trimmed
                        }else{
                            nameValues[column]=trimmed.split(/\s+/)[0]
                        }
                    })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            return cy.wrap(nameValues).as('taskActualStartDate')
        })
        cy.wait(5000)
    }
    verifyActualstartdate(){
        const fields = [{name:'actualStartDate',selector:'[data-testid="actual-start-date"] input',type:'value'},{name:'estimatedEndDate',selector:'[data-testid="estimated-end-date"] input',type:'value'},{name:'estimatedDuration',selector:'[data-testid="estimated-duration"]',type:'text'}]
         cy.get('@taskActualStartDate').then((values2)=>{
            const startDate = values2['actualStartDate']
            const endDate = values2['estimatedEndDate']
            const duration = values2['estimatedDuration']
            cy.wait(3000)
            fields.forEach((field)=>{
                if(field.type === 'value'){
                    cy.get(field.selector).invoke('attr','value').then((value)=>{
                        if(field.name === 'actualStartDate'){
                            expect(value).to.eq(startDate)
                        }else if(field.name === 'estimatedEndDate'){
                            expect(value).to.eq(endDate)
                        }
                    })
                }else if(field.type === 'text'){
                    cy.get(field.selector).invoke('text').then((text)=>{
                        if(field.name === 'estimatedDuration'){
                            expect(text.split(/\s+/)[0]).to.eq(duration)
                        }
                    })
                }
            })
        }) 
    }
    getActualTaskCompletionValues(taskName){
        let columnNames = ['actualStartDate','actualEndDate','actualDuration']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`)
                    .invoke('text')
                    .then((text)=>{
                        const trimmed = text.trim()
                        if(column === 'actualStartDate' || column === 'actualEndDate'){
                            // Normalize date formats to "dd Mon"
                            const match = trimmed.match(/(\d{1,2})[-\s]+([A-Za-z]{3})/)
                            nameValues[column] = match ? `${match[1]} ${match[2]}` : trimmed
                        }else{
                            nameValues[column]=trimmed.split(/\s+/)[0]
                        }
                    })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            return cy.wrap(nameValues).as('taskActualCompletionValues')
        })
        cy.wait(5000)
    }
    verifyActualTaskCompletionValues(){
        const fields = [{name:'actualStartDate',selector:'[data-testid="actual-start-date"] input',type:'value'},
            {name:'actualEndDate',selector:'[data-testid="actual-end-date"] input',type:'value'},
            {name:'actualDuration',selector:'.edit-task-details__content--left-panel__dates__actual-duration',type:'text'},
            {name:'plannedStartDate',selector:'[name="planned-start-date"]',type:'value'},
            {name:'plannedEndDate',selector:'[data-testid="planned-end-date"] input',type:'value'},
            {name:'plannedDuration',selector:'.edit-task-details__content--left-panel__dates__planned-duration',type:'text'}]
        cy.get('@taskActualCompletionValues').then((values1)=>{
            cy.get('@taskPlannedValues').then((values2)=>{
            const aStartDate = values1['actualStartDate']
            const aEndDate = values1['actualEndDate']
            const aDuration = values1['actualDuration']
            const pStartDate = values2['plannedStartDate']
            const pEndDate = values2['plannedEndDate']
            const pDuration = values2['plannedDuration']
            cy.wait(3000)
            fields.forEach((field)=>{
                if(field.type === 'value'){
                    cy.get(field.selector).invoke('attr','value').then((value)=>{
                        if(field.name === 'actualStartDate'){
                            expect(value).to.eq(aStartDate)
                        }else if(field.name === 'actualEndDate'){
                            expect(value).to.eq(aEndDate)
                        }else if(field.name === 'plannedStartDate'){
                            expect(value).to.eq(pStartDate)
                        }else if(field.name === 'plannedEndDate'){
                            expect(value).to.eq(pEndDate)
                        }
                    })
                }else if(field.type === 'text'){
                    cy.get(field.selector).invoke('text').then((text)=>{
                        if(field.name === 'actualDuration'){
                            expect(text.split(/\s+/)[0]).to.eq(aDuration)
                        }else if(field.name === 'plannedDuration'){
                            expect(text.split(/\s+/)[0]).to.eq(pDuration)
                        }
                    })
                }
            })
        })  
    })             
    }
    updateTaskName([...taskname]){
        this.openScheduleinEditMode()
        taskname.forEach((task) => {
            cy.wait(10000)
            // Use common helper to hover and click the edit icon on the Activity Name cell
            this.clickEditIconForCellByTaskName(task, 'text')

            // Support both legacy [name="text"] and new data-testid based input
            cy.get('body').then(($body) => {
                const hasNameInput = $body.find('[name="text"]').length > 0
                const selector = hasNameInput ? '[name="text"]' : 'input[data-testid="task-name"]'

                cy.get(selector)
                    .should('be.visible')
                    .clear()
                    .type('UpdatedTaskName')
            })

            cy.wait(1000)
            cy.get('.gantt_grid_data').click()
            cy.wait(6000)
            this.pageelements.savePlanBtn().should('be.visible').click()
            cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
            }) 
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist') 
        })
    }
    updatePlannedDates(taskName){
        let startDate,endDate
        cy.getDate(10,'CA').then((Sdate)=>{
            startDate = Sdate
        cy.getDate(50,'CA').then((Edate)=>{
            endDate = Edate
            let columnNames = ['plannedStartDate','plannedEndDate']
            columnNames.forEach((column) => {
                cy.wait(5000)
                this.openScheduleinEditMode()
                this.clickEditIconForCellByTaskName(taskName, column)
                if(column==='plannedStartDate'){
                cy.get('[name="plannedStartDate"').type(startDate)
                }else if(column==='plannedEndDate'){
                cy.get('[name="plannedEndDate"').type(endDate)
                }
                cy.get('.gantt_grid_data').click()
                cy.wait(6000)
                this.pageelements.savePlanBtn().should('be.visible').click()
                this.autoScheduleAndSave()
                cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
                }) 
                // Use Cypress's built-in wait for the UI to stabilize
                cy.get('.msgtoaster__text').should('not.exist')  
                cy.wait(3000)  
            })
        })
        })
    }

    openScheduleinEditMode(){
        //verify if edit plan button is visible
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.wrap($button).click()
                cy.wait(1000)
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
                this.pageelements.editPlanBtn().should('be.visible').click()
            }
        })
        cy.document().then((doc)=>{
            const leftContainer = doc.querySelector('div.gantt-container__left')
            if(leftContainer){
                const activityList = leftContainer.querySelector('div.gantt-container__left__title')
                if(activityList){
                    this.pageelements.leftExpandBtn().click()
                }else{
                    cy.log("left activity panel is already open")
                }
            }
        })
        cy.wait(10000)
        cy.document().then((doc)=>{
            const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
            if(leftActionHeader){
                const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                if(collapseBtn){
                    cy.log("schedule is already expanded")
                }else{
                    cy.get('[title="Expand"]').click()
                }
            }
        })
    }
    verifyValuesUpdated(taskName){
        this.selectAdditionalColumns(['Location','Assignee'])
        let columnNames = ['assigneeName','projectTaskLocationAssociationsName']
        let userName = Cypress.env('firstname')+Cypress.env('lastname')
        let actualValues = []
        let formattedactualValues = []
        let formattedexpectedValues = []
        let expectedValues = [userName,Cypress.env('projectName_3')]
        columnNames.forEach((column) => {
            cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).invoke('text').then((text)=>{
                actualValues.push(text)
                formattedactualValues = actualValues.toString().split(' ').join('').toLowerCase()
                formattedexpectedValues = expectedValues.toString().toLowerCase()
                cy.log(JSON.stringify(formattedactualValues))
                cy.log(JSON.stringify(formattedexpectedValues))
                // nameValues[column]=text
                // cy.log(JSON.stringify(nameValues))
            })
        })
        cy.then(()=>{
            expect(formattedactualValues).to.equal(formattedexpectedValues)
        })
    }
    removeAssinee([...taskname]){
        taskname.forEach((task) => {
            cy.log(JSON.stringify(task))
            //To check if scheduler is loaded fully
            cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
                expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
            })
            //open left panel if not open already
            cy.document().then((doc)=>{
                const leftContainer = doc.querySelector('div.gantt-container__left')
                if(leftContainer){
                    const activityList = leftContainer.querySelector('div.gantt-container__left__title')
                    if(activityList){
                        this.pageelements.leftExpandBtn().click()
                    }else{
                        cy.log("left activity panel is already open")
                    }
                }
            })
            cy.document().then((doc)=>{
                const leftActionHeader = doc.querySelector('div.projectPlanHeader__leftAction')
                if(leftActionHeader){
                    const collapseBtn = leftActionHeader.querySelector('[title="Collapse"]')
                    if(collapseBtn){
                        cy.log("schedule is already expanded")
                    }else{
                        cy.get('[title="Expand"]').click()
                    }
                }
            })
            cy.wait(10000)
            cy.xpath(`//span[@class="gantt-task-name-text" and text()="${task}"]`).should('be.visible').click()
            cy.get('.gantt_grid_data').click()
            cy.wait(6000)
            cy.xpath(`//span[@class="gantt-task-name-text" and text()="${task}"]`).should('be.visible').rightclick()
            cy.get('[data-testid=ProjectPlan-Menu-assignee]').click()
            cy.xpath('//div[text()="Assignee"]').should('be.visible')
            cy.xpath('//button[text()="Clear"]').should(($button)=>{
                expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
            })
            cy.xpath('//button[text()="Clear"]').click()
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Assignee successfully removed', 'Assignee successfully removed')
            }) 
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist') 
        })
    }
 
    clickEditIconForCellByTaskName(taskName, serialIdOrColumnName, maybeColumnName){
        const trimmedTaskName = (taskName ?? "").toString().trim()
        const hasSerialId = typeof maybeColumnName !== "undefined"
        const trimmedSerialId = hasSerialId ? (serialIdOrColumnName ?? "").toString().trim() : null
        const trimmedColumnName = (hasSerialId ? maybeColumnName : serialIdOrColumnName ?? "").toString().trim()

        if (!trimmedColumnName) {
            throw new Error("clickEditIconForCellByTaskName requires columnName")
        }

        this.ensureScheduleExpanded()

        if (hasSerialId && trimmedSerialId) {
            // ID-based flow (used when serialId is known to disambiguate duplicates)
            this.selectTaskByNameAndId(trimmedTaskName, trimmedSerialId)

            const rowXpath =
                `//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${trimmedTaskName}"]` +
                `/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${trimmedSerialId}"]]`

            const cellXpath =
                `${rowXpath}//div[@data-column-name="${trimmedColumnName}"]//div[contains(@class,"gantt-grid-cell-content")]`

            cy.xpath(cellXpath)
                .first()
                .scrollIntoView({ block: "center" })
                .should("exist")
                .then(($cell) => {
                    cy.wrap($cell)
                        .trigger("mousemove", { clientX: 5, clientY: 5, force: true })
                        .trigger("mouseover", { force: true })

                    cy.wrap($cell)
                        .find('img.gantt-grid-edit-icon[data-action="edit"][data-edit="true"]')
                        .then(($img) => {
                            const $visible = $img.filter(":visible")
                            const $toClick = $visible.length > 0 ? $visible.first() : $img.first()
                            expect($toClick.length, "edit icon").to.be.greaterThan(0)
                            cy.wrap($toClick).click({ force: true })
                        })
                })
        } else {
            // Name-only flow (used by smoke/global filter specs that don’t pass serialId)
            const normalizeNameKey = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "")
            const targetKey = normalizeNameKey(trimmedTaskName)
            const compact = (s) => (s || "").toString().replace(/\s+/g, " ").trim()
            const nameFromRow = ($row) => {
                const $nameCell = $row.find('[data-column-name="text"]')
                const whole = compact($nameCell.text())
                const fromTask = compact($nameCell.find(".gantt-task-name-text").first().text())
                const fromBold = compact($nameCell.find("b").first().text())
                const fromGridText = compact($nameCell.find("span.gantt-grid-cell-text").first().text())

                if ([whole, fromTask, fromBold, fromGridText].some((v) => v === trimmedTaskName)) return true
                return (
                    normalizeNameKey(whole) === targetKey ||
                    normalizeNameKey(fromTask) === targetKey ||
                    normalizeNameKey(fromBold) === targetKey ||
                    normalizeNameKey(fromGridText) === targetKey
                )
            }

            this.searchTaskByName(trimmedTaskName)
            cy.wait(3000)

            cy.get(".gantt_grid_data div.gantt_row")
                .then(($rows) => {
                    const $row = $rows.filter((_, el) => nameFromRow(Cypress.$(el))).first()
                    expect($row.length, `task row for '${trimmedTaskName}'`).to.be.greaterThan(0)

                    const $cell = $row.find(`div[data-column-name="${trimmedColumnName}"]`).first()
                    expect($cell.length, `cell for '${trimmedTaskName}' column '${trimmedColumnName}'`).to.be.greaterThan(0)

                    cy.wrap($cell)
                        .scrollIntoView({ block: "center" })
                        .should("exist")
                        .then(($c) => {
                            cy.wrap($c)
                                .trigger("mousemove", { clientX: 5, clientY: 5, force: true })
                                .trigger("mouseover", { force: true })

                            cy.wrap($c)
                                .find('img.gantt-grid-edit-icon[data-action="edit"][data-edit="true"]')
                                .then(($img) => {
                                    const $visible = $img.filter(":visible")
                                    const $toClick = $visible.length > 0 ? $visible.first() : $img.first()
                                    expect($toClick.length, "edit icon").to.be.greaterThan(0)
                                    cy.wrap($toClick).click({ force: true })
                                })
                        })
                })
        }
    }

    updatePlannedStartDate(taskName, taskIdOrDaysOffset, daysOffsetMaybe = undefined){
        let startDate
        const serialId = typeof daysOffsetMaybe === "undefined" ? null : taskIdOrDaysOffset
        const daysOffset = typeof daysOffsetMaybe === "undefined" ? taskIdOrDaysOffset : daysOffsetMaybe

        cy.getDate(daysOffset,'CA').then((Sdate)=>{
            startDate = Sdate
            cy.wait(5000)
            cy.log("task name sent here is "+taskName)
            cy.log("planned start date is "+startDate)
            if (serialId) {
                this.clickEditIconForCellByTaskName(taskName, serialId, 'plannedStartDate')
            } else {
                this.clickEditIconForCellByTaskName(taskName, 'plannedStartDate')
            }
            cy.get('[name="plannedStartDate"').type(startDate)
            cy.get('.gantt_grid_data').click()
            cy.wait(6000)
            this.pageelements.savePlanBtn().should('be.visible').click()
            this.autoScheduleAndSave()
            cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
            }) 
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist') 
            cy.wait(6000)
        })
    }
    clearAcceptChanges(){
        // cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
        // const taskNames = req.response.body.data.tasks.slice(1).map((task)=>task.taskName)
        // cy.log(taskNames)
        // })
        cy.wait(5000)
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.log("check for schedule pending notifination")
        cy.wait(10000)
        //Wrapping body with JQuery object to use find method on it
        cy.document().its('body').then(($body)=>{ 
            const $bodyJquery = Cypress.$($body)
            if($bodyJquery.find('.ViewScheduleUpdate__header').length>0){
                cy.log("Total requests to be accept ")
                this.pageelements.scheduleChangesCheckBox().check()
                cy.xpath('//span[text()="Reject"]').click()
            }else{
                cy.log("accept changes are not present")
            }
        })
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
            }
        })
        cy.wait(3000)
    }
    checkEditStatus(attempts = 0) {                 // Add retry mechanism for edit check
        cy.wait('@checkEditImport', { timeout: 30000 }).then((res) => {
            cy.log(`Edit check attempt ${attempts + 1}`);
            cy.log(res.response.body);
            cy.log(typeof res.response.body.is_Editable);
            
            if (!res.response.body.is_Editable && attempts < 20) {
                cy.log('Edit not ready, retrying...');
                cy.wait(10000); // Wait 10 seconds before retry
                this.checkEditStatus(attempts + 1);
            } else {
                expect(res.response.body.is_Editable).to.be.true;
                cy.log('Response at the time of import ' + JSON.stringify(res.response.body));
            }
        });
    }

    getTasks(attempts = 0){
        cy.wait("@getTasks", { timeout: 30000 }).then((req) => {
            if ((!req.response || !req.response.body) && attempts < 10) {
                cy.log(`Response body is undefined, retrying... (attempt ${attempts + 1})`)
                cy.wait(5000)
                this.getTasks(attempts + 1)
            } else {
                // Null checks for response
                expect(req.response, 'Response should exist').to.not.be.undefined
                expect(req.response.body, 'Response body should exist').to.not.be.undefined
                cy.wrap(req.response.body.data).should("have.property", "tasks")
                cy.log(`Task count: ${req.response.body.data.tasks.length}`)
                expect(req.response.body.data.tasks.length).to.be.gte(0)
                const taskNames = req.response.body.data.tasks.slice(1).map((task) => task.taskName)
                cy.log("task names collected are: " + taskNames)
                cy.wrap(taskNames).as('scheduleTasks')
                cy.log("Uploaded Schedule Successfully")
            }
        })
    }
    
    updateSerialNumber(attempts = 0) {
        cy.wait('@UpdateSerialNumber', { timeout: 30000 }).then((req) => {
            if ((!req.response || !req.response.body) && attempts < 10) {
                cy.log(`Serial number update response is undefined, retrying... (attempt ${attempts + 1})`)
                cy.wait(5000)
                this.updateSerialNumber(attempts + 1)
            } else {
                expect(req.response, 'Response should exist').to.not.be.undefined
                expect(req.response.body, 'Response body should exist').to.not.be.undefined
                cy.log(`Serial number updated successfully (attempt ${attempts + 1})`)
            }
        })
    }
    
    uploadScheduleInMSP(scheduleFile, fileFormat){
        cy.wait(2000)
        //verify if edit plan button is visible
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.wrap($button).click()
                cy.wait(1000)
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
                this.pageelements.editPlanBtn().should('be.visible').click()
            }
        })
        // cy.get('[data-testid="three-dot-button"]').click()
        cy.get('[data-testid="import-button"]').click()
        cy.wait(2000)
        cy.get(`[data-testid="import-${fileFormat}-plan-option"]`).click()
        cy.get('.projectPlanImport__planUpload__dropZone').then(($class)=>{
            //cy.wrap($class).find("input[type='file']").selectFile(`cypress\\fixtures\\${scheduleFile}`,{force:true})
            cy.wrap($class).find("input[type='file']").attachFile(scheduleFile)
            cy.xpath('//span[text()="Import File"]').click({force:true})
        })
        // Set up intercept BEFORE triggering the request
        cy.intercept('https://scheduler.service.qe.slate.ai/V1/projectPlan/check/edit').as('checkEditImport')
        cy.intercept('POST', 'https://hasura.service.**.slate.ai/v1/graphql', (req) => {
            if (req.body.operationName === "getProjectPlanTasksAllTasks") {
                    req.alias = 'getTasks'
            }
        })
        cy.xpath('//span[text()="Yes, Continue"]').click()
        cy.xpath('//span[text()="Sounds Good"]').should('be.visible')
        this.checkEditStatus()
        this.getTasks()
        cy.wait(10000)
    }

    importBOQ(fileName){
        cy.wait(2000)
        //verify if edit plan button is visible
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.wrap($button).click()
                cy.wait(1000)
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
                this.pageelements.editPlanBtn().should('be.visible').click()
            }
        })
        cy.get('[data-testid="import-button"]').click()
        cy.wait(2000)
        cy.get(`[data-testid="import-boq-plan-option"]`).click()
        cy.get('.projectPlanImport__planUpload__dropZone').then(($class)=>{
            cy.wrap($class).find("input[type='file']").attachFile(fileName)
            // Register the intercept JUST BEFORE clicking Import File so it's 
            // ready to catch the request the moment it fires
            cy.intercept('https://scheduler.service.**.slate.ai/V1/projectTask/costCode/update').as('updateBOQ')
            cy.xpath('//span[text()="Import File"]').click({force:true})
        })
        this.checkBOQupdate()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), `BOQ imported successfully`, 'BOQ imported sucessfully')
        })
        cy.get('.msgtoaster__text').should('not.exist')
    }

    checkBOQupdate(attempts = 0){
        cy.wait('@updateBOQ', { timeout: 30000 }).then((req) => {
            if ((!req.response || !req.response.body) && attempts < 10) {
                cy.log(`BOQ update response is undefined, retrying... (attempt ${attempts + 1})`)
                cy.wait(5000)
                this.checkBOQupdate(attempts + 1)
            } else {
                expect(req.response, 'Response should exist').to.not.be.undefined
                expect(req.response.body, 'Response body should exist').to.not.be.undefined
                cy.log(`BOQ updated successfully`)
            }
        })
    }

    verifyBOQColumns(elementIndex, taskName, classificationCode, classificationCodeName, plannedQuantity, UoM){
        cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div//div[@data-column-name="classificationCodeName"]//div[@class="gantt_tree_content"]`)
            .eq(elementIndex)
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.eq(classificationCode + " " + classificationCodeName)
            })

        cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div//div[@data-column-name="plannedQuantity"]//div[@class="gantt_tree_content"]`)
            .eq(elementIndex)
            .invoke('text')
            .then((text) => {
                expect(text.trim(), "Verifying Planned Quantity for task " + taskName).to.contain(plannedQuantity)
                expect(text.trim(), "Verifying UoM for task " + taskName).to.contain(UoM)
            })
            
    }

    verifyProductivity(task){
        const expectedClassification = task.classificationCode + " " + task.classificationCodeName
        
        cy.get('input.edit-task-details-view-productivity__list__searchbox')
            .should('have.value', expectedClassification)

        cy.get('span.edit-task-details-view-productivity__parameter__code__value')
            .should('have.text', expectedClassification)

        cy.get('input[data-testid="planned-quantity"]')
            .should('have.value', task.plannedQuantity.toString())

        cy.get('span.edit-task-details-view__parameter__value__unit')
            .eq(0)
            .should('have.text', task.UoM)
    }

    clearAllTasks(){
        // Intercept the GraphQL schedule request
        cy.interceptGraphQlRequest("getProjectPlanTasksAllTasks")
        cy.wait("@getProjectPlanTasksAllTasks").then((req)=>{
        const taskNames = req.response.body.data.tasks.slice(1).map((task)=>task.taskName)
        cy.log(taskNames)
        return cy.wrap(taskNames).as('tasks')
        })
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.log("check for schedule pending notifination")
        cy.wait(10000)
        //Wrapping body with JQuery object to use find method on it
        cy.document().its('body').then(($body)=>{ 
            const $bodyJquery = Cypress.$($body)
            if($bodyJquery.find('.ViewScheduleUpdate__header').length>0){
                cy.log("Total requests to be accept ")
                this.pageelements.scheduleChangesCheckBox().check()
                cy.xpath('//span[text()="Reject"]').click()
            }else{
                cy.log("accept changes are not present")
            }
        })
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
            }
        })
        cy.wait(3000)
        cy.get('@tasks').then((tasks)=>{
            cy.log(`task names are ${tasks}`)
            cy.wait(10000)
            if(tasks.length > 0){
            this.deleteTask([...tasks])
            }
            else{
                cy.log("No Tasks To Delete")
            }
        })
    }
    startTask(){
        let startDate
        const today = new Date()
        let pickDate = new Date()

        // Default selection: 4 days from today (current behavior)
        pickDate.setDate(pickDate.getDate() - 4)

        // Shift to Monday if selected date is Saturday(6) or Sunday(0)
        const weekday = pickDate.getDay()
        if (weekday === 6) {
            pickDate.setDate(pickDate.getDate() + 2)
            cy.log('Adjusted from Saturday to Monday for startTask')
        } else if (weekday === 0) {
            pickDate.setDate(pickDate.getDate() + 1)
            cy.log('Adjusted from Sunday to Monday for startTask')
        }

        const day = pickDate.getDate().toString()
        const pickMonth = pickDate.getMonth()
        const pickYear = pickDate.getFullYear()
        const todayMonth = today.getMonth()
        const todayYear = today.getFullYear()

        cy.log(`Selecting day: ${day}`)
        cy.get('[data-testid="edit-task-details-start-task"]').should('be.visible')
        cy.get('[data-testid="edit-task-details-start-task"]').click({force:true})
        cy.xpath('//div[@id="myModal"]//div//p').should('have.text','You are about to start this task. Please confirm start date')
        cy.get('[aria-label="change date"]').click({force:true})

        // If the target date is in the previous month relative to today, click the back arrow once
        const isPreviousMonthSameYear = todayYear === pickYear && todayMonth > 0 && pickMonth === todayMonth - 1
        const isPreviousMonthPrevYear = todayMonth === 0 && pickMonth === 11 && pickYear === todayYear - 1
        if (isPreviousMonthSameYear || isPreviousMonthPrevYear) {
            cy.log('Target date is in previous month, clicking back in date picker')
            // Material UI calendar uses icon buttons without an aria-label; the first header icon is "previous"
            cy.get('.MuiPickersCalendarHeader-iconButton')
              .first()
              .should('be.visible')
              .and('not.be.disabled')
              .click({ force: true })
        }

        // Select the target day ensuring we only click a visible (non-hidden) day in the current month
        cy.get('.MuiPickersDay-day:not(.MuiPickersDay-hidden)')
          .contains('p', day)
          .click({ force: true })

        cy.wait(5000)
        cy.get('input[name="date"]').invoke('text').then((text)=>{
            startDate = text
            return cy.wrap(startDate).as('actualStartDate')
        })
        cy.wait(5000)
        cy.xpath('//span[text()="Start"]').click({froce:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Your update has been submitted for review', 'Your update has been submitted for review')
        })  
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')  
        cy.xpath('//p[text()="These updates will reflect in the Project schedule as the Project Plan and Critical Path are updated"]').should('be.visible')
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
        cy.wait(3000)
    }
    completeTask(){
        let EndDate
        cy.get('[data-testid="edit-task-details-start-task"]').should('be.visible')
        cy.get('[data-testid="edit-task-details-start-task"]').click({force:true})
        cy.xpath('//div[@id="myModal"]//div//p').should('have.text','Please confirm End date')
        cy.get('input[name="date"]').invoke('text').then((text)=>{
            EndDate = text
            return cy.wrap(EndDate).as('actualEndDate')
        })
        cy.xpath('//span[text()="Confirm"]').click({froce:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Your update has been submitted for review', 'Your update has been submitted for review')
        })  
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
        cy.wait(3000)
    }
    acceptChanges(userAction){
        cy.wait(1000)
        cy.get('.projectPlanHeader__leftAction__accept-changes-count ').invoke('text').then((number) => {
            console.log("Total requests to be accept " + JSON.stringify(number))
            if(number>0){
                cy.get('.projectPlanHeader__leftAction__accept-changes ').then(($a)=>{
                    if($a.next('div.ViewScheduleUpdate').length === 0){
                        cy.wrap($a).click()
                    }
                })
                cy.get('.ViewScheduleUpdate__body').click({forrce:true})
                this.pageelements.scheduleChangesCheckBox().check()
                cy.xpath(`//span[text()='${userAction}']`).click()
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), `We'll send an email when your changes are processed.`, `We'll send an email when your changes are processed.`)
                })
                // Use Cypress's built-in wait for the UI to stabilize
                cy.get('.msgtoaster__text').should('not.exist') 
                cy.wait(1000)
            }
        })
    }
    verifyTaskNotStarted(){
        cy.get('[data-testid="edit-task-details-start-task"] span').should('have.text','Start Task')
    }
    selectTaskStatus(status){
        cy.get('select[name="status"]').select(status)
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Your update has been submitted for review', 'Your update has been submitted for review')
        })
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist') 
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
        cy.wait(3000)
    }
    verifyTaskdetailsPage(taskname){
        cy.get('[data-testid="edit-task-details-start-task"] span').should('have.text','Start Task')
        cy.get('[data-testid="edit-task-details-update-status-button"] span').should('have.text','Update Status')
        cy.get('.supplier-select__contractorlabel').eq(0).should('have.text','User Group')
        cy.get('.supplier-select__contractorlabel').eq(1).should('have.text','Assignee')
        cy.get('.supplier-select__contractorlabel').eq(2).should('have.text','Responsible Company')
        cy.get('[data-testid="edit-task-details-add-usergroup"]').should('have.text', 'Add User Group +')
        cy.get('[data-testid="edit-task-details-add-assignee"]').eq(0).should('have.text', 'Add Assignee +')
        cy.get('[data-testid="edit-task-details-add-assignee"]').eq(1).should('have.text', 'Add Responsible Company +')
        // cy.get('.supplier-select p').should('have.text','Responsible Company-')
        // cy.get('[title="Add assignee"]').should('be.visible')
        cy.xpath('//p[text()="Progress"]').should('be.visible')
        // cy.get('[name="status"]').invoke('text').should('eq','To-Do')
        // cy.get('[data-testid="task-float"]').should('be.visible')
        cy.get('[data-testid="edit-task-details-task-name"]').should('have.text',taskname)
        this.verifyTaskdetailsTabs()

    }

    verifyTaskdetailsTabs(){
        cy.get('[data-testid="task_tab_links_productivity"] span').should('have.text','Productivity')
        cy.get('[data-testid="task_tab_links_resources"] span').should('have.text','Resources')
        cy.get('[data-testid="task_tab_links_constraints"] span').should('have.text',' Constraints')
        cy.get('[data-testid="task_tab_links_variances"] span').should('have.text',' Variances')
        cy.get('[data-testid="task_tab_links_relatedTasks"] span').should('have.text','Related Tasks')
        cy.get('[data-testid="task_tab_links_data"] span').should('have.text',' Data')
        cy.get('[data-testid="task_tab_links_weather"] span').should('have.text',' Weather')
        cy.get('[data-testid="task_tab_links_tag"] span').should('have.text',' Tag')

        const tabs = ["task_tab_links_productivity","task_tab_links_resources","task_tab_links_constraints","task_tab_links_variances","task_tab_links_relatedTasks","task_tab_links_data","task_tab_links_weather","task_tab_links_tag"]
        const expectedElements = {
        "task_tab_links_productivity" : ['//label[text()="Select Classification Code"]','//div[text()="Classification Code"]'],
        "task_tab_links_resources":['[data-testid="edit-task-details-view-data-add-link"]','//span[text()="Material"]','//h3[text()="Cost"]','//label[text()="Commitment Cost"]','//label[text()="Payout Cost"]'],
        "task_tab_links_constraints":['[data-testid="edit-task-details-view-constraints-add-constraint"]','//span[text()="Looks like your task does not have any constraints yet"]'],
        "task_tab_links_variances":['[data-testid="edit-task-detail-view__variances__data-add-variance"]','//span[text()="Your task does not have any blockers yet"]'],
        "task_tab_links_relatedTasks":['//span[text()="Looks like your task does not have any buddies yet!"]','//span[text()="You can create links and add children to task from the gantt view"]'],
        "task_tab_links_data":['[id="link"]','[id="attachments"]','[data-testid="edit-task-details-view-data-empty-add-link"]'],
        "task_tab_links_weather":['//label[text()="Select Template"]','//div[text()="Rain/Snow"]','//div[text()="Wind"]','//div[text()="Wind Gust"]','//div[text()="Temperature"]'],
        "task_tab_links_tag":['//span[text()="Associate Tag(s)"]','//span[text()="Select a Tag"]']
        }

        tabs.forEach((tab)=>{
            cy.get(`[data-testid="${tab}"]`).click({force:true})
            expectedElements[tab].forEach((selector)=>{
                if(selector.startsWith('//')){
                    cy.xpath(selector).should('be.visible')
                }else{
                    cy.get(selector).should('be.visible')
                }
            })
        })
    }
    selectTask(tasnname){
        cy.xpath(`//span[@class="gantt-task-name-text" and text()="${tasnname}"]`).should('be.visible').scrollIntoView().first().click()
        // cy.get('.gantt_grid_data').click()
        cy.wait(6000)
    }
    getTaskId(){

    }
    clickOnAutoSchedule() {
        const AUTO_SCHEDULE_URL = "https://schedulemaster-api.service.**.slate.ai/v1/projecttask/autoSchedule"
        const AUTO_SCHEDULE_BUTTON = '//img[@alt="AutoSchedule"]'
        const ERROR_MESSAGE = "There are errors in the following tasks"
    
        this.openScheduleinEditMode()
    
        // Intercept the AutoSchedule API call
        cy.intercept('POST', AUTO_SCHEDULE_URL).as('autoSchedule')
    
        // Click the AutoSchedule button
        cy.xpath(AUTO_SCHEDULE_BUTTON).click({ force: true })
    
        // Wait for the AutoSchedule request and verify the response
        cy.wait('@autoSchedule').then((interception) => {
            const { statusCode, body } = interception.response
            
            // Check the status code
            if (statusCode !== 201) {
                throw new Error(`AutoSchedule failed with status code: ${statusCode}`)
            }
    
            // Check that the response does not contain the error message
            if (body.error && body.error.includes(ERROR_MESSAGE)) {
                throw new Error(`AutoSchedule response contains error: ${ERROR_MESSAGE}`)
            }
    
            cy.log("AutoSchedule completed successfully without errors")
        })
    
        // Save the plan using the savePlan function
        this.savePlan()
    }

    selectTaskDetailTab(tabName, text) {
        cy.wait(1000);
        cy.get(`[data-testid="task_tab_links_${tabName}"]`)
          .should('be.visible')
          .click({ force: true })
        cy.get(`[data-testid="task_tab_links_${tabName}"] span`)
          .should('have.text', text);
    }

    addVariances() {
        let startDate
        const variancesOptions = [
            "Approvals/Permits",
            "Completed Early (Positive)",
            "Contracts/ Change Orders",
            "Coordination Problem",
            "Engineering/Design",
            "Equipment Management",
            "Labor Management",
            "Materials Management",
            "Owner Decision",
            "Prerequisite Work Not Complete",
            "RFIs",
            "Site Conditions/Incidents",
            "Space/Required Spacing",
            "Submittals",
            "Weather"
        ]
        cy.getDate(0).then((date) => {
            startDate = date
            cy.get('[data-testid="edit-task-detail-view__variances__data-add-variance"]').click()
            
            // Wait for the input to be visible and focused
            cy.get('[placeholder="Enter Title"]')
                .should('be.visible')
                .click({force: true})
                .wait(500) // Add a small wait after clicking
                .clear() // Clear any existing value
                .type('variance01', {delay: 100}) // Add delay between keystrokes
            
            this.verifyAndSelectOption('variance-category', 'RFIs', variancesOptions)
            
            cy.get('[placeholder="Description"]')
                .should('be.visible')
                .click({force: true})
                .wait(500)
                .clear()
                .type('adding variance', {delay: 100})
            
            cy.get('[placeholder="Delay"]')
                .should('be.visible')
                .click({force: true})
                .wait(500)
                .clear()
                .type('2', {delay: 100})
            
            cy.get('[placeholder="Start Date"]')
                .should('be.visible')
                .click({force: true})
                .wait(500)
                .clear()
                .type(startDate, {delay: 100})
            
            cy.get('[data-testid="variance-btn-update"]').click()
            
            // Intercept and verify the GetTaskVariances update
            cy.interceptGraphQlRequest("GetTaskVariances")
            cy.wait("@GetTaskVariances").then((interception) => {
                cy.log("GetTaskVariances is saved")
                expect(interception.response.statusCode).to.eq(200)
                const projectTaskVariance = interception.response.body.data.projectTaskVariance
                expect(projectTaskVariance).to.be.an('array').that.is.not.empty
                projectTaskVariance.forEach(variance => {
                    expect(variance).to.not.be.null
                })
            })
            
            // cy.get('[data-testid="taskDetails-close-button"]').last().click({force: true})
            // cy.get('[data-testid="today"]').should('be.visible').click()
        })
    }

    verifyAndSelectOption(category, selectValue, expectedOptions) {
        // Construct the selector based on the category
        const selector = `div[data-testid="${category}-input"] select#demo-simple-select-outlined`;
    
        // Verify all expected options are present
        cy.get(selector)
            .children('option')
            .then(options => {
                const actualOptions = [...options].map(option => option.value);
                expectedOptions.forEach(expectedOption => {
                    expect(actualOptions).to.include(expectedOption);
                });
            });
    
        // Select the option with the specified value
        cy.get(selector).select(selectValue);
    }
    deleteVariances(){
        cy.get('[data-testid="variance-btn-delete"]').click({force:true})
        cy.xpath('//p[text()="Are you sure you want to delete this variance?"]').should('be.visible')
        cy.get('[data-testid="confirm-action"]').click({force:true})
        // Intercept and verify the GetTaskVariances update
        cy.interceptGraphQlRequest("GetTaskVariances")
        cy.wait("@GetTaskVariances").then((interception) => {
            cy.log("GetTaskVariances is saved") // Log that the request was intercepted
            expect(interception.response.statusCode).to.eq(200)             // Verify the response status code is 200
            const projectTaskVariance = interception.response.body.data.projectTaskVariance  // Verify that the response contains an empty projectTaskVariance array
            expect(projectTaskVariance).to.be.an('array').that.is.empty
        })
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
    }
    addConstraints() {
        let startDate
        const constraintOptions = [
            "Analysis not complete",
            "Availability: Equipment",
            "Availability: Labor",
            "Availability: Materials",
            "Data not received",
            "Design Change",
            "Design not complete",
            "Form",
            "Inspection not yet complete",
            "Permit not processed",
            "Site Conditions",
            "Something is not Ready",
            "Weather"
        ]
        const constraintFormOptions = [
            "RFI",
            "Submittals",
            "Observation Report",
            "Lessons Learned",
            "Change Order",
            "BIM360 Checklist",
            "BIM360 Issues",
            "PM4 - RFI",
            "Procore Manpower Logs",
            "Procore Timecard Entries",
            "Procore Productivity Logs",
            "Procore RFI",
            "BIM360 RFI",
            "Procore Observation",
            "Procore Inspection",
            "Procore Punchlists",
            "Procore Submittal",
            "Warranty Issues",
            "Procore Commitment Change Order",
            "Procore Prime Contract Change Order",
            "Procore Potential Change Order",
            "Oct-Form",
            "Procore Budget",
            "Procore Change Events",
            "BooleanFormCheck",
            "Procore Commitments",
            "OctoberStatus",
            "Lessons Learned Checklist",
            "Concreting for Slab & Beam Quality Checklist",
            "ACC Checklist",
            "ACC Issues",
            "ACC RFI"
        ]
        cy.getDate(0).then((date) => {
            startDate = date
            cy.get('[data-testid="edit-task-details-view-constraints-add-constraint"]').click()
            
            // Wait for the input to be visible and focused
            cy.get('[placeholder="Enter Title"]')
                .should('be.visible')
                .click({force: true})
                .wait(500) // Add a small wait after clicking
                .clear() // Clear any existing value
                .type('constraints01', {delay: 100}) // Add delay between keystrokes
            
            this.verifyAndSelectOption('constraint-category', 'Form', constraintOptions)
            this.verifyAndSelectOption('constraint-form', 'RFI', constraintFormOptions)
            
            cy.get('[placeholder="Enter Description"]')
                .should('be.visible')
                .click({force: true})
                .wait(500)
                .clear()
                .type('adding constraint', {delay: 100})
            
                cy.get('[placeholder="Search User/Company"]').type('winiie dunce')
                cy.get('[placeholder="Pick a date"]').type(startDate)
            
            cy.get('[data-testid="constraint-btn-update"').click()
            
            // Intercept and verify the GetTaskConstraints update
            cy.interceptGraphQlRequest("GetTaskConstraints")
            cy.wait("@GetTaskConstraints").then((interception) => {
                cy.log("GetTaskConstraints is saved")
                expect(interception.response.statusCode).to.eq(200)
                const projectTaskConstraints = interception.response.body.data.projectTaskConstraints
                expect(projectTaskConstraints).to.be.an('array').that.is.not.empty
                projectTaskConstraints.forEach(constraint => {
                    expect(constraint).to.not.be.null
                })
            })
            
            cy.get('[data-testid="constraint-resolvedat"] span').should('have.text','open')
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Constraint added successfully', 'Constraint added successfully')
            })   
            // Wait for the toaster message to disappear
            cy.get('.msgtoaster__text').should('not.exist')
        })
    }

    verifyAndUncheckConstraint(rfi, constraint) {
        // Construct the text to search for
        const searchText = `${rfi}: ${constraint}`;
    
        // Verify the presence of the RFI constraint
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__name')
          .should('contain.text', searchText);
    
        // Verify the checkbox is present and checked
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__constraint-checkbox input[type="checkbox"]')
          .should('be.checked');
    
        // Uncheck the checkbox
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__constraint-checkbox input[type="checkbox"]')
          .uncheck({ force: true });
    
        // Verify the checkbox is now unchecked
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__constraint-checkbox input[type="checkbox"]')
          .should('not.be.checked');
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Constraint deleted successfully', 'Constraint deleted successfully')
        })   
        // Wait for the toaster message to disappear
        cy.get('.msgtoaster__text').should('not.exist')
    }

    verifyConstraintAdded(){
        cy.wait(1000)
        cy.get('[data-testid="task_tab_links_constraints"] p')
        .invoke('text')
        .then((text) => {
            const trimmedText = text.trim(); // Trim whitespace
            const value = parseInt(trimmedText, 10); // Convert the text to a number
            expect(value).to.be.at.least(1); // Assert that the value is 1 or more
        })
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
    }
    verifyConstraintDeleted(){
        cy.wait(1000)
        cy.get('[data-testid="task_tab_links_constraints"] p')
        .invoke('text')
        .then((text) => {
            const trimmedText = text.trim(); // Trim whitespace
            const value = parseInt(trimmedText, 10); // Convert the text to a number
            expect(value).to.equal(0); // Assert that the value is 0
        })
        this.selectTaskDetailTab('constraints',' Constraints')
        cy.xpath('//span[text()="Looks like your task does not have any constraints yet"]').should('be.visible')
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
    }
    removeLink(){
        cy.get('[data-testid="edit-task-details-view-data-delete-link"]').click()
        cy.xpath('//p[text()="Are you sure you want to remove this link?"]').should('be.visible')
        cy.get('[data-testid="confirm-action"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Link removed successfully', 'Link removed successfully')
        })   
        // Wait for the toaster message to disappear
        cy.get('.msgtoaster__text').should('not.exist')
        cy.get('[data-testid="edit-task-details-view-data-empty-add-link"] span').should('have.text','+ Add Link')
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        cy.wait(1000)
        // cy.get('[data-testid="today"]').should('be.visible').click()
    }
    addLink(){
        cy.get('[data-testid="edit-task-details-view-data-empty-add-link"]').click()
        cy.contains('td', 'RFI-01') // Find the <td> with the text 'RFI-01'
            .parent() // Get the parent <tr> of that <td>
            .find('input[type="checkbox"]') // Find the checkbox within that row
            .check({ force: true }); // Check the checkbox, using force if necessary
        cy.get('[data-testid="add-data-link-popup-save-btn"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Link added successfully', 'Link added successfully')
        })   
        // Wait for the toaster message to disappear
        cy.get('.msgtoaster__text').should('not.exist')
        cy.get('[data-testid="task_tab_links_constraints"] p')
        .invoke('text')
        .then((text) => {
            const trimmedText = text.trim(); // Trim whitespace
            const value = parseInt(trimmedText, 10); // Convert the text to a number
            expect(value).to.equal(0); // Assert that the value is 0
        })
        cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
        // cy.get('[data-testid="today"]').should('be.visible').click()
        cy.wait(5000)
    }
    checkAddToConstraint(rfi, constraint) {
        // Construct the text to search for
        const searchText = `${rfi}: ${constraint}`;
    
        // Verify the presence of the RFI constraint
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__name')
          .should('contain.text', searchText);
       
        // check the checkbox
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__constraint-checkbox input[type="checkbox"]')
          .check({ force: true });
    
        // Verify the checkbox is present and checked
        cy.get('.edit-task-details-view-data__links-data__form__table-body-td-1__constraint-checkbox input[type="checkbox"]')
          .should('be.checked');
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Constraint added successfully', 'Constraint added successfully')
        })   
        // Wait for the toaster message to disappear
        cy.get('.msgtoaster__text').should('not.exist')
    }
    deleteConstraint(){
        cy.get('[data-testid="constraint-btn"]').last().click()
        cy.xpath('//p[text()="Are you sure you want to delete this constraint?"]').should('be.visible')
        cy.get('[data-testid="confirm-action"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Constraint deleted successfully', 'Constraint deleted successfully')
        })   
        // Wait for the toaster message to disappear
        cy.get('.msgtoaster__text').should('not.exist')
    }
    closeTaskDetails() {
        cy.wait(5000)
        
        // Check if the close button exists before trying to click it
        cy.get('body').then(($body) => {
            if ($body.find('[data-testid="taskDetails-close-button"]').length > 0) {
                cy.get('[data-testid="taskDetails-close-button"]').last().click({force: true})
            } else {
                cy.log('Close button not found, skipping close action')
            }
        })
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        // Click today button if it's visible
		cy.get('.msgtoaster__text', { timeout: 10000 }).should('not.exist')
		cy.get('body').then(($body) => {
			const hasTodayButton = $body.find('[data-testid="today"]').length > 0
			if (hasTodayButton) {
				cy.get('[data-testid="today"]').scrollIntoView({ block: 'center' })
					.should('be.visible')
					.click({ force: true })
			} else {
				cy.log('Today button not found, skipping click')
			}
		})
        cy.wait(1000)
    }

    ensureTaskDetailsClosed() {
        cy.get('body').then(($body) => {
            if ($body.find('.MuiDialog-scrollPaper').length > 0) {
                cy.get('[data-testid="taskDetails-close-button"]').last().click({force: true})
            }
        })
    }

    verifyVarianceAdded(){
        cy.wait(1000)
        cy.get('[data-testid="task_tab_links_variances"] p')
        .invoke('text')
        .then((text) => {
            const trimmedText = text.trim(); // Trim whitespace
            const value = parseInt(trimmedText, 10); // Convert the text to a number
            expect(value).to.be.at.least(1); // Assert that the value is 1 or more
        })
		cy.get('[data-testid="taskDetails-close-button"]').last().click({force:true})
		cy.get('.msgtoaster__text', { timeout: 10000 }).should('not.exist')
		cy.get('body').then(($body) => {
			const hasTodayButton = $body.find('[data-testid="today"]').length > 0
			if (hasTodayButton) {
				cy.get('[data-testid="today"]').scrollIntoView({ block: 'center' })
					.should('be.visible')
					.click({ force: true })
			} else {
				cy.log('Today button not found, skipping click')
			}
		})
    }

    savePlanVersion() {
        const SUCCESS_MESSAGE = 'Saved project plan successfully'
    
        // Set up intercept BEFORE triggering the request
        cy.intercept('PUT', 'https://scheduler.service.qe.slate.ai/V1/taskDetails/update_serialNumber').as('UpdateSerialNumber')
        // Click the save version button
        cy.get("[aria-controls='edit-save-mode']").click()
        .get("ul li").contains('Save version').click()
    
        //Save as baseline version
        cy.xpath('//span[text()="Save Version As"]').should('be.visible')
        cy.get('[data-testid="baseline-name"]').type('baseline')
        cy.get('[data-testid="baseline-description"]').type('creating baseline version')
        cy.get('[name="isBaseline"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})

        // Intercept and verify the version update
        cy.interceptGraphQlRequest("GET_VERSIONS")

        // Intercept and verify the calendar update
        cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
        cy.wait("@getAllProjectAssociatedCalendar").then((req) => {
            cy.log("Schedule is saved")
        })

        cy.wait("@GET_VERSIONS").then((req) => {
            // Assert that the baselineName is not null
            expect(req.response.body.data.scheduleBaselineMetadata).to.be.an('array').that.is.not.empty // Ensure the array is not empty
            expect(req.response.body.data.scheduleBaselineMetadata[0].baselineName).to.not.be.null // Assert baselineName is not null
            expect(req.response.body.data.scheduleBaselineMetadata[0].isBaseline).to.be.false // Assert isBaseline is false in case if baseline is checked
        })
    
        // Wait and verify the serial number update with retry
        this.updateSerialNumber()
    }

    selectScheduleVersion(version,taskname){
        // Intercept and verify version api
        cy.intercept('GET','https://scheduler.service.**.slate.ai/V1/baseline/**').as('baselineVersion')
        
        cy.get('select[name="version"]').select(version)
        cy.wait(40000)
        if(version === 'baseline'){
            cy.wait('@baselineVersion').then((res) => {
                expect(res.response.statusCode).to.eq(200) // Assert that the response status code is 200
                const tasks = res.response.body.data.tasks // Extract tasks from the response
                const taskNames = tasks.map(task => task.taskName) // Extract task names
                expect(taskNames).to.include(taskname) // Assert that the taskName is included
            })
        }
        cy.wait(3000)
    }

    checkAndAddTaskIfBaselineNotPresent(projectName, assignee, data) {
        // Get the select element and extract its options
        cy.get('select[name="version"]').then($select => {
            const options = $select.find('option'); // Get all options in the select element
            let hasBaseline = false

            // Iterate through the options to check for "baseline"
            options.each((index, option) => {
                if (option.innerText.trim() === 'baseline') { // Check if the option value is "baseline"
                    hasBaseline = true; // Set flag if baseline is found
                }
            });
    
            // If baseline is not present, call addNewTask
            if (!hasBaseline) {
                this.addNewTask(projectName, assignee, data, true); // Call addNewTask with isSaveVersion set to true
            } else {
                cy.log("Baseline is present, skipping addNewTask."); // Log that the task addition is skipped
            }
        })
    }
    verifyFilterMenuItems() {
        const expectedTexts = [
            "% Complete",
            "Planned Start Date",
            "Planned End Date",
            "Actual Start Date",
            "Actual End Date",
            "Assignee",
            "User Group",
            "Status",
            "Type",
            "Total Float",
            "Insight"
        ];
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button) => {
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.wait(1000)
        cy.get('[data-testid="FilterAltOutlinedIcon"]').click({ force: true })
        cy.get('.filter-panel__menu__container li')
            .should('have.length', expectedTexts.length)
            .each(($li, index) => {
                cy.wrap($li).find('span').invoke('text').then((text) => {
                    expect(text.trim()).to.equal(expectedTexts[index])
                })
            })
    }
    applyGlobalFilter(filters) {    
        filters.forEach(filter => {
            switch (filter) {
                case "Assignee":
                    cy.xpath(`//li[.//span[text()="${filter}"]]`).click({ force: true });
                    cy.wait(1000);
                    cy.get('[type="checkbox"]').click({ force: true });
                    break
    
                case "Planned Start Date":
                    cy.xpath(`//li[.//span[text()="${filter}"]]`).click({ force: true });
                    cy.wait(1000);
                    this.clickChangeDateButton("On or after")
                    //select today's date
                    const Ptoday = new Date().getDate();
                    cy.get('.MuiPickersDay-day p').each(($el) => {
                        if ($el.text() === Ptoday.toString()) {
                            cy.wrap($el.parent()).click({ force: true });
                        }
                    })
                    break
                case "User Group":
                    cy.xpath(`//li[.//span[text()="${filter}"]]`).click({ force: true });
                    cy.wait(1000);
                    cy.get('[type="checkbox"]').click({ force: true });
                    break

                case "Actual Start Date":
                    cy.xpath(`//li[.//span[text()="${filter}"]]`).click({ force: true });
                    cy.wait(1000);
                    this.clickChangeDateButton("On or after")
                    //select today's date
                    const Atoday = new Date().getDate();
                    cy.get('.MuiPickersDay-day p').each(($el) => {
                        if ($el.text() === Atoday.toString()) {
                            cy.wrap($el.parent()).click({ force: true });
                        }
                    })
                    this.clickChangeDateButton("On or before")
                    cy.wait(1000)
                    // Click on the future date
                    let futureDate = new Date()
                    futureDate.setDate(futureDate.getDate() + 4)
                    let day = futureDate.getDate().toString()
                    cy.log(day)
                    cy.wait(1000)
                    cy.get('.MuiPickersDay-day p').each(($el) => {
                        if ($el.text() === day) {
                            cy.wrap($el.parent()).click({ force: true });
                        }
                    })
                    cy.wait(1000)
                    break
    
                // Add more cases for other filters as needed
                // case "Another Filter":
                //     // Implement the logic for another filter
                //     break;
    
                default:
                    cy.log(`No specific action defined for filter: ${filter}`)
                    break;
            }
        });
    
        cy.get('[data-testid="filterPanel-apply-filter"]').click({ force: true })
    }

    verifyFilerApplied(taskname,NoOfFilters,shouldExist){
        cy.get('span[class*="MuiBadge-badge"][class*="MuiBadge-standard"][class*="MuiBadge-colorPrimary"]')// Select the span with the specific class
            .should('have.text', NoOfFilters) // Assert that the text is "3"
        this.ensureActivityPanelOpen()
        this.selectAdditionalColumns(['Type'])
        if(shouldExist){
            this.getActivityNameOfTaskType(taskname)
        }else{
            this.getActivityNames()
        }
    }
    getActivityNames(){
        cy.get('.gantt_grid_data .gantt_cell_tree .gantt_tree_content') // Select all activity name elements
            .then($elements => {
            const activityNames = $elements.map((index, element) => {
            return Cypress.$(element).text().trim(); // Get the text and trim whitespace
            }).get(); // Convert jQuery object to a regular array

            cy.log(activityNames); // Log the activity names
            // Assert that activityNames has only one value
            expect(activityNames).to.have.lengthOf(1)
        })
    }
    getActivityNameOfTaskType(taskname) {
        cy.get('.gantt_grid_data .gantt_row') // Select all rows in the grid
        .filter((index, element) => {
            // Check if the typeName cell contains "Task"
            return Cypress.$(element).find('.gantt_cell[data-column-name="typeName"] .gantt_tree_content').text().trim() === 'Task'
        })
        .then($filteredRows => {
            const activityNames = $filteredRows.map((index, element) => {
                // Get the activity name from the text column
                return Cypress.$(element).find('.gantt_cell[data-column-name="text"] .gantt_tree_content').text().trim()
            }).get(); // Convert jQuery object to a regular array
    
            cy.log(activityNames) // Log the activity names
    
            // Assert that the taskName is present in the activityNames
            expect(activityNames).to.deep.equal([taskname]) // Assert that activityNames contains only taskName
        })
    }
    clickChangeDateButton(placeholder) {
        cy.get(`input[placeholder="${placeholder}"]`) // Select the input field by its placeholder
          .parent() // Navigate to the parent div that contains the button
          .find('button[aria-label="change date"]') // Find the button with the specified aria-label
          .click({ force: true }); // Click the button, using force if necessary
    }
    clearGlobalFilter(){
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button) => {
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
        cy.wait(1000)
        cy.get('[data-testid="FilterAltOutlinedIcon"]').click({ force: true })
        cy.get('[data-testid="filterPanel-clear-button"]').click({ force: true })
        cy.wait(1000)
        cy.get('[data-testid="filterPanel-close-button"]').click({ force: true })
        cy.get('span.MuiBadge-badge.MuiBadge-standard.MuiBadge-invisible')
        .should('have.text', '0') // Assert that the text is "0"
    }

    selectDropdownValue(value) {
        cy.wait(5000)
        // Click on the dropdown to open it
        cy.get('[data-testid="views-select-dropdown"] .MuiSelect-root').click({ force: true })
    
        // Wait for the dropdown options to be visible
        cy.get('.MuiMenuItem-root').should('be.visible')
    
        // Wait for the menu to be visible
        cy.get('ul.MuiList-root').should('be.visible')

        // Find the list item with the specified data-value and click it
        cy.get('ul.MuiList-root li[data-value="' + value + '"]').click({ force: true })
        cy.wait(10000)
    }
    verifyWeekSpanText(expectedWeekText) {
        // Verify the week text, ignoring the number
        cy.get('.gantt-container__right__lookup__week')
            .invoke('text')
            .then((text) => {
                // Remove any numbers from the text and trim
                const textWithoutNumbers = text.replace(/\d+/g, '').trim();
                // Remove any numbers from the expected text and trim
                const expectedWithoutNumbers = expectedWeekText.replace(/\d+/g, '').trim();
                expect(textWithoutNumbers).to.equal(expectedWithoutNumbers);
            });
    }
    verifyWeeklyPlanAndWeekBefore(expectedWeeklyPlanText, expectedWeekBeforeText) {
        // Verify the Weekly Plan text
        cy.get('.Weelyplan__header__currentWeek__week')
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.equal(expectedWeeklyPlanText)
            });
    
        // Verify the Week Before text
        cy.get('.Weelyplan__header__weekbefore__current__week')
            .invoke('text')
            .then((text) => {
                expect(text.trim()).to.equal(expectedWeekBeforeText)
            });
    }
    clickOnTodayBtn(){
        // cy.get('[data-testid="today"]').should('be.visible').click()
        cy.wait(3000)
    }
    getPlannedDatesScheduler(taskName){
        let plannedDatesFromShedule = []
        const columns = ['plannedStartDate', 'plannedEndDate']

        // Chain the async operations sequentially to ensure all dates are collected
        cy.wrap(null).then(() => {
            return cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${columns[0]}"]//div`)
                .first()
                .invoke('text')
                .then((text) => {
                    plannedDatesFromShedule.push(text.trim())
                })
        }).then(() => {
            return cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${columns[1]}"]//div`)
                .first()
                .invoke('text')
                .then((text) => {
                    plannedDatesFromShedule.push(text.trim())
                })
        }).then(() => {
            cy.log(JSON.stringify(plannedDatesFromShedule));
            return cy.wrap(plannedDatesFromShedule).as('plannedDatesFromShedule')
        });
      
        cy.wait(5000)
    }
    checkSerialNumberOrder() {
        this.ensureScheduleExpanded()
        cy.wait(3000)
        this.ensureActivityPanelOpen()
        cy.wait(3000)
        // Select all elements with data-column-name="serialNumber" except the header
        cy.get('.gantt_grid_data [data-column-name="serialNumber"]').each(($el, index) => {
            // Get the text from the div
            cy.wrap($el).find('.gantt_tree_content').invoke('text').then((text) => {
                const serialNumber = parseInt(text.trim(), 10);
                // Log the serial number for debugging
                cy.log(`Found serial number: ${serialNumber}`)
                // Check if the serial number is in increment order
                expect(serialNumber).to.equal(index + 1);
            });
        });
    }

    changeActivityType(activityName, newType) {
        this.clickEditIconForCellByTaskName(activityName, 'typeName')
        cy.get('body').then(($body) => {
            const hasTypeSelect = $body.find('select[name="type"]').length > 0
            const selector = hasTypeSelect ? 'select[name="type"]' : 'select[name="taskType"]'
            cy.get(selector)
                .should('be.visible')
                .select(newType)
                .then(() => {
                    cy.get(selector).type('{enter}')
                })
        })
    }
    verifyDurationBasedonType(activityName, type) {
        let columnNames = ['plannedStartDate', 'plannedEndDate', 'plannedDuration']
        let nameValues = {}
        
        cy.wrap({}).then(() => {
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${activityName}"]/parent::div//div[@data-column-name="${column}"]//div`)
                    .invoke('text')
                    .then((text) => {
                        if (column === 'plannedStartDate' || column === 'plannedEndDate') {
                            nameValues[column] = text.replace(/-/g, ' ').replace(new RegExp('\\d{2}$'), '').trimEnd()
                        } else {
                            nameValues[column] = text.split(/\s+/)[0]
                        }
                    })
            })
        }).then(() => {
            // Verify based on type
            if (type === 'Task') {
                // For Task: start date should equal end date and duration should be 1
                expect(nameValues.plannedStartDate).to.equal(nameValues.plannedEndDate, 
                    'For Task type, planned start date should equal planned end date')
                expect(parseInt(nameValues.plannedDuration)).to.equal(1, 
                    'For Task type, duration should be 1')
            } else if (type === 'Milestone') {
                // For Milestone: start date should equal end date and duration should be 0
                expect(nameValues.plannedStartDate).to.equal(nameValues.plannedEndDate, 
                    'For Milestone type, planned start date should equal planned end date')
                expect(parseInt(nameValues.plannedDuration)).to.equal(0, 
                    'For Milestone type, duration should be 0')
            }
            cy.log(JSON.stringify(nameValues))
        })
    }
    updateDuration(activityName, duration) {
        // Use the common helper to hover and click the edit icon for the Planned Duration cell
        this.clickEditIconForCellByTaskName(activityName, 'plannedDuration')

        // Wait for the input field to be visible and type the duration
        cy.get('input[name="plannedDuration"]')
            .should('be.visible')
            .clear()
            .type(duration)
            .type('{enter}')  // Press enter to confirm
    }

    addRelationIntoPredecessor(activityName, relation){
        // Click the edit icon to open the input field
        this.clickEditIconForCellByTaskName(activityName, 'predecessor')
        // Wait for the input field to be visible and type the relation
        cy.get('input[name="predecessor"]')
            .should('be.visible')
            .should('be.enabled')
            .clear()
            .wait(2000)
            .type(relation, { force: true })
            .wait(2000)
            .type('{enter}')  // Press enter to confirm
            .wait(2000)
    }

    uploadCentroSchedule(scheduleFile, fileFormat = 'msp', fileEncodingOrOverwrite = 'binary', selectOverWrite = false) {
        const fileEncoding = typeof fileEncodingOrOverwrite === 'string' ? fileEncodingOrOverwrite : 'binary'
        const shouldSelectOverwrite = typeof fileEncodingOrOverwrite === 'boolean' ? fileEncodingOrOverwrite : selectOverWrite
        cy.wait(5000)
        //verify if edit plan button is visible
        cy.get('button[data-testid="edit-plan"],button[data-testid="save plan"]').then($button=>{
            if($button.attr("data-testid")==="edit-plan"){
                //edit plan button is present
                cy.wrap($button).click()
                cy.wait(1000)
                cy.log("edit plan is clicked")
            }else{
                //save plan button is present
                cy.get("[aria-controls='edit-save-mode']").click()
                .get("ul li").contains('Discard changes').click()
                this.pageelements.editPlanBtn().should('be.visible').click()
            }
        })
        // cy.get('[data-testid="three-dot-button"]').click()
        cy.get('[data-testid="import-button"]').click()
        cy.wait(2000)
        cy.get(`[data-testid="import-${fileFormat}-plan-option"]`).click()
        cy.wait(2000)
        cy.get('.projectPlanImport__planUpload__dropZone').then(($class)=>{
            // Read file before upload to verify it's not corrupted
            cy.readFile(`cypress/fixtures${scheduleFile}`, fileEncoding).then((fileContent) => {
                // Log file size for verification
                cy.log(`File size before upload: ${fileContent.length} bytes`);
                
                // Log the first few bytes for debugging
                const fileHeader = new Uint8Array(fileContent.slice(0, 8));
                cy.log('File header bytes:', Array.from(fileHeader).map(b => b.toString(16).padStart(2, '0')).join(' '));
                
                // Upload the file with proper encoding
                cy.wrap($class).find("input[type='file']").attachFile({
                    fileContent,
                    fileName: scheduleFile.split('/').pop(),
                    mimeType: 'application/octet-stream',
                    encoding: fileEncoding,
                    lastModified: new Date().getTime()
                });
            });
            // select the overwrite checkbox
            if (shouldSelectOverwrite && fileFormat !== 'pp') {
                cy.wrap($class).find('input[type="checkbox"]').then(($checkbox) => {
                    if ($checkbox.length > 0) {
                        cy.wrap($checkbox).check({ force: true });
                    } else {
                        cy.log('Overwrite checkbox not present; skipping overwrite selection');
                    }
                });
            }
            cy.wait(10000)
            cy.xpath('//span[text()="Import File"]/ancestor::button').should('not.be.disabled').click()
        })
        // Set up intercept BEFORE triggering the request
        cy.intercept('https://scheduler.service.qe.slate.ai/V1/projectPlan/check/edit').as('checkEditImport')
        cy.intercept('POST', 'https://hasura.service.**.slate.ai/v1/graphql', (req) => {
            if (req.body.operationName === "getProjectPlanTasksAllTasks") {
                    req.alias = 'getTasks'
            }
        })
        cy.xpath('//span[text()="Yes, Continue"]').click()
        const soundsGoodTimeout = fileFormat === 'pp' ? 180000 : 60000
        cy.xpath('//span[text()="Sounds Good"]', { timeout: soundsGoodTimeout }).should('be.visible')
        this.checkEditStatus();
        this.getTasks();
        cy.wait(20000)
    }
    exportSchedule(fileFormat, projectName) {
        cy.get('[data-testid="export-data-button"]').should('be.visible').click()
        cy.get(`[data-testid="export-${fileFormat}-option"]`).should('be.visible').click()
        cy.wait(2000)
        cy.waitForDownload("cypress/exports", 30000).then((file) => {
            const filepath = `cypress/exports/${file}`
            cy.wrap(filepath).should("contain", projectName)
        })
    }

    verifyLinksExist() {
        this.clearTaskFilter()
        cy.get('.gantt_links_area').find('.gantt_task_link').should('exist');
    }
    searchTaskByName(taskName){
        cy.wait(3000)
        // Click on the activity name filter input to open the dropdown
        cy.get('div[data-testid="filter-activity-name"] input[id="gantt-activity-name-filter"]').click({force:true})
        
        // Wait for the dropdown menu to be visible
        cy.get('ul.MuiList-root.MuiMenu-list').should('be.visible')
        
        // Type the task name in the search field
        cy.get('input[data-testid="activity-name-search"][placeholder="Search activity by name"]')
            .should('be.visible')
            .clear()
            .type(taskName)
        
        // Click on the overlay to close the popover
        cy.get('.MuiPopover-root > div[aria-hidden="true"]').click({ force: true })
        cy.wait(3000)
    }

    updateTaskField(fieldType, value, ...tasknames) {
        // Configuration for each field type
        const config = {
            assignee: {
                menu: '[data-testid=ProjectPlan-Menu-assignee]',
                label: 'Assignee',
                input: "[id='user-usergroup-search']",
                option: '.singleUserSelect__option__list__item',
                success: 'Updated successfully'
            },
            location: {
                menu: '[data-testid=ProjectPlan-Menu-location]',
                label: 'Location',
                input: "[id='projectLocation-search']",
                option: '.projectLocation__option__list__item',
                success: 'Location Updated successfully'
            },
            usergroup: {
                menu: '[data-testid=ProjectPlan-Menu-userGroup]',
                label: 'User Group',
                input: "[id='user-usergroup-search']",
                option: '.userGroupSelect__option__list__item',
                success: 'User groups Updated Successfully'
            },
            classification: {
                menu: '[data-testid=ProjectPlan-Menu-classifyCode]',
                label: 'Classification Code',
                input: ".edit-task-details-view-productivity__list__searchbox",
                option: '.productivitycode__option__list__item',
                success: 'Updated successfully'
            }
        };

        const { menu, label, input, option, success } = config[fieldType];

        tasknames.forEach((task) => {
            cy.log(JSON.stringify(task));
            // Ensure scheduler is loaded, open panels, etc.
            cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
                expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
            });
            cy.document().then((doc)=>{
                const leftContainer = doc.querySelector('div.gantt-container__left');
                if(leftContainer){
                    const activityList = leftContainer.querySelector('div.gantt-container__left__title');
                    if(activityList){
                        this.pageelements.leftExpandBtn().click();
                    }else{
                        cy.log("left activity panel is already open");
                    }
                }
            });
            this.ensureScheduleExpanded();
            cy.wait(10000);
            cy.xpath(`//span[@class="gantt-task-name-text" and text()="${task}"]`).should('be.visible').click();
            cy.get('.gantt_grid_data').click();
            cy.wait(6000);
            cy.xpath(`//span[@class="gantt-task-name-text" and text()="${task}"]`).should('be.visible').rightclick();
            cy.get(menu).click();
            cy.xpath(`//div[text()="${label}"]`).should('be.visible');
            cy.get(input).click().type(value);
            cy.wait(500);
            if (fieldType === 'location') {
                cy.get(option).contains('span', value).click();
            } else {
                cy.get(option).click();
            }
            cy.xpath('//button[text()="Update"]').should(($button)=>{
                expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
            });
            cy.xpath('//button[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), success, success);
            });
            cy.get('.msgtoaster__text').should('not.exist');
            cy.wait(1000);
        });
    }

    updateTaskFieldByIndex(fieldType, value, taskname, elementIndex = 0) {
        // Configuration for each field type
        const config = {
            assignee: {
                menu: '[data-testid=ProjectPlan-Menu-assignee]',
                label: 'Assignee',
                input: "[id='user-usergroup-search']",
                option: '.singleUserSelect__option__list__item',
                success: 'Updated successfully'
            },
            location: {
                menu: '[data-testid=ProjectPlan-Menu-location]',
                label: 'Location',
                input: "[id='projectLocation-search']",
                option: '.projectLocation__option__list__item',
                success: 'Location Updated successfully'
            },
            usergroup: {
                menu: '[data-testid=ProjectPlan-Menu-userGroup]',
                label: 'User Group',
                input: "[id='user-usergroup-search']",
                option: '.userGroupSelect__option__list__item',
                success: 'User groups Updated Successfully'
            },
            classification: {
                menu: '[data-testid=ProjectPlan-Menu-classifyCode]',
                label: 'Classification Code',
                input: ".edit-task-details-view-productivity__list__searchbox",
                option: '.productivitycode__option__list__item',
                success: 'Updated successfully'
            }
        };

        const { menu, label, input, option, success } = config[fieldType];

        cy.log(JSON.stringify(taskname));
        // Ensure scheduler is loaded, open panels, etc.
        cy.get('[data-testid="expand"],[title="Collapse"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        });
        cy.document().then((doc)=>{
            const leftContainer = doc.querySelector('div.gantt-container__left');
            if(leftContainer){
                const activityList = leftContainer.querySelector('div.gantt-container__left__title');
                if(activityList){
                    this.pageelements.leftExpandBtn().click();
                }else{
                    cy.log("left activity panel is already open");
                }
            }
        });
        this.ensureScheduleExpanded();
        cy.wait(10000);
        cy.xpath(`//span[@class="gantt-task-name-text" and text()="${taskname}"]`).eq(elementIndex).should('be.visible').click();
        cy.get('.gantt_grid_data').click();
        cy.wait(6000);
        cy.xpath(`//span[@class="gantt-task-name-text" and text()="${taskname}"]`).eq(elementIndex).should('be.visible').rightclick();
        cy.get(menu).click();
        cy.xpath(`//div[text()="${label}"]`).should('be.visible');
        cy.get(input).click().type(value);
        cy.wait(500);
        if (fieldType === 'location') {
            cy.get(option).contains('span', value).click();
        } else {
            cy.get(option).click();
        }
        cy.xpath('//button[text()="Update"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        });
        cy.xpath('//button[text()="Update"]').click();
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), success, success);
        });
        cy.get('.msgtoaster__text').should('not.exist');
        cy.wait(1000);
    }

    clickAndUpdateAllMatchingTasks(taskName, assignee) {
        cy.wait(3000)
        cy.log(taskName)
        const taskXpath = `//span[(contains(@class,"gantt-grid-cell-text") or contains(@class,"gantt-task-name-text")) and text()="${taskName}"]`;
    
    // First click to select the first matching task
        cy.xpath(taskXpath)
        .first()
        .click({force: true})
    
    cy.wait(1000)
    
    // Get the count of matching elements first
    cy.xpath(taskXpath)
        .its('length')
        .then((count) => {
            // Starting from index 1 (since first is already clicked)
            for (let i = 1; i < count; i++) {
                // Re-query the DOM each time to get fresh element references
                cy.xpath(taskXpath)
                    .eq(i)
                    .then(($el) => {
                        // Check if the parent row is already selected
                const $row = $el.closest('.gantt_row');
                        const isSelected = $row.hasClass('gantt_selected') || 
                                          $row.attr('aria-selected') === 'true';
                        
                if (!isSelected) {
                    cy.wrap($el).click({ ctrlKey: true, force: true });
                    cy.wait(3000);
                } else {
                    cy.log('Already selected, skipping click');
                }
            });
            }
        });
    
        // Now update all fields for this task
        this.updateFieldsAfterMultiSelect(taskName, assignee);
    }

    updateFieldsAfterMultiSelect(taskName, assignee) {
        const taskXpath = `//span[(contains(@class,"gantt-grid-cell-text") or contains(@class,"gantt-task-name-text")) and text()="${taskName}"]`;
        // Configuration for each field type
        const config = {
            assignee: {
                menu: '[data-testid=ProjectPlan-Menu-assignee]',
                label: 'Assignee',
                input: "[id='user-usergroup-search']",
                option: '.singleUserSelect__option__list__item',
                success: 'Updated successfully'
            },
            location: {
                menu: '[data-testid=ProjectPlan-Menu-location]',
                label: 'Location',
                input: "[id='projectLocation-search']",
                option: '.projectLocation__option__list__item',
                success: 'Location Updated successfully'
            },
            usergroup: {
                menu: '[data-testid=ProjectPlan-Menu-userGroup]',
                label: 'User Group',
                input: "[id='user-usergroup-search']",
                option: '.userGroupSelect__option__list__item',
                success: 'User groups Updated Successfully'
            },
            classification: {
                menu: '[data-testid=ProjectPlan-Menu-classifyCode]',
                label: 'Classification Code',
                input: ".edit-task-details-view-productivity__list__searchbox",
                option: '.productivitycode__option__list__item',
                success: 'Updated successfully'
            }
        };

        // Helper to update a single field
        const updateField = (fieldType, value) => {
            // Always right-click before updating to open the menu
            cy.xpath(taskXpath).first().rightclick();
            const { menu, label, input, option, success } = config[fieldType];
            cy.get(menu).click();
            cy.xpath(`//div[text()="${label}"]`).should('be.visible');
            cy.get(input).click().type(value);
            cy.wait(500);
            if (fieldType === 'location') {
                cy.get(option).contains('span', value).click();
            } else {
                cy.get(option).click();
            }
            cy.xpath('//button[text()="Update"]').should(($button)=>{
                expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
            });
            cy.xpath('//button[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), success, success);
            });
            cy.get('.msgtoaster__text').should('not.exist');
            cy.wait(1000);
        };

        // Update all fields in sequence for the single taskName, right-clicking before each
        updateField('assignee', assignee);
        updateField('location', 'building1');
        updateField('usergroup', 'design');
        updateField('classification', 'Concrete');
    }

    attachFileToDataTab(fileName) {
        cy.get('div.file-attachment__dropZone--white input[type="file"]')
          .attachFile(fileName, { subjectType: 'input' });
    }
    captureAlwaysOverwriteValuesBeforeReupload(taskName, elementIndex) {
        let columnNames = ['plannedStartDate','plannedEndDate','recentBaselineStartDate','recentBaselineEndDate','recentBaselineDuration']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text)=>{
                    if(column === 'plannedStartDate' || column === 'plannedEndDate' ||column === 'baselineStartDate'|| column === 'baselineEndDate'){
                        nameValues[column]=text.trimEnd()
                    }else{
                        nameValues[column]=text.split(/\s+/)[0]
                    }
                })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            return cy.wrap(nameValues).as('alwaysOverwriteValuesBeforeReupload')
        })
        cy.wait(5000)
    }

    addCompanyName(companyName){
        cy.get('[data-testid="edit-task-details-add-assignee"]').contains('Add Responsible Company').click()
        cy.get('[id="supplier-searchbox"]').type(companyName)
        // cy.get('[data-testid="supplier-select-btn-edit"]').click()
        // cy.get('[data-testid="supplier-search"]').type(companyName)
        cy.get('.supplier-select__option__single__option').first().click({force:true})
    }
    captureAlwaysRetainedValuesBeforeReupload(taskName, elementIndex){
        let columnNames = ['typeName','assigneeName','userGroupName','projectTaskLocationAssociationsName','classificationCodeName','predecessor']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text)=>{
                        nameValues[column]=text.trim()
                })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            return cy.wrap(nameValues).as('alwaysRetainedValuesBeforeReupload')
        })
        cy.wait(5000)
    }
    captureOverwriteWhenSelectedValuesBeforeReupload(taskName, elementIndex = 1){
        let columnNames = ['actualStartDate','actualEndDate','estimatedEndDate','progress','status']
        let nameValues = {}
        cy.wrap({}).then(()=>{
            columnNames.forEach((column) => {
                cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text)=>{
                        nameValues[column]=text.trim()
                })
            })
        }).then(()=>{
            cy.log(JSON.stringify(nameValues))
            return cy.wrap(nameValues).as('overwriteWhenSelectedValuesBeforeReupload')
        })
        cy.wait(5000) 
    }
    captureAlwaysRetainedValuesInTaskDetailsBeforeReupload(taskName){
        // Check if the breadcrumb button is present and visible
        cy.get('button.edit-task-details__title__breadcrumb__btn').should('be.visible');
        this.selectTaskDetailTab('variances',' Variances');
        // Verify that the table contains exactly one td with text 'variance01'
        cy.get('table.edit-task-detail-view__variances__data__table')
          .find('td')
          .contains('variance01')
          .should('exist');
        cy.get('table.edit-task-detail-view__variances__data__table')
          .find('td')
          .then($tds => {
            // Only one td with variance01 should be present
            const count = $tds.filter((i, el) => el.innerText.trim() === 'variance01').length;
            expect(count).to.equal(1);
          });
        // Now select Constraints tab and verify constraints01
        this.selectTaskDetailTab('constraints',' Constraints');
        cy.get('div.edit-task-detail-view__constraints[data-testid="edit-task-details-view-constraints-component"]')
          .find('span.edit-task-detail-view__constraints__data__body__item__name-text-hiperlink')
          .contains('constraints01')
          .should('exist');
        cy.get('div.edit-task-detail-view__constraints[data-testid="edit-task-details-view-constraints-component"]')
          .find('span.edit-task-detail-view__constraints__data__body__item__name-text-hiperlink')
          .then($spans => {
            const count = $spans.filter((i, el) => el.innerText.trim() === 'constraints01').length;
            expect(count).to.equal(1);
          });
        // Now select Data tab and verify attachments and links
        this.selectTaskDetailTab('data',' Data');
        // Verify Attachments section has exactly one attachment
        cy.get('table.photo-table__table tbody.photo-table__table__body tr')
          .should('have.length', 1);
        // Verify Links section has a row with 'RFI: constraints01'
        cy.get('table.edit-task-details-view-data__links-data__form__table')
          .find('span')
          .contains('RFI: constraints01')
          .should('exist');
        // Verify Responsible Company is set to Release-Test
        cy.get('span.supplier-select__contractorname').should('have.text', 'Release-Test');
        this.closeTaskDetails()
    }

    compareOverwriteValuesAfterReupload(taskName, elementIndex) {
        cy.get('@alwaysOverwriteValuesBeforeReupload').then((beforeValues) => {
            let columnNames = ['plannedStartDate','plannedEndDate','recentBaselineStartDate','recentBaselineEndDate','recentBaselineDuration'];
            let afterValues = {};
            cy.wrap({}).then(() => {
                columnNames.forEach((column) => {
                    cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text) => {
                        afterValues[column] = text.trim();
                    });
                });
            }).then(() => {
                cy.log('Before values:', JSON.stringify(beforeValues));
                cy.log('After values:', JSON.stringify(afterValues));
                columnNames.forEach((column) => {
                    expect(afterValues[column], `Value for ${column} should be different after reupload`).to.not.equal(beforeValues[column]);
                });
            });
        });
    }

    compareAlwaysRetainedValuesAfterReupload(taskName, elementIndex) {
        cy.get('@alwaysRetainedValuesBeforeReupload').then((beforeValues) => {
            let columnNames = [
                'typeName',
                'assigneeName',
                'userGroupName',
                'projectTaskLocationAssociationsName',
                'classificationCodeName',
                'predecessor'
            ];
            let afterValues = {};
            cy.wrap({}).then(() => {
                columnNames.forEach((column) => {
                    cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text) => {
                        afterValues[column] = text.trim();
                    });
                });
            }).then(() => {
                cy.log('Before values:', JSON.stringify(beforeValues));
                cy.log('After values:', JSON.stringify(afterValues));
                columnNames.forEach((column) => {
                    if (column === 'predecessor') {
                        expect(afterValues[column], `Predecessor should be '138FS' after reupload`).to.equal('22FS');
                    } else {
                        expect(afterValues[column], `Value for ${column} should be retained after reupload`).to.equal(beforeValues[column]);
                    }
                });
            });
        });
    }
    compareOverwriteWhenSelectedValuesAfterReupload(taskName, elementIndex) {
        cy.get('@overwriteWhenSelectedValuesBeforeReupload').then((beforeValues) => {
            let columnNames = [
                'actualStartDate',
                'actualEndDate',
                'estimatedEndDate',
                'progress',
                'status'
            ];
            let afterValues = {};
            cy.wrap({}).then(() => {
                columnNames.forEach((column) => {
                    cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text) => {
                        afterValues[column] = text.trim();
                    });
                });
            }).then(() => {
                cy.log('Before values:', JSON.stringify(beforeValues));
                cy.log('After values:', JSON.stringify(afterValues));
                columnNames.forEach((column) => {
                    expect(afterValues[column], `Value for ${column} should be retained after reupload (no overwrite)`).to.equal(beforeValues[column]);
                });
            });
        });
    }
    compareOverwriteWhenSelectedValuesAfterReuploadWithTrue(taskName,elementIndex){
        cy.get('@overwriteWhenSelectedValuesBeforeReupload').then((beforeValues) => {
            let columnNames = [
                'actualStartDate',
                'actualEndDate',
                'estimatedEndDate',
                'progress',
                'status'
            ];
            let afterValues = {};
            cy.wrap({}).then(() => {
                columnNames.forEach((column) => {
                    cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text) => {
                        afterValues[column] = text.trim();
                    });
                });
            }).then(() => {
                cy.log('Before values:', JSON.stringify(beforeValues));
                cy.log('After values:', JSON.stringify(afterValues));
                columnNames.forEach((column) => {
                    expect(afterValues[column], `Value for ${column} should be retained after reupload (no overwrite)`).to.not.equal(beforeValues[column]);
                });
            });
        });
    }
    verifyNoOfTasks(numberOfTasks){
        cy.get("@getTasks").then((req)=>{
            cy.wrap(req.response.body.data).should("have.property","tasks")
            cy.log(req.response.body.data.tasks.length)
            expect(req.response.body.data.tasks.length).to.be.eq(numberOfTasks)
            cy.log("Schedule only contains single task")
        })
    }

    captureVarianceDetailsForReports(taskName,elementIndex){
        // Check if the breadcrumb button is present and visible
        cy.get('button.edit-task-details__title__breadcrumb__btn').should('be.visible');
        this.selectTaskDetailTab('variances',' Variances');
        
        // Capture variance details and task values, then create unified array
        cy.get('table.edit-task-detail-view__variances__data__table').then($table => {
            const varianceDetails = [];
            
            // Get all rows in the table body
            cy.wrap($table).find('tr.edit-task-detail-view__variances__data__table__body__row').each(($row) => {
                const title = $row.find('td.edit-task-detail-view__variances__data__table__body__row__td-1').text().trim();
                const category = $row.find('td.edit-task-detail-view__variances__data__table__body__row__td-2').text().trim();
                const delay = $row.find('td.edit-task-detail-view__variances__data__table__body__row__td-4').text().trim();
                
                varianceDetails.push({
                    title: title,
                    category: category,
                    delay: delay
                });
            }).then(() => {
                // Close task details
                this.closeTaskDetails();
                cy.wait(5000);
                
                // Capture task values (serialNumber and status)
                this.selectAdditionalColumns(['Status']);
                let columnNames = ['serialNumber','status'];
                let nameValues = {};
                
                cy.wrap({}).then(() => {
                    columnNames.forEach((column) => {
                        // First find the row at elementIndex, then find the column within that specific row
                        cy.xpath(`(//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div)[${elementIndex + 1}]//div[@data-column-name="${column}"]//div`)
                            .first()
                            .invoke('text')
                            .then((text) => {
                                nameValues[column] = text.trim();
                            });
                    });
                }).then(() => {
                    // Create unified array matching report table structure
                    const unifiedReportData = [];
                    
                    varianceDetails.forEach((variance) => {
                        // Create array in order: [ID, Activity Name, Activity Status, Variance Title, Category, Delay(days)]
                        const reportRow = [
                            nameValues.serialNumber,       // ID
                            taskName,                      // Activity Name
                            nameValues.status,             // Activity Status
                            variance.title,                // Variance Title
                            variance.category,             // Category
                            variance.delay                 // Delay(days)
                        ];
                        
                        unifiedReportData.push(reportRow);
                        cy.log(`Created report row: [${reportRow.join(', ')}]`);
                    });
                    
                    // Store only the final unified data
                    cy.wrap(unifiedReportData).as('unifiedReportData');
                    cy.log('Unified report data created:', JSON.stringify(unifiedReportData));
                });
            });
        });
        
        cy.wait(10000) 
    }
    captureTaskValuesForReports([...taskNames]) {
        /**
         * Previous implementation used `.eq(index)` on separate XPath queries
         * for each column. If the column DOM structure differed (extra wrappers,
         * hidden rows, etc.), the indexes drifted and we ended up mixing cell
         * values from different rows.
         *
         * This version walks *each matching row* and then queries its child
         * cells, guaranteeing that all values for a given row stay aligned.
         */

        // Ensure the necessary columns are visible first
        this.selectAdditionalColumns([
            'Assignee',
            'Planned Start Date',
            'Planned End Date',
            'Baseline Start Date',
            'Baseline End Date',
            'Actual Start Date',
            'Actual End Date',
            'Progress'
        ]);

        const allTaskValues = [];

        // Helper to capture values for a single task name
        const captureForTaskName = (taskName) => {
            cy.log(`Capturing task values for: ${taskName}`);

            // Apply the activity name filter so only rows for this task are present/visible
            this.searchTaskByName(taskName);

            // Select each matching row and read its cells in that row context
            cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div`)
                .each(($row, rowIndex) => {
                    const getCellText = (columnName) =>
                        cy.wrap($row)
                            .find(`div[data-column-name="${columnName}"] > div`)
                            .invoke('text')
                            .then(t => (t || '').trim());

                    const values = {};

                    // Collect all needed columns for this physical row
                    cy.wrap(null).then(() => {
                        return getCellText('serialNumber').then(text => { values.serialNumber = text; });
                    }).then(() => {
                        // activity name is just the taskName we filtered by
                        values.text = taskName;
                        return getCellText('assigneeName').then(text => { values.assigneeName = text; });
                    }).then(() => {
                        return getCellText('plannedStartDate').then(text => { values.plannedStartDate = text; });
                    }).then(() => {
                        return getCellText('plannedEndDate').then(text => { values.plannedEndDate = text; });
                    }).then(() => {
                        return getCellText('recentBaselineStartDate').then(text => { values.recentBaselineStartDate = text; });
                    }).then(() => {
                        return getCellText('recentBaselineEndDate').then(text => { values.recentBaselineEndDate = text; });
                    }).then(() => {
                        return getCellText('actualStartDate').then(text => { values.actualStartDate = text; });
                    }).then(() => {
                        return getCellText('actualEndDate').then(text => { values.actualEndDate = text; });
                    }).then(() => {
                        return getCellText('progress').then(text => { values.progress = text; });
                    }).then(() => {
                        const taskRow = [
                            values.serialNumber || '',          // ID
                            values.text || taskName,            // Activity Name
                            values.assigneeName || '',          // Assignee
                            values.plannedStartDate || '',      // Planned Start
                            values.plannedEndDate || '',        // Planned End
                            values.recentBaselineStartDate || '', // Baseline Start
                            values.recentBaselineEndDate || '',   // Baseline Finish
                            values.actualStartDate || '',       // Actual Start
                            values.actualEndDate || '',         // Actual End
                            '-',                                // Delay (kept as '-')
                            values.progress || ''               // % Complete
                        ];

                        allTaskValues.push(taskRow);
                        cy.log(`Captured task ${rowIndex + 1} for ${taskName}: [${taskRow.join(', ')}]`);
                    });
                });
        };

        // Process each task name sequentially to keep Cypress chain sane
        cy.wrap(null)
            .then(() => {
                taskNames.forEach(taskName => {
                    captureForTaskName(taskName);
                });
            })
            .then(() => {
                cy.wrap(allTaskValues).as('taskValuesForReports');
                cy.log(`Final taskValuesForReports: ${JSON.stringify(allTaskValues)}`);
            })
            .then(() => {
                // Deselect the additional columns to clean up UI
                this.deselectAdditionalColumns([
                    'Assignee',
                    'Planned Start Date',
                    'Planned End Date',
                    'Baseline Start Date',
                    'Baseline End Date',
                    'Actual Start Date',
                    'Actual End Date',
                    'Progress'
                ]);
            });
    }

    copypasteTask(){
        // cy.xpath(`//span[@class="gantt-grid-cell-text" and text()="Roof Final Inspection"]`).first().rightclick();
        // cy.get('ul.MuiMenu-list').contains('Copy').click();
        // cy.xpath('//span[@class="gantt-grid-cell-text" and text()="Roof Final Inspection"]/ancestor::div[contains(@class,"gantt_row_task")]/preceding-sibling::div[contains(@class,"gantt_row_wbs")]').first().rightclick()

        cy.get('div.gantt_tree_content').contains('Roof Soffit').first().rightclick()
        cy.get('ul.MuiMenu-list').contains('Copy').click();
        // cy.get('div.gantt_tree_content').contains('Roof Final Inspection').first().then(($ele)=>{
        //     cy.wrap($ele).find('.gantt_cell .gantt_tree_content').eq(0).invoke('text').then( (textval) => {
        //         let taskid = textval
        //         cy.log(`id - ${taskid}`)
        //         return cy.wrap(taskid).as('taskid')
        //     })  
        // })
        cy.get('div.gantt_tree_content').contains('Roof Soffit').first().parents('.gantt_row_task').prevAll('.gantt_row_wbs').first().then(($ele)=>{
            cy.wrap($ele).find('.gantt_cell .gantt_tree_content').eq(0).invoke('text').then( (textval) => {
                let beforewbsid = textval
                cy.log(`id - ${beforewbsid}`)
                return cy.wrap(beforewbsid).as('beforewbsid')
            })  
        })
        this.clearTaskFilter()
        cy.get('@beforewbsid').then((wbsid)=>{
        this.scrollUntilWbsVisible(wbsid)

        // Use XPath approach to find the specific WBS row
        cy.xpath(`//div[contains(@class,"gantt_row_wbs")][div[@data-column-name="serialNumber"]/div[normalize-space(text())="${wbsid}"]]`)
          .first()
          .scrollIntoView()
          .click({force:true})
        
        // Wait for DOM to stabilize after click
        cy.wait(1000)
        
        // Scroll down a bit more to ensure next WBS row is visible
        cy.get('.gantt_ver_scroll').scrollTo(0, '10%', { ensureScrollable: false, duration: 1000 });
        cy.wait(500);
        
        // Re-query to find the next WBS row after the one we clicked
        cy.xpath(`//div[contains(@class,"gantt_row_wbs")][div[@data-column-name="serialNumber"]/div[normalize-space(text())="${wbsid}"]]`)
          .first()
          .nextAll('.gantt_row_wbs')
          .first()
          .then(($ele) => {
            cy.wrap($ele).find('.gantt_cell .gantt_tree_content').eq(0).invoke('text').then( (textval) => {
                let id = textval
                cy.log(`id - ${id}`)
                return cy.wrap(id).as('nextwbs')
            })  
          })
        })
        this.searchTaskByName('Roof Soffit')
        // cy.get('@beforepaste')
        cy.get('div.gantt_tree_content').contains('Roof Soffit').first().parents('.gantt_row_task').prevAll('.gantt_row_wbs').first().rightclick()
        cy.get('ul.MuiMenu-list').contains('Paste').click();
        this.savePlan()
    }

    getFloatIncrement(){                        //Dynamically calculating float increment
        cy.getDate(-4, 'CA').then(startDate => {
            cy.getWorkingDaysBetweenDates('2026-03-09', startDate)
              .as('floatIncrement')
        })
    }

    clearTaskFilter(){
        cy.wait(3000)
        // Click on the activity name filter input to open the dropdown
        cy.get('div[data-testid="filter-activity-name"] input[id="gantt-activity-name-filter"]').click({force:true})
        
        // Wait for the dropdown menu to be visible
        cy.get('ul.MuiList-root.MuiMenu-list').should('be.visible')
        
        // Type the task name in the search field
        cy.get('input[data-testid="activity-name-search"][placeholder="Search activity by name"]')
            .should('be.visible')
            .clear()
        
        // Click on the overlay to close the popover
        cy.get('.MuiPopover-root > div[aria-hidden="true"]').click({ force: true })
        cy.wait(3000)
    }

    scrollUntilWbsVisible(wbsid, maxTries = 20, currentTry = 0) {
        cy.get('.gantt_row_wbs .gantt_cell[data-column-name="serialNumber"] .gantt_tree_content').then($cells => {
          const found = Array.from($cells).some(cell => cell.innerText.trim() === wbsid);
          if (found) {
            cy.log(`Found WBS with serial: ${wbsid}`);
            cy.get('.gantt_row_wbs').filter((i, el) => {
              return Cypress.$(el)
                .find('.gantt_cell[data-column-name="serialNumber"] .gantt_tree_content')
                .text()
                .trim() === wbsid;
            })
          } else if (currentTry < maxTries) {
            // Scroll more aggressively to find higher numbered WBS rows
            const $verScroll = Cypress.$('.gantt_ver_scroll')
            if ($verScroll.length > 0) {
                cy.get('.gantt_ver_scroll').scrollTo(0, `${(currentTry + 1) * 5}%`, { ensureScrollable: false })
            } else {
                // Fallback: scroll the gantt grid container if the dedicated scrollbar isn't present.
                cy.get('.gantt_grid_data').then($grid => {
                    if ($grid[0]) $grid[0].scrollTop += 250
                })
            }
            cy.wait(1000);
            this.scrollUntilWbsVisible(wbsid, maxTries, currentTry + 1);
          } else {
            throw new Error(`WBS with serial ${wbsid} not found after ${maxTries} scroll attempts`);
          }
        });
    }

    scrollUntilTaskIdVisible(taskId, maxTries = 30, currentTry = 0) {
        // Try to find the task row by task_id or data-task-id
        cy.get('.gantt_row_task .gantt_cell[data-column-name="serialNumber"] .gantt_tree_content').then($cells => {
          const found = Array.from($cells).some(cell => cell.innerText.trim() === taskId);
          if (found) {
            cy.log(`Found Task with serial: ${taskId}`);
            cy.get('.gantt_row_task').filter((i, el) => {
              return Cypress.$(el)
                .find('.gantt_cell[data-column-name="serialNumber"] .gantt_tree_content')
                .text()
                .trim() === taskId;
            })
          } else if (currentTry < maxTries) {
            // Scroll more aggressively to find higher numbered WBS rows
            const $verScroll = Cypress.$('.gantt_ver_scroll')
            if ($verScroll.length > 0) {
                cy.get('.gantt_ver_scroll').scrollTo(0, `${(currentTry + 1) * 5}%`, { ensureScrollable: false })
            } else {
                // Fallback: scroll the gantt grid container if the dedicated scrollbar isn't present.
                cy.get('.gantt_grid_data').then($grid => {
                    if ($grid[0]) $grid[0].scrollTop += 250
                })
            }
            cy.wait(1000);
            this.scrollUntilTaskIdVisible(taskId, maxTries, currentTry + 1);
          } else {
            throw new Error(`Task with serial ${taskId} not found after ${maxTries} scroll attempts`);
          }
        });
    }
    verifyIdofTaskPasted(){
        // Find the 2nd occurrence (index 1) of the task name and read its ID from serialNumber column
        const taskName = 'Roof Soffit'
        //click on Expand/Collapse button
        cy.get('[title="Collapse"]').click({force:true})
        cy.get('[title="Expand"]').click({force:true})
        // Ensure at least two matches are present in DOM (may require scrolling/searching beforehand)
        cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]`)
          .should($els => {
            expect($els.length, 'at least two matching task rows').to.be.gte(2)
          })
          .eq(1) // second match (0-based)
          .parents('.gantt_row')
          .find('.gantt_cell[data-column-name="serialNumber"] .gantt_tree_content')
          .invoke('text')
          .then((idText) => {
            const secondId = idText.trim()
            cy.log(`Second occurrence ID - ${secondId}`)
            cy.wrap(secondId).as('secondOccurrenceTaskId')
          })
          .then(() => {
            // Compare nextWbsId (captured earlier) with the second occurrence's ID
            cy.get('@nextwbs').then((nextWbsId) => {
              cy.get('@secondOccurrenceTaskId').then((taskid) => {
                cy.log(`Comparing nextWbsId(${nextWbsId}) with taskid(${taskid})`)
                expect(String(nextWbsId).trim()).to.eq(String(taskid).trim())
              })
            })
          })
    }
    selectTaskByNameAndId(taskName, serialId){
        // Optionally narrow results by name using the existing search
        this.searchTaskByName(taskName)
        this.scrollUntilTaskIdVisible(serialId)
        // Find the row that matches BOTH the task name and the serial ID, then click it
        cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${serialId}"]]`)
          .should('exist')
          .first()
          .scrollIntoView()
          .click({force:true})
    }

    // captureTaskColumnValues(taskName, serialId, expectedValues){
    //     let columnLabels = [
    //         'Planned Start Date',
    //         'Planned End Date',
    //         'Planned Duration',
    //         'Actual Start Date',
    //         'Actual End Date',
    //         'Actual Duration',
    //         'Estimated End',
    //         'Estimated Duration',
    //         'Type',
    //         'Total Float',
    //         'Assignee',
    //         'Responsible Company',
    //         'Progress',
    //         'User Group',
    //         'Status',
    //         'Location',
    //         'Baseline Start Date',
    //         'Baseline End Date',
    //         'Baseline Duration',
    //         'Classification Code',
    //         'Predecessor'
    //     ]
    //     // Map from UI menu label to grid data-column-name
    //     const labelToColumnKey = {
    //         'Planned Start Date': 'plannedStartDate',
    //         'Planned End Date': 'plannedEndDate',
    //         'Planned Duration': 'plannedDuration',
    //         'Actual Start Date': 'actualStartDate',
    //         'Actual End Date': 'actualEndDate',
    //         'Actual Duration': 'actualDuration',
    //         'Estimated End': 'estimatedEndDate',
    //         'Estimated Duration': 'estimatedDuration',
    //         'Type': 'typeName',
    //         'Total Float': 'floatValue',
    //         'Assignee': 'assigneeName',
    //         'Responsible Company': 'responsibleCompany',
    //         'Progress': 'progress',
    //         'User Group': 'userGroupName',
    //         'Status': 'status',
    //         'Location': 'projectTaskLocationAssociationsName',
    //         'Baseline Start Date': 'recentBaselineStartDate',
    //         'Baseline End Date': 'recentBaselineEndDate',
    //         'Baseline Duration': 'recentBaselineDuration',
    //         'Classification Code': 'classificationCodeName',
    //         'Predecessor': 'predecessor'
    //     }
        
    //     // Ensure columns are visible via the existing helper
    //     this.selectAdditionalColumns([...columnLabels])
        
    //     // Narrow down to the exact row (taskName + ID)
    //     this.selectTaskByNameAndId(taskName, serialId)
        
    //     // Build values object in the same order as requested labels
    //     const values = {}
        
    //     cy.wrap(null).then(() => {
    //         columnLabels.forEach((label) => {
    //             const columnKey = labelToColumnKey[label]
    //             if(!columnKey){
    //                 throw new Error(`Unknown column label: ${label}`)
    //             }
    //             cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${serialId}"]]//div[@data-column-name="${columnKey}"]//div`)
    //                 .invoke('text')
    //                 .then((text) => {
    //                     values[columnKey] = (text || '').trim()
    //                 })
    //         })
    //     }).then(() => {
    //         cy.log(`Captured values for ${taskName} (${serialId}): ${JSON.stringify(values)}`)
    //         cy.wrap(values).as('capturedTaskColumnValues')

    //         if (Array.isArray(expectedValues)) {
    //             // Build an array of captured values in the same order as columnLabels
    //             const capturedArray = columnLabels.map(lbl => values[labelToColumnKey[lbl]] ?? '')
    //             cy.log(`Expected: ${JSON.stringify(expectedValues)}`)
    //             cy.log(`Actual  : ${JSON.stringify(capturedArray)}`)

    //             // Assert length matches first for clear error messaging
    //             expect(capturedArray.length, 'number of captured columns').to.equal(expectedValues.length)

    //             // Compare each element
    //             capturedArray.forEach((actual, idx) => {
    //                 const expected = (expectedValues[idx] ?? '').toString().trim()
    //                 const normalizedActual = (actual ?? '').toString().trim()
    //                 expect(normalizedActual, `mismatch at index ${idx} (${columnLabels[idx]})`).to.equal(expected)
    //             })
    //         }
    //     })
    // }

    // Lighter approach: assert per column by toggling its visibility to reduce DOM work
    assertTaskColumnValuesSequential(taskName, serialId, expectedValues){
        // const expectedValues = [
        //     '12-Jun-25','12-Jun-25','1 day','-','-','',
        //     '-','','Task','99','-','-','0','',
        //     'To Do','','-','-','','',''
        // ]
        const columnLabels = [
            'Planned Start Date',
            'Planned End Date',
            'Planned Duration',
            'Actual Start Date',
            'Actual End Date',
            'Actual Duration',
            'Estimated End',
            'Estimated Duration',
            'Type',
            'Total Float',
            'Assignee',
            'Responsible Company',
            'Progress',
            'User Group',
            'Status',
            'Location',
            'Baseline Start Date',
            'Baseline End Date',
            'Baseline Duration',
            'Classification Code',
            'Predecessor'
        ]

        const labelToColumnKey = {
            'Planned Start Date': 'plannedStartDate',
            'Planned End Date': 'plannedEndDate',
            'Planned Duration': 'plannedDuration',
            'Actual Start Date': 'actualStartDate',
            'Actual End Date': 'actualEndDate',
            'Actual Duration': 'actualDuration',
            'Estimated End': 'estimatedEndDate',
            'Estimated Duration': 'estimatedDuration',
            'Type': 'typeName',
            'Total Float': 'floatValue',
            'Assignee': 'assigneeName',
            'Responsible Company': 'responsibleCompany',
            'Progress': 'progress',
            'User Group': 'userGroupName',
            'Status': 'status',
            'Location': 'projectTaskLocationAssociationsName',
            'Baseline Start Date': 'recentBaselineStartDate',
            'Baseline End Date': 'recentBaselineEndDate',
            'Baseline Duration': 'recentBaselineDuration',
            'Classification Code': 'classificationCodeName',
            'Predecessor': 'predecessor'
        }

        // Basic guard
        if (!Array.isArray(expectedValues) || expectedValues.length !== columnLabels.length) {
            throw new Error(`expectedValues must be an array of length ${columnLabels.length}`)
        }

        // Iterate sequentially per column to keep DOM light
        columnLabels.forEach((label, idx) => {
            const columnKey = labelToColumnKey[label]
            const expected = (expectedValues[idx] ?? '').toString().trim()

            this.selectAdditionalColumns([label])
            this.selectTaskByNameAndId(taskName, serialId)

            cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${serialId}"]]//div[@data-column-name="${columnKey}"]//div`)
            .last()         //To prevent matching multiple divs and concatenating the texts inside them
            .invoke('text')
              .then((text) => {
                cy.log(text)
                  const actual = (text ?? '').toString().trim()
                  expect(actual, `Column ${label} should match`).to.contain(expected)
              })

            this.deselectAdditionalColumns([label])
        })
    }
    rightClickAndUpdateUsergroup(taskName,serialId,fieldType,value){
        const config = {
        usergroup: {
            menu: '[data-testid="ProjectPlan-Menu-userGroup"]',
            label: 'User Group',
            input: "[id='user-usergroup-search']",
            option: '.userGroupSelect__option__list__item',
            success: 'User groups Updated Successfully'
        }}
        const { menu, label, input, option, success } = config[fieldType];
        this.selectTaskByNameAndId(taskName,serialId)
        // Always right-click before updating to open the menu
        cy.xpath(`//div[@class="gantt_cell gantt_cell_tree" and normalize-space(@aria-label)="${taskName}"]/parent::div[div[@data-column-name="serialNumber"]/div[normalize-space(text())="${serialId}"]]`)
          .should('exist')
          .first().rightclick();
        cy.get(menu).click();
        cy.xpath(`//div[text()="${label}"]`).should('be.visible');
        cy.get(input).click().type(value);
        cy.wait(500)
        cy.get(option).click();
        cy.xpath('//button[text()="Update"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        });
        cy.xpath('//button[text()="Update"]').click();
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), success, success);
        });
        cy.get('.msgtoaster__text').should('not.exist');
        cy.wait(1000);
    }

    updatePlannedStartDateAfterSearchingTaskByID(taskID,daysOffset = 7){
        this.scrollUntilTaskIdVisible(taskID)
        let startDate
        cy.getDate(daysOffset,'CA').then((Sdate)=>{
            startDate = Sdate
            cy.wait(5000)
            cy.log("task name sent here is "+taskID)
            cy.log("planned start date is "+startDate)
            cy.xpath(`//div[@class ="gantt_cell" and @aria-label="${taskID}"]/parent::div//div[@data-column-name="plannedStartDate"]//div`).click()
            cy.get('[name="plannedStartDate"').type(startDate)
            cy.get('.gantt_grid_data').click()
            cy.wait(6000)
            this.pageelements.savePlanBtn().should('be.visible').click()
            cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
            }) 
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist') 
            cy.wait(6000)
        })
    }
    updateStatusOfTaskInSchedule(taskID,taskstatus){
        this.scrollUntilTaskIdVisible(taskID)
        cy.xpath(`//div[@class ="gantt_cell" and @aria-label="${taskID}"]/parent::div//div[@data-column-name="status"]//div`).click()
        cy.get('select[name="taskStatus"]').select(taskstatus)
        cy.get('.gantt_grid_data').click()
        cy.wait(6000)
        this.pageelements.savePlanBtn().should('be.visible').click()
        cy.interceptGraphQlRequest("getAllProjectAssociatedCalendar")
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Saved project plan successfully', 'Saved project plan successfully')
        }) 
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist') 
        cy.wait(6000)
    }
    /**
     * Resizes a gantt grid column by dragging its resize handle.
     * @param {string} columnName - The column name shown in the header aria-label (e.g., 'Activity Name', 'Planned Start Date').
     * @param {number} targetWidth - The desired column width in pixels.
     */
    resizeColumn(columnName, targetWidth) {
        cy.get(`div.gantt_grid_head_cell[aria-label*="${columnName}"]`)
            .should('exist')
            .then(($header) => {
                const columnId = $header.attr('column_id')
                cy.window().then((win) => {
                    const gantt = win.gantt
                    const column = gantt.config.columns.find(c => c.name === columnId)
                    if (column) {
                        const oldWidth = column.width || 0
                        const delta = targetWidth - oldWidth
                        // Expand the total grid width to accommodate the new column width
                        gantt.config.grid_width = (gantt.config.grid_width || 0) + delta
                        column.width = targetWidth
                        column.min_width = targetWidth
                        gantt.render()
                        cy.log(`Resized column "${columnName}" (${columnId}) to ${targetWidth}px | grid_width: ${gantt.config.grid_width}px`)
                    } else {
                        cy.log(`Column "${columnId}" not found in gantt.config.columns`)
                    }
                })
            })
    }

    // captureScheduleValuesToBeVerifiedInDL(taskName, ID) {
    //     let columnNames = ['plannedStartDate','plannedEndDate','plannedDuration','recentBaselineStartDate','recentBaselineEndDate','Actual Start Date','Progress','Status']
    //     let nameValues = {}
    //     cy.wrap({}).then(()=>{
    //         columnNames.forEach((column) => {
    //             cy.xpath(`//div[@class ="gantt_cell gantt_cell_tree" and @aria-label=" ${taskName} "]/parent::div//div[@data-column-name="${column}"]//div`).eq(elementIndex).invoke('text').then((text)=>{
    //             cy.xpath(`//div[@class ="gantt_cell" and @aria-label="${taskID}"]/parent::div//div[@data-column-name="${column}"]//div`).invoke('text').then((text)=>{
    //                 if(column === 'plannedStartDate' || column === 'plannedEndDate' ||column === 'baselineStartDate'|| column === 'baselineEndDate'){
    //                     nameValues[column]=text.trimEnd()
    //                 }else{
    //                     nameValues[column]=text.split(/\s+/)[0]
    //                 }
    //             })
    //         })
    //     }).then(()=>{
    //         cy.log(JSON.stringify(nameValues))
    //         return cy.wrap(nameValues).as('alwaysOverwriteValuesBeforeReupload')
    //     })
    //     cy.wait(5000)
    // }
    verifyWeatherTabInTaskDetails(){
        const normalizeNameKey = (s) => (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim()

        const readNumberInput = ($container) => {
            const v = $container.find('input[type="number"]').first().val()
            return v === undefined || v === null ? '' : String(v).trim()
        }

        const expectNumberLike = (uiVal, expectedVal, label) => {
            const expected = (expectedVal ?? '').toString().trim()
            const actual = (uiVal ?? '').toString().trim()
            if (expected === '') {
                // App may show 0 when threshold not applicable.
                expect(
                    actual === '' || actual === '0',
                    `${label} (expected empty; got "${actual}")`
                ).to.be.true
            } else {
                expect(actual, label).to.eq(expected)
            }
        }

        cy.fixture('weatherTemplateValues.json').then((templates) => {
            cy.get('.weather-activity').should('be.visible')
            cy.get('select#weather_template_type').should('be.visible')

            cy.get('select#weather_template_type option').then(($opts) => {
                const optionEls = Array.from($opts)
                // Skip the placeholder option (empty value)
                const templateNames = optionEls
                    .map((o) => ({ value: o.getAttribute('value') || '', text: (o.textContent || '').trim() }))
                    .filter((o) => o.value !== '' && o.text !== '')

                expect(templateNames.length, 'weather template dropdown options').to.be.greaterThan(0)

                // Validate each template against captured fixture
                templateNames.forEach(({ value, text }) => {
                    const key = text
                    const expected = templates[key]
                    expect(expected, `fixture has template '${key}'`).to.exist

                    cy.get('select#weather_template_type').select(value, { force: true })
                    cy.wait(300) // allow UI to update parameters

                    // Rain/Snow checkbox
                    cy.get('.weather-activity__parameter')
                        .contains('.weather-activity__parameter__label', 'Rain/Snow')
                        .parents('.weather-activity__parameter')
                        .find('input[type="checkbox"]')
                        .should(($cb) => {
                            const isChecked = $cb.prop('checked') === true
                            expect(isChecked, `${key} impactedByRainSnow`).to.eq(expected.impactedByRainSnow === true)
                        })

                    // Wind
                    cy.get('.weather-activity__parameter')
                        .contains('.weather-activity__parameter__label', 'Wind')
                        .parents('.weather-activity__parameter')
                        .find('.weather-activity__parameter__value')
                        .then(($c) => {
                            const uiVal = readNumberInput(Cypress.$($c))
                            expectNumberLike(uiVal, expected.windMph, `${key} windMph`)
                        })

                    // Wind Gust
                    cy.get('.weather-activity__parameter')
                        .contains('.weather-activity__parameter__label', 'Wind Gust')
                        .parents('.weather-activity__parameter')
                        .find('.weather-activity__parameter__value')
                        .then(($c) => {
                            const uiVal = readNumberInput(Cypress.$($c))
                            expectNumberLike(uiVal, expected.windGustMph, `${key} windGustMph`)
                        })

                    // Temperature (Min/Max inputs)
                    cy.get('.weather-activity__parameter')
                        .contains('.weather-activity__parameter__label', 'Temperature')
                        .parents('.weather-activity__parameter')
                        .find('input[type="number"]')
                        .should('have.length.at.least', 2)
                        .then(($inputs) => {
                            const minVal = String(Cypress.$($inputs[0]).val() ?? '').trim()
                            const maxVal = String(Cypress.$($inputs[1]).val() ?? '').trim()
                            expectNumberLike(minVal, expected.minTempF, `${key} minTempF`)
                            expectNumberLike(maxVal, expected.maxTempF, `${key} maxTempF`)
                        })
                })
            })
        })
    }

    verifyTagsTabInTaskDetails() {
        // Verify base container and label
        cy.get('.edit-task-details-view__tags').should('be.visible')
        cy.contains('.edit-task-details-view__tags__select-tag__container-tag-label', 'Associate Tag(s)').should('be.visible')

        const optionSelector = '.edit-task-details-view__tags__select-tag__container__form-control__select__option'
        const chipSelector = '.edit-task-details-view__tags__chip-container__chip'

        const closeDropdown = () => cy.get('body').click(0, 0)

        const removeAllChips = () => {
            cy.get('body').then($body => {
                const chips = $body.find(chipSelector)
                if (chips.length > 0) {
                    cy.wrap(chips[0]).find('.MuiChip-deleteIcon').click({ force: true })
                    removeAllChips()
                }
            })
        }

        // Open dropdown and capture a small sample of available tag names
        cy.get('[data-testid="tag-select"]').should('be.visible').click()
        cy.get(optionSelector)
            .should('have.length.greaterThan', 0)
            .then($options => {
                const allTagNames = Cypress._.map($options, el => {
                    return (el.querySelector('.MuiListItemText-primary')?.textContent || '').trim()
                }).filter(Boolean)
                const uniqueTagNames = Array.from(new Set(allTagNames)).slice(0, 3)
                expect(uniqueTagNames.length, 'at least one tag option').to.be.greaterThan(0)

                // Select only first 3 tags for faster execution
                uniqueTagNames.forEach(name => {
                    cy.get(optionSelector)
                        .contains('.MuiListItemText-primary', name)
                        .closest('li[role="option"]')
                        .within(() => {
                            cy.get('input[type="checkbox"]').check({ force: true })
                        })
                })

                closeDropdown()

                // Verify selected tags are shown as chips on page
                cy.get(`${chipSelector} .MuiChip-label`).should('have.length', uniqueTagNames.length)
                uniqueTagNames.forEach(name => {
                    cy.get(`${chipSelector} .MuiChip-label`).contains(name).should('be.visible')
                })

                // Re-open dropdown and verify selected tags are removed from selectable list
                cy.get('[data-testid="tag-select"]').click()
                cy.get('.MuiMenu-paper:visible').should('be.visible').within(() => {
                    uniqueTagNames.forEach(name => {
                        cy.contains(optionSelector, name).should('not.exist')
                    })
                })
                closeDropdown()

                // Remove selected chips and verify page has no selected tags
                removeAllChips()
                cy.get(chipSelector).should('not.exist')

                // Re-open dropdown and verify selected tags are back as unselected
                cy.get('[data-testid="tag-select"]').click()
                cy.get('.MuiMenu-paper:visible').should('be.visible').within(() => {
                    uniqueTagNames.forEach(name => {
                        cy.contains(optionSelector, name)
                            .find('input[type="checkbox"]')
                            .should('not.be.checked')
                    })
                })

                closeDropdown()
            })
    }
    verifyRelatedTasksTabInTaskDetails(){
        cy.get('.edit-task-details-view-related-task').should('be.visible')
        cy.get('.edit-task-details-view-related-task-heading')
            .should('be.visible')
            .and('have.text', 'Succeeding Tasks')

        // Verify table headers
        cy.get('.edit-task-details-view-related-task thead th')
            .should('have.length', 3)
            .then(($headers) => {
                const headers = [...$headers].map((h) => (h.textContent || '').trim())
                expect(headers, 'related task headers').to.deep.equal(['Name', 'Status', 'Relationship'])
            })

        // Verify at least one related task row is displayed
        cy.get('.edit-task-details-view-related-task__data__table-body tr')
            .should('have.length.at.least', 1)
            .first()
            .as('firstRelatedRow')

        // Validate content of the first row against test data
        cy.fixture('scheduleTestData.json').then((scheduleTestData) => {
            const expectedTaskName =
                scheduleTestData?.addTask1?.taskname || scheduleTestData?.addTask1 || 'task01'

            cy.get('@firstRelatedRow')
                .find('td')
                .eq(0)
                .invoke('text')
                .then((nameText) => {
                    expect(nameText.trim(), 'related task name').to.eq(expectedTaskName)
                })

            cy.get('@firstRelatedRow')
                .find('td')
                .eq(1)
                .invoke('text')
                .then((statusText) => {
                    expect(statusText.replace(/\s+/g, ' ').trim(), 'related task status').to.include('To-Do')
                })

            cy.get('@firstRelatedRow')
                .find('td')
                .eq(2)
                .invoke('text')
                .then((relationText) => {
                    expect(relationText.replace(/\s+/g, ' ').trim(), 'related task relationship').to.eq('Finish to Start')
                })
        })
    }
    verifyResourcesTabInTaskDetails(){
        cy.get('[data-testid="task_tab_links_resources"]').click()
        // Open add material popup from resources tab
        cy.get('body').then(($body) => {
            if ($body.find('[data-testid="edit-task-details-view-data-add-link"]').length > 0) {
                cy.get('[data-testid="edit-task-details-view-data-add-link"]').click({ force: true })
            } else {
                cy.contains('button span', 'Add Material').click({ force: true })
            }
        })

        cy.get('div[role="dialog"]').last().as('materialDialog')
        cy.get('@materialDialog').should('be.visible')
        cy.get('@materialDialog').find('h2').contains('Add Material').should('be.visible')
        cy.get('@materialDialog').find('input[data-testid="task-name"]')
            .should('be.visible')
            .and('have.attr', 'placeholder', 'Search')

        // Header validations
        cy.get('@materialDialog').find('thead th').then(($headers) => {
            const headers = [...$headers].map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim())
            expect(headers.join(' | '), 'resource add material headers')
                .to.include('Material')
                .and.to.include('ID')
                .and.to.include('Category')
                .and.to.include('Unit')
                .and.to.include('Type')
        })

        // Resolve footer add button inside popup (text may vary: Add Material/Add Materials)
        cy.get('@materialDialog').then(($dialog) => {
            const $preferred = $dialog.find('button.add-material-popup-footer-add-material')
            if ($preferred.length > 0) {
                cy.wrap($preferred.first()).as('addMaterialBtn')
            } else {
                cy.wrap($dialog)
                    .contains('button', /^Add Materials?$/)
                    .as('addMaterialBtn')
            }
        })

        // Add button is disabled before row selection
        cy.get('@addMaterialBtn').should('be.disabled')

        // Select both rows: Iron Bar + cement
        ;['Iron Bar', 'cement'].forEach((materialName) => {
            cy.get('@materialDialog')
                .contains('tbody tr', materialName)
                .should('be.visible')
                .within(() => {
                    cy.get('input[type="checkbox"]').first().check({ force: true })
                })
        })

        // Add button should be enabled after selection
        cy.get('@addMaterialBtn')
            .should('not.be.disabled')
            .click({ force: true })

        // Validate resources tab data after adding materials
        cy.get('.edit-task-details-view-resources__container').should('be.visible')
        cy.get('[data-testid="material-heading"]').should('have.text', 'Material')

        cy.get('.edit-task-details-view-resources__container-material__data__table-body')
            .should('be.visible')
            .within(() => {
                ;['Iron Bar', 'cement'].forEach((materialName) => {
                    cy.contains('tr', materialName).should('be.visible')
                })
            })

        // Validate key material table headers by partial text (UI truncates with ...)
        cy.get('.edit-task-details-view-resources__container-material__data-table-container thead th')
            .then(($headers) => {
                const headerText = [...$headers]
                    .map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim())
                    .join(' | ')
                expect(headerText).to.include('Material')
                expect(headerText).to.include('Quantity')
                expect(headerText).to.include('Total')
            })

        // Validate quantity inputs and unit labels are present for each added row
        ;['Iron Bar', 'cement'].forEach((materialName) => {
            cy.contains('.edit-task-details-view-resources__container-material__data__table-body-row', materialName)
                .should('be.visible')
                .within(() => {
                    cy.get('input[name="quantityAllocated"]').should('be.visible')
                    cy.get('input[name="quantityConsumed"]').should('be.visible')
                    cy.get('.edit-task-details-view-resources__container-material__data__table-body-cell-unit')
                        .should('have.length.at.least', 1)
                })
        })

        // +Add Material button should still be visible
        cy.contains('button', '+Add Material').should('be.visible')

        // Cost and carbon section validations
        cy.contains('.edit-task-details-view-resources__container-cost-code__heading', 'Cost').should('be.visible')
        cy.get('[data-testid="commitment-cost"]').should('be.visible')
        cy.get('[data-testid="payout-cost"]').should('be.visible')

        cy.contains('.edit-task-details-view-resources__container-cost-code__heading', 'Carbon').should('be.visible')
        cy.contains('label', 'Total Baseline EC (kgCO2e)').should('be.visible')
        cy.contains('label', 'Total Design EC (kgCO2e)').should('be.visible')
        cy.contains('.MuiTypography-root', '0.00').should('be.visible')
    }
    deleteResources(){
        const rowSelector = '.edit-task-details-view-resources__container-material__data__table-body-row'
        const deleteIconSelector = '.edit-task-details-view-resources__container-material__data__table-body-cell-delete'

        const deleteNextRow = () => {
            cy.get('body').then(($body) => {
                const rowCount = $body.find(rowSelector).length
                if (rowCount === 0) {
                    cy.log('No resource rows left to delete.')
                    return
                }

                // Delete one row at a time to avoid stale/click interception issues during rerender
                cy.get(rowSelector).first().within(() => {
                    cy.get(deleteIconSelector).should('be.visible').click({ force: true })
                })

                // Confirm only if confirmation dialog appears
                cy.get('body').then(($b) => {
                    if ($b.find('[data-testid="confirm-action"]').length > 0) {
                        cy.get('[data-testid="confirm-action"]').click({ force: true })
                    }
                })

                // Wait until table updates (row count reduces), then continue
                cy.get(rowSelector, { timeout: 10000 }).should(($rows) => {
                    expect($rows.length).to.be.lessThan(rowCount)
                })
                deleteNextRow()
            })
        }

        deleteNextRow()
    }
}
export default schedulerPage;