import homePage from "../../support/pageObject/homePage";
import formPage from "../../support/pageObject/formPage";
import * as storedFormQuery from '../../support/queries/formQueries'

const homepage = new homePage()
const formpage = new formPage()

describe("Verification of Create/Update/Delete Procore Punchlists Forms", () => {

    const projectName = Cypress.env('projectName_1')
    const assignee = Cypress.env('emailAdmin').split('@')[0]
    const deleteTask = true
    const tenantName = "Admin"
  
    beforeEach(() => {
      cy.loginToUI(projectName,tenantName) // Log in to the UI
    })
    //Test cases to verify Procore Punchlists Form
    it("Verify Procore Punchlists form detail page", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        formpage.verifyFormDetailPage('Procore Punchlists',['Id','Subject','Status','Created by','Created On','Actions'])
    })
    it("Creating an open Procore Punchlists with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        formpage.createProcorePunchlistsForm()
        formpage.searchForm('Procore Punchlists-01')
        cy.wait(5000)
        formpage.verifyStatusInlist('OPEN')
    })
    it("Update Procore Punchlists form details and verify", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        cy.wait(3000)
        formpage.searchForm('Procore Punchlists-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore Punchlists-01')
        formpage.updateSubject('UpdatedProcore Punchlists-01')
        formpage.verifyUpdatedDetails('UpdatedProcore Pun . . .')
        formpage.selectRecordFromList('UpdatedProcore Pun . . .')
        formpage.updateSubject('Procore Punchlists-01')
    })
    it("Update status to closed for Procore Punchlists Form", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        cy.wait(3000)
        formpage.searchForm('Procore Punchlists-01')
        cy.wait(5000)
        formpage.selectRecordFromList('Procore Punchlists-01')
        formpage.selectStatus('CLOSED')
        formpage.verifyStatusInlist('CLOSED')
    })
    it("Creating an Draft Procore Punchlists with only mandatory fields", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        formpage.createProcorePunchlistsDraft()
        formpage.searchForm('ProcorePunchlistsDRAFT')
        cy.wait(5000)
        formpage.verifyStatusInlist('DRAFT')
    })
    it("Delete all Procore Punchlists forms", () => {
        cy.visit('/')  
        homepage.navigateToForms()
        formpage.selectForm('Procore Punchlists')
        cy.deleteALLForms(storedFormQuery.ProcorePunchID)
        cy.reload()
        cy.task('log', 'This will be output to the terminal')
    })
})
