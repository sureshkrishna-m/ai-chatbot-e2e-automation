import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvaluationResult } from './AiResponseValidator.js';

const valid = {
    passed_all_rules: true,
    reasoning: 'Relevant and complete.',
    is_hallucinated: false,
    is_incomplete_thought: false,
    score_details: { factual_correctness: 25, completeness: 25, public_service_relevance: 15 },
    overall_score_out_of_100: 85
};

test('accepts a consistent judge result', () => {
    assert.equal(validateEvaluationResult(valid), valid);
});

test('rejects scores outside their ranges or with incorrect totals', () => {
    assert.throws(() => validateEvaluationResult({ ...valid, score_details: { ...valid.score_details, completeness: 31 } }));
    assert.throws(() => validateEvaluationResult({ ...valid, overall_score_out_of_100: 90 }));
});

test('rejects a pass flag that disagrees with the threshold', () => {
    assert.throws(() => validateEvaluationResult({ ...valid, passed_all_rules: false }));
});

test('rejects missing or malformed fields', () => {
    assert.throws(() => validateEvaluationResult(null));
    assert.throws(() => validateEvaluationResult({ ...valid, is_hallucinated: 'false' }));
    assert.throws(() => validateEvaluationResult({ ...valid, reasoning: '' }));
});