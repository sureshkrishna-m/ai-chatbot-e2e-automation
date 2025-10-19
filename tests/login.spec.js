import { test as base, expect } from '../fixtures/pages-fixture.js';

// Override context fixture to reset the storageState
export const test = base.extend({
    context: async ({ browser }, use) => {
        const context = await browser.newContext({ storageState: undefined });
        await use(context);
        await context.close();
    },
});

test.describe('Test Suite - Login tests', () => {

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto()
    })

    test('Login with Email — Successful Login with valid credentials', async ({ loginPage, chatPage }) => {
        await loginPage.clickLoginWithEmail();
        await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD);

        const isVisible = await chatPage.isWelcomeTextDisplayed().catch(() => false)
        expect(isVisible).toBeTruthy();
        await chatPage.verifyWelcomeUser(process.env.LOGIN_EMAIL)
    });

    test('Login with Email — Error thrown for wrong password', async ({ loginPage }, testInfo) => {
        await loginPage.clickLoginWithEmail();
        await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_WRONG_PASSWORD);

        const errorPagePath = `test-results/login-error-page.png`;
        await loginPage.captureLoginError(errorPagePath);
        await testInfo.attach('login-error-page', { path: errorPagePath, contentType: 'image/png' });
    });
});