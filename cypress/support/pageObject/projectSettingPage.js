class projectSettingPage {
    pageelements = {
        // Add page elements here as needed
    }

    navigateToProjectSettingOption(expectedProjectName,navigationText) {
        cy.get('div.left-navBar__project__details__name label[aria-label="first name"]')
            .should('have.attr', 'title', expectedProjectName)
            .and('contain.text', expectedProjectName)
        cy.wait(3000)
        cy.log("project page page is displayed, selecting the option")
        // Click on the specified navigation text in the left navigation bar
        cy.contains('div.left-navBar__item__content__text', navigationText).click()
        cy.wait(7000) // Wait for page to load
    }

    verifyAndCreateUserGroup(groupName = 'design', membersEmail) {
        cy.get('table.usergroupTable__table tbody').then($tbody => {
            // Check if the specific group name already exists in any row
            const groupExists = $tbody.find('td').filter(function() {
                return Cypress.$(this).text().trim().toLowerCase() === groupName.toLowerCase()
            }).length > 0

            if (groupExists) {
                cy.log(`User group '${groupName}' already exists. Skipping creation.`);
                return;
            }

            cy.log(`Creating user group '${groupName}'.`);
            cy.contains('div.header-wrapper__text', 'User Groups').should('be.visible')
            cy.contains('span.MuiButton-label', 'Create a New Group').should('be.visible')
            cy.contains('span.MuiButton-label', 'Create a New Group').click()
            cy.get('div[data-testid="userGroup-name"] input[placeholder="Enter a name"]').should('be.visible').type(groupName)
            cy.wait(2000)
            cy.get('table.ProjectUserListTable__table tbody tr').each(($tr) => {
                const emailText = $tr.find('label[aria-label="User group email"]').text().trim()
                if (membersEmail.includes(emailText)) {
                    cy.wrap($tr)
                      .find('td.MuiTableCell-paddingCheckbox input[type="checkbox"]')
                      .then(($cb) => {
                          if (!$cb.is(':checked')) {
                              cy.wrap($cb).check({ force: true })
                          }
                      })
                }
            })
            cy.contains('span.MuiButton-label', 'Save Changes').click()
            cy.get('button[data-testid="create-usergroup"]').click()
            cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                assert.equal(successMsg.text(), 'Created user group successfully', 'Created user group successfully')
            });
            cy.get('.msgtoaster__text').should('not.exist');
        });
    }

    verifyAndCreateLocation() {
        cy.contains('div.header-wrapper__text', 'Location Management').should('be.visible');
        cy.contains('div.LocationManagement__body__header__left', 'List Items').should('be.visible');

        cy.get('div.LocationManagement__body__content').then($content => {
            if ($content.find('button.LocationManagement__body__content__item__left__btn').length > 0) {
                    cy.get('button.LocationManagement__body__content__item__left__btn').click()
                    cy.get('div.LocationManagement__body__content').then($content =>{
                        if($content.find('[data-testid="add-newitem-input"]').length > 0) {
                            this.createLocation('phase1')
                            // Verify the "Click to add list item" button is visible after creation
                            cy.get('button[data-testid="add-newitem"]').should('be.visible')
                            cy.get('button.LocationSubItem__element__item__left__btn').click()
                            this.createLocation('building1')
                            cy.wait(5000)
                        } else if($content.find('div.LocationSubItem__element__item').length > 0){
                            cy.log('Location(s) already exist. Skipping creation.');
                            return;
                        }
                    })
                }
            })
        
    }

    createLocation(locationName) {
        // Type the location name into the input field
        cy.get('div[data-testid="add-newitem-input"] input[placeholder="Enter an Item name"]')
            .should('be.visible')
            .type(locationName)
        // Click on the first Add List Item button (in case there are multiple)
        cy.get('button.LocationSubItem__element__addItem__btn').first().click()
    }

    verifyAndUploadClassificationcode(fileName = 'My_Classification code 5.xlsx') {
        cy.get('.projectSettings__rightSide').then($rightSide => {
            if ($rightSide.find('table.ClassificationCodeTable').length > 0) {
                cy.log('Classification code(s) already exist. Skipping upload.');
                return;
            }
            if ($rightSide.find('p').text().includes('No Classification Code found')) {
                cy.log('No classification code found. Proceeding to upload classification code file.');
                // Verify Classification Code header is visible
                cy.get('div.ProjectMaterialMaster-header h2.MuiTypography-body1')
                    .should('be.visible')
                    .and('contain.text', 'Classification Code')
                
                // Verify search form elements are visible
                cy.get('button[aria-label="menu"]').should('be.visible')
                cy.get('input#list-search-text[placeholder="Search by Name, Code"]').should('be.visible')
                
                // Verify Download Template and Upload buttons are visible
                cy.get('button.ProjectMaterialMaster-header__download').should('be.visible')
                cy.get('button.ProjectMaterialMaster-header__upload').should('be.visible')
                
                // Attach file to the hidden file input element
                cy.get('input[type="file"][accept=".xlsx"]').attachFile(fileName)
                
                // Click Upload button to trigger the upload
                cy.get('button.ProjectMaterialMaster-header__upload').click()
                // Wait for the success toast message and assert its text  
                cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                    assert.equal(successMsg.text(), 'Classification codes imported.', 'Classification codes imported.');
                });   
                // Wait for the toaster to disappear
                cy.get('.msgtoaster__text').should('not.exist');
            } else {
                // Fallback: If neither table nor message
                cy.log('No classification code found. Proceeding to upload classification code file.');
                // Verify Classification Code header is visible
                cy.get('div.ProjectMaterialMaster-header h2.MuiTypography-body1')
                    .should('be.visible')
                    .and('contain.text', 'Classification Code')
                
                // Verify search form elements are visible
                cy.get('button[aria-label="menu"]').should('be.visible')
                cy.get('input#list-search-text[placeholder="Search by Name, Code"]').should('be.visible')
                
                // Verify Download Template and Upload buttons are visible
                cy.get('button.ProjectMaterialMaster-header__download').should('be.visible')
                cy.get('button.ProjectMaterialMaster-header__upload').should('be.visible')
                
                // Attach file to the hidden file input element
                cy.get('input[type="file"][accept=".xlsx"]').attachFile(fileName)
                
                // Click Upload button to trigger the upload
                cy.get('button.ProjectMaterialMaster-header__upload').click()
                // Wait for the success toast message and assert its text  
                cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                    assert.equal(successMsg.text(), 'Classification codes imported.', 'Classification codes imported.');
                });   
                // Wait for the toaster to disappear
                cy.get('.msgtoaster__text').should('not.exist');
            }
        });
    }
    setDecimalPrecision(precisionValue = '0') {
        cy.get('div.schedule-settings__row').contains('p', 'Show decimal values for % progress')
            .closest('div.schedule-settings__row')
            .find('input[type="radio"]:checked')
            .invoke('val')
            .then((currentValue) => {
                if (currentValue === precisionValue) {
                    cy.log(`Already set to ${precisionValue}`)
                } else {
                    cy.get('div.schedule-settings__row').contains('p', 'Show decimal values for % progress')
                        .closest('div.schedule-settings__row')
                        .find(`input[type="radio"][value="${precisionValue}"]`)
                        .parent('span')
                        .click({ force: true })
                    cy.get('.msgtoaster__text', { timeout: 10000 }).should('have.text', 'Setting updated successfully')
                    cy.get('.msgtoaster__text').should('not.exist')
                }
            })
    }

    enableUserGroup(enable = true) {
        const targetValue = enable ? "userGroup" : "assignee";
        cy.get(`input[type="radio"][value="${targetValue}"]`).then(($input) => {
            const isChecked = $input.is(':checked')
            if(!isChecked){
                cy.wrap($input)
                  .parents('span.MuiButtonBase-root')
                  .first()
                  .click({force:true})
                cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                    assert.equal(successMsg.text(), 'Setting updated successfully', 'Setting updated successfully')
                })
                cy.get('.msgtoaster__text').should('not.exist')
            } else {
                cy.log(`${enable ? 'User Group' : 'Assignee'} option already enabled; skipping toggle`)
            }
        })
    }
    toggleVarianceControl(enable = true){
        cy.get('input[type="checkbox"][aria-label="Schedule variance control"]').then(($checkbox) => {
            const isChecked = $checkbox.is(':checked')
            if(enable && !isChecked){
                cy.wrap($checkbox).click({force:true})
                cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                    assert.equal(successMsg.text(), 'Setting updated successfully', 'Setting updated successfully')
                })
                cy.get('.msgtoaster__text').should('not.exist')
            } else if(!enable && isChecked){
                cy.wrap($checkbox).click({force:true})
                cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                    assert.equal(successMsg.text(), 'Setting updated successfully', 'Setting updated successfully')
                })
                cy.get('.msgtoaster__text').should('not.exist')
            } else {
                cy.log(`Schedule variance control already ${enable ? 'enabled' : 'disabled'}; skipping`)
            }
        })
    }
    addUsersIntoTeams(userName){
        cy.get('[data-testid="edit-team"]').click({force:true})
        cy.get('input[id="edit-team"]').clear().type(userName)
        cy.wait(1000)
        // Find matching user row and ensure checkbox is checked
        cy.contains('tr', userName)
            .should('exist')
            .within(() => {
            cy.get('input[type="checkbox"][aria-labelledby^="enhanced-table-checkbox-"]')
                .then(($cb) => {
                const isChecked = $cb.is(':checked')
                if(!isChecked){
                    cy.wrap($cb).click({force:true})
                } else {
                    cy.log('User already selected; skipping checkbox toggle')
                }
                })
        })
        cy.get('[aria-labelledby="user-role-undefined"]').click()
        cy.get("ul li").contains('Project Administrator').click()
        //save changes
        cy.get('[data-testid="save-edit-team"]').click({force:true})
        cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
            assert.equal(successMsg.text(), 'Successfully updated', 'Successfully updated')
        })
        cy.get('.msgtoaster__text').should('not.exist')
    }
    addUsersIntoUserGroup(groupName, emails = []){
        cy.wait(3000)
        // Click on the row matching the group name
        cy.get('table.usergroupTable__table tbody tr').contains('td', groupName).click({force:true})
        cy.wait(1000)
        cy.get('[data-testid="edit-add-teammates"]').click({force:true})
        cy.wait(1000)
        // Check only the checkboxes for rows whose email matches the provided list
        emails.forEach((email) => {
            cy.get('table.ProjectUserListTable__table tbody tr').each(($tr) => {
                const emailText = $tr.find('label[aria-label="User group email"]').text().trim()
                if (emailText === email) {
                    cy.wrap($tr)
                      .find('td.MuiTableCell-paddingCheckbox input[type="checkbox"]')
                      .then(($cb) => {
                          if (!$cb.is(':checked')) {
                              cy.wrap($cb).check({ force: true })
                          }
                      })
                }
            })
        })
        // Verify the correct number of checkboxes are checked
        cy.get('table.ProjectUserListTable__table tbody tr td.MuiTableCell-paddingCheckbox input[type="checkbox"]:checked')
          .should('have.length', emails.length)
        //save changes
        cy.xpath('//span[text()="Save Changes"]').click({force:true})
        cy.xpath('//span[text()="Update"]').click({force:true})
        cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
            assert.equal(successMsg.text(), 'Updated successfully', 'Updated successfully')
        })
        cy.get('.msgtoaster__text').should('not.exist')
    }

    deleteAllUserGroups() {
        cy.wait(2000)
        cy.get('body').then($body => {
            const deleteButtons = $body.find('button[aria-label="Delete usergroup"]');
            if (deleteButtons.length > 0) {
                for (let i = 0; i < deleteButtons.length; i++) {
                    cy.get('button[aria-label="Delete usergroup"]').first().click({ force: true })
                    cy.wait(500)
                    cy.get('body').then($modalBody => {
                        const confirmBtn = $modalBody.find('div[role="dialog"] button:contains("Delete")');
                        if (confirmBtn.length > 0) {
                            cy.wrap(confirmBtn).click({ force: true })
                        }
                    })
                    cy.wait(1000)
                }
            } else {
                cy.log('No user groups found to delete.')
            }
        })
    }
    addProjectMaterial() {
        cy.xpath('//h2[text()="Project Material Master"]').should('be.visible')
        cy.wait(5000)
        // Empty-state validation
        cy.contains('p.MuiTypography-root', 'Add some materials to your project to get started').should('be.visible')
        cy.contains('button span', 'Add Material').should('be.visible').click({ force: true })

        // Step 1 modal validations
        cy.get('div[role="dialog"]').should('be.visible')
        cy.get('div[role="dialog"] h2').contains('Add Material').should('be.visible')
        cy.get('div[role="dialog"] input#list-search-text')
            .should('be.visible')
            .and('have.attr', 'placeholder', 'Search Material Name, Material Id')
            .and('have.value', '')

        cy.get('div[role="dialog"] thead th').then(($headers) => {
            const headers = [...$headers].map((h) => (h.textContent || '').trim())
            expect(headers).to.include.members(['Name', 'ID', 'UoM', 'Material Category', 'Type'])
        })

        const materialNames = ['Iron Bar', 'cement']
        materialNames.forEach((materialName) => {
            cy.contains('div[role="dialog"] tbody tr', materialName)
                .should('be.visible')
                .within(() => {
                    cy.get('input[type="checkbox"]').first().check({ force: true })
                })
        })

        cy.contains('div[role="dialog"] button span', 'Next')
            .should('be.visible')
            .should('not.have.class', 'Mui-disabled')
            .click({ force: true })

        // Step 2 modal validations
        cy.get('div[role="dialog"] tbody tr').should('have.length', 2)
        materialNames.forEach((materialName) => {
            cy.contains('div[role="dialog"] tbody tr td', materialName).should('be.visible')
        })

        // Select first supplier for each row
        cy.get('div[role="dialog"] tbody tr').each(($row) => {
            // Open supplier dropdown for current row only
            cy.wrap($row)
                .find('td')
                .eq(5)
                .find('.MuiSelect-root[role="button"]')
                .first()
                .click({ force: true })

            // Pick first option from currently visible supplier menu
            cy.get('.MuiPopover-paper:visible ul[role="listbox"] li[role="option"]')
                .first()
                .click({ force: true })

            // Click inside dialog to ensure menu is closed and value committed
            cy.get('div[role="dialog"]').click('topLeft', { force: true })
        })

        // Submit add material
        cy.contains('div[role="dialog"] button', 'Add').click({ force: true })
        //msgtoaster__text verification
        cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
            assert.equal(successMsg.text(), 'Material added successfully', 'Material added successfully')
        })
        cy.get('.msgtoaster__text').should('not.exist')
    }
    clearProjectMaterial() {
        cy.xpath('//h2[text()="Project Material Master"]').should('be.visible')

        cy.get('body').then(($body) => {
            const rowCheckboxes = $body.find('table.ProjectMaterialMasterTable tbody input[type="checkbox"]')

            if (rowCheckboxes.length === 0) {
                cy.log('No project materials found to delete.')
                return
            }

            // Select all material rows
            cy.get('table.ProjectMaterialMasterTable tbody input[type="checkbox"]').each(($cb) => {
                cy.wrap($cb).check({ force: true })
            })

            // Click Delete action
            cy.contains('button span', 'Delete')
                .should('be.visible')
                .click({ force: true })

            //msgtoaster__text verification
            cy.get('.msgtoaster__text', { timeout: 10000 }).then((successMsg) => {
                assert.equal(successMsg.text(), 'Materials deleted successfully.', 'Materials deleted successfully.')
            })

            cy.get('.msgtoaster__text').should('not.exist')
        })
    }
}

export default projectSettingPage;
