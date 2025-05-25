from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from typing import List, Dict, Any
import asyncio
from anthropic import AsyncAnthropic

# Initialize Claude client
client = AsyncAnthropic()

def welcome():
    return {
        "welcome": "Evaluation Runner Agent - I execute evaluation cases by coordinating with Claude and collecting responses for comparison",
        "prompts": [
            {
                "data": json.dumps({
                    "evaluation_id": "math_eval_001",
                    "model_config": {
                        "model_name": "claude-3-5-sonnet-latest",
                        "max_tokens": 100,
                        "temperature": 0.1
                    }
                }),
                "contentType": "application/json"
            },
            {
                "data": json.dumps({
                    "evaluation_id": "sentiment_eval_001",
                    "model_config": {
                        "model_name": "claude-3-5-haiku-latest",
                        "max_tokens": 50,
                        "temperature": 0.0
                    }
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
        model_config = data.get("model_config", {})
        
        if not evaluation_id:
            return response.json({
                "error": "Missing required field: evaluation_id"
            })
        
        context.logger.info("Starting evaluation execution for: %s", evaluation_id)
        
        # Retrieve processed cases from KV store
        processed_key = f"eval_run_{evaluation_id}_processed"
        processed_result = await context.kv.get("eval_processed", processed_key)
        
        if not processed_result:
            return response.json({
                "error": f"Processed cases not found for evaluation: {evaluation_id}"
            })
        
        # Access the processed data
        processed_data = await processed_result.data.json()
        processed_cases = processed_data["processed_cases"]
        total_cases = len(processed_cases)
        
        context.logger.info("Executing %d evaluation cases", total_cases)
        
        # Execute each case
        execution_results = []
        successful_cases = 0
        failed_cases = 0
        
        for i, case in enumerate(processed_cases):
            try:
                context.logger.info("Executing case %d/%d: %s", i+1, total_cases, case["case_id"])
                
                # Execute the case by calling Claude directly
                case_result = await execute_single_case(case, model_config, context)
                
                if case_result.get("success", False):
                    successful_cases += 1
                    context.logger.info("Case %s completed successfully", case["case_id"])
                else:
                    failed_cases += 1
                    context.logger.error("Case %s failed: %s", case["case_id"], case_result.get("error", "Unknown error"))
                
                execution_results.append(case_result)
                
            except Exception as e:
                failed_cases += 1
                error_result = {
                    "case_id": case["case_id"],
                    "success": False,
                    "error": f"Exception during execution: {str(e)}",
                    "original_query": case.get("original_query", ""),
                    "expected_response": case.get("expected_response", ""),
                    "processed_prompt": case.get("processed_prompt", ""),
                    "model_response": None,
                    "execution_time": 0
                }
                execution_results.append(error_result)
                context.logger.error("Exception executing case %s: %s", case["case_id"], str(e))
        
        # Store execution results in KV store
        results_key = f"eval_run_{evaluation_id}_results"
        results_data = {
            "evaluation_id": evaluation_id,
            "total_cases": total_cases,
            "successful_cases": successful_cases,
            "failed_cases": failed_cases,
            "model_config": model_config,
            "execution_results": execution_results,
            "status": "execution_completed"
        }
        
        await context.kv.set("eval_results", results_key, results_data)
        
        # Update metadata
        eval_metadata_key = f"eval_run_{evaluation_id}_metadata"
        metadata_result = await context.kv.get("eval_metadata", eval_metadata_key)
        if metadata_result:
            metadata = await metadata_result.data.json()
            metadata["status"] = "execution_completed"
            metadata["successful_cases"] = successful_cases
            metadata["failed_cases"] = failed_cases
            metadata["execution_summary"] = {
                "total": total_cases,
                "success": successful_cases,
                "failed": failed_cases,
                "success_rate": successful_cases / total_cases if total_cases > 0 else 0
            }
            await context.kv.set("eval_metadata", eval_metadata_key, metadata)
        
        context.logger.info("Evaluation execution completed: %d/%d successful", successful_cases, total_cases)
        context.logger.info("Handing off to llm_as_judge for result analysis")
        
        # Hand off to llm_as_judge agent
        return response.handoff(
            {"name": "llm_as_judge"},
            {"evaluation_id": evaluation_id},
            {"source": "evaluation_runner"}
        )
        
    except Exception as e:
        context.logger.error("Error in evaluation execution: %s", str(e))
        return response.json({
            "error": f"Failed to execute evaluations: {str(e)}"
        })

async def execute_single_case(case: Dict[str, Any], model_config: Dict[str, Any], context: AgentContext) -> Dict[str, Any]:
    """Execute a single evaluation case by calling Claude directly"""
    
    import time
    start_time = time.time()
    
    try:
        # Extract model configuration with defaults
        model_name = model_config.get("model_name", "claude-3-5-sonnet-latest")
        max_tokens = model_config.get("max_tokens", 1024)
        temperature = model_config.get("temperature", 0.1)
        
        context.logger.info("Calling Claude with model: %s, max_tokens: %d, temperature: %f", 
                          model_name, max_tokens, temperature)
        
        # Call Claude API
        result = await client.messages.create(
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {
                    "role": "user",
                    "content": case["processed_prompt"],
                }
            ],
            model=model_name,
        )
        
        model_response = result.content[0].text
        execution_time = time.time() - start_time
        
        context.logger.info("Claude response received for case %s (%.2fs)", 
                          case["case_id"], execution_time)
        
        return {
            "case_id": case["case_id"],
            "success": True,
            "original_query": case["original_query"],
            "expected_response": case["expected_response"],
            "processed_prompt": case["processed_prompt"],
            "model_response": model_response,
            "model_config": model_config,
            "execution_time": execution_time,
            "template_variables": case.get("template_variables", {})
        }
        
    except Exception as e:
        execution_time = time.time() - start_time
        context.logger.error("Claude API error for case %s: %s", case["case_id"], str(e))
        return {
            "case_id": case["case_id"],
            "success": False,
            "error": str(e),
            "original_query": case.get("original_query", ""),
            "expected_response": case.get("expected_response", ""),
            "processed_prompt": case.get("processed_prompt", ""),
            "model_response": None,
            "execution_time": execution_time
        }
