class recipePage {

    pageelements={
        accountOption:() => cy.get('[data-testid="account"]'),
    }
    importNewRecipe(recipeFile){
        const randomNumber = Math.floor(Math.random() * 100)
        const recipeName = `recipeForAutomation${randomNumber}`
        cy.get('[data-testid="import-recipe"]').click({force:true})
        cy.xpath('//span[text()="Upload File"]').should('be.visible')
        cy.get('[id="recipe-name"]').type(recipeName)
        cy.get('[aria-haspopup="listbox"]').click()
        cy.get('[data-value="Non IC"]').click()
        cy.get('[id="recipe-description"]').type('adding new recipe for automation')
        //cy.get("input[type='file']").selectFile(`cypress\\fixtures\\${recipeFile}`,{force:true})
        
        cy.get("input[type='file']").attachFile(recipeFile); 
        
        cy.get('[data-testid="recipe-import-template-save"]').click()
        cy.wait(1000)
        cy.xpath('//div[text()="Your recipe has been successfully added"]').should('be.visible')
        cy.xpath('//button[text()="Continue"]').click({force:true})
        return cy.wrap(recipeName).as('recipename')
    }

    deleteReciepe(recipeName){
        this.searchRecipe(recipeName)
        cy.wait(2000)
        cy.get('[data-testid*="delete-task"]').click()
        cy.xpath('//div[text()="Are you sure?"]').should('be.visible')
        cy.xpath('//p[text()="If you delete this recipe, all data related to this recipe will be lost."]').should('be.visible')
        cy.get('[data-testid="confirm-action"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Deleted Successfully', `Deleted ${recipeName} successfully`)
        })
    }

    openRecipePlan(recipeName){
        this.searchRecipe(recipeName)
        cy.wait(2000)
        cy.get('[data-testid*="edit-task"]').click()
        cy.wait(5000)
        cy.xpath(`//span[text()="${recipeName}"]`).should('be.visible')
        cy.xpath('//span[text()="Discard"]').should('be.visible')
        cy.xpath('//span[text()="Save Recipe"]').should('be.visible')
        cy.xpath('//span[text()="Discard"]').click({force:true})
    }

    autoScheduleActivities(recipeName){
        this.searchRecipe(recipeName)
        cy.wait(2000)
        cy.get('[data-testid*="edit-task"]').click()
        cy.wait(2000)
        cy.xpath(`//span[text()="${recipeName}"]`).should('be.visible')
        cy.get('[aria-label="Schedule activities and update network path"]').click({force:true})
        cy.xpath('//span[text()="Save Recipe"]').click({force:true})
        cy.get('.msgtoaster__text').then((sucessMsg) => {
            assert.equal(sucessMsg.text(), 'Saved recipe plan successfully', 'Saved recipe plan successfully')
        })      
    }
    searchRecipe(recipeName){
        cy.get('[id="list-search-text"]').type(`${recipeName}{enter}`) 
    }

    addRecipeToSchedule(recipeName,wbs){
        cy.xpath('//div[text()="Recipes"]').click({force:true})
        cy.get('input[placeholder="Search recipe or work package"]').type(recipeName)
        cy.wait(5000)
        // cy.get('.MuiSvgIcon-root RecipesImport__header__search').click()
        cy.get('[class="RecipeItem__tab__download"] svg').click({force:true})
        cy.wait(2000)
        cy.get('[aria-label="Activity Name"]').should('be.visible')
        cy.get('[id="parent-task-search"]').type(wbs,{delay:150})
        cy.wait(2000)
        cy.xpath(`//div[text()="${wbs}"]`).last().click({force:true})
        cy.get('[data-testid="create-pulltask-add"]').click({force:true})
        cy.wait(2000)
    }
}
export default recipePage;