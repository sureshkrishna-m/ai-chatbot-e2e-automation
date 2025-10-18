import { chromium, expect } from "@playwright/test";
import LoginPage from './pages/LoginPage.js'
import ChatPage from './pages/ChatPage.js';

async function globalSetup() {
    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const loginPage = new LoginPage(page)
    const chatPage = new ChatPage(page)

    console.log('Global Setup Running...');
    await loginPage.goto()
    await loginPage.clickLoginWithEmail()
    await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD)
    const isVisible = await chatPage.isWelcomeTextDisplayed().catch(() => false)
    expect(isVisible).toBeTruthy();
    await page.context().storageState({ path: process.env.STORAGE_STATE_PATH })
    console.log('Global Setup Completed.');
    await browser.close()
}

export default globalSetup;