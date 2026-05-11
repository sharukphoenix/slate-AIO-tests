import homePage from "../../support/pageObject/homePage"
import managePage from "../../support/pageObject/managePage"
import {default as expectedDefaults} from "../../fixtures/modelSchemaTableVaules.json";
import {default as setupschemaTestData} from "../../fixtures/setupModelSchemaTestdata.json";

const homepage = new homePage()
const managepage = new managePage

describe('Verify manage page before file upload', () => {
  const env = Cypress.env('ENV')
  const projectName = Cypress.env('projectName_5')
  const assignee = Cypress.env('emailDPR').split('@')[0]
  const deleteTask = true
  const tenantName = "DPR"

  beforeEach(() => {
    cy.loginToUI(projectName,tenantName) // Log in to the UI
  })

  it('Verify empty manage page',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.verifyManagePageBeforeFileUploads()
  })
  it('Verify GoToProgress when no files uploaded',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.gotoProgress()
    managepage.verifyUploadProgrammeEmptyState()
    managepage.verifyDPRLandingEmptyState()
  })
  it('Verify model schema table default values',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.validateHeaderElements()
    managepage.verifySchemaTitle()
    managepage.verifyAllTableRows(expectedDefaults)
  })
  it('Verify upadting values in schema page and resetting',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.verifySingleRow('Containment - MEP Fabrication',setupschemaTestData.rowValues1,setupschemaTestData.dropdownOptions)
    managepage.saveChangesAndProceed()
    managepage.clickOnSetUpModelSchema()
    managepage.verifySingleRow('Containment - MEP Fabrication',setupschemaTestData.rowValues2,setupschemaTestData.dropdownOptions)
    managepage.useDefaultSchemaandContinue()
    managepage.clickOnSetUpModelSchema()
    managepage.verifySingleRow('Containment - MEP Fabrication',setupschemaTestData.rowValues1,setupschemaTestData.dropdownOptions)
  })
  it('change and verifies column values of Electrical row',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.changeAndVerifyColumns('Containment - MEP Fabrication',setupschemaTestData.Electrical.expectedValues)
  })
  it('change and verifies column values of Mechanical row',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.changeAndVerifyColumns('Duct Insulations',setupschemaTestData.Mechanical.expectedValues)
  })
  it('change and verifies column values of Plumbing row',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.changeAndVerifyColumns('Pipework - MEP Fabrication',setupschemaTestData.Plumbing.expectedValues)
  })

  after(() => {
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.useDefaultSchemaandContinue()
  })
})
