import { test, expect } from '../fixtures/pages-fixture.js';
import queries from '../testdata/queries.json' assert { type: 'json' };
import genericData from '../testdata/genericData.json' assert {type: 'json'}

test.describe('Test Suite - Chatbot UI Behavior', () => {

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto()
    })

    test('Validate chat widget loads on desktop and mobile', async ({ chatPage }) => {
        // Mobile
        await chatPage.setViewport(genericData.viewports.mobile);
        await chatPage.waitForChatWidget();
        await expect(chatPage.page.locator(chatPage.chatInputContainer)).toBeVisible();

        // Desktop
        await chatPage.setViewport(genericData.viewports.desktop);
        await chatPage.waitForChatWidget();
        await expect(chatPage.page.locator(chatPage.chatInputContainer)).toBeVisible();
    });

    test('Validate user can send messages via input box and input is cleared', async ({ chatPage }) => {
        await chatPage.waitForChatWidget();

        // Send the message
        const testMessage = queries.english.testQuery;
        await chatPage.sendMessage(testMessage);
        await chatPage.waitForAIResponse();

        // Wait for the message to appear (exact match)
        const seen = await chatPage.waitForUserMessage(testMessage);
        expect(seen).toBeTruthy();

        const texts = await chatPage.getUserMessageTexts()
        expect(texts.includes(testMessage)).toBeTruthy();

        // And the input should be cleared after sending
        const cleared = await chatPage.isInputCleared();
        expect(cleared).toBeTruthy();
    });

    test('Validate whether AI responses are rendered properly and no broken html displayed', async ({ chatPage }) => {
        await chatPage.waitForChatWidget();

        // Send the message
        const testMessage = queries.english.simpleQuery;
        await chatPage.sendMessage(testMessage);
        await chatPage.waitForAIResponse();

        //Check for Locator and Text visibility
        await expect(chatPage.lastMessageLocator()).toBeVisible({ timeout: 5000 })
        const responseText = (await chatPage.lastMessageLocator().innerText()).trim()
        expect(responseText).toBeDefined();
        expect(responseText.length).toBeGreaterThan(10);
        expect(responseText).not.toMatch(/[<>]/);
        expect(responseText).not.toMatch(/<div|<p/i)

        //Check for HTML tags
        const responseHtml = await chatPage.lastMessageLocator().innerHTML()
        expect(responseHtml).toMatch(/<div|<p/i)
        const unclosedTagPattern = /<([a-z]+)(?:(?!<\/\1>).)*$/i;
        expect(responseHtml).not.toMatch(unclosedTagPattern);
        const openTags = (responseHtml.match(/</g) || []).length;
        const closeTags = (responseHtml.match(/>/g) || []).length;
        expect(openTags).toBe(closeTags);
    });

    test('Validate the page scroll and accessibility', async ({ chatPage }) => {
        await chatPage.waitForChatWidget();

        for (let i = 0; i < 4; i++) {
            await chatPage.sendMessage(`${queries.english.testQuery} ${i}`);
            await chatPage.waitForAIResponse();
        }

        // Ensure chat is scrolled to the bottom and the last message is visible
        const lastLocator = chatPage.lastMessageLocator();
        await expect(lastLocator).toBeVisible({ timeout: 5000 });
        await chatPage.scrollToTop();
        await chatPage.scrollToBottom();
        await expect(lastLocator).toBeVisible({ timeout: 5000 });

        // Accessibility: the input should be focusable and focused after messages
        const inputField = chatPage.page.locator(chatPage.messageInput);
        await expect(inputField).toBeEditable();
        await inputField.focus();
        await expect(inputField).toBeFocused();
    });

    test('Validate multilingual support for English LTR', async ({ chatPage }) => {
        test.setTimeout(120000)
        let textDirection = ''
        await chatPage.waitForChatWidget();
        textDirection = await chatPage.getTextDirection(queries.english.simpleQuery)
        expect(textDirection).toBe(genericData.expectedEN_EnglishTextDirection);

        textDirection = await chatPage.getTextDirection(queries.arabic.simpleQuery)
        expect(textDirection).toBe(genericData.expectedEN_ArabicTextDirection);
    });

    test('Validate multilingual support for Arabic RTL', async ({ chatPage }) => {
        test.setTimeout(120000)
        let textDirection = ''
        await chatPage.waitForChatWidget();
        await chatPage.setAppLanguage('Arabic')

        textDirection = await chatPage.getTextDirection(queries.english.simpleQuery)
        expect(textDirection).toBe(genericData.expectedAR_EnglishTextDirection);

        textDirection = await chatPage.getTextDirection(queries.arabic.simpleQuery)
        expect(textDirection).toBe(genericData.expectedAR_ArabicTextDirection);
    });
});
