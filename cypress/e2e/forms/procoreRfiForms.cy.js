import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete Procore RFI Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
//Test cases to verify Procore RFI Form
    it("Verify Procore RFI form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        formpage.verifyFormDetailPage('Procore RFI',['RFI ID','Subject','Status','Created by','Created On','Actions'])
    })
    it("Creating an open Procore RFI with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        formpage.createProcoreRFIForm()
        formpage.searchForm('Procore RFI-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update Procore RFI form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        cy.wait(3000)
        formpage.searchForm('Procore RFI-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore RFI-01')
        formpage.updateSubject('UpdatedProcore RFI-01')
        formpage.verifyUpdatedDetails('UpdatedProcore RFI-01')
        formpage.selectRecordFromList('UpdatedProcore RFI-01')
        formpage.updateSubject('Procore RFI-01')
    })
    it("Update status to closed for Procore RFI Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        cy.wait(3000)
        formpage.searchForm('Procore RFI-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore RFI-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft Procore RFI with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        formpage.createProcoreRFIDraft()
        formpage.searchForm('ProcoreRFIDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all Procore RFI forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore RFI')
        cy.deleteALLForms(storedFormQuery.ProcorerfiID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})