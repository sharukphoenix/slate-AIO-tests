
class pivotTablePage {
    /**
     * Validates the presence of the '% Progress User Group Vs Location' report card and clicks on it.
     */
    clickUserGroupVsLocationReportCard() {
        cy.get('div.report-card')
          .contains('div.card-title', '% Progress User Group Vs Location')
          .should('be.visible')
          .parents('div.report-card')
          .first()
          .click();
    }

    /**
     * Validates the presence and structure of the User Group vs Location pivot table.
     */
    validateUserGroupVsLocationPivotTable() {
        // Validate the main pivot container
        cy.get('div.pivot').should('exist').and('be.visible');
        cy.get('div.pivot-container').should('exist').and('be.visible');
        // Validate legends
        cy.get('div.legends-container').within(() => {
            cy.contains('div.legend-box', 'No data').should('exist');
            cy.contains('div.legend-box', 'Planned > Actual').should('exist');
            cy.contains('div.legend-box', 'Planned ≤ Actual').should('exist');
        });
        // Validate export button
        cy.get('button.pivot-table-print-btn').should('exist').and('be.visible').and('have.attr', 'aria-label', 'Export table as PDF');
        cy.get('button.pivot-table-print-btn').contains('Export').should('exist');
        // Validate table headers
        cy.get('div.tablehead-label-container').within(() => {
            cy.contains('div.pivot-progress-label', '% Progress').should('exist');
            cy.contains('div.header-title-pivot', 'Location').should('exist');
        });
        // Validate table structure and at least one data row
        cy.get('table.pivot-table').should('exist').within(() => {
            cy.get('thead').should('exist');
            cy.get('tbody tr.item-row').should('have.length.at.least', 1);
            cy.get('td.item-cell').contains('design').should('exist');
            cy.get('td.data-cell[aria-label="Planned"]').should('exist');
            cy.get('td.data-cell[aria-label="Actual"]').should('exist');
        });
    }

    /**
     * Verifies the first row has "design" as user group, clicks the arrow down to expand,
     * and then gets the task names and count.
     */
    expandUserGroupAndGetTasks() {
        // Verify the first row has "design" as user group
        cy.get('table.pivot-table tbody tr.item-row').first().within(() => {
            cy.get('td.item-cell').should('contain.text', 'design');
            cy.log('Verified user group "design" exists in first row');
            
            // Click the arrow down (▶) to expand
            cy.get('span').contains('▶').click();
            cy.log('Clicked arrow down to expand user group');
        });

        // Wait for expansion to complete
        cy.wait(2000);

        // Get all task names and actual values after expansion
        cy.get('table.pivot-table tbody tr.item-row').then(($rows) => {
            const taskCount = $rows.length;
            cy.log(`Total number of tasks found: ${taskCount}`);

            const taskNames = [];
            const actualValues = [];
            const varianceRows = [];
            $rows.each((index, row) => {
                const $row = Cypress.$(row);
                const rawText = $row.find('td.item-cell').text();
                const cleanTaskName = rawText.replace(/[▶•▼]/g, '').trim();
                cy.log(`Row ${index} cleanTaskName: "${cleanTaskName}"`);
                // For the first row, treat as 'design'
                if (index === 0) {
                    if ($row.find('div.variance-indicator').length > 0) {
                        varianceRows.push('design');
                    }
                } else {
                    if (cleanTaskName) {
                        taskNames.push(cleanTaskName);
                        const actualValue = $row.find('td.data-cell[aria-label="Actual"]').text().trim();
                        actualValues.push(actualValue);
                        if ($row.find('div.variance-indicator').length > 0) {
                            varianceRows.push(cleanTaskName);
                        }
                    }
                }
            });

            cy.log(`Task names found: ${JSON.stringify(taskNames)}`);
            cy.log(`Number of tasks under "design" user group: ${taskNames.length}`);
            cy.log(`Actual values found: ${JSON.stringify(actualValues)}`);
            cy.log(`Rows with variance-indicator: ${JSON.stringify(varianceRows)}`);

            // Assert that only 'L2 Wall +POD + Allignment' and 'design' have variance-indicator
            expect(varianceRows).to.include('design');
            expect(varianceRows).to.include('L2 Wall +POD + Allignment');
            expect(varianceRows.length).to.equal(2);

            // Store the results for potential use in tests
            cy.wrap({
                userGroup: 'design',
                taskCount: taskNames.length,
                taskNames: taskNames,
                actualValues: actualValues,
                varianceRows: varianceRows
            }).as('pivotTableTasks');
        });

        // Verify all Planned cells in expanded rows have value '100%'
        cy.get('table.pivot-table tbody tr.item-row').each(($row) => {
            cy.wrap($row).find('td.data-cell[aria-label="Planned"]').invoke('text').then((plannedValue) => {
                cy.log(`Planned cell value: ${plannedValue.trim()}`);
                expect(plannedValue.trim()).to.equal('100%');
            });
        });
    }

    /**
     * Clicks on the variance indicator in the design row to open a popup with table,
     * then clicks on 'List of activities' tab and verifies headers for both tables.
     */
    clickUserGroupVarianceIndicator(userGroup) {
        // Click on the variance indicator in the specified user group row
        cy.get('table.pivot-table tbody tr.item-row').each(($row) => {
            cy.wrap($row).find('td.item-cell').invoke('text').then((cellText) => {
                if (cellText.includes(userGroup)) {
                    cy.wrap($row).within(() => {
                        cy.get('td.data-cell[aria-label="Actual"] div.variance-indicator')
                            .should('be.visible')
                            .click();
                        cy.log(`Clicked on ${userGroup} row variance indicator`);
                    });
                    return false; // Break the each loop
                }
            });
        });

        // Wait for popup to appear and validate it
        cy.wait(1000);
        
        // Verify popup is displayed with the specific structure
        cy.get('div.popup')
            .should('be.visible')
            .within(() => {
                // Verify popup header with close button
                cy.get('div.variance-heading button.close-button')
                    .should('be.visible')
                    .and('contain.text', '×');
                
                // Verify popup navigation tabs
                cy.get('div.popup-header div.popup-nav').within(() => {
                    cy.get('button.popup-tab.active')
                        .should('be.visible')
                        .and('contain.text', 'Variance Details');
                    cy.get('button.popup-tab')
                        .should('be.visible')
                        .and('contain.text', 'List of activities');
                });
                
                this.verifyVarianceTableContent()
                // Click on 'List of activities' tab
                cy.get('div.popup-header div.popup-nav button.popup-tab').contains('List of activities').click();
                cy.log('Clicked on List of activities tab');

                // Wait for the table to update
                cy.wait(500);

                // Verify table headers for List of activities (explicitly for .activities-list)
                // cy.get('div.table-wrapper table.variance-table.activities-list').should('exist').and('be.visible');
                // cy.get('div.table-wrapper table.variance-table.activities-list thead tr th').then($ths => {
                //     const headers = [...$ths].map(th => th.innerText.trim());
                //     cy.log('List of activities headers: ' + headers.join(', '));
                //     expect(headers).to.deep.equal([
                //         'ID',
                //         'Activity Name',
                //         'Assignee',
                //         'Planned Start',
                //         'Planned End',
                //         'Baseline Start',
                //         'Baseline Finish',
                //         'Actual Start',
                //         'Actual End',
                //         'Delay',
                //         '% Complete'
                //     ]);
                // });
                this.verifyActivityTableContent()

                // Click the close button to close the popup
                cy.get('div.variance-heading button.close-button')
                    .should('be.visible')
                    .click();
                cy.log('Clicked close button to close popup');
            });
    }

    /**
     * Clicks on the variance indicator for the specific task with new popup structure
     * @param {string} activityName - The name of the activity/task to find and click
     */
    clickTaskVarianceIndicator(activityName) {
        // Find the row containing the specified activity name and click its variance indicator
        cy.get('table.pivot-table tbody tr.item-row').each(($row) => {
            cy.wrap($row).find('td.item-cell').invoke('text').then((cellText) => {
                if (cellText.includes(activityName)) {
                    cy.wrap($row).within(() => {
                        cy.get('td.data-cell[aria-label="Actual"] div.variance-indicator')
                            .should('be.visible')
                            .click();
                        cy.log(`Clicked on ${activityName} variance indicator`);
                    });
                    return false; // Break the each loop
                }
            });
        });

        // Wait for popup to appear and validate it
        cy.wait(1000);
        
        // Verify popup is displayed with the specific structure
        cy.get('div.popup')
            .should('be.visible')
            .within(() => {
                // Verify popup header with close button
                cy.get('div.variance-heading button.close-button')
                    .should('be.visible')
                    .and('contain.text', '×');
                
                // Verify popup navigation tabs
                cy.get('div.popup-header div.popup-nav').within(() => {
                    cy.get('button.popup-tab.active')
                        .should('be.visible')
                        .and('contain.text', 'Variance Details');
                    cy.get('button.popup-tab')
                        .should('be.visible')
                        .and('contain.text', 'Activities');
                });
                this.verifyVarianceTableContent()
                // Click on 'Activities' tab
                cy.get('div.popup-header div.popup-nav button.popup-tab').contains('Activities').click();
                cy.log('Clicked on Activities tab');

                // Wait for the table to update
                cy.wait(3000);

                // Verify table headers for Activities (explicitly for .activities-list)
                // cy.get('div.table-wrapper table.variance-table.activities-list').should('exist').and('be.visible');
                // cy.get('div.table-wrapper table.variance-table.activities-list thead tr th').then($ths => {
                //     const headers = [...$ths].map(th => th.innerText.trim());
                //     cy.log('Activities headers: ' + headers.join(', '));
                //     expect(headers).to.deep.equal([
                //         'ID',
                //         'Activity Name',
                //         'Assignee',
                //         'Planned Start',
                //         'Planned End',
                //         'Baseline Start',
                //         'Baseline Finish',
                //         'Actual Start',
                //         'Actual End',
                //         'Delay',
                //         '% Complete'
                //     ]);
                // });
                this.verifyActivityTableContent(activityName)

                // Click the close button to close the popup
                cy.get('div.variance-heading button.close-button')
                    .should('be.visible')
                    .click();
                cy.log('Clicked close button to close popup');
            });
        }

    verifyVarianceTableContent(){
        // Verify table wrapper and variance table
        cy.get('div.table-wrapper table.variance-table.variance-details')
            .should('exist')
            .and('be.visible');
        
        // Verify table headers for Variance Details
        cy.get('table.variance-table.variance-details thead tr th').then($ths => {
            const headers = [...$ths].map(th => th.innerText.trim());
            cy.log('Variance Details headers: ' + headers.join(', '));
            expect(headers).to.deep.equal([
                'ID',
                'Activity Name',
                'Activity Status',
                'Variance Title',
                'Category',
                'Delay(days)'
            ]);
        });
         // Capture actual report table data and compare with stored unifiedReportData
        cy.get('@unifiedReportData').then((expectedData) => {
            cy.log('Expected data from task details:', JSON.stringify(expectedData));
            
            // Capture actual report table data
            const actualReportData = [];
            cy.get('table.variance-table.variance-details tbody tr').each(($row) => {
                const rowData = [];
                cy.wrap($row).find('td').each(($cell) => {
                    rowData.push($cell.text().trim());
                }).then(() => {
                    actualReportData.push(rowData);
                    cy.log(`Captured report row: [${rowData.join(', ')}]`);
                });
            }).then(() => {
                cy.log('Actual report data:', JSON.stringify(actualReportData));
                
                // Compare expected vs actual data
                expect(actualReportData.length).to.equal(expectedData.length);
                
                for (let i = 0; i < expectedData.length; i++) {
                    cy.log(`Comparing row ${i + 1}:`);
                    cy.log(`Expected: [${expectedData[i].join(', ')}]`);
                    cy.log(`Actual: [${actualReportData[i].join(', ')}]`);
                    
                    // Compare each element individually for better debugging
                    for (let j = 0; j < expectedData[i].length; j++) {
                        const expectedValue = expectedData[i][j];
                        const actualValue = actualReportData[i][j];
                        
                        // Special handling for status column (column 3) to handle "To-Do" vs "To Do"
                        if (j === 2) { // Column 3 (0-indexed)
                            const normalizedExpected = expectedValue.replace(/[-]/g, ' ').trim();
                            const normalizedActual = actualValue.replace(/[-]/g, ' ').trim();
                            expect(normalizedActual, `Row ${i + 1}, Column ${j + 1} (Status) should match`).to.equal(normalizedExpected);
                        } else if (j === 5) { // Delay column (index 5 for 6th column in Variance Details)
                            // Skip assertion for Delay column
                            cy.log(`Skipping assertion for Delay column (Row ${i + 1}, Column ${j + 1})`);
                        } else {
                            expect(actualValue, `Row ${i + 1}, Column ${j + 1} should match`).to.equal(expectedValue);
                        }
                    }
                }
                
                cy.log('Report data matches expected data from task details');
            });
        });
    }
    verifyActivityTableContent(activityName) {       
        cy.get('@taskValuesForReports').then((allExpectedData) => {
            // Filter expected data if activityName is provided
            const expectedData = activityName
                ? allExpectedData.filter(row => row[1] === activityName)
                : allExpectedData;

            cy.log('Expected data from scheduler:', JSON.stringify(expectedData));
            cy.wait(5000)
            // Determine if Actual Start column should be present
            const hasActualStart = expectedData.some(row => row[7] && row[7] !== '-');
            const hasActualEnd = expectedData.some(row => row[8] && row[8] !== '-');

            // Build expected headers
            const expectedHeaders = [
                'ID', 'Activity Name', 'Assignee', 'Planned Start', 'Planned End',
                'Baseline Start', 'Baseline Finish'
            ];
            if (hasActualStart) expectedHeaders.push('Actual Start');
            if (hasActualEnd) expectedHeaders.push('Actual End');
            expectedHeaders.push('Delay', '% Complete');

            // Check headers
            cy.get('table.variance-table.activities-list thead tr th').then($ths => {
                const headers = [...$ths].map(th => th.innerText.trim());
                cy.log('Activities headers: ' + headers.join(', '));
                expect(headers).to.deep.equal(expectedHeaders);
            });

            // Capture actual Activities table data
            const actualActivitiesData = [];
            cy.get('table.variance-table.activities-list tbody tr').each(($row) => {
                const rowData = [];
                cy.wrap($row).find('td').each(($cell) => {
                    rowData.push($cell.text().trim());
                }).then(() => {
                    actualActivitiesData.push(rowData);
                    cy.log(`Captured Activities row: [${rowData.join(', ')}]`);
                });
            }).then(() => {
                cy.log('Actual Activities data:', JSON.stringify(actualActivitiesData));
                expect(actualActivitiesData.length).to.equal(expectedData.length);

                // Create a map of expected data by ID for easier lookup
                const expectedDataMap = {};
                expectedData.forEach(row => {
                    expectedDataMap[row[0]] = row; // row[0] is the ID
                });

                // Compare each actual row with expected data based on ID
                actualActivitiesData.forEach((actualRow, index) => {
                    const actualId = actualRow[0];
                    const expectedRow = expectedDataMap[actualId];

                    if (expectedRow) {
                        cy.log(`Comparing row ${index + 1} with ID ${actualId}:`);
                        cy.log(`Expected: [${expectedRow.join(', ')}]`);
                        cy.log(`Actual: [${actualRow.join(', ')}]`);

                        // Build the expected row for comparison, omitting Actual Start and Actual end if not present
                        let expectedCompareRow;
                        if (hasActualStart) {
                            expectedCompareRow = [
                                expectedRow[0], expectedRow[1], expectedRow[2], expectedRow[3], expectedRow[4],
                                expectedRow[5], expectedRow[6], expectedRow[7], expectedRow[9], expectedRow[10]
                            ];
                        } if (hasActualStart && hasActualEnd) {
                            expectedCompareRow = [
                                expectedRow[0], expectedRow[1], expectedRow[2], expectedRow[3], expectedRow[4],
                                expectedRow[5], expectedRow[6], expectedRow[7], expectedRow[8], expectedRow[9], expectedRow[10]
                            ];
                        } if (!hasActualStart && !hasActualEnd) {
                            // Omit Actual Start and Actual End(index 7)
                            expectedCompareRow = [
                                expectedRow[0], expectedRow[1], expectedRow[2], expectedRow[3], expectedRow[4],
                                expectedRow[5], expectedRow[6], expectedRow[9], expectedRow[10]
                            ];
                        }

                        // Now compare each element
                        for (let j = 0; j < expectedCompareRow.length; j++) {
                            const expectedValue = expectedCompareRow[j];
                            const actualValue = actualRow[j];
                            // Special handling for Delay column (index depends on hasActualStart)
                            let delayColIndex;
                            if (hasActualStart && hasActualEnd) {
                                delayColIndex = 9;
                            } else if (hasActualStart || hasActualEnd) {
                                delayColIndex = 8;
                            } else {
                                delayColIndex = 7;
                            }
                            if (j === delayColIndex) {
                                cy.log(`Skipping assertion for Delay column (Row ${index + 1}, Column ${j + 1})`);
                            } else {
                                expect(actualValue, `Row ${index + 1}, Column ${j + 1} should match for ID ${actualId}`).to.equal(expectedValue);
                            }
                        }
                    } else {
                        cy.log(`Warning: No expected data found for ID ${actualId}`);
                    }
                });

                cy.log('Activities table data matches expected data from scheduler');
            });
        });
    }
    clickTaskWithoutVarianceandVerify(activityName) {
        cy.xpath(`//td[text()="${activityName}"]/parent::tr//td[@class="data-cell data-cell-planned  "]`).click();
            cy.log(`Clicked Planned cell for activity: ${activityName}`);
            this.verifyActivityTableContent(activityName)
            // Click the close button to close the popup
            cy.get('div.variance-heading button.close-button')
                .should('be.visible')
                .click();
            cy.log('Clicked close button to close popup');
    }
    verifyNoDataToShowInReports(){
        this.clickUserGroupVsLocationReportCard()
        cy.xpath('//h2[text()="No Data to Show"]').should('be.visible')
        cy.xpath('//p[text()="Kindly ensure that you have a schedule in place. Additionally, user groups and locations must be linked to the scheduled tasks for the report to display accurate data."]').should('be.visible')
        cy.xpath('//button[text()="OK"]').should('be.visible')
        cy.xpath('//button[text()="OK"]').click({ force : true})
        cy.wait(10000)
        cy.get('[data-testid="today"]').should('be.visible')
        cy.get('[data-testid="edit-plan"]').should('be.visible')
    }

}

export default pivotTablePage;