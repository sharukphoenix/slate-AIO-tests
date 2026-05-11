import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete Procore Observation Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
//Test cases to verify Procore Observation Form
    it("Verify Procore Observation form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        cy.wait(100)
        formpage.verifyFormDetailPage('Procore Observation',['Observation ID','Subject','Status','Created by','Created On','Actions'])
    })
    it("Creating an open Procore Observation with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        formpage.createProcoreObservationForm()
        formpage.searchForm('Procore Observation-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update Procore Observation form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        cy.wait(3000)
        formpage.searchForm('Procore Observation-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore Observation-01')
        formpage.updateSubject('UpdatedProcore Observation-01')
        formpage.verifyUpdatedDetails('UpdatedProcore Obs . . .')
        formpage.selectRecordFromList('UpdatedProcore Obs . . .')
        formpage.updateSubject('Procore Observation-01')
    })
    it("Update status to closed for Procore Observation Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        cy.wait(3000)
        formpage.searchForm('Procore Observation-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore Observation-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft Procore Observation with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        formpage.createProcoreObservationDraft()
        formpage.searchForm('ProcoreObservationDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all Procore Observation forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Observation')
        cy.deleteALLForms(storedFormQuery.ProcoreObID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})