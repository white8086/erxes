import { SignIn } from '../utils';

SignIn;

context('Login', () => {
  beforeEach(function(){
    Cypress.Cookies.debug(true);
    cy.visit('/');
    cy.clearCookies();
  });

  it('Sign In', function(){
    cy.signIn();
  });
});
