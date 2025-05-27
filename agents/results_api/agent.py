from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from typing import List, Dict, Any, Optional

def welcome():
    return {
        "welcome": "Results API Agent - Serves evaluation results data to the frontend",
        "operations": [
            {
                "operation": "test",
                "description": "Simple test operation for debugging",
                "example": {"operation": "test"}
            },
            {
                "operation": "list_evaluations",
                "description": "List all evaluations with their metadata",
                "example": {"operation": "list_evaluations"}
            },
            {
                "operation": "get_evaluation_details",
                "description": "Get detailed results for a specific evaluation",
                "example": {"operation": "get_evaluation_details", "evaluation_id": "eval_001"}
            },
            {
                "operation": "get_evaluation_cases",
                "description": "Get individual case results for an evaluation",
                "example": {"operation": "get_evaluation_cases", "evaluation_id": "eval_001"}
            },
            {
                "operation": "debug_kv_store",
                "description": "Debug KV store contents for troubleshooting",
                "example": {"operation": "debug_kv_store"}
            }
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Parse the incoming request
        try:
            raw_data = await request.data.json()
            context.logger.info("Successfully parsed JSON request: %s", raw_data)
        except Exception as json_error:
            context.logger.error("Failed to parse JSON request: %s", str(json_error))
            # Try to get raw text to see what was sent
            try:
                raw_text = await request.data.text()
                context.logger.error("Raw request text: %s", raw_text[:500])  # Log first 500 chars
            except Exception as text_error:
                context.logger.error("Could not get raw text either: %s", str(text_error))
            
            return response.json({
                "error": f"Invalid JSON request: {str(json_error)}",
                "status": "error"
            })
        
        # Handle both direct operation format and nested input format
        if isinstance(raw_data, dict) and "input" in raw_data:
            data = raw_data["input"]
        else:
            data = raw_data
        
        operation = data.get("operation")
        
        context.logger.info("Results API operation: %s", operation)
        
        # Route to appropriate handler
        if operation == "test":
            result = await handle_test(context)
        elif operation == "list_evaluations":
            result = await handle_list_evaluations(context)
        elif operation == "get_evaluation_details":
            evaluation_id = data.get("evaluation_id")
            if not evaluation_id:
                result = {"error": "Missing required field: evaluation_id", "status": "error"}
            else:
                result = await handle_get_evaluation_details(evaluation_id, context)
                context.logger.info("Evaluation details: %s", result)
        elif operation == "get_evaluation_cases":
            evaluation_id = data.get("evaluation_id")
            if not evaluation_id:
                result = {"error": "Missing required field: evaluation_id", "status": "error"}
            else:
                result = await handle_get_evaluation_cases(evaluation_id, context)
        elif operation == "debug_kv_store":
            result = await handle_debug_kv_store(context)
        else:
            result = {
                "error": "Unknown operation",
                "operation": operation,
                "available_operations": ["test", "list_evaluations", "get_evaluation_details", "get_evaluation_cases", "debug_kv_store"],
                "status": "error"
            }
        
        # Return in consistent format
        return response.json(result)
        
    except Exception as e:
        context.logger.error("Error in results API: %s", str(e))
        error_result = {
            "error": f"Internal server error: {str(e)}",
            "status": "error"
        }
        return response.json(error_result)

async def handle_test(context: AgentContext) -> Dict[str, Any]:
    """Simple test operation for debugging"""
    context.logger.info("Test operation called")
    return {
        "message": "test successful", 
        "evaluations": [],
        "status": "success"
    }

async def handle_list_evaluations(context: AgentContext) -> Dict[str, Any]:
    """List all evaluations with their metadata"""
    try:
        context.logger.info("Starting list_evaluations operation")
        
        # Get the evaluation registry which contains a list of all evaluation IDs
        registry_result = await context.kv.get("eval_registry", "evaluation_list")
        
        evaluations = []
        
        if registry_result:
            # If registry exists, use it to get evaluation IDs
            try:
                registry_data = await registry_result.data.json()
                evaluation_ids = registry_data.get("evaluation_ids", [])
                
                context.logger.info("Found %d evaluations in registry", len(evaluation_ids))
                
                for evaluation_id in evaluation_ids:
                    try:
                        metadata_key = f"eval_run_{evaluation_id}_metadata"
                        metadata_result = await context.kv.get("eval_metadata", metadata_key)
                        
                        if metadata_result:
                            metadata = await metadata_result.data.json()
                            
                            evaluation_summary = {
                                "id": evaluation_id,
                                "status": metadata.get("status", "unknown"),
                                "startedAt": metadata.get("started_at"),
                                "completedAt": metadata.get("completed_at"),
                                "dataset_name": metadata.get("dataset_name"),
                                "model_name": metadata.get("model_name"),
                                "total_cases": metadata.get("total_cases", 0)
                            }
                            
                            # Add summary results if available
                            if "comparison_summary" in metadata:
                                summary = metadata["comparison_summary"]
                                evaluation_summary["results"] = {
                                    "totalCases": summary.get("total_cases", metadata.get("total_cases", 0)),
                                    "averageSimilarityScore": summary.get("average_similarity", 0),
                                    "highSimilarityCount": summary.get("high_similarity_count", 0),
                                    "mediumSimilarityCount": summary.get("medium_similarity_count", 0),
                                    "lowSimilarityCount": summary.get("low_similarity_count", 0),
                                    "highSimilarityRate": summary.get("high_similarity_rate", 0)
                                }
                            
                            evaluations.append(evaluation_summary)
                            
                    except Exception as e:
                        context.logger.warning("Failed to process metadata for evaluation %s: %s", evaluation_id, str(e))
                        continue
                        
            except Exception as e:
                context.logger.error("Failed to parse registry data: %s", str(e))
                # Fall through to empty list case
        else:
            # If no registry exists, return empty list but log a helpful message
            context.logger.info("No evaluation registry found - no evaluations have been run yet")
        
        # Sort by started_at descending (most recent first)
        # Handle None values in startedAt field
        evaluations.sort(key=lambda x: x.get("startedAt") or "", reverse=True)
        
        # Create the response data
        response_data = {
            "evaluations": evaluations,
            "status": "success"
        }
        context.logger.info("Returning %d evaluations", len(evaluations))
        
        return response_data
        
    except Exception as e:
        context.logger.error("Error listing evaluations: %s", str(e))
        return {
            "error": f"Failed to list evaluations: {str(e)}",
            "status": "error"
        }

async def handle_get_evaluation_details(evaluation_id: str, context: AgentContext) -> Dict[str, Any]:
    """Get detailed results for a specific evaluation"""
    try:
        context.logger.info("Getting details for evaluation: %s", evaluation_id)
        
        # First try the evaluation_id directly
        comparison_key = evaluation_id
        comparison_result = await context.kv.get("eval_comparison", evaluation_id)
        
        # If not found, try with the eval_run prefix
        if not comparison_result.data:
            comparison_key = f"eval_run_{evaluation_id}_comparison"
            comparison_result = await context.kv.get("eval_comparison", comparison_key)
        
        if not comparison_result.data:
            context.logger.error("No comparison data found for evaluation: %s", evaluation_id)
            return {
                "error": f"Evaluation details not found for: {evaluation_id}",
                "status": "error"
            }
        
        evaluation_details = await comparison_result.data.json()
        context.logger.info("Found evaluation details with key: %s", comparison_key)
        
        # Return the evaluation details directly (they should already be in the correct format)
        return {
            "evaluation": evaluation_details,
            "status": "success"
        }
        
    except Exception as e:
        context.logger.error("Error getting evaluation details for %s: %s", evaluation_id, str(e))
        return {
            "error": f"Failed to get evaluation details: {str(e)}",
            "status": "error"
        }

async def handle_get_evaluation_cases(evaluation_id: str, context: AgentContext) -> Dict[str, Any]:
    """Get individual case results for an evaluation"""
    try:
        comparison_id = f"eval_run_{evaluation_id}_comparison"
        context.logger.info("Getting cases for evaluation: %s", comparison_id)
        
        # Get comparison results which contain individual cases - try evaluation_id directly first
        comparison_result = await context.kv.get("eval_comparison", comparison_id)
        
        context.logger.info("Found comparison data: %s", comparison_result)
        if not comparison_result:
            return {
                "error": f"Comparison results not found for evaluation: {evaluation_id}",
                "status": "error"
            }
        
        comparison_data = await comparison_result.data.json()
        comparison_results = comparison_data.get("comparison_results", [])
        
        # Transform the data to match frontend expectations
        cases = []
        for result in comparison_results:
            case = {
                "case_id": result.get("case_id"),
                "original_query": result.get("original_query", ""),
                "expected_response": result.get("expected_response", ""),
                "model_response": result.get("model_response", ""),
                "similarity_score": result.get("similarity_score", 0),
                "similarity_category": result.get("similarity_category", "low"),
                "judge_reasoning": result.get("judge_reasoning", ""),
                "success": result.get("success", False)
            }
            cases.append(case)
        
        context.logger.info("Retrieved %d cases for evaluation: %s", len(cases), evaluation_id)
        return {
            "evaluation_id": evaluation_id,
            "total_cases": len(cases),
            "cases": cases,
            "status": "success"
        }
        
    except Exception as e:
        context.logger.error("Error getting evaluation cases for %s: %s", evaluation_id, str(e))
        return {
            "error": f"Failed to get evaluation cases: {str(e)}",
            "status": "error"
        }

async def handle_debug_kv_store(context: AgentContext) -> Dict[str, Any]:
    """Debug KV store to understand what's happening with the evaluations"""
    try:
        context.logger.info("Debugging KV store")
        
        debug_info = {
            "registry": {},
            "sample_metadata": {},
            "namespaces_checked": []
        }
        
        # Check the evaluation registry
        try:
            registry_result = await context.kv.get("eval_registry", "evaluation_list")
            if registry_result:
                registry_data = await registry_result.data.json()
                debug_info["registry"] = {
                    "exists": True,
                    "data": registry_data,
                    "evaluation_ids": registry_data.get("evaluation_ids", [])
                }
            else:
                debug_info["registry"] = {
                    "exists": False,
                    "message": "No evaluation registry found"
                }
        except Exception as e:
            debug_info["registry"] = {
                "exists": False,
                "error": str(e)
            }
        
        # If we found evaluation IDs, try to get sample metadata
        evaluation_ids = debug_info["registry"].get("evaluation_ids", [])
        if evaluation_ids:
            sample_id = evaluation_ids[0]
            try:
                # Try both key formats for metadata
                metadata_key = f"eval_run_{sample_id}_metadata"
                metadata_result = await context.kv.get("eval_metadata", metadata_key)
                if not metadata_result:
                    # Try direct evaluation_id
                    metadata_result = await context.kv.get("eval_metadata", sample_id)
                    metadata_key = sample_id
                
                if metadata_result:
                    metadata = await metadata_result.data.json()
                    debug_info["sample_metadata"] = {
                        "evaluation_id": sample_id,
                        "key_used": metadata_key,
                        "exists": True,
                        "data": metadata
                    }
                else:
                    debug_info["sample_metadata"] = {
                        "evaluation_id": sample_id,
                        "exists": False,
                        "message": "Metadata not found with either key format"
                    }
                    
                # Also check comparison data
                comparison_result = await context.kv.get("eval_comparison", sample_id)
                comparison_key = sample_id
                if not comparison_result:
                    comparison_key = f"eval_run_{sample_id}_comparison"
                    comparison_result = await context.kv.get("eval_comparison", comparison_key)
                
                if comparison_result:
                    comparison_data = await comparison_result.data.json()
                    debug_info["sample_comparison"] = {
                        "evaluation_id": sample_id,
                        "key_used": comparison_key,
                        "exists": True,
                        "total_cases": comparison_data.get("total_cases", 0),
                        "has_comparison_results": "comparison_results" in comparison_data
                    }
                else:
                    debug_info["sample_comparison"] = {
                        "evaluation_id": sample_id,
                        "exists": False,
                        "message": "Comparison data not found with either key format"
                    }
                    
            except Exception as e:
                debug_info["sample_metadata"] = {
                    "evaluation_id": sample_id,
                    "exists": False,
                    "error": str(e)
                }
        
        debug_info["namespaces_checked"] = [
            "eval_registry",
            "eval_metadata", 
            "eval_comparison",
            "eval_results",
            "eval_datasets",
            "eval_templates",
            "eval_processed"
        ]
        
        context.logger.info("Debug info collected: %s", debug_info)
        
        return {
            "debug": debug_info,
            "status": "success"
        }
        
    except Exception as e:
        context.logger.error("Debug KV store error: %s", str(e))
        return {
            "error": f"Failed to debug KV store: {str(e)}",
            "status": "error"
        } 