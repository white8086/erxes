import { SignIn, waitAndClick } from '../utils';

SignIn;

context('Login', () => {
  beforeEach(function(){
    Cypress.Cookies.debug(true);
    cy.visit('/');
    cy.clearCookies();
  });

  it('Sign In', function(){

    const email = Cypress.env('userEmail');
    const password = Cypress.env('userPassword');

    cy.get('input[name=email]').type(email);
    cy.get('input[name=password]').type(`${password}{enter}`);

    cy.url().should('include', '/?signedIn');
    cy.url().should('include', '/inbox');

    cy.getCookie('auth-token').should('exist');

    waitAndClick('button[id="robot-get-started"]')

    cy.get('div[id="robot-features"]')
      .children()
      .should('have.length', 9);
    cy.get('button[id="robot-get-started"]').should('be.disabled');

    cy.get('div[id="robot-item-inbox"]').click();
    cy.get('div[id="robot-item-contacts"]').click();
    cy.get('div[id="robot-item-integrations"]').click();

    cy.get('button[id="robot-get-started"]').click();
    cy.get('div[id="robot-feature-close"]').click();
  });
});
