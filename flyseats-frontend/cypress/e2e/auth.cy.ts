describe('Authentication', () => {
  it('should navigate to login page', () => {
    cy.visit('/auth/login')
    cy.contains('Login').should('be.visible')
  })

  it('should login successfully', () => {
    cy.login('test@example.com', 'password123')
    // Should redirect after successful login
    cy.url().should('not.include', '/auth/login')
  })

  it('should validate email format', () => {
    cy.visit('/auth/login')
    cy.get('input[type="email"]').type('invalid-email')
    cy.get('input[type="password"]').type('password')
    cy.get('button[type="submit"]').should('be.disabled')
  })
})
