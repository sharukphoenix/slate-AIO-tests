import homePage from "../../support/pageObject/homePage"
import managePage from "../../support/pageObject/managePage"
import {default as expectedDefaults} from "../../fixtures/modelSchemaTableVaules.json";
import {default as setupschemaTestData} from "../../fixtures/setupModelSchemaTestdata.json";

const homepage = new homePage()
const managepage = new managePage

describe('Verify upload files in Manage Page', () => {
  const env = Cypress.env('ENV')
  const projectName = Cypress.env('projectName_4')
  const assignee = Cypress.env('emailDPR').split('@')[0]
  const deleteTask = true
  const tenantName = "DPR"

  beforeEach(() => {
    cy.loginToUI(projectName,tenantName) // Log in to the UI
  })

  it('Upload schedule file and verify',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickReplaceOrAddFileForSchedule()
    managepage.uploadScheduleFile('/Test Script 2 Schedule - RME Advanced Sample Project 6.xml')
    // managepage.verifyFirstScheduleRow({fileName: 'Test Script 2 Schedule - RME Advanced Sample Project 6.xml',userName: 'au' })
  })
  it('Delete schedule file',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.deleteAllButFirstRow()
  })
  it('Setup model schema to default',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickOnSetUpModelSchema()
    managepage.useDefaultSchemaandContinue()
  })
  it('Upload model file and verify',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.clickReplaceOrAddFileForModel()
    managepage.verifyAndUploadModel('/002_BASE-MODEL_Replace-TEST_Length-CHANGE_001 2.rvt','Architectural')
    
  })

  it('Delete model file and verify',()=>{
    cy.visit('/')
    homepage.navigateToProgress()
    managepage.deleteModel('/002_BASE-MODEL_Replace-TEST_Length-CHANGE_001 2.rvt') 
  })
})
