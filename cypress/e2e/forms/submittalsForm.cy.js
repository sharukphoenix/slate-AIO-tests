import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete Submittals Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
//Test cases to verify Submittals Form
    it("Verify Submittals form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        formpage.verifyFormDetailPage('Submittals',['Submittal ID','Subject','Division Number','Division Name','Specification Section Number','Specification Section Name','Status','Created by','Created On','Actions'])
    })
    it("Creating an open Submittals with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        formpage.createSubmittalsForm()
        formpage.searchForm('Submittals-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update submittals form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        cy.wait(3000)
        formpage.searchForm('Submittals-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Submittals-01')
        formpage.updateSubject('UpdatedSubmittals-01')
        formpage.verifyUpdatedDetails('UpdatedSubmittals-01')
        formpage.selectRecordFromList('UpdatedSubmittals-01')
        formpage.updateSubject('Submittals-01')
    })
    it("Update status to closed for Submittals Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        cy.wait(3000)
        formpage.searchForm('Submittals-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Submittals-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft Submittals with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        formpage.createSubmittalsDraft()
        formpage.searchForm('SubmittalsDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all Submittals forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Submittals')
        cy.deleteALLForms(storedFormQuery.submittalsID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})