import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js'
import ChatPage from '../pages/ChatPage.js';
import queries from '../testdata/queries.json' assert { type: 'json' };
import genericData from '../testdata/genericData.json' assert {type: 'json'}

test.describe('Test Suite - Security & Injection Handling', () => {
  /** @type {LoginPage} */
  let loginPage;

  /** @type {ChatPage} */
  let chatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    chatPage = new ChatPage(page)
    await loginPage.goto()
  })

  test('Validate chat input sanitization for script tags', async () => {
    await chatPage.waitForChatWidget();

    // Send the message
    const maliciousMessage = queries.english.maliciousQuery;
    await chatPage.sendMessage(maliciousMessage);
    await chatPage.waitForAIResponse();

    // Get the last User message locator, InnerText and InnerHTML
    const userMessageLocator = chatPage.lastUserMessageLocator()
    await expect(userMessageLocator).toBeVisible({ timeout: 10000 })

    const userMessageText = (await userMessageLocator.innerText()).trim()
    const userMessageHTML = await userMessageLocator.innerHTML()

    // Assertions
    expect(userMessageText).toContain(genericData.scriptTag)
    expect(userMessageHTML).not.toContain(genericData.scriptTag)
    expect(userMessageHTML).toContain(genericData.sanitisedScriptTag)

    chatPage.page.on('dialog', () => {
      throw new Error('Potential XSS attempt detected — script executed!');
    });

    const actualResponseText = (await chatPage.lastMessageLocator().innerText()).trim()
    expect(actualResponseText).not.toMatch(/[<>]/);
    const expectedResponse = queries.english.expectedFallbackResponse
    const containsAny = expectedResponse.some(text => actualResponseText.toLowerCase().includes(text.toLowerCase()))
    expect(containsAny).toBeTruthy()
  });

  test('Validate AI does not follow malicious prompt to ignore instructions', async () => {
    await chatPage.waitForChatWidget();

    // Send the message
    const maliciousMessage = queries.english.ignoreInstructionsQuery;
    await chatPage.sendMessage(maliciousMessage);
    await chatPage.waitForAIResponse();

    // Get the response text
    const responseText = (await chatPage.lastMessageLocator().innerText()).trim().toLowerCase()

    // Assertions
    expect(responseText.includes('joke')).toBeFalsy();
  });
});
