import { GoogleGenAI } from '@google/genai';

export function validateEvaluationResult(result) {
    const scores = result?.score_details;
    const limits = { factual_correctness: 30, completeness: 30, public_service_relevance: 20 };
    const validScores = scores && Object.entries(limits).every(([key, max]) =>
        Number.isInteger(scores[key]) && scores[key] >= 0 && scores[key] <= max);

    if (!validScores || typeof result.reasoning !== 'string' || !result.reasoning.trim() ||
        typeof result.is_hallucinated !== 'boolean' || typeof result.is_incomplete_thought !== 'boolean' ||
        typeof result.passed_all_rules !== 'boolean' || !Number.isInteger(result.overall_score_out_of_100)) {
        throw new Error('LLM judge returned an invalid evaluation.');
    }

    const total = scores.factual_correctness + scores.completeness + scores.public_service_relevance +
        (result.is_hallucinated ? 0 : 10) + (result.is_incomplete_thought ? 0 : 10);
    if (result.overall_score_out_of_100 !== total || result.passed_all_rules !== (total >= 60)) {
        throw new Error('LLM judge returned an inconsistent evaluation.');
    }
    return result;
}

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
      "overall_score_out_of_100": number //Ensure the sum is always accurate and correct.
    }
    `;

    if (!process.env.GEMINI_API_KEY?.trim()) {
        throw new Error('GEMINI_API_KEY is required for LLM evaluation.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

        return validateEvaluationResult(evaluationResult);

    } catch (error) {
        throw new Error('LLM evaluation failed.', { cause: error });
    }
}

export default { validateContextualCorrectness };