import * as storedFormQuery from '../support/queries/formQueries'

const env = Cypress.env('ENV');
const graphQl_Endpoint = Cypress.env('graphQlEndpoint')

const pageElements={
    userName: 'input[name="email"]',
    password: 'input[name="password"]',
    loginBtn: '[class="submitButton_center"]'
};

//Login to Slate and select a Project within a session
Cypress.Commands.add('loginToUI', (projectName,tenantName) => { 
    const currentEmail = tenantName === "DPR" ? Cypress.env('emailDPR')
          : tenantName === "ONX" ? Cypress.env('emailUserA')
          : tenantName === "Admin" ? Cypress.env('emailAdmin')
          : tenantName === "ONXB" ? Cypress.env('emailUserB')
          : tenantName === "Test" ? Cypress.env('emailTest')
          : tenantName === "Sharuk" ? Cypress.env('emailSharuk')
          : 'unknown-user'

    // Store the current user's email so getUserName() can match the right tenant association
    Cypress.env('currentEmail', currentEmail)

    const sessionKey = [tenantName, projectName, currentEmail]

    cy.session(sessionKey, () => {

        cy.log('UILogin started')
        cy.visit('/')
        if(tenantName=== "DPR"){
            cy.get(pageElements.userName).type(Cypress.env('emailDPR'));
            cy.get(pageElements.password).type(Cypress.env('passwordDPR'));
        }else if(tenantName === "ONX"){
            cy.get(pageElements.userName).type(Cypress.env('emailUserA'));
            cy.get(pageElements.password).type(Cypress.env('passwordUserA'));
        }else if(tenantName === "Admin"){
            cy.get(pageElements.userName).type(Cypress.env('emailAdmin'));
            cy.get(pageElements.password).type(Cypress.env('passwordAdmin'));
        }else if(tenantName === "ONXB"){
            cy.get(pageElements.userName).type(Cypress.env('emailUserB'));
            cy.get(pageElements.password).type(Cypress.env('passwordUserB'));
        }else if(tenantName === "Test"){
            cy.get(pageElements.userName).type(Cypress.env('emailTest'));
            cy.get(pageElements.password).type(Cypress.env('passwordTest'));
        }else if(tenantName === "Sharuk"){
            cy.get(pageElements.userName).type(Cypress.env('emailSharuk'));
            cy.get(pageElements.password).type(Cypress.env('passwordSharuk'));
        }
        
        cy.get(pageElements.loginBtn).click();
        cy.intercept('POST', "https://authentication.service.**.slate.ai/V1/user/login/exchange").as('TenantExchange')
        cy.wait('@TenantExchange').its("response.statusCode").should("eq", 200)
    
        cy.get('#Header-Logo').click()
        //Waiting for Analyze text to be appear
        // cy.contains('Analyze').should('be.visible')

        //Selecting Project
        cy.selectProject(projectName)
        
        //Giving some wait to capture all cookies to the session
        //I think the request fired by the UI is not captured by cy.intercept -> Leads to whole test suite being skipped
        //cy.intercept('POST', "https://authentication.service.**.slate.ai/V1/S3/downloadLink").as('DownloadLink') //Removed the leading whitespace from the URL

        // //Giving some wait to capture all cookies to the session
        // cy.contains('Analyze').click()
        // cy.contains('Analysis').should('be.visible')
       
    })
})


Cypress.Commands.add('selectProject', (projectName) => {
    
    cy.get('#Header-Logo').click()
    //Waiting for Analyze text to be appear
    // cy.contains('Analyze').should('be.visible')

    //Verifying Builddings portfolio is selected by default.
    cy.get('[data-testid="portfolio-input"]').find('input[id="combo-box-demo"]').invoke('attr', 'value').then(value => {
        assert.equal(value, 'Buildings', 'Buildings Portfolio is not selected by default')
    })

    //Typing Project name and selecting the first suggestion
    cy.get('[data-testid="project-input"]').find('input[id="combo-box-demo"]').should('be.visible').clear()
    cy.get('[data-testid="project-input"]').find('input[id="combo-box-demo"]').should('be.visible').type(projectName)
    cy.get('[role="listbox"]').contains(projectName).click({ force: true })

    //Verifying if the required project been selected.
    cy.get('[data-testid="project-input"]').find('input[id="combo-box-demo"]').invoke('attr', 'value').then(value => {
        assert.equal(value, projectName, 'Given Project is not selected on the Project dropdown')
    })
})

Cypress.Commands.add('interceptGraphQlRequest', (opName) => {
  cy.intercept('POST', 'https://hasura.service.**.slate.ai/v1/graphql*', (req) => {

    const bodyOp = req.body?.operationName
    const urlOp = new URL(req.url).searchParams.get('opName')

    if (bodyOp === opName || urlOp === opName) {
      req.alias = opName
    }

  })
})

Cypress.Commands.add('getUserName',() => {
    cy.interceptGraphQlRequest("getUserDetails")
    cy.get('[data-testid="account"]').click({force:true})
    cy.wait(3000)
    cy.get('ul li').contains('My Profile').click({force:true})

    const currentEmail = Cypress.env('currentEmail')

    // Recursively wait for the correct getUserDetails response,
    // skipping stale responses
    function waitForCorrectUser(attempt = 1) {
        cy.wait("@getUserDetails", { timeout: 10000 }).then((req) => {
            const user = req.response.body.data.tenantAssociation[0].user
            if (user.email === currentEmail) {
                Cypress.env('firstname', user.firstName)
                Cypress.env('lastname', user.lastName)
                cy.log('Current user: ' + user.firstName + ' ' + user.lastName)
            } else if (attempt < 5) {
                cy.log(`Stale getUserDetails response (got ${user.email}, expected ${currentEmail}). Skipping... (attempt ${attempt})`)
                waitForCorrectUser(attempt + 1)
            } else {
                // Safety fallback after max retries
                cy.log('Max retries reached. Using: ' + user.firstName + ' ' + user.lastName)
                Cypress.env('firstname', user.firstName)
                Cypress.env('lastname', user.lastName)
            }
        })
    }

    waitForCorrectUser()
    cy.get('[class="closeButton"]').click()
})

Cypress.Commands.add('getDate', (days = 0, locale = 'IN') => {
    const today = new Date()
    
    // Calculate the target date with 5-day work week logic
    let futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
    
    // Adjust for weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = futureDate.getDay()
    
    if (dayOfWeek === 6) {
        // If it's Saturday, move to Monday (add 2 days)
        futureDate.setDate(futureDate.getDate() + 2)
        cy.log(`Adjusted from Saturday to Monday: ${futureDate}`)
    } else if (dayOfWeek === 0) {
        // If it's Sunday, move to Monday (add 1 day)
        futureDate.setDate(futureDate.getDate() + 1)
        cy.log(`Adjusted from Sunday to Monday: ${futureDate}`)
    }
    
    cy.log(`planned start date is ${futureDate}`)
    let formattedDate
    
    if (locale === 'US') {
        // Manually format as MM-DD-YYYY for US
        const month = String(futureDate.getMonth() + 1).padStart(2, '0')
        const day = String(futureDate.getDate()).padStart(2, '0')
        const year = futureDate.getFullYear()
        formattedDate = `${month}-${day}-${year}`
    } else if (locale === 'CA') {
        // Format as YYYY-MM-DD for CA
        const month = String(futureDate.getMonth() + 1).padStart(2, '0')
        const day = String(futureDate.getDate()).padStart(2, '0')
        const year = futureDate.getFullYear()
        formattedDate = `${year}-${month}-${day}`
    } else {
        // Default to DD-MM-YYYY for other locales
        const month = String(futureDate.getMonth() + 1).padStart(2, '0')
        const day = String(futureDate.getDate()).padStart(2, '0')
        const year = futureDate.getFullYear()
        formattedDate = `${day}-${month}-${year}`
    }
    
    cy.log(`current date is ${formattedDate}`)
    return cy.wrap(formattedDate)
})

Cypress.Commands.add('getWorkingDaysBetweenDates', (startDate,endDate) => {     //Used to calculate float increment for now, but can be reused in other date related methods or tests
    const s = new Date(startDate)
    const e = new Date(endDate)
    let totalDays = Math.round((e - s) / (1000 * 60 * 60 * 24))
    let weeks = Math.floor(totalDays / 7)
    let remainder = totalDays % 7
    let workingDays = weeks * 5

    let dayOfWeek = s.getDay()
    for (let i = 0; i < remainder; i++) {
        if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++
        dayOfWeek = (dayOfWeek + 1) % 7
    }
    cy.log(`Total working days between ${startDate} and ${endDate} is ${workingDays}`)
    return cy.wrap(workingDays)
})

Cypress.Commands.add('verifySheduleUploaded',()=>{
    // Intercept the GraphQL login request
    cy.interceptGraphQlRequest("getProjectPlanTasks")
    cy.wait("@getProjectPlanTasks").then((req)=>{
        cy.log(req.request.body.operationName)
        cy.log("Response", req.response.body)
        cy.wrap(req.response.body.data).should("have.property","links")
        if(req.response.body.data.links.length === 0){
            cy.log("task is not uploaded")
        }else{
            cy.log("task is already uploaded")
            
        }
    })
})


/*These are on demand commands, fetching token from local/session storage of browser. in order to get project token of 
 current project we need to change the project from UI first and then call this command. its not reading Project values 
 from the config file. */

 Cypress.Commands.add('getTenantToken', () => {

    cy.getAllLocalStorage().then((val) => {
        let env = Cypress.env('ENV')
        let url = 'https://ui.'+env+'.slate.ai'
        let obj =  JSON.parse(val[url].exchangetoken)         //Where exchangetoken is the key saved in local storage.
        var tenantExchangeToken = Object.values(obj)[0];
        return 'Bearer ' + tenantExchangeToken
        
    })
})

Cypress.Commands.add('getProjectToken', () => {
    cy.getAllSessionStorage().then((val) => {
        let env = Cypress.env('ENV')
        let url = 'https://ui.'+env+'.slate.ai'
        return 'Bearer ' + val[url].ProjectToken             //Where ProjectToken is the key saved in local storage.
    })

})



//Calling GraphQL APIs within the UI Page. 
Cypress.Commands.add('apiGQL', (hasuraRole, query, authorization = 'tenantToken' || 'projectToken', variables) => {
    
    if (authorization === 'tenantToken') {    
        cy.getTenantToken().then((tenantToken)=>{
            cy.request({
                method: 'POST',
                url: graphQl_Endpoint,
                headers: {
                    'x-hasura-role': hasuraRole,
                    authorization: tenantToken
                },
                body: {
                    query: query,
                    variables: variables
                }
            })
        })

    } else if (authorization === 'projectToken') {
        cy.getProjectToken().then((projectToken)=>{
            cy.request({
                method: 'POST',
                url: graphQl_Endpoint,
                headers: {
                    'x-hasura-role': hasuraRole,
                    authorization: projectToken
                },
                body: {
                    query: query,
                    variables: variables
                }
            })
        })
    }
    else
        throw new Error(
            'Allowed values for Authorization - tenantToken or projectToken'
        )
}
)


//It gives us number of forms present in first page of list.
Cypress.Commands.add('checkNumberofForms', () => {
    cy.interceptGraphQlRequest("getFilterListForms")
    cy.wait("@getFilterListForms").then((req) => {
        return req.response.body.data.listForms_query.count
    })
})

Cypress.Commands.add('deleteALLForms',(ID)=>{

    //Making call to FeatureList API and deleting existing Forms (if any) 

    //Check the number of RFIs
          let getFormListvar =  {
            featureId: ID,
            filterData: [],
            limit: 10,
            offset: 0,
            order: "desc",
            orderBy: ""
        }

        cy.apiGQL('viewForm', storedFormQuery.getFormList, 'projectToken', getFormListvar).then((resp)=>{
            let counts = resp.body.data
            console.log("Final response "+ JSON.stringify(counts))  
            if (resp.body.data.listForms_query.count > 0) {
                let forms = resp.body.data.listForms_query.data
                for (let form of forms) {
                  let deleteFormvar = {
                    formId: form.id
                  }
                  cy.apiGQL('deleteForm', storedFormQuery.deleteForm, 'projectToken', deleteFormvar).
                    then((resp) => {
                      console.log("Deleted Forms" + JSON.stringify(resp.body))
                    })
                }
        
            }          
        })       

    })

Cypress.Commands.add('getProjectID',()=>{
        cy.intercept('GET', 'https://notification.service.qe.slate.ai/V1/notification').as('notificationApi')
        cy.wait('@notificationApi', { timeout: 500000 }).then((req) => {
            cy.log("notificationApi response:", req.response.body)
            const projectId = req.response.body.success.notifications[0].metaData.projectId
            cy.log("Extracted projectId:", projectId)
            Cypress.env('projectId', projectId)
            return projectId
        })
})

//Login to Slate UI with out saving it as session
Cypress.Commands.add('loginToUIWithoutSession', (projectName,tenantName) => { 
        cy.log('UILogin started')
        cy.visit('/')
        if(tenantName=== "DPR"){
            cy.get(pageElements.userName).type(Cypress.env('emailDPR'));
            cy.get(pageElements.password).type(Cypress.env('passwordDPR'));
        }else if(tenantName === "ONX"){
            cy.get(pageElements.userName).type(Cypress.env('emailUserA'));
            cy.get(pageElements.password).type(Cypress.env('passwordUserA'));
        }else if(tenantName === "Admin"){
            cy.get(pageElements.userName).type(Cypress.env('emailAdmin'));
            cy.get(pageElements.password).type(Cypress.env('passwordAdmin'));
        }else if(tenantName === "ONXB"){
            cy.get(pageElements.userName).type(Cypress.env('emailUserB'));
            cy.get(pageElements.password).type(Cypress.env('passwordUserB'));
        }

        cy.get(pageElements.loginBtn).click();
        cy.intercept('POST', "https://authentication.service.**.slate.ai/V1/user/login/exchange").as('TenantExchange')
        cy.wait('@TenantExchange').its("response.statusCode").should("eq", 200)
    
        cy.get('#Header-Logo').click()
        //Waiting for Analyze text to be appear
        // cy.contains('Analyze').should('be.visible')
        
        //Giving some wait to capture all cookies to the session
        cy.intercept('POST', " https://authentication.service.**.slate.ai/V1/S3/downloadLink").as('DownloadLink')
        //Selecting Project
        cy.selectProject(projectName)
    
        cy.wait('@DownloadLink').its("response.statusCode").should("eq", 201)
       
})

//Logout from Slate UI
Cypress.Commands.add('logoutUI', () => { 
    cy.log('UILogout started')
    cy.get('[data-testid="account"]').click({force:true})
    cy.wait(3000)
    cy.get('ul li').contains('Logout').click({force:true})
    cy.wait(3000)
    cy.get(pageElements.loginBtn).should('be.visible')
    cy.log('logout from UI successful')
})

/**
 * Custom command to wait for a file download to complete in the specified folder.
 * Uses recursion to poll for the file presence.
 * @param {string} folder - The directory path to check for the latest file.
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 30000).
 * @returns {Chainable<string>} - The name of the downloaded file.
 */
Cypress.Commands.add('waitForDownload', (folder, timeout = 30000) => {
    const startTime = Date.now();
    const endTime = startTime + timeout;

    function check() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        return cy.task('getLatestFile', folder, { timeout: 45000 }).then((file) => {
            if (file) {
                cy.log(`File found: ${file} (after ${elapsed}s)`);
                return cy.wrap(file);
            }

            if (Date.now() < endTime) {
                cy.log(`Waiting for download... (${elapsed}s elapsed)`);
                cy.wait(1000, { log: false }); // Wait 1 second before retrying
                return check();
            }

            throw new Error(`File download timed out in ${folder} after ${timeout}ms`);
        });
    }

    return check();
});