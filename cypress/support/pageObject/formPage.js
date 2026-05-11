class formPage{

    pageelements={}

//function to verify form list page
    verifyFormDetailPage(formName,columnNames){
        cy.get('.rfi-wrapper__header').invoke('text').should('equal', `${formName}`);
        cy.get('[placeholder="Assigned / Created by me"]').should('be.visible')
        // cy.xpath('//span[text()="Form Settings" and ancestor::*[@data-testid="create-form-template"]]').should('be.visible')
        cy.xpath('//span[text()="Export"]').should('be.visible')
        cy.xpath('//span[text()="Create" and ancestor::*[@data-testid="create-form-template"]]').should('be.visible')
        this.verifyTableHeader(columnNames)
        cy.contains('No forms were found').should('be.visible')
    }

//function to delete all the form from form list page
    deleteALLExistingForms(){
        cy.checkNumberofForms().then((val=>{
            console.log("value is "+ val)
        }))

    }
  
//function to select form
    selectForm(formName){
        cy.wait(3000)
        cy.get('.FeatureFormsLanding__left__form__item__body').contains(formName).click({force:true})
    }

    verifyTableHeader(expectedColumnName){
        cy.get('[aria-label="enhanced table"]').within(()=>{
            expectedColumnName.forEach((colomnName,index)=>{
                cy.get(`tr th:nth-child(${index +2}) span`).should('contain',colomnName)
            })
        })
    }

//function to search any form from form list page
    searchForm(formName){
        cy.get('[id="list-search-text"]').type(`${formName}{enter}`)
    }

//function to select any form from form list page
    selectRecordFromList(formName){
        cy.get('[aria-label="enhanced table"] th span').contains('Subject').parent('th').then(($th)=>{
            const columnIndex = $th.index()
            cy.get(`[aria-label="enhanced table"] tr:first-child td:nth-child(${columnIndex + 1}) label`).invoke('text').then((text)=>{
                const labelText = text.trim()
                cy.log(labelText)
                if(labelText === formName){
                    cy.get('[aria-label="enhanced table"] tr').eq(1).click()
                }else{
                    cy.log('not matching')
                }
            })
        })
    }

//function to verify status of form
    verifyStatusInlist(expectedStatus){
        cy.get('[aria-label="enhanced table"] th span').contains('Status').parent('th').then(($th)=>{
            const columnIndex = $th.index()
            cy.get(`[aria-label="enhanced table"] tr:first-child td:nth-child(${columnIndex + 1}) label`).invoke('text').then((text)=>{
                cy.log(text)
                assert.equal(text,expectedStatus)
            })
        })
    }

//function to update form
    updateSubject(updatedFormName){
        cy.get('[placeholder="Text"]').first().clear().type(updatedFormName)
        cy.get('[data-testid="edit-rfi-save"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Updated form successfully', 'Form created successfully')
        })
        cy.wait(5000)
        cy.get('.header-wrapper__navBack svg').click({force:true})
        cy.wait(5000)
    }
    verifyUpdatedDetails(updatedDetails){
        cy.get('[aria-label="enhanced table"] th span').contains('Subject').parent('th').then(($th)=>{
            const columnIndex = $th.index()
            cy.get(`[aria-label="enhanced table"] tr:first-child td:nth-child(${columnIndex + 1}) label`).invoke('text').then((text)=>{
                cy.log(text)
                assert.equal(text,updatedDetails)
            })
        })
    }

//function to update status
    selectStatus(status){
        cy.wait(5000)
        cy.get('[id="demo-simple-select"]').click({force:true})
        cy.get(`[data-value="${status}"]`).click({force:true})
        cy.xpath('//div[text()="Status Change"]').should('be.visible')
        cy.get('[id="demo-simple-select"]').last().invoke('text').then((text)=>{
            assert.equal(text,status)
        })
        cy.get('[placeholder="Please enter your comments"]').type(`changing status to : ${status}`)
        cy.xpath('//span[text()="Ok"]').click({force:true})
        cy.get('[data-testid="edit-rfi-save"]').click({force:true})
        cy.wait(5000)
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Updated form successfully', 'Form created successfully')
        })
                cy.wait(5000)
        cy.get('.header-wrapper__navBack svg').click({force:true})
        cy.wait(5000)
    }

//functions to create different forms
    createRFIForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('RFI-01')
        cy.get('[placeholder="Click here to select"]').last().click()
        cy.contains('Select your list item').should('be.visible')
        cy.contains('Constructibility').click()
        cy.get('[data-ph="Text area"]').type('Sample Question')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createRFIDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').type('RFIDRAFT')
        cy.get('[placeholder="Click here to select"]').last().click()
        cy.contains('Select your list item').should('be.visible')
        cy.contains('Constructibility').click()
        cy.get('[data-ph="Text area"]').type('Sample Question')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createSubmittalsForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('Submittals-01')
        cy.get('[placeholder="Click here to select"]').click()
        cy.contains('Select your list item').should('be.visible')
        cy.contains('As-Built').click()
        cy.get('[data-ph="Text area"]').type('Creating Submittals Form')
        cy.get('[id="singlevalue-Company-14"]').click({force:true})
        cy.get('ul li').eq(1).click({force:true})
        cy.get('[placeholder="Text"]').eq(1).type('DivisionNo-01')
        cy.get('[placeholder="Text"]').eq(2).type('DevisionName-01')
        cy.get('[placeholder="Text"]').eq(3).type('SpecNo-01')
        cy.get('[placeholder="Text"]').eq(4).type('SpecName-01')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createSubmittalsDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('SubmittalsDRAFT')
        cy.get('[placeholder="Click here to select"]').click()
        cy.contains('Select your list item').should('be.visible')
        cy.contains('As-Built').click()
        cy.get('[data-ph="Text area"]').type('Creating Submittals Form')
        cy.get('[id="singlevalue-Company-14"]').click({force:true})
        cy.get('ul li').eq(1).click({force:true})
        cy.get('[placeholder="Text"]').eq(1).type('DivisionNo-01')
        cy.get('[placeholder="Text"]').eq(2).type('DevisionName-01')
        cy.get('[placeholder="Text"]').eq(3).type('SpecNo-01')
        cy.get('[placeholder="Text"]').eq(4).type('SpecName-01')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createWarrantyIssuesForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('Warranty Issues-01')
        cy.get('[placeholder="Number"]').first().type('PROJ01')
        cy.get('[placeholder="Number"]').eq(1).type('PROJID01')
        cy.get('[data-ph="Text area"]').type('Creating Warranty Issues Form')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createWarrantyIssuesDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('WarrantyIssuesDRAFT')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcoreRFIForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('Procore RFI-01')
        cy.get('[placeholder="Click here to select"]').click()
        cy.contains('Select your list item').should('be.visible')
        cy.get('[aria-label="primary checkbox"]').check()
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('[data-ph="Text area"]').type('Sample Question')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcoreRFIDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('ProcoreRFIDRAFT')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcoreObservationForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('Procore Observation-01')
        cy.get('[placeholder="Number"]').first().type('01')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcoreObservationDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('ProcoreObservationDRAFT')
        cy.get('[placeholder="Number"]').first().type('01')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcorePunchlistsForm(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('Procore Punchlists-01')
        cy.get('[placeholder="Text"]').eq(1).type('ProcorePunchlists')
        cy.get('[type="submit"]').click()
        cy.get('.MuiInputAdornment-root > .MuiButtonBase-root').click()
        cy.get('.MuiPickersDay-day p').each(($el)=>{
            if($el.text() === day){
                cy.wrap($el.parent()).click({force:true})
            }
        })
        cy.get('[id="user-usergroup-search"]').type(Cypress.env('emailAdmin').split('@')[0],{delay:150})
        cy.get('[data-testid="pullPlanAssignee-add"] svg').click({force:true})
        cy.get('[data-testid="add"]').click({force:true})
        cy.xpath('//span[text()="Save"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
    createProcorePunchlistsDraft(){
        let pickDate = new Date()
        let day = pickDate.getDate().toString()
        cy.log(day)
        cy.contains('Create').click()
        cy.get('[placeholder="Text"]').first().type('ProcorePunchlistsDRAFT')
        cy.get('[placeholder="Text"]').eq(1).type('ProcorePunchlists')
        cy.xpath('//span[text()="Save as Draft"]').click()
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Form created successfully', 'Form created successfully')
        })
    }
}

export default formPage;