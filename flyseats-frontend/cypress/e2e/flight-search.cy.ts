describe('Flight Search', () => {
  beforeEach(() => {
    cy.visit('/flights')
  })

  it('should display flight search form', () => {
    cy.contains('Search Flights').should('be.visible')
    cy.get('input[formControlName="origin"]').should('be.visible')
    cy.get('input[formControlName="destination"]').should('be.visible')
  })

  it('should search for flights', () => {
    cy.get('input[formControlName="origin"]').type('New York')
    cy.get('input[formControlName="destination"]').type('Los Angeles')
    cy.get('input[formControlName="departureDate"]').type('2024-12-25')
    cy.get('input[formControlName="passengers"]').clear().type('2')
    cy.get('button[type="submit"]').click()
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').should('be.disabled')
  })
})
