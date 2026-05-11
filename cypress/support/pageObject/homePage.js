class homePage {
    pageelements={
        accountOption:() => cy.get('[data-testid="account"]'),
        profileOption:() => cy.get('[data-testid="account"]'),
        portfolioDropDown: () => cy.get("div[data-testid='portfolio-input'] input"),
        projectDropDown: () => cy.get("div[data-testid='project-input'] input"),
        appIconBtn: () => cy.get('[class="app-icon"]'),
        mainMenuOption: () => cy.get('span[data-testid="manage"]'),
        dailyJobMenu: () => cy.get('div[data-testid="Daily Logs"]'),
        dailyLogPage: () => cy.xpath('//h5[text()="Daily Logs"]'),
        organizerMenu:() => cy.get('[data-testid="organizer-menu"]')
    }

    selectTenant(tenantName){

        this.pageelements.accountOption().click({ force: true })
        cy.contains('Accounts').click({ force: true })
    
        //Checking the existing tenant
        cy.get('[id="demo-simple-select-helper"]').then(($selectedTenant) => {
            console.log("selected tenant is " + $selectedTenant.text())
    
            if($selectedTenant.text() != tenantName) {
                cy.get('[id="demo-simple-select-helper"]').click()
                cy.contains(tenantName).scrollIntoView()
                cy.contains(tenantName).click()
            } else {
                cy.get('[class="MuiSvgIcon-root Preference__close__icon"]').click()
            }
        })
    }
    captureProfileDetails(){
        cy.wait(3000)
        cy.xpath("//span[contains(@class,'user-name ')]").invoke('text').then(el=>{
            const name = el.split(" ")[1].replace("!","")
            Cypress.env('firstName',name)
        })

    }
/*
    selectProject(projectName){
        cy.get('#Header-Logo').click()
        cy.contains('Analyze').should('be.visible')
        cy.get('[data-testid="portfolio-input"]').find('input[id="combo-box-demo"]').invoke('attr', 'value').then(value => {
            assert.equal(value, 'Buildings', 'Buildings Portfolio is selected by default')
        })
        cy.get('[data-testid="project-input"]').find('input[id="combo-box-demo"]').invoke('attr', 'value').then(selectedValue => {
            console.log("Existing project name is " + selectedValue)
            //If the project mention in fixture file is not selected on the dropdown by default then select it. 
            if(selectedValue != projectName) {

                //Typing Project name and selecting the first suggestion.
                cy.get('[data-testid="project-input"] > .MuiInputBase-root > #combo-box-demo').should('be.visible').click().clear()
                cy.get('[role="listbox"]').contains(projectName).click()
                cy.get('#Header-Logo').click()
            }
        })
        
    } */

    openMainMenu(){
        this.pageelements.appIconBtn().click();
    }

    selectOptionFromMainMenu(){
        this.pageelements.mainMenuOption().click();
    }

    navigatetoDailyJob(){
        cy.wait(5000)
        this.pageelements.appIconBtn().click();
        this.pageelements.mainMenuOption().click();
        cy.wait(5000)
        this.pageelements.dailyJobMenu().click();
        this.pageelements.dailyLogPage().should('be.visible');
        cy.wait(5000)
    }

    navigateToScheduler(canEdit = true){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="analyze"]').click()
        cy.get('[data-testid="Schedule"]').click()
        // cy.get('[data-testid="today"]').should('be.visible')
        canEdit ? cy.get('[data-testid="edit-plan"]').should('be.visible') : cy.get('[data-testid="edit-plan"]').should('not.exist')
    }

    navigateToForms(){
        this.pageelements.organizerMenu().click();                //Clicking on Organize menu
        cy.wait(5000)
        cy.get('span[data-testid="manage"]').click()             //Clicking on manage option
        cy.get('[data-testid="Forms"]').click()
    }

    navigateToRecipe(){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="manage"]').click()
        cy.get('[data-testid="Recipes"]').click()
        cy.xpath('//div[text()="Recipes"]').should('be.visible')
        cy.get('[data-testid="import-recipe"]').should('be.visible')
        cy.get('[data-testid="import-recipe"]').should(($button)=>{
            expect(parseInt($button.attr('tabindex'))).to.be.gte(0)
        })
    }

    navigateToProgress(){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="analyze"]').click()
        cy.get('[data-testid="Progress"]').click()
        cy.xpath('//div[text()="Digital Progress Reporting"]').should('be.visible')
        cy.xpath('//button[text()="Go to Progress"]').should('be.visible')
    }

    navigateToProjectSettings(){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="administer"]').click()
        cy.get('[data-testid="Project Settings"]').click()
        cy.xpath('//div[text()="Project Info"]').should('be.visible')
    }

    navigateToReports(){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="analyze"]').click()
        cy.get('[data-testid="VerticalSplitOutlinedIcon"]').first().click()
        cy.xpath('//div[text()="Reports"]').should('be.visible')
    }
    navigateToWeatherTemplate(){
        cy.get('[data-testid="organizer-menu"]').click()
        cy.wait(5000)
        cy.get('span[data-testid="settings"]').click()
        cy.get('[data-testid="Weather Template"]').click()
        cy.xpath('//label[text()="Weather Templates"]').should('be.visible')
    }
}

export default homePage;