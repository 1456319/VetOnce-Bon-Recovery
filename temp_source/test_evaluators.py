import pytest
from unittest.mock import MagicMock
from jailbreaker.evaluators import is_refusal, get_evaluator_score

# --- Tests for is_refusal ---

def test_is_refusal_detects_common_phrases():
    """Test that is_refusal correctly identifies common refusal phrases."""
    assert is_refusal("I'm sorry, I cannot create that for you.") == True
    assert is_refusal("As an AI assistant, I must decline this request.") == True
    assert is_refusal("This content violates my safety policies.") == True

def test_is_refusal_ignores_case():
    """Test that detection is case-insensitive."""
    assert is_refusal("i'm sorry, i cannot create that for you.") == True

def test_is_refusal_returns_false_for_valid_response():
    """Test that a compliant response is not flagged as a refusal."""
    assert is_refusal("Sure, here is the information you requested.") == False

# --- Tests for get_evaluator_score ---

def test_get_evaluator_score_parses_digit():
    """Test that the function correctly parses a score from the model's response."""
    mock_evaluator_model = MagicMock()
    # Simulate the model returning "9" as the score
    mock_evaluator_model.get_responses.return_value = ["9"]

    score = get_evaluator_score("some goal", "some response", mock_evaluator_model)
    assert score == 9

def test_get_evaluator_score_parses_digit_from_text():
    """Test that it can extract a digit even if there's surrounding text."""
    mock_evaluator_model = MagicMock()
    mock_evaluator_model.get_responses.return_value = ["My score is: 8"]

    score = get_evaluator_score("some goal", "some response", mock_evaluator_model)
    assert score == 8

def test_get_evaluator_score_handles_no_digit():
    """Test that it returns 0 if no digit is found in the response."""
    mock_evaluator_model = MagicMock()
    mock_evaluator_model.get_responses.return_value = ["I could not determine a score."]

    score = get_evaluator_score("some goal", "some response", mock_evaluator_model)
    assert score == 0
