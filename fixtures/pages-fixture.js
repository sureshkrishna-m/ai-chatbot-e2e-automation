// @ts-check
import { test as base, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import ChatPage from '../pages/ChatPage.js';

/**
 * @typedef {import('@playwright/test').TestType<
 *   { loginPage: LoginPage, chatPage: ChatPage },
 *   {}
 * >} MyTestType
 */

/** @type {MyTestType} */
const test = base.extend({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },
    chatPage: async ({ page }, use) => {
        const chatPage = new ChatPage(page);
        await use(chatPage);
    },
});

export { test, expect };
