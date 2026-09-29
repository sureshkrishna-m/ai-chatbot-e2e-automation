# AI-Chatbot-E2E-Automation

## Overview

Playwright end-to-end tests for an authenticated public-service chatbot. Browser checks cover login, rendering, multilingual behavior, injection handling, and response quality. Gemini evaluates answers against reference responses; its structured verdict is checked locally for valid scores and consistent arithmetic before assertions use it. LLM judgments are probabilistic and should supplement, not replace, deterministic assertions.

## Tech Stack

| **Category**         | **Tool / Technology** |
|:-------------------- |:-------------------- |
| Automation Tool      | Playwright |
| Programming Language | JavaScript |
| Framework Pattern    | Page Object Model (POM) |
| LLM Validator        | Google Gen AI SDK |
| Test Data Management | JSON Files |
| Reporting            | Allure Reports |
| CI/CD Integration    | GitHub Actions (private, short-lived test artifacts) |

## Project Structure

```
/project-root
├── pages/               # Page object classes
├── fixtures/            # Test fixtures and setup files
├── tests/               # Test specification files
├── allure-results/      # Allure report data (generated after test execution)
├── playwright.config.js # Playwright configuration file
├── package.json         # Project dependencies and scripts
├── .env                 # Environment variables (API keys, etc.)
└── README.md            # This file
```

## Page Object Model (POM)

This project utilizes the Page Object Model (POM) design pattern.  Each page of the application under test (AUT) is represented by a Page Object class.  These classes encapsulate the locators and methods necessary to interact with the elements on that page. This promotes code reusability, maintainability, and reduces test duplication.

## Reporting (Allure Reports)

Allure Reports are integrated for detailed and visually appealing test reports. Allure provides features such as:

*   Test execution history
*   Step-by-step reporting
*   Screenshots and videos of test failures
*   Test categorization and labeling

## Getting Started

### Prerequisites

*   Node.js and npm installed
*   A code editor (e.g., VS Code)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/sureshkrishna-m/ai-chatbot-e2e-automation.git
    cd <your-project-directory>
    ```

2.  Install dependencies:

    ```bash
    npm ci
    npx playwright install chromium
    ```

### Configuration

1.  The repository includes `.env` for shared, non-sensitive defaults. Keep tracked values free of real credentials and API keys; set `CHATBOT_URL`, `LOGIN_EMAIL`, `LOGIN_PASSWORD`, and `LOGIN_WRONG_PASSWORD` through private environment variables or a local `.env.local` instead. Shell/CI variables take precedence, followed by `.env.local`, then `.env`. The URL must point to an accessible test environment; use a dedicated test account. Optionally set `GEMINI_API_KEY` for judge-backed checks. Without it, only the two judge-backed tests are skipped. `STORAGE_STATE_PATH` optionally overrides the default `playwright/.auth/state.json`; keep overrides outside version control. Never commit authentication state.

    Configure the same values in GitHub Actions: `CHATBOT_URL` as an environment variable under the `ci` environment, and the login values and optional Gemini key as environment secrets. Store the wrong password as a deliberately invalid value. Rotate any credentials previously committed to the repository; deleting a tracked file does not erase Git history.

2.  **Playwright Configuration:**

    *   Review and modify the `playwright.config.js` file to adjust settings such as:
        *   `baseURL`:  The base URL of the application under test.
        *   `headless`:  Whether to run tests in headless mode (true/false).
        *   `reporter`:  The test reporter(s) to use (e.g., 'html', 'list', 'allure-playwright').
        *   `use`: Browser settings (e.g., `browserName`, `viewport`).

### Running Tests

1.  **Run all tests:**

    ```bash
    npm test
    ```

    *(This command typically executes the `test` script defined in your `package.json` file, which in turn runs the Playwright tests.)*

2.  **Run tests with UI mode:**

    ```bash
    npx playwright test --ui
    ```

3.  **Run offline judge contract tests (no app or key needed):**

    ```bash
    npm run test:unit
    ```

4.  **Run a specific test file:**

    ```bash
    npx playwright test tests/gpt-response.spec.js
    ```

5.  **Run tests in headed mode:**

    ```bash
    npx playwright test --headed
    ```

### Generating Allure Reports

1.  **Generate and Open the Allure report:**

    ```bash
    npm run test:allure_generate_and_open
    ```

    This will open the Allure report in your default web browser.

    CI retains Playwright and Allure raw results as a private workflow artifact for seven days, including failure traces. Treat artifacts as sensitive; they can capture conversation text. Live browser tests need the application and credentials, and judge-backed tests additionally need a Gemini key. The judge rubric passes at 60/100; the quality test enforces a stricter 70/100 threshold.
    Forked pull requests run offline contract tests only, because GitHub does not provide them with environment secrets.

### Test Language Configuration

The test language is configured within the Playwright configuration file (`playwright.config.js`). Ensure that the appropriate locale and any necessary language-specific settings are configured for your tests.
