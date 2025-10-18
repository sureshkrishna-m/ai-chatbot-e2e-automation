import { expect } from '@playwright/test';
import AiValidator from '../utils/AiResponseValidator.js';

class ChatPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.welcomeText = 'div.welcome-text h1 span';
        this.chatContainer = '#chat-container';
        this.chatInputContainer = '#chat-input-container';
        this.messageInput = '#chat-input';
        this.messageSendButton = '#send-message-button';
        this.messagesContainer = '#messages-container';
        this.messageElements = '#messages-container .group'
        this.userMessageChildElement = '.user-message'
        this.textDirectionChildElement = 'div[id^="message-"]'
        this.copyResponseButton = 'button.copy-response-button'
        this.loadingSpinner = `${this.chatContainer} svg, ${this.chatContainer} [data-loading]`;
        this.citationElements = 'li span[title^=Citation]'
        this.htmlParentElement = 'html'
        this.userProfileElement = 'div#sidebar img[alt="User profile"]'
        this.languageSwitchCheckbox = 'div[role="switch"]'
        this.loadingDisplayTexts = ['Classifying your query', 'Working on it...', 'تصنيف الاستعلام الخاص بك', 'العمل على ذلك...']
    }

    async isWelcomeTextDisplayed() {
        await this.page.waitForSelector(this.welcomeText)
        const isDisplayed = await this.page.locator(this.welcomeText).isVisible({ timeout: 10000 });
        return isDisplayed;
    }

    async getWelcomeUsername() {
        const welcomeUser = await this.page.locator(this.welcomeText).textContent()
        const username = welcomeUser.split(',')[1].split('.')[0].trim().toLowerCase()
        return username;
    }

    async verifyWelcomeUser(expectedUser) {
        const actualUser = await this.getWelcomeUsername()
        const expUser = expectedUser.split('@')[0].split('.')[0]
        expect(actualUser).toBe(expUser)
    }

    async waitForChatWidget() {
        const candidates = [this.messageInput, this.chatInputContainer];
        const start = Date.now();
        const timeout = 30000;
        for (const sel of candidates) {
            try {
                await this.page.waitForSelector(sel, { timeout: Math.max(1000, timeout - (Date.now() - start)) });
                return;
            } catch (e) { }
        }
    }

    async sendMessage(text) {
        await this.page.locator(this.messageInput).click()
        await this.page.locator(this.messageInput).clear()
        await this.page.keyboard.type(text)
        await this.page.keyboard.press('Enter')
        //await this.page.locator(this.messageSendButton).click()
    }

    async waitForUserMessage(text) {
        try {
            await this.page.waitForSelector(`text=${text}`, { timeout: 10000 });
            return true;
        } catch (e) { }
    }

    async getUserMessageTexts() {
        const actualMessageTexts = []
        const elements = await this.page.$$(`${this.messagesContainer} ${this.userMessageChildElement}`)
        for (const ele of elements) {
            const text = (await ele.innerText()).trim()
            actualMessageTexts.push(text)
        }
        return actualMessageTexts;
    }

    async getAllMessageTexts() {
        const allMessages = []
        const elements = await this.page.$$(this.messageElements)
        for (const element of elements) {
            const notRequiredChild = await element.$(this.userMessageChildElement) || false;
            if (!notRequiredChild) {
                const text = (await element.innerText()).trim()
                allMessages.push(text)
            }
        }
        return allMessages;
    }

    lastMessageLocator() {
        return this.page.locator(this.messageElements).last()
    }

    lastUserMessageLocator() {
        return this.page.locator(`${this.messagesContainer} ${this.userMessageChildElement}`).last()
    }

    async isLastMessageFullyGenerated() {
        return await this.lastMessageLocator().locator(this.copyResponseButton).isVisible({ timeout: 15000 })
    }

    async waitForAIResponse() {
        const timeout = 120000
        const pollInterval = 3000
        const pollOptions = {
            intervals: Array(Math.floor(timeout / pollInterval)).fill(pollInterval),
            timeout: timeout,
            message: 'Waiting on AI Response to be generated within the timeout period..'
        }

        await expect.poll(async () => {
            let isResponseGenerated = false;
            const allMessages = await this.getAllMessageTexts()
            const notExpectedTexts = this.loadingDisplayTexts
            const lastMessage = allMessages[allMessages.length - 1]
            const containsNotExpected = notExpectedTexts.some(text => lastMessage.includes(text));
            if ((!containsNotExpected) && (await this.isLastMessageFullyGenerated())) {
                isResponseGenerated = true
            }
            return isResponseGenerated;
        }, pollOptions).toBeTruthy();
    }

    async isLoadingStateVisible() {
        let isVisible = false
        const allMessages = await this.getAllMessageTexts()
        const loadingTexts = this.loadingDisplayTexts
        const lastMessage = allMessages[allMessages.length - 1]
        isVisible = loadingTexts.some(text => lastMessage.includes(text));
        return isVisible
    }

    async getLastAIResponseText() {
        const text = await this.lastMessageLocator().evaluate((element, citationElementsSelector) => {
            const citationElements = element.querySelectorAll(citationElementsSelector)
            citationElements.forEach(ele => {
                ele.remove()
            })
            return element.innerText.trim()
        }, this.citationElements)
        return text;
    }

    async scrollToTop() {
        const container = this.page.locator(this.messagesContainer);
        await container.evaluate(el => el.scrollTop = 0);
        await this.page.waitForTimeout(200).catch(() => { });
    }

    async scrollToBottom() {
        try {
            await this.page.$eval(this.messagesContainer, el => {
                el.scrollTop = el.scrollHeight;
            });
        } catch (e) {
            await this.page.$eval(this.chatContainer, el => { el.scrollTop = el.scrollHeight; }).catch(() => { });
        }
        await this.page.waitForTimeout(200).catch(() => { });
    }

    async getTextDirectionValue(locator) {
        const textDirection = await locator.locator(this.textDirectionChildElement).getAttribute('dir')
        return textDirection
    }

    async getTextDirection(query) {
        await this.sendMessage(query);
        await this.waitForAIResponse();
        return await this.getTextDirectionValue(this.lastMessageLocator())
    }

    async isInputCleared() {
        const value = await this.page.$eval(this.messageInput, el => el.textContent || el.value || '').catch(() => '');
        return (value || '').trim() === '';
    }

    async setViewport(size) {
        await this.page.setViewportSize(size);
    }

    async getAIResponseValidationResult(query, expectedResponse) {
        await this.sendMessage(query);
        await this.waitForAIResponse();
        const actualResponseText = await this.getLastAIResponseText()
        console.log(actualResponseText);
        expect(actualResponseText.length).toBeGreaterThan(10);
        const result = await AiValidator.validateContextualCorrectness(query, actualResponseText, expectedResponse);
        return result
    }

    async getCurrentAppLanguage() {
        const lang = await this.page.locator(this.htmlParentElement).getAttribute('lang')
        const appLanguage = (lang === 'en-US') ? 'English' : 'Arabic'
        return appLanguage
    }

    async setAppLanguage(language) {
        const currentLanguage = await this.getCurrentAppLanguage()
        if (language != currentLanguage) {
            await this.page.locator(this.userProfileElement).click()
            await this.page.locator(this.languageSwitchCheckbox).first().click({ timeout: 5000 })
            await this.page.locator(this.userProfileElement).click()
        }
    }
}

export default ChatPage;