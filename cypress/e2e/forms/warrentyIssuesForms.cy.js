import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete Warranty Issues Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
//Test cases to verify Warranty Issues Form
    it("Verify Warranty Issues form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        formpage.verifyFormDetailPage('Warranty Issues',['ID','Subject','Status','Created by','Created On','Actions'])
    })
    it("Creating an open Warranty Issues with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        formpage.createWarrantyIssuesForm()
        formpage.searchForm('Warranty Issues-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update Warranty Issues form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        cy.wait(3000)
        formpage.searchForm('Warranty Issues-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Warranty Issues-01')
        formpage.updateSubject('UpdatedWarranty Issues-01')
        formpage.verifyUpdatedDetails('UpdatedWarranty Issues-01')
        formpage.selectRecordFromList('UpdatedWarranty Issues-01')
        formpage.updateSubject('Warranty Issues-01')
    })
    it("Update status to closed for Warranty Issues Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        cy.wait(3000)
        formpage.searchForm('Warranty Issues-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Warranty Issues-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft Warranty Issues with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        formpage.createWarrantyIssuesDraft()
        formpage.searchForm('WarrantyIssuesDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all Warranty Issues forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Warranty Issues')
        cy.deleteALLForms(storedFormQuery.WarrantyIssuesID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})