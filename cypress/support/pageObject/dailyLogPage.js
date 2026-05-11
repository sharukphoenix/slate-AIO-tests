class dailyLogPage {
    pageelements={
        addDailyLogBtn: () => cy.xpath('//span[text()="Add Daily Log"]'),
        assignedActivitiesTitle: () => cy.xpath('//h5[text()="Activities to Update"]'),
        dailyLogList: () => cy.xpath("//table[@aria-label='customized table']/tbody/tr/td[1]"),
        updateDailyLogBtn: () => cy.xpath('//span[text()="Update Daily Log"]')
        
    }

    /**
     * Sets the "Progress" field in the Daily Log popover/dialog.
     * The input type has changed between releases (number -> text), so we locate by label.
     */
    setDailyLogProgress(value) {
        cy.contains('p', /^Progress$/)
            .parents('.MuiFormControl-root')
            .find('input')
            .last()
            .should('be.visible')
            .clear({ force: true })
            .type(String(value), { force: true })
    }

    addDailyLog(){
        cy.wait(10000)
        cy.xpath('//span[text()="Update Daily Log"]|//span[text()="Add Daily Log"]|//span[text()="..."]').then($button=>{
            if($button.text()==="Update Daily Log"){
                //update daily log button is present
                cy.wrap($button).click()
            }else if(($button.text()==="Add Daily Log")){
                //add daily log button is present
                this.pageelements.addDailyLogBtn().click()
            }else{
                // click on 3 dots
                cy.xpath('//span[text()="..."]').click()
            }
        })
        this.pageelements.assignedActivitiesTitle().should('be.visible')
    }
    selectStatusFromDropDown(dailyLogStatus, taskName, progressValue = 10, fillVariance = false, isVarianceMandatory = false) {
        // Find the row containing the task name and click the status dropdown
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="status-selector"]')
                .click({ force: true });
        });
        
        cy.wait(1000);
        
        // Select status from the Material-UI menu list
        cy.get('.MuiMenu-list').within(() => {
            cy.get(`li[data-value="${dailyLogStatus}"]`).click();
        });

        if (dailyLogStatus === 'notStarted') {
            cy.xpath('//span[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`);
            });
            cy.get('p[data-testid="assigned-activity-item-progress-text"]').invoke('text').should("contain", "0");
        } else if (dailyLogStatus === 'inProgressDelayed') {
            this.setDailyLogProgress(progressValue)
            if (fillVariance) {
                isVarianceMandatory ? this.checkVarianceMandatory() : cy.log("Variance is not mandatory")
                cy.xpath('//div[text()="Select a category"]').click();
                cy.get('[data-value="Approvals/Permits"]').click();
                cy.get('[type="number"]').first().clear().type("3");
                cy.get('input[type="textarea"]').first().type("task delayed");
            }
            cy.xpath('//span[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`);
            });
            if (fillVariance) {
                cy.xpath('//p[text()="Variance Description"]').should("be.visible");
            }
        } else if (dailyLogStatus === 'inProgressOnTrack') {
            cy.wait(1000)
            this.setDailyLogProgress(progressValue)
            cy.xpath('//span[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`);
            });
            cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
                cy.contains('h2', taskName)
                    .parents('tr')
                    .find('p[data-testid="assigned-activity-item-progress-text"]')
                    .invoke('text')
                    .should("eq", `${progressValue}%`);
            });
        } else if (dailyLogStatus === 'completed') {
            // Progress field may be rendered as text/number; validate by value
            cy.contains('p', /^Progress$/)
                .parents('.MuiFormControl-root')
                .find('input')
                .last()
                .should(($input) => {
                    expect($input.val()).to.eq('100')
                })
            if (fillVariance) {
                isVarianceMandatory ? this.checkVarianceMandatory() : cy.log("Variance is not mandatory")
                cy.xpath('//div[text()="Select a category"]').click();
                cy.get('[data-value="Completed Early (Positive)"]').click();
                cy.get('[type="number"]').first().clear().type("3");
                cy.get('input[type="textarea"]').type("completed task");
            }
            cy.xpath('//span[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`);
            });
            cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
                cy.contains('h2', taskName)
                    .parents('tr')
                    .find('p[data-testid="assigned-activity-item-progress-text"]')
                    .invoke('text')
                    .should("contain", "100");
            });
        }
        cy.wait(5000)
    }

    selectBOQStatusFromDropDown(dailyLogStatus, taskName, progressValue, plannedTotal, plannedDuration, decimalPrecision, todayQuantity, uomText, fillVariance = false, isVarianceMandatory = false) {
        // Find the row containing the task name and click the status dropdown
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="status-selector"]')
                .click({ force: true });
        });
        
        cy.wait(1000);
        
        // Select status from the Material-UI menu list
        cy.get('.MuiMenu-list').within(() => {
            cy.get(`li[data-value="${dailyLogStatus}"]`).click();
        });

        if (dailyLogStatus === 'inProgressOnTrack' || dailyLogStatus === 'inProgressDelayed' || dailyLogStatus === 'completed') {
            cy.wait(1000)

            // 1. Verify Planned (Daily/Total)
            const plannedDaily = (parseFloat(plannedTotal) / parseFloat(plannedDuration)).toFixed(decimalPrecision);
            const expectedPlannedText = `${plannedDaily} / ${plannedTotal}`;

            cy.contains('p', /^Planned \(Daily\/Total\)$/)
                .parents('.MuiFormControl-root')
                .within(() => {
                    cy.get('input').should('have.value', expectedPlannedText);
                    cy.get('p').contains(uomText).should('be.visible');
                });

            // 2. "Today" Quantity — editable for in-progress, disabled & auto-filled for completed
            if (dailyLogStatus === 'completed') {
                // For completed: Today = plannedQuantity - toDate, and is disabled
                cy.contains('p', /^To Date$/)
                    .parents('.MuiFormControl-root')
                    .find('input[type="number"]')
                    .invoke('val')
                    .then((toDateValue) => {
                        let expectedToday = (parseFloat(plannedTotal) - parseFloat(toDateValue))
                        expectedToday = (expectedToday === 100)? expectedToday : expectedToday.toFixed(decimalPrecision);
                        cy.contains('p', /^Today$/)
                            .parents('.MuiFormControl-root')
                            .within(() => {
                                cy.get('input[type="number"]')
                                    .should('be.disabled')
                                    .and('have.value', expectedToday);
                                cy.get('p').contains(uomText).should('be.visible');
                            });
                    });
            } else {
                cy.contains('p', /^Today$/)
                    .parents('.MuiFormControl-root')
                    .within(() => {
                        cy.get('input[type="number"]')
                            .should('not.be.disabled')
                            .clear({ force: true })
                            .type(String(todayQuantity), { force: true });
                        cy.get('p').contains(uomText).should('be.visible');
                    });
            }

            // 3. Verify "To Date" (disabled)
            cy.contains('p', /^To Date$/)
                .parents('.MuiFormControl-root')
                .within(() => {
                    cy.get('input[type="number"]').should('be.disabled');
                    cy.get('p').contains(uomText).should('be.visible');
                });

            // 4. Fill variance if delayed and fillVariance is true
            if (dailyLogStatus === 'inProgressDelayed' && fillVariance) {
                isVarianceMandatory ? this.checkVarianceMandatory() : cy.log("Variance is not mandatory")
                cy.xpath('//div[text()="Select a category"]').click();
                cy.get('[data-value="Approvals/Permits"]').click();
                cy.get('[type="number"]').first().clear().type("3");
                cy.get('input[type="textarea"]').first().type("task delayed");
            }

            // Submit
            cy.xpath('//span[text()="Update"]').click();
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated successfully`);
            });

            if (dailyLogStatus === 'inProgressDelayed' && fillVariance) {
                cy.xpath('//p[text()="Variance Description"]').should("be.visible");
            }

            // Verify the derived progress % in the DL item row
            cy.wait(1000)
            cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
                cy.contains('h2', taskName)
                    .parents('tr')
                    .find('p[data-testid="assigned-activity-item-progress-text"]')
                    .invoke('text')
                    .should("eq", progressValue + '%');
            });
        }
        cy.wait(5000)
    }

    editHistoricDailylogFromList(historicLogDate,taskName){
        cy.getUserName().then((userName)=>{
            cy.wait(2000)
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
                const user = el.split(" ")[0]
                if(user === userName){
                    cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
                    cy.log("this daily log is editable")
                    cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
                        cy.wrap($tr).find("[data-testid='assigned-activity-item-comment']").should('be.enabled')
                        cy.wrap($tr).find("[data-testid='assigned-activity-item-comment']").type('task not completed')
                        cy.wrap($tr).find("h4[class='assigned-activity-item-dates-progress--progress-text']").click()
                        cy.get('.msgtoaster__text').then((sucessMsg) => {
                            assert.equal(sucessMsg.text(), 'Task comment added  successfully', 'Task comment added  successfully')
                        })
                    })
                }else{
                    cy.log("this daily log belongs to diffrent user hence not editable")
                    cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().first().click()
                    cy.log("this daily log is not editable")
                    cy.get("[data-testid='assigned-activity-item-comment']").should('not.be.enabled')
                }
            })
        })
    }
    deleteCommentsFromHistoricDailylog(historicLogDate,taskName){
        cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
            const user = el.split(" ")[0]
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
            cy.log("this daily log is editable")
            cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
                cy.wrap($tr).find("[data-testid='assigned-activity-item-comment']").should('be.enabled')
                cy.wrap($tr).find("[data-testid='assigned-activity-item-comment']").clear()
                cy.wrap($tr).find("h4[class='assigned-activity-item-dates-progress--progress-text']").click()
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), 'Task comment deleted  successfully', 'Task comment deleted  successfully')
                })
            })
        })
    }
    addPhotoToHistoricLog(historicLogDate,taskName){
        cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
            cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
                cy.wrap($tr).find("input[type='file']").selectFile('cypress\\fixtures\\image.jpg',{force:true})
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), 'Dailylog attachment added successfully', 'Dailylog attachment added successfully')
                })
            })
        })
    }
    viewPhotosAddedToDailylog(historicLogDate,taskName){
        cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
            cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
                cy.wrap($tr).find("[alt='cypress\\\\fixtures\\\\image.jpg']").first().click()
            })
            cy.xpath("//h5[text()='Photo Gallery']").should('be.visible')
            cy.xpath("//span[text()='Previous']").should('be.visible')
            // cy.xpath('//div//p').last().contains('1 / 1').should('be.visible')
            cy.xpath("//span[text()='Next']").should('be.visible')
        })
    }
    addAdditionalCommentsToDailylog(historicLogDate){
        // this.deleteAdditionalCommentsToDailylog(historicLogDate)
        cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
            cy.get('[data-testid="dailyLogAddCommentTextArea"]').clear().type('adding additional comments')
            cy.xpath("//span[text()='Add Comment and Close']").click()
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog comment added successfully', 'Dailylog additional comment added successfully')
            })
        })
    }
    deleteAdditionalCommentsToDailylog(historicLogDate){
        cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().invoke('text').then(el=>{
            cy.xpath(`//table//span[text()='${historicLogDate}']`).parent().next().click()
            cy.wait(3000)
            cy.get('[data-testid="dailyLogAddCommentTextArea"]').clear()
            cy.xpath("//span[text()='Add Comment and Close']").click()
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog comment deleted successfully', 'Dailylog additional comment deleted successfully')
            })
        })
        cy.wait(8000)
    }
    updateProgressto100(dailyLogStatus,taskName){
        cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
            cy.wrap($tr).find('[data-testid="status-selector"]').click({force:true})
            cy.wait(1000)        
            cy.get(`[id="${dailyLogStatus}"]`).click()
            if(dailyLogStatus === 'inProgressDelayed'){
                cy.get("[type='number']").last().clear().type("100")
                cy.xpath("//div[text()='Select a category']").click()
                cy.get("[data-value='Approvals/Permits']").click()
                cy.get("input[type='textarea']").first().clear().type("3")
                cy.xpath("//span[text()='Update']").click()
                cy.xpath("//div[text()='Confirmation']").should('be.visible')
                cy.xpath("//div[@class='dialog__body']//p").contains('You have marked this task as 100%, do you want to complete this task with current date as actual end date?')
                cy.xpath("//span[text()='Yes']").should('be.visible').click()
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`)
                })
                cy.get('p[data-testid="assigned-activity-item-progress-text"]').invoke('text').should("contain","100")
            }else if(dailyLogStatus === 'inProgressOnTrack'){
                cy.get('[type="number"]').last().clear().type("100")
                cy.xpath("//div[text()='Select a category']").click()
                cy.get("[data-value='Approvals/Permits']").click()
                cy.get("input[type='textarea']").first().clear().type("3")
                cy.xpath('//span[text()="Update"]').click()
                cy.xpath("//div[text()='Confirmation']").should('be.visible')
                cy.xpath("//div[@class='dialog__body']//p").contains('You have marked this task as 100%, do you want to complete this task with current date as actual end date?')
                cy.xpath("//span[text()='Yes']").should('be.visible').click()
                cy.get('.msgtoaster__text').then((sucessMsg) => {
                    assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', `Dailylog status updated to ${dailyLogStatus} successfully`)
                })
                cy.get('p[data-testid="assigned-activity-item-progress-text"]').invoke('text').should("contain","100")
            }
        })
    }

    viewDailyLogStatus(expectedStatus,taskName){
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="status-selector"]')
                .find('input')
                .should('have.value', expectedStatus);
        });
        cy.wait(1000);
    }

    isDailyLogAddedToday(){
        cy.wait(3000)
        const todayLong = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' })
        const todayShort = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

        const tableSel = '[data-test="dailyLogTableContainer"]'
        const noLogsSel = '[data-testid="dailyLogNoLogContainer"]'
        const groupRowSel = 'div[data-test^="dailyLogReportDate-Group-"]'

        cy.get('body').then(($b) => {
            // No logs container visible → definitely not added today
            if ($b.find(noLogsSel).length > 0) {
                cy.log('No logs container present')
                return cy.wrap({ runTest: false }).as('runTests')
            }

            // Table presence (soft check)
            const hasTable = $b.find(tableSel).length > 0
            cy.log(`table present: ${hasTable}`)

            // Look for today in grouped header text
            const hasTodayInGroup = $b
              .find(groupRowSel)
              .filter((_, el) => (el.textContent || '').includes(todayLong))
              .length > 0

            // Or look for today in individual rows
            const hasTodayInRows = $b
              .find('span[data-test^="dailyLogReportDate-"]')
              .filter((_, el) => (el.textContent || '').includes(todayShort))
              .length > 0

            cy.log(`hasTodayInGroup: ${hasTodayInGroup}, hasTodayInRows: ${hasTodayInRows}`)

            if (hasTodayInGroup || hasTodayInRows) {
                cy.log('dailylog present for today')
                return cy.wrap({ runTest: true }).as('runTests')
            } else {
                cy.log('dailylog NOT added for today')
                return cy.wrap({ runTest: false }).as('runTests')
            }
        })
    }
    verifyTaskInDailyLog(activity, taskName) {
        if (activity === 'upcomingActivity') {
            cy.get('table.upcoming-activities__table').within(() => {
                cy.get('h2').contains(taskName).should('be.visible');
                cy.log("found the task under upcoming activities");
            });
        } else if (activity === 'assignedActivity') {
            cy.get('[data-testid="assignedActivitiesTable-table-container"]')
                .scrollTo('bottom', { ensureScrollable: false })
            cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
                cy.get('h2').contains(taskName).scrollIntoView()
                cy.get('h2').contains(taskName).should('be.visible')
                cy.log("found the task under assigned activities");
            });
        }
    }
    // Verify a task is NOT visible in assigned/upcoming activities
    verifyTaskNotInDailyLog(activity, taskName) {
        if (activity === 'upcomingActivity') {
            cy.get('table.upcoming-activities__table').within(() => {
                cy.get('h2').contains(taskName).should('not.exist')
                cy.log(taskName + " is not under upcoming activities as expected")
            })
        } else if (activity === 'assignedActivity') {
            cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
                cy.get('h2').contains(taskName).should('not.exist')
                cy.log(taskName + " is not under assigned activities as expected")
            })
        }
    }
    isDailyLogAddedYesterday(){
        cy.wait(5000)
        cy.get('[data-test="dailyLogTableContainer"] tr').should('be.visible').its('length').then((length) => {
            if(length > 1){
                cy.log('daily log added')
                return cy.xpath("//table[@aria-label='customized table']/tbody/tr/td[1]/div").invoke('text').then(text=>{
                    const today = new Date()
                    const yesterday = new Date(today.getTime() - 86400000) 
                    const options = {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    }
                    const options1 = {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                    }
                    const formattedDate = yesterday.toLocaleDateString('en-US',options)
                    const historicDate = yesterday.toLocaleDateString('en-US',options1)
                    cy.log(formattedDate)
                    cy.log(text)
                    if(text.includes(formattedDate)){
                        cy.log("dailylog present for yesterday")
                        return cy.wrap({runTest:false,historicDate}).as('runTests')
                    }else{
                        cy.log("dailylog not added for yesterday")
                        return cy.wrap({runTest:true,historicDate}).as('runTests')
                    }
                })
            }else{
                cy.get('[data-testid="dailyLogNoLogContainer"]').should('be.visible').then(()=>{
                    cy.log("no logs created for tasks yet")
                    return cy.wrap({runTest:false,historicDate}).as('runTests')
                })
            }
        })
    }
    verifyStartDate(taskName){
        const today = new Date()
        const day = today.getDate()
        const month = today.toLocaleDateString('default',{month: 'short'})
        const year = today.getFullYear()
        const curentDate = `${day} ${month}, ${year}`
        cy.log(curentDate)
        cy.xpath(`//tr[.//h5[contains(text(),"${taskName}")]]`).then(($tr)=>{
            cy.wrap($tr). xpath('.//p[text()="Start"]').next('p').invoke('text').should('eq',curentDate)
        })
    }
    getPercentProgressDL(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('p[data-testid="assigned-activity-item-progress-text"]')
                .invoke('text')
                .then((text) => {
                    let percentProgressDL = text.replace('%', '');
                    cy.log(percentProgressDL);
                    return cy.wrap(percentProgressDL).as('percentProgressDL');
                });
        });
    }
    updateStatusWithFutureDates(dailyLogStatus, taskName, daysOffset) {
        let pickDate = new Date();
        pickDate.setDate(pickDate.getDate() + parseInt(daysOffset, 10));
        // If pickDate is Saturday (6), add 2 days; if Sunday (0), add 1 day
        if (pickDate.getDay() === 6) {
            pickDate.setDate(pickDate.getDate() + 2); // Move to Monday
        } else if (pickDate.getDay() === 0) {
            pickDate.setDate(pickDate.getDate() + 1); // Move to Monday
        }
        let day = pickDate.getDate().toString();
        let month = pickDate.toLocaleString('default', { month: 'long' });
        let year = pickDate.getFullYear().toString();

        cy.log(`Target date: ${day} ${month} ${year}`);
        cy.wait(5000)
        // First try to find the task in assigned activities
        cy.get('div[data-testid="assignedActivitiesTable"]')
            .find('table[data-testid="assignedActivitiesTable-table-control"]')
            .then(($table) => {
                if ($table.find(`h2:contains("${taskName}")`).length > 0) {
                    // Task found in assigned activities
                    cy.wrap($table).within(() => {
                        cy.contains('h2', taskName)
                            .parents('tr')
                            .find('div[data-testid="status-selector"]')
                            .click({ force: true });
                    });
                } else {
                    // Task not found in assigned activities, try upcoming activities
                    cy.get('table.upcoming-activities__table').within(() => {
                        cy.contains('h2', taskName)
                            .parents('tr')
                            .find('div[data-testid="status-selector"]')
                            .click({ force: true });
                    });
                }
            });
        
        cy.wait(2000);
        cy.log(dailyLogStatus)
        // 2. Select status from the Material-UI menu list
        cy.get('.MuiMenu-list')
            .should('be.visible')
            .within(() => {
                cy.get(`li[data-value="${dailyLogStatus}"]`)
                    .should('be.visible')
                    .should('exist')
                    .click({ force: true });
            });

        if (dailyLogStatus === 'notStarted') {

            // 8. Wait for success message
            cy.get('.msgtoaster__text').then((sucessMsg) => {
                assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', 'Dailylog status updated successfully');
            });
            // Use Cypress's built-in wait for the UI to stabilize
            cy.get('.msgtoaster__text').should('not.exist');
            // // 3. When status popup opens, change planned start date
            // cy.get('p:contains("Planned Start Date")').next().find('button[aria-label="change date"]').click();
            
            // // 4. Navigate to the correct month and year
            // cy.get('.MuiPickersCalendarHeader-switchHeader p').then(($label) => {
            //     const currentText = $label.text(); // e.g., "May 2025"
            //     const [currentMonth, currentYear] = currentText.split(' ');
                
            //     cy.log(`Current calendar: ${currentMonth} ${currentYear}`);
            //     cy.log(`Target calendar: ${month} ${year}`);
                
            //     if (currentMonth !== month || currentYear !== year) {
            //         // Navigate to the correct month/year
            //         const navigateToTargetDate = () => {
            //             cy.get('.MuiPickersCalendarHeader-switchHeader p').then(($currentLabel) => {
            //                 const [curMonth, curYear] = $currentLabel.text().split(' ');
                            
            //                 if (curMonth !== month || curYear !== year) {
            //                     // Determine if we need to go forward or backward
            //                     const currentDate = new Date(`${curMonth} 1, ${curYear}`);
            //                     const targetDate = new Date(`${month} 1, ${year}`);
                                
            //                     if (targetDate < currentDate) {
            //                         // Target date is in the past, click previous button (first button)
            //                         cy.get('.MuiPickersCalendarHeader-switchHeader button').first().click();
            //                         cy.log(`Navigating backward from ${curMonth} ${curYear} to ${month} ${year}`);
            //                     } else {
            //                         // Target date is in the future, click next button (last button)
            //                         cy.get('.MuiPickersCalendarHeader-switchHeader button').last().click();
            //                         cy.log(`Navigating forward from ${curMonth} ${curYear} to ${month} ${year}`);
            //                     }
            //                     cy.wait(500);
            //                     navigateToTargetDate(); // Recursive call
            //                 } else {
            //                     cy.log(`Successfully navigated to ${month} ${year}`);
            //                 }
            //             });
            //         };
                    
            //         navigateToTargetDate();
            //     }
            // });
            
            // // 5. Select the correct day
            // cy.wait(3000)
            // cy.get('.MuiPickersDay-day')
            // .filter((index, el) => Cypress.$(el).text().trim() === day)
            // .first()
            // .click({ force: true });
            // cy.wait(1000);

            // // 6. When status popup opens, capture dates
            // cy.get('p:contains("Planned Start Date")').next().find('input').invoke('val').then((plannedStartDate) => {
            //     cy.get('p:contains("Planned End Date")').next().find('input').invoke('val').then((plannedEndDate) => {
            //         // 7. Click on update
            //         cy.xpath('//span[text()="Update"]').click();
            //         cy.wait(1000);

            //         // 8. Wait for success message
            //         cy.get('.msgtoaster__text').then((sucessMsg) => {
            //             assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', 'Dailylog status updated successfully');
            //         });
            //         // Use Cypress's built-in wait for the UI to stabilize
            //         cy.get('.msgtoaster__text').should('not.exist');

            //         // 9. Capture dates from different element within the same task row
            //         cy.get('div[data-testid="assignedActivitiesTable"]')
            //             .find('table[data-testid="assignedActivitiesTable-table-control"]')
            //             .then(($table) => {
            //                 if ($table.find(`h2:contains("${taskName}")`).length > 0) {
            //                     // Task found in assigned activities
            //                     cy.wrap($table).within(() => {
            //                         cy.contains('h2', taskName)
            //                             .parents('tr')
            //                             .find('.row')
            //                             .invoke('text')
            //                             .then((dateText) => {
            //                                 const startDateMatch = dateText.match(/Planned Start: (\d{2}-[A-Za-z]{3}-\d{4})/);
            //                                 const endDateMatch = dateText.match(/Planned End: (\d{2}-[A-Za-z]{3}-\d{4})/);

            //                                 if (startDateMatch && endDateMatch) {
            //                                     // 10. Normalize the date format
            //                                     const normalizedStartDate = this.formatDate(startDateMatch[1]);
            //                                     const normalizedEndDate = this.formatDate(endDateMatch[1]);
            //                                     const normalizedPlannedStartDate = this.formatDate(plannedStartDate);
            //                                     const normalizedPlannedEndDate = this.formatDate(plannedEndDate);

            //                                     // 11. Verify both dates
            //                                     expect(normalizedPlannedStartDate).to.equal(normalizedStartDate);
            //                                     expect(normalizedPlannedEndDate).to.equal(normalizedEndDate);
            //                                 }
            //                             });
            //                     });
            //                 } else {
            //                     // Task found in upcoming activities
            //                     cy.get('table.upcoming-activities__table').within(() => {
            //                         cy.contains('h2', taskName)
            //                             .parents('tr')
            //                             .find('.row')
            //                             .invoke('text')
            //                             .then((dateText) => {
            //                                 const startDateMatch = dateText.match(/Planned Start: (\d{2}-[A-Za-z]{3}-\d{4})/);
            //                                 const endDateMatch = dateText.match(/Planned End: (\d{2}-[A-Za-z]{3}-\d{4})/);

            //                                 if (startDateMatch && endDateMatch) {
            //                                     // 10. Normalize the date format
            //                                     const normalizedStartDate = this.formatDate(startDateMatch[1]);
            //                                     const normalizedEndDate = this.formatDate(endDateMatch[1]);
            //                                     const normalizedPlannedStartDate = this.formatDate(plannedStartDate);
            //                                     const normalizedPlannedEndDate = this.formatDate(plannedEndDate);

            //                                     // 11. Verify both dates
            //                                     expect(normalizedPlannedStartDate).to.equal(normalizedStartDate);
            //                                     expect(normalizedPlannedEndDate).to.equal(normalizedEndDate);
            //                                 }
            //                             });
            //                     });
            //                 }
            //             });
            //     });
            // });
            // cy.get('p[data-testid="assigned-activity-item-progress-text"]').invoke('text').should("contain", "0");
        } else if (dailyLogStatus === 'completed') {
            cy.get('[type="number"]').last().should('have.value', '100');
            cy.xpath('//div[text()="Select a category"]').click();
            cy.get('[data-value="Completed Early (Positive)"]').click();
            cy.get('input[type="textarea"]').type("completed task");
            // 3. When status popup opens, change planned start date
            cy.get('p:contains("Start Date")').next().find('button[aria-label="change date"]').click();
            
            // 4. Navigate to the correct month and year
            cy.get('.MuiPickersCalendarHeader-switchHeader p').then(($label) => {
                const currentText = $label.text(); // e.g., "May 2025"
                const [currentMonth, currentYear] = currentText.split(' ');
                
                cy.log(`Current calendar: ${currentMonth} ${currentYear}`);
                cy.log(`Target calendar: ${month} ${year}`);
                
                if (currentMonth !== month || currentYear !== year) {
                    // Navigate to the correct month/year
                    const navigateToTargetDate = () => {
                        cy.get('.MuiPickersCalendarHeader-switchHeader p').then(($currentLabel) => {
                            const [curMonth, curYear] = $currentLabel.text().split(' ');
                            
                            if (curMonth !== month || curYear !== year) {
                                // Determine if we need to go forward or backward
                                const currentDate = new Date(`${curMonth} 1, ${curYear}`);
                                const targetDate = new Date(`${month} 1, ${year}`);
                                
                                if (targetDate < currentDate) {
                                    // Target date is in the past, click previous button (first button)
                                    cy.get('.MuiPickersCalendarHeader-switchHeader button').first().click();
                                    cy.log(`Navigating backward from ${curMonth} ${curYear} to ${month} ${year}`);
                                } else {
                                    // Target date is in the future, click next button (last button)
                                    cy.get('.MuiPickersCalendarHeader-switchHeader button').last().click();
                                    cy.log(`Navigating forward from ${curMonth} ${curYear} to ${month} ${year}`);
                                }
                                cy.wait(500);
                                navigateToTargetDate(); // Recursive call
                            } else {
                                cy.log(`Successfully navigated to ${month} ${year}`);
                            }
                        });
                    };
                    
                    navigateToTargetDate();
                }
            });
            
            // 5. Select the correct day
            cy.wait(3000)
            cy.get('.MuiPickersDay-day')
            .filter((index, el) => Cypress.$(el).text().trim() === day)
            .first()
            .click({ force: true });
            cy.wait(1000);

            // 4. Capture dates
            cy.get('input[name="date"]').first().invoke('val').then((actualStartDate) => {
                cy.get('input[name="date"]').last().invoke('val').then((actualEndDate) => {
                    // 5. Click on update
                    cy.xpath('//span[text()="Update"]').click();
                    cy.wait(1000);

                    // 6. Wait for success message
                    cy.get('.msgtoaster__text').then((sucessMsg) => {
                        assert.equal(sucessMsg.text(), 'Dailylog status updated successfully', 'Dailylog status updated successfully');
                    });
                    // Use Cypress's built-in wait for the UI to stabilize
                    cy.get('.msgtoaster__text').should('not.exist');

                    // 7. Capture dates from different element within the same task row
                    cy.get('div[data-testid="assignedActivitiesTable"]')
                        .find('table[data-testid="assignedActivitiesTable-table-control"]')
                        .then(($table) => {
                            if ($table.find(`h2:contains("${taskName}")`).length > 0) {
                                // Task found in assigned activities
                                cy.wrap($table).within(() => {
                                    cy.contains('h2', taskName)
                                        .parents('tr')
                                        .find('.completed')
                                        .invoke('text')
                                        .then((dateText) => {
                                            const startDateMatch = dateText.match(/Actual Start: (\d{2}-[A-Za-z]{3}-\d{4})/);
                                            const endDateMatch = dateText.match(/Actual End: (\d{2}-[A-Za-z]{3}-\d{4})/);

                                            if (startDateMatch && endDateMatch) {
                                                // 8. Normalize the date format
                                                const normalizedStartDate = this.formatDate(startDateMatch[1]);
                                                const normalizedEndDate = this.formatDate(endDateMatch[1]);
                                                const normalizedActualStartDate = this.formatDate(actualStartDate);
                                                const normalizedActualEndDate = this.formatDate(actualEndDate);

                                                // 9. Verify both dates
                                                expect(normalizedActualStartDate).to.equal(normalizedStartDate);
                                                expect(normalizedActualEndDate).to.equal(normalizedEndDate);
                                            }
                                        });
                                });
                            } else {
                                // Task found in upcoming activities
                                cy.get('table.upcoming-activities__table').within(() => {
                                    cy.contains('h2', taskName)
                                        .parents('tr')
                                        .find('.completed')
                                        .invoke('text')
                                        .then((dateText) => {
                                            const startDateMatch = dateText.match(/Actual Start: (\d{2}-[A-Za-z]{3}-\d{4})/);
                                            const endDateMatch = dateText.match(/Actual End: (\d{2}-[A-Za-z]{3}-\d{4})/);

                                            if (startDateMatch && endDateMatch) {
                                                // 8. Normalize the date format
                                                const normalizedStartDate = this.formatDate(startDateMatch[1]);
                                                const normalizedEndDate = this.formatDate(endDateMatch[1]);
                                                const normalizedActualStartDate = this.formatDate(actualStartDate);
                                                const normalizedActualEndDate = this.formatDate(actualEndDate);

                                                // 9. Verify both dates
                                                expect(normalizedActualStartDate).to.equal(normalizedStartDate);
                                                expect(normalizedActualEndDate).to.equal(normalizedEndDate);
                                            }
                                        });
                                });
                            }
                        });
                });
            });
            cy.get('p[data-testid="assigned-activity-item-progress-text"]').invoke('text').should("contain", "100");
        }
    }
    getPlannedDatesDL(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .within(() => {
                    cy.get('.row').invoke('text').then((dateText) => {
                        // Extract dates using regex to match the format "Planned Start: DD-MMM-YYYY"
                        const startDateMatch = dateText.match(/Planned Start: (\d{2}-[A-Za-z]{3}-\d{4})/);
                        const endDateMatch = dateText.match(/Planned End: (\d{2}-[A-Za-z]{3}-\d{4})/);
                        
                        if (startDateMatch && endDateMatch) {
                            const formattedStartDate = this.formatDate(startDateMatch[1]);
                            const formattedEndDate = this.formatDate(endDateMatch[1]);
                            
                            let plannedDatesInDL = [formattedStartDate, formattedEndDate];
                            cy.log(plannedDatesInDL);
                            return cy.wrap(plannedDatesInDL).as('plannedDatesInDL');
                        }
                    });
                });
        });
    }
    // Helper function to format date
    formatDate(dateString) {
        try {
            cy.log('Input date string:', dateString);
            if (!dateString) {
                cy.log('Empty date string received');
                return '';
            }
            
            // Handle both formats: "17 May 2025" and "17-May-2025"
            let day, month, year;
            if (dateString.includes('-')) {
                [day, month, year] = dateString.split('-');
            } else {
                [day, month, year] = dateString.split(' ');
            }
            
            if (!day || !month || !year) {
                cy.log('Invalid date format. Expected DD-MMM-YYYY or DD MMM YYYY');
                return dateString;
            }
            
            const shortYear = year.slice(-2);
            const formattedDate = `${day}-${month}-${shortYear}`;
            cy.log('Formatted date:', formattedDate);
            return formattedDate;
        } catch (error) {
            cy.log('Error formatting date:', error);
            return dateString;
        }
    }
    verifyAddOrUpdateDailyLogButton() {
        // Build today's labels as shown in UI
        const todayLong = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' }); // e.g., "Wednesday, Sep 24, 2025"
        const todayShort = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }); // e.g., "Sep 24, 2025"

        const tableSel = '[data-test="dailyLogTableContainer"]'
        const noLogsSel = '[data-testid="dailyLogNoLogContainer"]'
        const groupRowSel = 'div[data-test^="dailyLogReportDate-Group-"]'
        const addBtn = '//span[text()="Add Daily Log"]'
        const updateBtn = '//span[text()="Update Daily Log"]'

        cy.get('body').then(($b) => {
            // Case 1: No logs present → Add Daily Log
            if ($b.find(noLogsSel).length > 0) {
                cy.xpath(addBtn).should('be.visible')
                cy.xpath(updateBtn).should('not.exist')
                return
            }

            // Ensure table area exists before checking its contents (soft check)
            const hasTable = $b.find(tableSel).length > 0
            expect(hasTable, 'daily log table container present').to.be.true

            // Detect if today exists in grouped header OR rows by filtering text content
            const hasTodayInGroup = $b
              .find(groupRowSel)
              .filter((_, el) => (el.textContent || '').includes(todayLong))
              .length > 0

            const hasTodayInRows = $b
              .find('span[data-test^="dailyLogReportDate-"]')
              .filter((_, el) => (el.textContent || '').includes(todayShort))
              .length > 0

            if (hasTodayInGroup || hasTodayInRows) {
                // Today exists → Update Daily Log
                cy.xpath(updateBtn).should('be.visible')
                cy.xpath(addBtn).should('not.exist')
            } else {
                // Today not present → Add Daily Log
                cy.xpath(addBtn).should('be.visible')
                cy.xpath(updateBtn).should('not.exist')
            }
        })
    }  
    verifyStatusSelectorLabel(checkLabel){
        if(checkLabel){
            cy.get('label[data-testid="status-selector-label"]').invoke('text').should("contain", "Updated status");
        }else{
            cy.get('label[data-testid="status-selector-label"]').invoke('text').should("contain", "Update today's status");
        }
    } 
    

    addCommentsToDL(taskName, comment, isCommentAdded = false){
        // Find the row containing the task name and click on comment box
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="assigned-activity-item-comment"]')
                .wait(300)
                .type('\n' + comment, {delay:100})
        });
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .click({ force: true })
        });
        if (isCommentAdded) {
            // Comment was previously added/modified today → always "Updated"
            cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                assert.equal(successMsg.text(), 'Task comment Updated successfully', 'Task comment Updated successfully')
            })
        } else {
            // First-ever comment on this task today
            cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                assert.equal(successMsg.text(), 'Task comment added successfully', 'Task comment added successfully')
            })
        }
    cy.wait(5000)
    cy.get('.msgtoaster__text').should('not.exist')

    cy.getUserName().then(() => {
        const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
        this.checkSubmittedByInfo(taskName, fullName)
    })
}

    addPhotoToDL(taskName,fileName){
        // Find the row containing the task name and attach photo
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .scrollIntoView()
                .parents('tr')
                .find('input[type="file"]')
                .selectFile(fileName,{force:true})
        })
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Dailylog attachment added successfully', 'Dailylog attachment added successfully')
        })
        cy.get('.msgtoaster__text').should('not.exist')

        cy.getUserName().then(() => {
            const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
            this.checkSubmittedByInfo(taskName, fullName)
        })
    }
    deleteCommentsInDL(taskName){
        // Find the row containing the task name and clear  comment box
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
          cy.contains('h2', taskName)
            .parents('tr')
            .find('[data-testid="assigned-activity-item-comment"]')
            .should('be.visible')
            .invoke('val')
            .should('not.be.empty')
          // Re-query and clear after confirming comments are loaded
          cy.contains('h2', taskName)
            .parents('tr')
            .find('[data-testid="assigned-activity-item-comment"]')
            .clear({ force: true })
        });
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .click({ force: true })
        });
        cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
            assert.equal(successMsg.text(), 'Task comment deleted successfully', 'Task comment deleted successfully')
        })

        cy.wait(5000)
        cy.get('.msgtoaster__text').should('not.exist')

        cy.getUserName().then(() => {
            const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
            this.checkSubmittedByInfo(taskName, fullName)
        })
    }
    deletePhotoInDL(taskName){
        // Find the row containing the task name and delete photo
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
            .closest('tr')                        // the whole row for this task
            .find('img')                          // find the photo image first
            .closest('div')                       // get its container div
            .find('button.MuiIconButton-root')    // find the delete button within that container
            .first()                              // ensure we only get one (the delete button for this photo)
            .click({ force: true });
        });
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Deleted attachment successfully', 'Deleted attachment successfully')
        })
        cy.get('.msgtoaster__text').should('not.exist')

        cy.getUserName().then(() => {
            const fullName = `${Cypress.env('firstname')} ${Cypress.env('lastname')}`
            this.checkSubmittedByInfo(taskName, fullName)
        })
    }

    // Verify the status selector shows the expected value
    checkStatus(taskName, expectedStatus) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('div[data-testid="status-selector"]')
                .find('input')
                .should('have.value', expectedStatus)
        })
    }

    // Verify the status label text (e.g. "Update today's status" or "Updated status")
    checkStatusLabel(taskName, expectedLabel) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('label[data-testid="status-selector-label"]')
                .invoke('text')
                .should('contain', expectedLabel)
        })
    }

    // Verify the progress % text matches
    checkProgress(taskName, expectedProgress) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('p[data-testid="assigned-activity-item-progress-text"]')
                .invoke('text')
                .should('contain', expectedProgress)
        })
    }

    // Verify the comment field contains the expected text
    checkComment(taskName, expectedComment) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="assigned-activity-item-comment"]')
                .invoke('val')
                .should('contain', expectedComment)
        })
    }

    // Verify at least one photo is visible for the task
    checkPhotoAttached(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('img')
                .should('exist')
                .and('be.visible')
        })
    }

    // Verify the "Submitted By" line shows correct user, date and time
    checkSubmittedByInfo(taskName, expectedUserName) {
        const now = new Date()
        const dd = String(now.getDate()).padStart(2, '0')
        const mon = now.toLocaleString('en-US', { month: 'short' })
        const yy = String(now.getFullYear()).slice(-2)
        const expectedDate = `${dd}-${mon}-${yy}`

        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .scrollIntoView()
                .parents('tr')
                .find('div.progressArea__createdBy .row.progressArea__createdBy__bg')
                .should('be.visible')
                .invoke('text')
                .then((txt) => {
                    const normalized = txt.replace(/\s+/g, ' ').trim()
                    expect(normalized).to.include('Submitted By:')
                    expect(normalized).to.include(expectedUserName)
                    expect(normalized).to.include(expectedDate)
                    expect(/\bat\s+\d{2}:\d{2}\b/.test(normalized), 'contains time like HH:MM').to.be.true
                })
        })
    }

    // Delete all photos/attachments for a given task
    deleteAllPhotosInDL(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .closest('tr')
                .then(($row) => {
                    const photos = $row.find('img')
                    if (photos.length === 0) {
                        cy.log('No photos to delete for ' + taskName)
                        return
                    }
                    // Delete each photo one by one
                    for (let i = 0; i < photos.length; i++) {
                        cy.contains('h2', taskName)
                            .closest('tr')
                            .find('img')
                            .first()
                            .closest('div')
                            .find('button.MuiIconButton-root')
                            .first()
                            .click({ force: true })
                        cy.wait(2000)
                    }
                })
        })
        cy.get('.msgtoaster__text').should('not.exist')
    }

    // Verify that variance fields show mandatory indicators (red * span)
    checkVarianceMandatory() {
        const checkLabelHasAsterisk = (labelText) => {
            cy.contains('p.MuiTypography-root', labelText)
                .invoke('text')
                .then((txt) => {
                    // Mandatory marker is a red asterisk rendered as a nested span.
                    // We assert the '*' character exists to avoid brittle style selectors.
                    expect(txt.replace(/\s+/g, ' ').trim()).to.include('*')
                })
        }

        checkLabelHasAsterisk('Variance Category')
        checkLabelHasAsterisk('Delay (days)')
        checkLabelHasAsterisk('Title')
    }

    // Fill variance fields and submit
    fillVarianceFields(category = 'Approvals/Permits', delay = 3, title = 'task delayed') {
        cy.xpath('//div[text()="Select a category"]').click()
        cy.get(`[data-value="${category}"]`).click()
        cy.get('[type="number"]').first().clear().type(String(delay))
        cy.get('input[type="textarea"]').first().type(title)
        cy.xpath('//span[text()="Update"]').click()
        cy.get('.msgtoaster__text').then((msg) => {
            assert.equal(msg.text(), 'Dailylog status updated successfully', 'Dailylog status updated successfully')
        })
        cy.xpath('//p[text()="Variance Description"]').should("be.visible")
    }

    // Verify the comment field is empty for a given task
    checkCommentEmpty(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('[data-testid="assigned-activity-item-comment"]')
                .invoke('val')
                .should('be.empty')
        })
    }

    // Verify no photos/attachments exist for a given task
    checkNoPhoto(taskName) {
        cy.get('table[data-testid="assignedActivitiesTable-table-control"]').within(() => {
            cy.contains('h2', taskName)
                .parents('tr')
                .find('img')
                .should('not.exist')
        })
    }
}

export default dailyLogPage;