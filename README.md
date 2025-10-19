# AI-Chatbot-E2E-Automation

## Overview

This project is an automated test suite built using Playwright and JavaScript, following the Page Object Model pattern. The tests are ran in parallel mode using playwright's inbuild mechanism. Login state of the application is stored and used across all the tests for faster execution. It leverages Allure Reports for detailed and comprehensive test reporting.

## Tech Stack

*   **Automation Tool      :** Playwright
*   **Programming Language :** JavaScript
*   **Framework Pattern    :** Page Object Model (POM)
*   **LLM Validator        :** Google Gemini CLI
*   **Testdata Management  :** JSON files
*   **Reporting            :** Allure Reports
*   **CI/CD Integration    :** Github Actions

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
    npm install
    ```

### Configuration

1.  **Gemini API Key:**

    *   Generate an API key from the Google AI Studio ([https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)).
    *   Update the `.env` file in the project root directory.
    *   Add your Gemini API key to the `.env` file:

        ```
        GEMINI_API_KEY="YOUR_API_KEY"
        ```

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

3.  **Run a specific test file:**

    ```bash
    npx playwright test tests/example.spec.js
    ```

4.  **Run tests in headed mode:**

    ```bash
    npx playwright test --headed
    ```

### Generating Allure Reports

1.  **Generate and Open the Allure report:**

    ```bash
    npm run test:allure_generate_and_open
    ```

    This will open the Allure report in your default web browser.

### Test Language Configuration

The test language is configured within the Playwright configuration file (`playwright.config.js`). Ensure that the appropriate locale and any necessary language-specific settings are configured for your tests.
