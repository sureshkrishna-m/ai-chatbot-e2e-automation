import { test, expect } from '@playwright/test';
import LoginPage from '../pages/LoginPage.js';
import ChatPage from '../pages/ChatPage.js';
import queries from '../testdata/queries.json' assert { type: 'json' };

test.describe('Test Suite - GPT-Powered Response Validation', () => {
  /** @type {LoginPage} */
  let loginPage;

  /** @type {ChatPage} */
  let chatPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    chatPage = new ChatPage(page)
    await loginPage.goto()
  })

  test('Validate AI provides clear and helpful responses and consistent between English and Arabic', async () => {
    test.setTimeout(150000)
    await chatPage.waitForChatWidget();
    if (process.env.GEMINI_API_KEY === "") {
      test.fail(true, 'GEMINI_API_KEY is not set')
      return;
    }
    
    const englishResult = await chatPage.getAIResponseValidationResult(queries.english.publicService_QueryOne, queries.english.publicService_ExpectedResponseOne)
    console.log(JSON.stringify(englishResult, null, 1));
    await test.step(`Publish English Matching Score - ${englishResult.overall_score_out_of_100}`, async () => { })
    test.info().annotations.push({
      type: 'English Matching Score',
      description: `Chatbot English response matching score value - ${englishResult.overall_score_out_of_100}`,
    });
    expect(englishResult.overall_score_out_of_100).toBeGreaterThanOrEqual(70)
    expect(englishResult.passed_all_rules).toBeTruthy();

    const arabicResult = await chatPage.getAIResponseValidationResult(queries.arabic.publicService_QueryOne, queries.arabic.publicService_ExpectedResponseOne)
    console.log(JSON.stringify(arabicResult, null, 1));
    await test.step(`Publish Arabic Matching Score - ${arabicResult.overall_score_out_of_100}`, async () => { })
    test.info().annotations.push({
      type: 'Arabic Matching Score',
      description: `Chatbot Arabic response matching score value - ${arabicResult.overall_score_out_of_100}`,
    });
    expect(arabicResult.overall_score_out_of_100).toBeGreaterThanOrEqual(70)
    expect(arabicResult.passed_all_rules).toBeTruthy();
  });

  test('Validate whether the AI responses are not hallucinated and not incomplete thoughts', async () => {
    test.setTimeout(150000)
    await chatPage.waitForChatWidget();
    if (process.env.GEMINI_API_KEY === "") {
      test.fail(true, 'GEMINI_API_KEY is not set')
      return;
    }

    const result1 = await chatPage.getAIResponseValidationResult(queries.english.publicService_QueryOne, queries.english.publicService_ExpectedResponseOne)
    console.log(JSON.stringify(result1, null, 1));
    await test.step(`Publish English Matching Score - ${result1.overall_score_out_of_100}`, async () => { })
    test.info().annotations.push({
      type: 'English Matching Score',
      description: `Chatbot English response matching score value - ${result1.overall_score_out_of_100}`,
    });
    expect(result1.is_hallucinated).toBeFalsy()
    expect(result1.is_incomplete_thought).toBeFalsy()

    const result2 = await chatPage.getAIResponseValidationResult(queries.english.publicService_QueryTwo, queries.english.publicService_ExpectedResponseTwo)
    console.log(JSON.stringify(result2, null, 1));
    await test.step(`Publish English Matching Score - ${result2.overall_score_out_of_100}`, async () => { })
    test.info().annotations.push({
      type: 'English Matching Score',
      description: `Chatbot English response matching score value - ${result2.overall_score_out_of_100}`,
    });
    expect(result2.is_hallucinated).toBeFalsy()
    expect(result2.is_incomplete_thought).toBeFalsy()
  });

  test('Validate loading states and fallback messages are displayed', async () => {
    await chatPage.waitForChatWidget();

    const testMessage = queries.english.fallbackQuery;
    await chatPage.sendMessage(testMessage);
    expect(await chatPage.isLoadingStateVisible()).toBeTruthy()

    await chatPage.waitForAIResponse();
    await expect(chatPage.lastMessageLocator()).toBeVisible({ timeout: 5000 })
    const actualResponseText = (await chatPage.lastMessageLocator().innerText()).trim()
    const expectedResponse = queries.english.expectedFallbackResponse
    const containsAny = expectedResponse.some(text => actualResponseText.toLowerCase().includes(text.toLowerCase()))
    expect(containsAny).toBeTruthy()
  });
});