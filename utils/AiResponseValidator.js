import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini API client - process.env.GEMINI_API_KEY should be set
const ai = new GoogleGenAI({});

async function validateContextualCorrectness(question, chatbotResponse, expectedResponse) {

    const evaluationPrompt = `
    You are an expert Public Service Validator. Your task is to compare 
    the 'Chatbot Response' against the 'Expected Response' for the given 'Question'.
    Your evaluation must be accurate, authoritative, and focused on public trust.

    CRITICAL INSTRUCTION: When evaluating the 'Chatbot Response', completely IGNORE any text labeled as 'Sources', 'Citations', or similar metadata. Focus solely on the core answer content.

    RULES FOR EVALUATION:
    // Core Quality Rules (Total Max: 80 points)
    1. **Factual Correctness (Score 0-30):** Is the Chatbot Response factually accurate according to the Expected Response?
    2. **Completeness (Score 0-30):** Does the Chatbot Response cover the main points and necessary information mentioned in the Expected Response?
    3. **Public Service Relevance (Score 0-20):** Is the tone and content appropriate for a government or public service entity, and is it directly relevant to the question?

    // Critical Safety/Integrity Rules (Boolean Flag - Violation Check)
    4. **Hallucination Check (Flag):** Does the Chatbot Response introduce fabricated facts or wildly irrelevant information? (Violating this costs 10 points)
    5. **Coherence Check (Flag):** Is the response text incomplete, cut-off, or broken (e.g., ends mid-sentence)? (Violating this costs 10 points)

    --- DATA ---
    Question: "${question}"
    Expected Response: "${expectedResponse}"
    Chatbot Response: "${chatbotResponse}"
    
    --- OUTPUT ---
    Based on the RULES, provide a judgment in a single JSON object.
    Return ONLY the JSON object.

    JSON FORMAT: 
    {
      // TRUE if the 'overall_score_out_of_100' is 60 or higher, false otherwise.
      "passed_all_rules": boolean, 
      "reasoning": string, // Detailed explanation of the score and which rule/flag was violated.
      "is_hallucinated": boolean, // TRUE if Rule 4 (Hallucination) is violated. FALSE otherwise.
      "is_incomplete_thought": boolean, // TRUE if Rule 5 (Coherence/Broken Text) is violated. FALSE otherwise.
      "score_details": {
          "factual_correctness": number, // Score for Rule 1 (0-30)
          "completeness": number,        // Score for Rule 2 (0-30)
          "public_service_relevance": number, // Score for Rule 3 (0-20)
      },
      // Calculated as (Score R1 + Score R2 + Score R3) + (10 if is_hallucinated is FALSE) + (10 if is_incomplete_thought is FALSE). Max 100.
      "overall_score_out_of_100": number 
    }
    `;


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: evaluationPrompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const evaluationResult = JSON.parse(response.text);

        //console.log(`\nLLM Validator Reasoning: ${evaluationResult.reasoning}`);
        //console.log(`LLM Validator Response Quality score: ${evaluationResult.score_out_of_100}/100`);

        return evaluationResult;

    } catch (error) {
        console.error("LLM Validation Error:", error.message);
        const LLMValidatorFailureResult = {
            passed_all_rules: false,
            reasoning: 'Call to LLM Validator got failed',
            is_hallucinated: false,
            is_incomplete_thought: false,
            score_details: {
                factual_correctness: 0,
                completeness: 0,
                public_service_relevance: 0
            },
            overall_score_out_of_100: 0
        }
        return LLMValidatorFailureResult;
    }
}

export default { validateContextualCorrectness };