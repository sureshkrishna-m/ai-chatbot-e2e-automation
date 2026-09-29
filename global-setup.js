import { chromium, expect } from "@playwright/test";
import LoginPage from './pages/LoginPage.js'
import ChatPage from './pages/ChatPage.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function globalSetup() {
    const required = ['CHATBOT_URL', 'LOGIN_EMAIL', 'LOGIN_PASSWORD', 'LOGIN_WRONG_PASSWORD'];
    const missing = required.filter(name => !process.env[name]?.trim());
    if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

    const browser = await chromium.launch({ headless: true })
    try {
        const page = await browser.newPage()
        const loginPage = new LoginPage(page)
        const chatPage = new ChatPage(page)

        console.log('Global Setup Running...');
        await loginPage.goto()
        await loginPage.clickLoginWithEmail()
        await loginPage.login(process.env.LOGIN_EMAIL, process.env.LOGIN_PASSWORD)
        const isVisible = await chatPage.isWelcomeTextDisplayed().catch(() => false)
        expect(isVisible).toBeTruthy();
        const statePath = process.env.STORAGE_STATE_PATH || 'playwright/.auth/state.json';
        await fs.mkdir(path.dirname(statePath), { recursive: true });
        await page.context().storageState({ path: statePath })
        console.log('Global Setup Completed.');
    } finally {
        await browser.close()
    }
}

export default globalSetup;