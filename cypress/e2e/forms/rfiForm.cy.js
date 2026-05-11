import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete  RFI Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
//Test cases to verify RFI Form
    it("Verify RFI form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        formpage.verifyFormDetailPage('RFI',['RFI ID','Subject','Status','Created by','Created On','Actions'])
    })
    it("Creating an open RFI with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        formpage.createRFIForm()
        formpage.searchForm('RFI-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        cy.wait(3000)
        formpage.searchForm('RFI-01')
        cy.wait(5000)
        formpage.selectRecordFromList('RFI-01')
        formpage.updateSubject('UpdatedRFI-01')
        formpage.verifyUpdatedDetails('UpdatedRFI-01')
        formpage.selectRecordFromList('UpdatedRFI-01')
        formpage.updateSubject('RFI-01')
    })
    it("Update status to closed for RFI Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        cy.wait(3000)
        formpage.searchForm('RFI-01')
        cy.wait(5000)
        formpage.selectRecordFromList('RFI-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft RFI with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        formpage.createRFIDraft()
        formpage.searchForm('RFIDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all RFI forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('RFI')
        cy.deleteALLForms(storedFormQuery.rfiID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})