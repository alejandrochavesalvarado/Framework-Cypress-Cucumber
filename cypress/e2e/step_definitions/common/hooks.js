import { Before, After } from "@badeball/cypress-cucumber-preprocessor";

// Define base URL

// Import page objects with ES module syntax
import LoginPageActions from '../../../support/PageObjects/PageActions/LoginPageActions.js';
import NavBarActions from "../../../support/PageObjects/PageActions/NavBarActions";

// Initialize page objects for this context
Before(function() {
  Cypress.env('loginPageActions', new LoginPageActions());
  Cypress.env('navBarActions', new NavBarActions());
});


export function getPageObject(name) {
  return Cypress.env(name);
}

Before(function() {
  cy.log('HOOK: Before each scenario executed');
  Cypress.on('uncaught:exception', (err, runnable) => {
    return false;
  });
});

// After each scenario
After(function() {
  cy.log('HOOK: After each scenario executed');
  
  // Clear caches to maintain test isolation
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  
  // Reset window size to default
  cy.viewport('macbook-15');
});

Before({ tags: "@smoke" }, function() {
  cy.log('HOOK: Smoke test detected');
});

Before({ tags: "@regression" }, function() {
  cy.log('HOOK: Regression test detected');
  Cypress.config('screenshotOnRunFailure', false);
});


Before({ tags: "@smoke and @critical" }, function() {
  cy.log('HOOK: Critical smoke test detected');
});


Before({ tags: "@mobile or @tablet" }, function() {
  cy.log('HOOK: Mobile or tablet test detected');
  cy.viewport('iphone-x');
});

//* If you want to run preconditions and postconditions in order
//* Mention your functions in the form below
/* Before({ tags: "@execute first", order: 1}, function() {
  cy.log('Priority Execution');
}); */