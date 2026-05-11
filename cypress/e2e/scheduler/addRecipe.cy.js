import homePage from "../../support/pageObject/homePage"
import schedulerPage from "../../support/pageObject/schedulerPage"
import recipePage from "../../support/pageObject/recipePage"

const homepage = new homePage()
const schedulerpage = new schedulerPage()
const recipepage = new recipePage()

describe('Recipe Management in Project Schedule', () => {
  const env = Cypress.env('ENV')
  const projectName = Cypress.env('projectName_3')
  let recipename = 'recipeForAutomation20'
  const assignee = Cypress.env('emailUserA').split('@')[0]
  const deleteTask = true
  const tenantName = "Admin"

  beforeEach(() => {
    cy.loginToUI(projectName,tenantName) // Log in to the UI
  })

  it('Verify Recipe Import and Page Display', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToRecipe() // Navigate to the recipe page
    cy.log("in the recipe page") // Log the current page
    recipepage.importNewRecipe("/sampleRecipe.xlsx") // Import a new recipe from an Excel file
    cy.get('@recipename').then((recipeName) => {
      recipename = recipeName // Store the generated recipe name
    })
  })

  it('Auto-Schedule Tasks in Imported Recipe', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToRecipe() // Navigate to the recipe page
    cy.log("in the recipe page") // Log the current page
    recipepage.openRecipePlan(recipename) // Open the imported recipe plan
    recipepage.autoScheduleActivities(recipename) // Auto-schedule activities within the recipe
  })

  it('Add Recipe to Project Schedule', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    schedulerpage.uploadCentroSchedule('/0402ScheduleMSP.xml', 'msp') // Upload a schedule file in MSP format
    schedulerpage.openScheduleinEditMode() // Open the schedule in edit mode
    schedulerpage.selectTask("Level 1 Mechanical") // Select a specific task in the schedule
    recipepage.addRecipeToSchedule(recipename, "Level 1 Mechanical") // Add the recipe to the selected task in the schedule
    schedulerpage.savePlan() // Save the updated schedule
  })

  it('Remove Recipe from Project Schedule', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToScheduler() // Navigate to the scheduler page
    cy.log("in the recipe page") // Log the current page
    schedulerpage.deleteTask([recipename]) // Delete the recipe from the schedule
    cy.wait(20000) // Wait for the deletion to complete
  })

  it('Delete Recipe from Recipe Management Page', () => {
    cy.visit('/') // Visit the home page
    homepage.navigateToRecipe() // Navigate to the recipe page
    cy.wait(50000) // Wait for the page to load completely
    cy.log("in the recipe page") // Log the current page
    recipepage.deleteReciepe(recipename) // Delete the recipe from the recipe page
  })
})