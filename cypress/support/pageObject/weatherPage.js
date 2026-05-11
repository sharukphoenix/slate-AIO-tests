class weatherPage {
    verifyWeatherTemplateValuesandCapture(){
        const expectedHeaders = [
            'Constraint Name',
            'Wind (mph)',
            'Wind Gust (mph)',
            'Max Temperature (°F)',
            'Min Temperature (°F)',
            'Impacted by Rain/snow'
        ]

        cy.get('.weather-template').should('be.visible')
        cy.contains('label', 'Weather Templates').should('be.visible')

        // Verify action area
        cy.get('[data-testid="weatherTemplateSearch"]').within(() => {
            cy.get('input#weather-search-text[placeholder="Search by name"]').should('be.visible')
        })
        cy.contains('button', 'Update Template(s)').should('be.disabled')

        // Verify table headers
        cy.get('table.weather-table-template-table thead th').should('have.length', expectedHeaders.length)
        cy.get('table.weather-table-template-table thead th').each(($th, idx) => {
            cy.wrap($th).invoke('text').then((t) => {
                expect(t.replace(/\s+/g, ' ').trim()).to.eq(expectedHeaders[idx])
            })
        })

        // Capture table values keyed by Constraint Name
        cy.get('table.weather-table-template-table tbody tr').then(($rows) => {
            const captured = {}

            Cypress.$($rows).each((_, rowEl) => {
                const $row = Cypress.$(rowEl)
                const constraintName = $row
                    .find('td.weather-table-template-constraintname [aria-label="material name"]')
                    .first()
                    .text()
                    .trim()

                if (!constraintName) return

                const numberVal = (cellIdx) => {
                    const v = $row.find('td').eq(cellIdx).find('input[type="number"]').val()
                    return v === undefined || v === null ? '' : String(v).trim()
                }

                const impacted = $row.find('td').eq(5).find('input[type="checkbox"]').prop('checked') === true

                captured[constraintName] = {
                    windMph: numberVal(1),
                    windGustMph: numberVal(2),
                    maxTempF: numberVal(3),
                    minTempF: numberVal(4),
                    impactedByRainSnow: impacted
                }
            })

            cy.wrap(captured).should((obj) => {
                expect(Object.keys(obj).length, 'captured weather templates count').to.be.greaterThan(0)
            })

            cy.writeFile('cypress/fixtures/weatherTemplateValues.json', captured)
        })
    }
}

export default weatherPage;