from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from typing import List, Dict, Any, Optional
from anthropic import AsyncAnthropic

# Initialize Claude client for judging
client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Response Comparator Agent - I use Claude to judge the similarity between model outputs and expected results",
        "prompts": [
            {
                "data": json.dumps({
                    "evaluation_id": "math_eval_001",
                    "similarity_threshold": 80
                }),
                "contentType": "application/json"
            },
            {
                "data": json.dumps({
                    "evaluation_id": "sentiment_eval_001", 
                    "similarity_threshold": 70,
                    "judge_model": "claude-3-5-haiku-latest"
                }),
                "contentType": "application/json"
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Parse the incoming request
        data = await request.data.json()
        evaluation_id = data.get("evaluation_id")
        similarity_threshold = 80  # Fixed threshold
        judge_model = "claude-3-5-haiku-latest"  # Fixed judge model
        
        if not evaluation_id:
            return response.json({
                "error": "Missing required field: evaluation_id"
            })
        
        context.logger.info("Starting response comparison for: %s using Claude judge (threshold: %d)", 
                          evaluation_id, similarity_threshold)
        
        # Retrieve execution results from KV store
        results_key = f"eval_run_{evaluation_id}_results"
        results_result = await context.kv.get("eval_results", results_key)
        
        if not results_result:
            return response.json({
                "error": f"Execution results not found for evaluation: {evaluation_id}"
            })
        
        # Access the execution results
        results_data = await results_result.data.json()
        execution_results = results_data["execution_results"]
        total_cases = len(execution_results)
        
        context.logger.info("Comparing %d evaluation results using Claude judge", total_cases)
        
        # Compare each result using Claude as judge
        comparison_results = []
        high_similarity = 0  # >= threshold
        medium_similarity = 0  # 50-threshold
        low_similarity = 0  # < 50
        total_similarity_score = 0
        
        for i, result in enumerate(execution_results):
            try:
                context.logger.info("Judging case %d/%d: %s", i+1, total_cases, result["case_id"])
                
                # Use Claude to judge similarity
                comparison_result = await judge_similarity_with_claude(
                    result, judge_model, similarity_threshold, context
                )
                
                # Categorize similarity scores
                similarity_score = comparison_result.get("similarity_score", 0)
                if similarity_score >= similarity_threshold:
                    high_similarity += 1
                elif similarity_score >= 50:
                    medium_similarity += 1
                else:
                    low_similarity += 1
                
                total_similarity_score += similarity_score
                comparison_results.append(comparison_result)
                
                context.logger.info("Case %s judged: %d/100 similarity", 
                                  result["case_id"], similarity_score)
                
            except Exception as e:
                error_result = {
                    "case_id": result["case_id"],
                    "success": False,
                    "error": f"Exception during comparison: {str(e)}",
                    "similarity_score": 0,
                    "similarity_category": "error",
                    "judge_reasoning": f"Error occurred: {str(e)}"
                }
                comparison_results.append(error_result)
                low_similarity += 1
                context.logger.error("Exception judging case %s: %s", result["case_id"], str(e))
        
        # Calculate average similarity
        avg_similarity = total_similarity_score / total_cases if total_cases > 0 else 0
        
        # Store comparison results in KV store
        comparison_key = f"eval_run_{evaluation_id}_comparison"
        comparison_data = {
            "evaluation_id": evaluation_id,
            "total_cases": total_cases,
            "high_similarity_count": high_similarity,  # >= threshold
            "medium_similarity_count": medium_similarity,  # 50-threshold
            "low_similarity_count": low_similarity,  # < 50
            "average_similarity_score": avg_similarity,
            "similarity_threshold": similarity_threshold,
            "judge_model": judge_model,
            "comparison_results": comparison_results,
            "status": "comparison_completed"
        }
        
        await context.kv.set("eval_comparison", comparison_key, comparison_data)
        
        # Update metadata
        eval_metadata_key = f"eval_run_{evaluation_id}_metadata"
        metadata_result = await context.kv.get("eval_metadata", eval_metadata_key)
        if metadata_result:
            metadata = await metadata_result.data.json()
            metadata["status"] = "comparison_completed"
            metadata["comparison_summary"] = {
                "average_similarity": avg_similarity,
                "high_similarity_count": high_similarity,
                "medium_similarity_count": medium_similarity,
                "low_similarity_count": low_similarity,
                "high_similarity_rate": high_similarity / total_cases if total_cases > 0 else 0,
                "threshold": similarity_threshold
            }
            await context.kv.set("eval_metadata", eval_metadata_key, metadata)
        
        context.logger.info("Response comparison completed: avg similarity %.1f, %d high, %d medium, %d low", 
                          avg_similarity, high_similarity, medium_similarity, low_similarity)
        
        # Return the comparison results directly to the frontend
        return response.json({
            "evaluation_id": evaluation_id,
            "status": "comparison_completed",
            "summary": {
                "total_cases": total_cases,
                "average_similarity_score": round(avg_similarity, 1),
                "similarity_threshold": similarity_threshold,
                "high_similarity_count": high_similarity,
                "medium_similarity_count": medium_similarity,
                "low_similarity_count": low_similarity,
                "high_similarity_rate": round(high_similarity / total_cases * 100, 1) if total_cases > 0 else 0,
                "judge_model": judge_model
            }
        })
        
    except Exception as e:
        context.logger.error("Error in response comparison: %s", str(e))
        return response.json({
            "error": f"Failed to compare responses: {str(e)}"
        })

async def judge_similarity_with_claude(
    result: Dict[str, Any], 
    judge_model: str,
    similarity_threshold: int,
    context: AgentContext
) -> Dict[str, Any]:
    """Use Claude to judge similarity between expected and actual responses"""
    
    case_id = result["case_id"]
    expected_response = result.get("expected_response", "").strip()
    model_response = result.get("model_response", "").strip()
    original_query = result.get("original_query", "")
    
    # If the execution failed, return 0 similarity
    if not result.get("success", False) or not model_response:
        return {
            "case_id": case_id,
            "success": True,
            "expected_response": expected_response,
            "model_response": model_response,
            "similarity_score": 0,
            "similarity_category": "low",
            "judge_reasoning": "Model execution failed or empty response",
            "judge_model": judge_model
        }
    
    try:
        # Create the judging prompt
        judge_prompt = f"""You are an expert evaluator comparing AI model responses. Your task is to judge how similar two responses are to the same question.

Please evaluate the similarity between the Expected Response and Actual Response on a scale of 0-100, where:
- 100 = Identical or semantically equivalent
- 80-99 = Very similar, minor differences in wording or style
- 60-79 = Similar meaning, some differences in detail or approach
- 40-59 = Partially similar, captures some key points but misses others
- 20-39 = Somewhat related but significant differences
- 0-19 = Very different or unrelated

Consider:
- Factual accuracy
- Semantic meaning
- Completeness of the answer
- Relevance to the question

Original Question: {original_query}

Expected Response: {expected_response}

Actual Response: {model_response}

Respond with ONLY a JSON object in this exact format:
{{
    "similarity_score": <number 0-100>,
    "reasoning": "<brief explanation of your scoring>"
}}
"""

        context.logger.info("Calling Claude judge with model: %s", judge_model)
        
        # Call Claude to judge similarity
        judge_result = await client.messages.create(
            max_tokens=200,
            temperature=0.1,  # Low temperature for consistent judging
            messages=[
                {
                    "role": "user",
                    "content": judge_prompt,
                }
            ],
            model=judge_model,
        )
        
        judge_response = judge_result.content[0].text.strip()
        
        # Parse the JSON response
        try:
            judge_data = json.loads(judge_response)
            similarity_score = int(judge_data.get("similarity_score", 0))
            reasoning = judge_data.get("reasoning", "No reasoning provided")
        except (json.JSONDecodeError, ValueError) as e:
            context.logger.warning("Failed to parse judge response for case %s: %s", case_id, str(e))
            # Fallback: try to extract number from response
            import re
            numbers = re.findall(r'\b(\d{1,3})\b', judge_response)
            similarity_score = int(numbers[0]) if numbers else 0
            reasoning = f"Fallback parsing: {judge_response[:100]}..."
        
        # Ensure score is in valid range
        similarity_score = max(0, min(100, similarity_score))
        
        # Categorize similarity
        if similarity_score >= similarity_threshold:
            category = "high"
        elif similarity_score >= 50:
            category = "medium"
        else:
            category = "low"
        
        context.logger.info("Claude judge scored case %s: %d/100 (%s)", case_id, similarity_score, category)
        
        return {
            "case_id": case_id,
            "success": True,
            "expected_response": expected_response,
            "model_response": model_response,
            "similarity_score": similarity_score,
            "similarity_category": category,
            "judge_reasoning": reasoning,
            "judge_model": judge_model,
            "original_query": original_query
        }
        
    except Exception as e:
        context.logger.error("Claude judge error for case %s: %s", case_id, str(e))
        return {
            "case_id": case_id,
            "success": False,
            "error": str(e),
            "expected_response": expected_response,
            "model_response": model_response,
            "similarity_score": 0,
            "similarity_category": "error",
            "judge_reasoning": f"Judge error: {str(e)}",
            "judge_model": judge_model
        }
