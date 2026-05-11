import 'cypress-file-upload'

class managePage {

    constructor() {
        this.tableSelector = '.table-wrapper table';
        this.expectedHeaders = [
            'State Grouping',
            'Geometry Categories(Revit Categories)',
            'Process Geometry?',
            'Able to highlight geometry?',
            'Unit',
            'Split Geometry?',
            'Length of Split(UoM from Model)'
        ];
    }

    pageelements={
        accountOption:() => cy.get('[data-testid="account"]'),
    }

    verifyManagePageBeforeFileUploads(){
    // Verify Headers and Main Title
    const headers = {
        mainTitle: 'Digital Progress Reporting',
        subTitle: 'Manage Files',
        goToProgressBtn: 'Go to Progress'
    };

    // Verify header section
    cy.get('.dpr-manage-header').should('have.text', headers.mainTitle);
    cy.get('.dpr-manage-sub-header').should('have.text', headers.subTitle);
    cy.get('.dpr-manage-head button').should('have.text', headers.goToProgressBtn);

    // Verify Schedule Uploads Section
    cy.get('.dpr-manage--section').first().within(() => {
        cy.get('.dpr-manage--section__title').should('have.text', 'Schedule Uploads');
        
        // Explicitly verify that Schedule Upload's Add File button is enabled
        cy.get('button')
            .should('exist')
            .and('not.be.disabled')
            .and('have.text', 'Add File')
            .within(() => {
                cy.get('svg').should('exist');
            });
    });

    // Verify Schedule Upload Table Headers
    const scheduleTableHeaders = [
        'File Details',
        'File Status',
        'Last Updated',
        'Date Uploaded',
        'Uploaded By',
        'In Use',
        'Actions'
    ];

    cy.get('.dpr-manage-table').first().within(() => {
        // Verify table headers
        cy.get('thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', scheduleTableHeaders[index]);
            // // Verify resize bar exists
            // cy.wrap($th).find('.resize-bar').should('exist');
        });

        // Verify empty state message
        cy.get('tbody td').should('have.text', 'Upload a file to begin');
    });

    // Verify Model Uploads Section
    cy.get('.dpr-manage--section').eq(1).within(() => {
        // Verify section title
        cy.get('.dpr-manage--section__title').should('have.text', 'Model Uploads');

        // Verify Setup Model Schema button
        cy.get('.dpr-manage--section_setup_schema_button, .edit-schema-btn')
            .should('exist')
            .and('not.be.disabled')
            .and('contain.text', 'Edit Model Schema')
            .within(() => {
                cy.get('svg').should('exist')
            });

        // Verify Model Upload's Add File button
        cy.contains('button', 'Add File')
            .should('exist')
            .and('not.be.disabled')
            .and('have.attr', 'title', 'Adds new 3D model to the inventory.')
            .within(() => {
                cy.get('svg').should('exist');
            });
    });

    // Verify Model Upload Table Headers
    const modelTableHeaders = [
        'Model Name',
        'Description',
        'Positioning System',
        'File Status',
        'Last Updated',
        'Date Uploaded',
        'Uploaded By',
        'In Use',
        'Actions'
    ];

    cy.get('.dpr-manage-table').eq(1).within(() => {
        // Verify table headers
        cy.get('thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', modelTableHeaders[index]);
            // // Verify resize bar exists
            // cy.wrap($th).find('.resize-bar').should('exist');
        });

        // Verify empty state message
        cy.get('tbody td').should('have.text', 'Upload a file to begin');
    });

    // Verify Checklist Uploads Section
    cy.get('.dpr-manage--section').eq(2).within(() => {
        cy.get('.dpr-manage--section__title').should('have.text', 'Checklist Uploads');

        cy.contains('button', 'Add Checklist')
            .should('exist')
            .and('not.be.disabled')
            .and('have.attr', 'title', 'Adds new checklist to progress activity.')
            .within(() => {
                cy.get('svg').should('exist');
            });
    });

    // Verify Checklist Upload Table Headers
    const checklistTableHeaders = [
        'File Details',
        'Description',
        'Last Updated',
        'Date Uploaded',
        'Uploaded By',
        'Actions'
    ];

    cy.get('.dpr-manage-table').eq(2).within(() => {
        cy.get('thead th').each(($th, index) => {
            cy.wrap($th).should('contain.text', checklistTableHeaders[index]);
        });

        cy.get('tbody td').should('have.text', 'Upload a file to begin');
    });
    }

    gotoProgress(){
        cy.xpath('//button[text()="Go to Progress"]').click()
    }
    selecttask(){

    }
    selectLevel(){

    }
    expandSchedule(){
        cy.wait(5000)
        cy.xpath('//button[text()="Expand "]').click()
        cy.wait(5000)
        cy.xpath('//div[text()="MEP Design Partner Lead in Period"]').scrollIntoView().click()
        cy.log('Closing drawer') // closing left drawer
        cy.get('.dpr-drawer--close> .MuiSvgIcon-root').click()
        // cy.document().then((doc)=>{
        //     const icons = doc.querySelectorAll('.rightPanelMain__icon')
        //     icons[2].click()
        // })
        //opening Filter 
        cy.get(':nth-child(3) > .rightPanelMain__icon > img').click()
        cy.xpath('//span[text()="All levels"]').last().click()
        cy.get(':nth-child(2) > .MuiListItemText-root > .MuiTypography-root').then(($a => {
            expect($a.text()).to.equal('Level 1')
        }))

        //Selecting Level 1 Filter
        cy.get(':nth-child(2) > .MuiListItemIcon-root > svg > rect').click();
        //Selecting Mechanical filter
        cy.get(':nth-child(7) > .rightPanelMain__itemStyle__multiIcon > svg > rect').first().click();
        //closing filter
        cy.get(':nth-child(3) > .rightPanelMain__icon > img').click()
        // cy.contains('All levels').should('not.exist')

        
        cy.get('canvas').then($canvas => {
            let canvas = $canvas[0]; // Get the DOM element from the jQuery object

            //Click on the Marker setup mode - 
            cy.get(':nth-child(4) > .rightPanelMain__icon').click()
            cy.log('Marker mode started for activity linking')

            //Started drawing a line into the 3D image (These dimensions are valid for viewport = 1366 x 768) -  

            let xStart = 648
            let yStart = 330
            let xEnd = 750
            let yEnd = 450
            let i = 0;

            cy.wrap(canvas).trigger('mousedown', { position: "center" });

            //For 45 degree gradient x=y/2 so I took same equation for moving mouse. check graph plotter.            
            while(xStart + i < xEnd && yStart + i < yEnd) {

                cy.wrap(canvas).trigger('mousemove', { clientX: xStart + i, clientY: yStart + i / 2 });
                cy.wrap(canvas).trigger('mousemove', { clientX: xStart + i, clientY: yStart + i / 2.2 });
                i++
            }
            cy.wrap(canvas).trigger('mouseup', { position: "center" });

            //Linking the draw selection with activity 'Level 1 Mechanical Ducts'
            cy.get("svg[title='Link to Activity']").trigger('click')
            cy.get('.Toastify__toast-body').should('be.visible')
            cy.get('.Toastify__toast-body').should('not.be.visible')
            cy.get('canvas').click()
            //Marker setup  Mode end
            cy.get('canvas').matchImageSnapshot('linkedimage')
        })
    }
    verifyUploadProgrammeEmptyState() {
        // Define expected text content
        const expectedContent = {
            title: 'Upload a Schedule',
            fileCount: '0 file(s) completed processing',
            uploadLink: 'Upload a file to start',
            message: 'Generate an activity-driven project Schedule for BIM association.'
        };
    
        // Verify the entire section exists
        cy.get('.UploadProgramme--no-schedule').within(() => {
            // Verify title
            cy.get('.UploadProgramme--no-schedule__title')
                .should('exist')
                .and('have.text', expectedContent.title);
    
            // Verify count section
            cy.get('.UploadProgramme--no-schedule__count').within(() => {
                // Verify file count text
                cy.contains(expectedContent.fileCount).should('exist');
                
                // Verify dot separator exists
                cy.get('.UploadProgramme--no-schedule__count--dot')
                    .should('exist');
                
                // Verify upload link text
                cy.get('.UploadProgramme--no-schedule__count--link')
                    .should('exist')
                    .and('have.text', expectedContent.uploadLink);
            });
    
            // Verify message
            cy.get('.UploadProgramme--no-schedule__message')
                .should('exist')
                .and('have.text', expectedContent.message);
        });
    }
    verifyDPRLandingEmptyState() {
        // Define expected text content
        const expectedContent = {
            title: 'Upload BIM',
            fileCount: '0 file(s) completed processing',
            uploadLink: 'Upload a file to start',
            message: 'Process project BIM geometry for Schedule association.'
        };
    
        // Verify the entire section exists
        cy.get('.dpr-landing--no-bim').within(() => {
            // Verify title - using trim() to handle extra spaces
            cy.get('.dpr-landing--no-bim__title')
                .should('exist')
                .invoke('text')
                .then(text => {
                    expect(text.trim()).to.equal(expectedContent.title);
                });
    
            // Verify count section
            cy.get('.dpr-landing--no-bim__count').within(() => {
                // Verify file count text
                cy.contains(expectedContent.fileCount).should('exist');
                
                // Verify dot separator exists
                cy.get('.dpr-landing--no-bim__count--dot')
                    .should('exist');
                
                // Verify upload link text - using trim()
                cy.get('.dpr-landing--no-bim__count--link')
                    .should('exist')
                    .invoke('text')
                    .then(text => {
                        expect(text.trim()).to.equal(expectedContent.uploadLink);
                    });
            });
    
            // Verify message - using trim()
            cy.get('.dpr-landing--no-bim__count---message')
                .should('exist')
                .invoke('text')
                .then(text => {
                    expect(text.trim()).to.equal(expectedContent.message);
                });
        });
    }

    clickOnSetUpModelSchema(){
        cy.get('[data-testid="PermDataSettingOutlinedIcon"]')
        .parent('button.dpr-manage--section_setup_schema_button')
        .click()
    }

    validateHeaderElements() {
        // Verify header container exists
        cy.get('.header-area').should('exist');
    
        // Verify back button
        cy.get('.back-button')
            .should('exist')
            .and('be.visible')
            .invoke('text')
            .then((text) => {
                const normalizedText = text.replace(/\s+/g, ' ').trim();
                expect(normalizedText).to.equal('< Back');
            });
    
        // Verify info icon and text
        cy.get('[data-testid="InfoIcon"]')
            .should('exist')
            .and('be.visible')
            .parent('div.text-info')  // Get parent div
            .should('exist')
            .and('be.visible')
            .invoke('text')
            .then((text) => {
                const normalizedText = text.replace(/\s+/g, ' ').trim();
                expect(normalizedText).to.equal(`Changes during your project’s life cycle may cause data loss.`);
            });
        
        // Verify header buttons
        cy.get('.header-buttons')
            .should('exist')
            .within(() => {
                // Verify Default Schema button
                cy.get('.default-schema-button')
                    .should('exist')
                    .and('be.visible')
                    .and('have.text', 'Use Default Schema and Continue')
                    .and('not.be.disabled');
    
                // Verify Save Changes button
                cy.get('.save-changes-button')
                    .should('exist')
                    .and('be.visible')
                    .and('have.text', 'Save Changes and Continue ')
                    .and('not.be.disabled');
            });
    }
    verifySchemaTitle() {
        // Verify container exists
        cy.get('.schema-options')
            .should('exist')
            .and('be.visible')

        // Verify title
        cy.get('.schema-options .schema-title')
            .should('exist')
            .and('be.visible')
            .and('have.text', 'Setup Model Schema')
            .and('not.be.empty')

        cy.get('.table-title')
        .should('exist')
        .and('be.visible')
        .and('have.text', 'Modify your Model Processing Schema')

        cy.get('.table-description')
        .should('exist')
        .and('be.visible')
        .and('have.text', 'Fill out the chart below to setup how your team will Progress your project.')
    }
    verifyTableHeaders() {
        // Verify each header text
        cy.get(`${this.tableSelector} thead tr th span`).each(($headerSpan, index) => {
            cy.wrap($headerSpan)
                .invoke('text')
                .should('eq', this.expectedHeaders[index]);
        });
    }
    verifyRowValues($row, expectedValues) {
        // Verify State Grouping (first column)
        cy.wrap($row)
            .find('td:nth-child(1) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.stateGrouping);

        // Verify Category (second column)
        cy.wrap($row)
            .find('td:nth-child(2)')
            .invoke('text')
            .should('eq', expectedValues.category);

        // Verify Process Geometry (third column)
        cy.wrap($row)
            .find('td:nth-child(3) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.processGeometry);

        // Verify Highlight Geometry (fourth column)
        cy.wrap($row)
            .find('td:nth-child(4) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.highlightGeometry);

        // Verify Unit (fifth column)
        cy.wrap($row)
            .find('td:nth-child(5) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.unit);

        // Verify Split Geometry (sixth column)
        cy.wrap($row)
            .find('td:nth-child(6) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.splitGeometry);

        // Verify Length of Split (seventh column)
        cy.wrap($row)
            .find('td:nth-child(7) .custom-select-label')
            .invoke('text')
            .should('eq', expectedValues.lengthOfSplit);
    }

    verifyAllTableRows(fixtureJSON) {
        // First verify headers
        this.verifyTableHeaders();

        // Snapshot the entire table and deep-compare in one assertion
        // This avoids queuing 420+ Cypress commands (56 rows × 7 columns)
        cy.get(`${this.tableSelector} tbody tr`)
            .should('have.length', fixtureJSON.rows.length)
            .then($rows => {
                const actual = [...$rows].map(row => {
                    const label = (n) => row.querySelector(`td:nth-child(${n}) .custom-select-label`)?.textContent;
                    return {
                        stateGrouping: label(1),
                        category: row.querySelector('td:nth-child(2)')?.textContent,
                        processGeometry: label(3),
                        highlightGeometry: label(4),
                        unit: label(5),
                        splitGeometry: label(6),
                        lengthOfSplit: label(7),
                    };
                });
                expect(actual).to.deep.equal(fixtureJSON.rows);
            });
    }  
    
    findRowByCategory(categoryName) {
        return cy.get('tbody tr')
            .contains('td', categoryName)
            .parent('tr');
    }

    verifyAndChangeDropdown(tdIndex, currentValue, expectedOptions) {
        // Click the dropdown to open it
        cy.get(`td:nth-child(${tdIndex + 1}) .custom-select-label`)
            .should('have.text', currentValue)
            .click();

        // Verify dropdown options
        cy.get('.dropdown-list')
            .should('be.visible')
            .within(() => {
                // Verify all expected options exist
                expectedOptions.forEach(option => {
                    cy.get('.dropdown-item')
                        .contains(option)
                        .should('exist');
                });

                // Find current value's index and click next option
                cy.get('.dropdown-item')
                    .then($items => {
                        const items = $items.map((_, el) => Cypress.$(el).text()).get();
                        const currentIndex = items.indexOf(currentValue);
                        const nextIndex = (currentIndex + 1) % items.length;
                        cy.get('.dropdown-item')
                            .eq(nextIndex)
                            .click();
                    });
            });

        // Verify the new selection is displayed
        cy.get(`td:nth-child(${tdIndex + 1}) .custom-select-label`)
            .should('not.have.text', currentValue);
    }

    verifySingleRow(categoryName,ExpectedRowValues,dropdownOptions) {
        this.findRowByCategory(categoryName)
            .within(($row) => {
                // Verify initial values
                Object.entries(ExpectedRowValues).forEach(([columnIndex, value]) => {
                    if (columnIndex === '1') {
                        // Category column (direct text)
                        cy.get(`td:nth-child(${parseInt(columnIndex) + 1})`)
                            .should('have.text', value);
                    } else {
                        // Dropdown columns
                        cy.get(`td:nth-child(${parseInt(columnIndex) + 1}) .custom-select-label`)
                            .should('have.text', value);
                    }
                });

                // Test dropdowns
                Object.entries(dropdownOptions).forEach(([columnIndex, options]) => {
                    cy.get(`td:nth-child(${parseInt(columnIndex) + 1}) .custom-select-container`)
                        .then($container => {
                            if (!$container.hasClass('disabled')) {
                                this.verifyAndChangeDropdown(
                                    parseInt(columnIndex),
                                    ExpectedRowValues[columnIndex],
                                    options
                                );
                            }
                        });
                });
            });
    }

    clickSaveChangesAndContinue() {
        cy.get('.save-changes-button')
            .should('be.visible')
            .and('not.be.disabled')
            .and('have.text', 'Save Changes and Continue ')
            .click()
    }

    verifyModalContent(expectedMessage) {
        // Verify modal is visible
        cy.get('.cdp-modal-content')
            .should('be.visible')

        // Verify modal title
        cy.get('.cdp-modal-title')
            .should('be.visible')
            .and('have.text', 'Caution')

        // Verify modal message
        cy.get('.cdp-modal-content')
            .invoke('text')
            .should('contain', expectedMessage)
            .and('contain', 'Do you wish to proceed?')

        // Verify buttons exist
        cy.get('.nav-btn-container')
            .within(() => {
                cy.get('.nav-btn')
                    .not('.proceed')
                    .should('be.visible')
                    .and('have.text', 'Cancel')

                cy.get('.nav-btn.proceed')
                    .should('be.visible')
                    .and('have.text', 'Proceed')
            });
    }

    clickProceed() {
        cy.get('.nav-btn.proceed')
            .should('be.visible')
            .and('not.be.disabled')
            .click()
    }

    saveChangesAndProceed() {
        this.clickSaveChangesAndContinue()
        this.verifyModalContent('You are about to make a BIM schema change.')
        this.clickProceed()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Successfully updated project schema', 'Successfully updated project schema')
        })    
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist') 
    }

    clickDefaultSchemaButton() {
        cy.get('.default-schema-button')
            .should('be.visible')
            .and('not.be.disabled')
            .and('have.text', 'Use Default Schema and Continue')
            .click();
    }

    useDefaultSchemaandContinue() {
        this.clickDefaultSchemaButton()
        this.verifyModalContent('You are about to replace your current BIM schema with the default schema.')
        this.clickProceed()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Successfully updated project schema', 'Successfully updated project schema')
        })   
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist')  
    }

    changeAndVerifyColumns(categoryName, expectedValues) {
        this.findRowByCategory(categoryName)
            .within(($row) => {
                // Helper function to change dropdown value
                const changeDropdownValue = (tdIndex, newValue) => {
                    cy.get(`td:nth-child(${tdIndex}) .custom-select-label`)
                        .click();

                    cy.get('.dropdown-list')
                        .should('be.visible')
                        .within(() => {
                            cy.contains('.dropdown-item', newValue).click();
                        });

                    cy.get(`td:nth-child(${tdIndex}) .custom-select-label`)
                        .should('have.text', newValue);
                };

                // Helper function to verify disabled state and value
                const verifyDisabledColumns = (startIndex, expectedValues) => {
                    expectedValues.forEach((value, i) => {
                        const colIndex = startIndex + i;
                        cy.get(`td:nth-child(${colIndex}) .custom-select-container`)
                            .should('have.class', 'disabled');

                        cy.get(`td:nth-child(${colIndex}) .custom-select-label`)
                            .should('have.class', 'disabled')
                            .and('have.text', value);
                    });
                };

                // Change 'Process Geometry?' to 'False' and verify
                changeDropdownValue(3, 'False');
                verifyDisabledColumns(4, expectedValues.slice(1));

                // Set 'Process Geometry?' back to 'True'
                changeDropdownValue(3, 'True');

                // Change 'Able to highlight geometry?' to 'False' and verify
                changeDropdownValue(4, 'False');
                verifyDisabledColumns(5, expectedValues.slice(2));

                // Set 'Able to highlight geometry?' back to 'True'
                changeDropdownValue(4, 'True');

                // Change 'Unit' to 'Do Not quantify' and verify
                changeDropdownValue(5, 'Do Not quantify');
                verifyDisabledColumns(6, expectedValues.slice(3));

                // Set 'Unit' back to the original value
                changeDropdownValue(5, expectedValues[2]);

                // Change 'Split Geometry?' to 'False' and verify
                changeDropdownValue(6, 'False');
                verifyDisabledColumns(7, expectedValues.slice(4));

                // Set 'Split Geometry?' back to 'True'
                changeDropdownValue(6, 'True');

                // Change 'Length of Split(UoM from Model)' to '2 meters' and verify no other columns are disabled
                changeDropdownValue(7, '2 meters');
                cy.get(`td:nth-child(7) .custom-select-container`)
                    .should('not.have.class', 'disabled');
            });
    }

    clickReplaceOrAddFileForSchedule() {
        cy.get('.dpr-manage--section').contains('.dpr-manage--section__title', 'Schedule Uploads')
          .parents('.dpr-manage--section')
          .then($section => {
            // Check for Replace File button inside this section
            const $replaceBtn = $section.find('button.replace-button:visible');
            if ($replaceBtn.length > 0) {
              cy.wrap($replaceBtn).click();
            } else {
              // Otherwise, click Add File button
              const $addBtn = $section.find('button:contains("Add File"):visible');
              cy.wrap($addBtn).click();
            }
          })
      }

    uploadScheduleFile(fileName,fileType = "Microsoft Project (MPP and XML)"){
        //Select the file type
        // cy.get('.dpr-upload-card--file-type-option')
        // .contains(fileType)
        // .click()

        cy.get('.dpr-upload-card').find("input[type='file']").attachFile(fileName) 
        //Wait for the Upload button to be enabled and click it
        cy.get('.dpr-upload-card--button')
        .contains('Upload')
        // .should('not.be.disabled')
        .click()

        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Your file has been successfully uploaded', 'Your file has been successfully uploaded')
        }) 
        // Use Cypress's built-in wait for the UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist') 

        //click on continue
        this.verifyUploadSuccessAndContinue()

        this.verifyUploadIsSuccess()

    }

    verifyUploadSuccessAndContinue() {
        // Verify the upload success popup is visible
        cy.get('.dpr-upload-success').should('be.visible').within(() => {
          // Verify the title text
          cy.get('.dpr-upload-success-title')
            .should('be.visible')
            .and('have.text', 'Your file has been successfully added!')
      
          // Verify the detail text for both schedule and model uploads
          cy.get('.dpr-upload-success-detail')
            .should('be.visible')
            .then($detail => {
              const detailText = $detail.text()
              expect(detailText).to.satisfy(text =>
                text.includes('It may take a few minutes to process your file.') ||
                text.includes('It may take a few minutes to process your model. You will receive an email when it\'s ready to use.')
              )
            })
      
          // Click the Continue button
          cy.get('.dpr-upload-card--button')
            .should('be.visible')
            .and('have.text', 'Continue')
            .click()
        })
      }

      verifyUploadIsSuccess(){
        // Wait for the import icon to appear
        cy.get('td[title="import"] svg').should('exist');

        // Now wait for the published icon to appear (this will retry until it exists)
        cy.get('td[title="published"] svg')
        .should('exist')
        .and('be.visible')
        .find('circle[stroke="#2BB614"]')
        .should('exist');
    }
    verifyFirstScheduleRow({ fileName, userName }) {
        // Get today's date in DD-MMM-YY format
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = today.toLocaleString('en-US', { month: 'short' });
        const year = String(today.getFullYear()).slice(-2);
        const todayStr = `${day}-${month}-${year}`;
        
        cy.get('.dpr-manage-table tbody tr').first().within(() => {
            // File Details
            cy.get('td').eq(0).should('have.text', fileName);
        
            // File Status: green circle (published)
            cy.get('td').eq(1)
            .should('have.attr', 'title', 'published')
            .find('circle[stroke="#2BB614"]')
            .should('exist');
        
            // Date Uploaded
            cy.get('td').eq(3)
            .invoke('text')
            .then(text => {
                expect(text.trim()).to.equal(todayStr);
            });
        
            // Uploaded By
            cy.get('td').eq(4)
            .find('span.updated-icon')
            .should('have.text', userName);
        
            // In Use: tickmark (Active Schedule)
            cy.get('td').eq(5)
            .should('have.attr', 'title', 'Active schedule.')
            .find('svg')
            .should('exist');

            // //Verify Replace File button is visible in the Schedule Uploads section
            // cy.get('.dpr-manage--section').contains('.dpr-manage--section__title', 'Schedule Uploads')
            // .parents('.dpr-manage--section')
            // .find('button.replace-button')
            // .should('be.visible')
        })
    }

    deleteAllButFirstRow() {
        cy.get('.dpr-manage-table').first().within(() => {
          cy.wait(3000); // Optional: Wait for any initial loading
      
          // Find tbody tr elements
          cy.get('tbody tr').then($rows => {
            const rowCount = $rows.length;
            cy.log(rowCount);
      
            // Iterate over all rows starting from the second one
            for (let i = 1; i < rowCount; i++) {
              // Re-query the rows each time to ensure the DOM is up-to-date
              cy.get('tbody tr').eq(1).within(() => {
                // Click the delete icon in the "Actions" cell of the current row
                cy.get('.dpr-manage-table--actions svg').click();
              })
      
              // Verify the delete confirmation modal
              cy.xpath('//div[text()="Delete Schedule"]').should('be.visible')
              cy.xpath('//button[text()="Delete"]').click({force:true})

            //   // Verify the success message
            //   cy.get('.msgtoaster__text').should('have.text', 'The file has been successfully deleted');
            //   cy.get('.msgtoaster__text').should('not.exist');
      
              // Wait for the row to be deleted before proceeding to the next
              cy.get('tbody tr').should('have.length', rowCount - i);
            }
          });
        });
      }
      clickReplaceOrAddFileForModel() {
        cy.get('.dpr-manage--section').contains('.dpr-manage--section__title', 'Model Uploads')
          .parents('.dpr-manage--section')
          .then($section => {
            //click Add File button
              const $addBtn = $section.find('button:contains("Add File"):visible')
              cy.wrap($addBtn).click()
            })
      }
      verifyAndUploadModel(modelFileName, discipline) {
        // Verify the upload card is visible
        cy.get('.dpr-upload-card').should('be.visible').within(() => {
            // Verify the upload model title
            cy.get('.dpr-upload-card--name').should('have.text', 'Upload Model');
      
            // Verify the file type options
            cy.get('.dpr-upload-card--file-type-option').eq(0).within(() => {
                cy.get('span').should('have.text', 'Autodesk Revit (.rvt 2011 and higher)');
            });
            cy.get('.dpr-upload-card--file-type-option').eq(1).within(() => {
                cy.get('span').should('have.text', 'IFC (2.1 - 4.3.2)');
            });
      
            // Verify the drag and drop area
            cy.get('.dpr-upload-card--upload-text').within(() => {
                cy.contains('Drag and drop file');
                cy.contains('or').within(() => {
                    cy.get('label').should('have.text', 'Browse Computer');
                });
            });
      
            // Verify the description input
            cy.get('input[type="text"]').should('have.attr', 'maxlength', '500');
      
            // Verify the model discipline dropdown
            cy.get('#model-discipline-label').should('have.text', 'Select a Model Discipline *');
            cy.get('[data-testid="SearchIcon"]').should('exist');
      
            // Verify the action buttons
            cy.get('.dpr-upload-card--button__cancel').should('have.text', 'Cancel');
            cy.get('.dpr-upload-card--button').contains('Upload').should('be.disabled');

            // Read file before upload to verify it's not corrupted
            cy.readFile(`cypress/fixtures/${modelFileName}`, 'binary').then((fileContent) => {
                // Log file size for verification
                cy.log(`File size before upload: ${fileContent.length} bytes`);
                
                // Log the first few bytes for debugging
                const fileHeader = new Uint8Array(fileContent.slice(0, 8));
                cy.log('File header bytes:', Array.from(fileHeader).map(b => b.toString(16).padStart(2, '0')).join(' '));
                
                // Upload the file with proper encoding
                cy.get('input[type="file"]').attachFile({
                    fileContent,
                    fileName: modelFileName,
                    mimeType: 'application/octet-stream',
                    encoding: 'binary',
                    lastModified: new Date().getTime()
                });
            });
      
            // Select model discipline
            // cy.get('#model-discipline').click();
            // cy.wait(10000);
            // cy.xpath(`//li[text()="${discipline}"]`).click({force:true});
            cy.get('input[placeholder="Type or select a Model Discipline"]').type(discipline)
            cy.get('[data-testid="filecard"]').click()
            // Enable and click the upload button
            cy.get('.dpr-upload-card--button').contains('Upload').should('not.be.disabled').click();
        });

        // Verify upload success message
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Your file has been successfully uploaded', 'Your file has been successfully uploaded');
        }); 
        
        // Wait for UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist'); 
        
        // Click continue and verify upload success
        this.verifyUploadSuccessAndContinue();
        this.waitForModelProcessingToComplete();
    }

    waitForModelProcessingToComplete() {
        // Intercept the GraphQL request
        cy.interceptGraphQlRequest("fetchBimModelList").as('fetchBimModelList');
        
        let previousStatus = null;
        let attempts = 0;
        const maxAttempts = 120; // 10 minutes with 5-second intervals
        
        const checkStatus = () => {
            cy.wait('@fetchBimModelList', { timeout: 10000 }).then((interception) => {
                attempts++;
                
                if (attempts > maxAttempts) {
                    throw new Error('Model processing did not complete within the expected time (10 minutes)');
                }

                const bimModel = interception.response.body.data.bimModel[0];
                if (!bimModel || !bimModel.bimModelStatuses || bimModel.bimModelStatuses.length === 0) {
                    cy.log('No model status found, retrying...');
                    cy.wait(5000);
                    checkStatus();
                    return;
                }

                const currentStatus = bimModel.bimModelStatuses[0].status;
                
                // Log status change if it's different from previous status
                if (currentStatus !== previousStatus) {
                    cy.log(`Model processing status changed: ${previousStatus || 'INITIAL'} -> ${currentStatus}`);
                    previousStatus = currentStatus;
                    
                    // Check for failure status
                    if (currentStatus === "MODEL_PROCESSING_FAILED") {
                        throw new Error('Model file upload failed - processing status: MODEL_PROCESSING_FAILED');
                    }
                }
                
                if (currentStatus === "COMPLETED") {
                    // Log final status details
                    const finalStatus = bimModel.bimModelStatuses[0];
                    cy.log('Final model processing status:');
                    cy.log(`- Status: ${finalStatus.status}`);
                    cy.log(`- Geometry Status: ${finalStatus.geometryStatus}`);
                    cy.log(`- Property Status: ${finalStatus.propertyStatus}`);
                    cy.log(`- Completed At: ${finalStatus.completedAt}`);
                    
                    // Verify final status
                    expect(finalStatus.status).to.equal('COMPLETED');
                    expect(finalStatus.geometryStatus).to.be.true;
                    expect(finalStatus.propertyStatus).to.be.true;
                    return;
                }
                
                // If not completed, wait and check again
                cy.wait(5000);
                checkStatus();
            });
        };

        // Start checking status with error handling
        cy.wrap(null).then(() => {
            try {
                checkStatus();
            } catch (error) {
                cy.log(`Error in model processing: ${error.message}`);
                throw error;
            }
        });
    }

    clickThreeDotMenuForFile(fileName) {
        // Find the row containing the file name and click its three-dot menu button
        cy.get('.dpr-manage-table tbody tr').contains('td', fileName)
            .parent('tr')
            .within(() => {
                // Click the three-dot menu button in the Actions column
                cy.get('button.MuiIconButton-root').click();
            });
    }

    clickDeleteModelMenuItem() {
        // Click the Delete Model menu item
        cy.get('li.MuiMenuItem-root')
            .contains('Delete Model')
            .click();
    }

    verifyDeleteModelPopup() {
        // Verify the modal content
        cy.get('.cdp-modal-content').should('be.visible').within(() => {
            // Verify title
            cy.get('.cdp-modal-title').should('have.text', 'Delete Model');
            
            // Verify message
            cy.get('.confirmation-message').should('have.text', 
                'All linked geometries and progress data for the selected model will be deleted. If you want to update to a more recent version of this model, please use the replace option. Continue to Delete?'
            );
            
            // Verify buttons
            cy.get('.cdp-delete').should('have.text', 'Cancel');
            cy.get('.delete-btn').should('have.text', 'Delete');
        });
    }

    clickDeleteConfirmationButton() {
        // Click the Delete button in the confirmation popup
        cy.get('.delete-btn').click();
    }

    deleteModel(fileName) {
        // First click the three-dot menu for the file
        this.clickThreeDotMenuForFile(fileName);
        // Then click the Delete Model menu item
        this.clickDeleteModelMenuItem();
        // Verify the delete confirmation popup
        this.verifyDeleteModelPopup();
        // Click the delete confirmation button
        this.clickDeleteConfirmationButton();
        // Verify upload success message
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Selected model deletion started successfully', 'Selected model deletion started successfully');
        }); 
        
        // Wait for UI to stabilize
        cy.get('.msgtoaster__text').should('not.exist'); 
    }
}
export default managePage;