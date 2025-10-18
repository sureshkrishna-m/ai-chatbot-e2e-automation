import { expect } from '@playwright/test';

class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.url = process.env.CHATBOT_URL;
        this.loginWithEmailButton = 'text="Log in with email"';
        this.emailInput = '#email';
        this.passwordInput = '#password';
        this.submitButton = 'button:has-text("Continue"), button:has-text("Log in"), button:has-text("Sign in")';
        this.welcomeText = 'text=Hi, Farrukh. Ready to dive in?';
    }

    async goto() {
        await this.page.goto(this.url, { waitUntil: 'networkidle' });
    }

    async clickLoginWithEmail() {
        const btn = this.page.locator(this.loginWithEmailButton);
        if (await btn.count() > 0) {
            await btn.first().click();
            await this.page.waitForLoadState('networkidle')
        } else {
            const alt = this.page.locator('button:has-text("email")');
            if (await alt.count() > 0) {
                await alt.first().click();
                await this.page.waitForLoadState('networkidle')
            }
        }
    }

    async login(email, password) {
        if (await this.page.$(this.emailInput)) {
            await this.page.fill(this.emailInput, email);
        } else {
            const byRole = this.page.getByRole('textbox', { name: /email/i });
            if (await byRole.count() > 0) await byRole.first().fill(email);
        }

        if (await this.page.$(this.passwordInput)) {
            await this.page.fill(this.passwordInput, password);
        } else {
            const byRolePwd = this.page.getByRole('textbox', { name: /password/i });
            if (await byRolePwd.count() > 0) await byRolePwd.first().fill(password);
        }

        const submit = this.page.locator(this.submitButton);
        if (await submit.count() > 0) {
            await Promise.all([
                this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => { }),
                submit.first().click().catch(() => { })
            ]);
        } else {
            if (await this.page.$(this.passwordInput)) await this.page.press(this.passwordInput, 'Enter').catch(() => { });
        }
        await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
        await this.page.waitForLoadState('networkidle')
    }

    async captureLoginError(errorScreenshotPath) {
        const exact1 = this.page.getByText('Sign in failed. Username or password is incorrect.');
        const exact2 = this.page.getByText('The email or password provided is incorrect. Please check and try again.');
        let error;
        if (await exact1.count()) {
            error = exact1.first();
        } else if (await exact2.count()) {
            error = exact2.first();
        } else {
            error = this.page.getByText(/invalid|incorrect|failed|Invalid email format/i).first();
        }

        await error.waitFor({ state: 'visible', timeout: 10000 });
        await expect(error).toBeVisible();
        await this.page.waitForTimeout(250);
        await this.page.screenshot({ path: errorScreenshotPath, fullPage: true });
    }
}

export default LoginPage;