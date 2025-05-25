from agentuity import AgentRequest, AgentResponse, AgentContext
import json
import re
from typing import List, Dict, Any

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    try:
        # Parse the incoming request (should just be evaluation_id from handoff)
        data = await request.data.json()
        evaluation_id = data.get("evaluation_id")
        
        if not evaluation_id:
            return response.json({
                "error": "Missing required field: evaluation_id"
            })
        
        context.logger.info("Processing templates for evaluation: %s", evaluation_id)
        
        # Retrieve dataset from KV store
        dataset_key = f"eval_run_{evaluation_id}_dataset"
        dataset_result = await context.kv.get("eval_datasets", dataset_key)
        
        context.logger.info("Dataset result: %s", dataset_result)

        if not dataset_result:
            return response.json({
                "error": f"Dataset not found for evaluation: {evaluation_id}"
            })
        
        # Retrieve template from KV store
        template_key = f"eval_run_{evaluation_id}_template"
        template_result = await context.kv.get("eval_templates", template_key)
        
        if not template_result:
            return response.json({
                "error": f"Template not found for evaluation: {evaluation_id}"
            })
        
        # Access the actual data from the DataResult objects
        dataset_data = await dataset_result.data.json()
        template_data = await template_result.data.json()
        
        dataset = dataset_data["dataset"]
        template_string = template_data["template"]
        variables = template_data["variables"]
        
        context.logger.info("Processing %d cases with template: %s", len(dataset), template_string[:50] + "...")
        
        # Process each case in the dataset
        processed_cases = []
        for i, case in enumerate(dataset):
            try:
                # Substitute variables in template
                processed_prompt = substitute_template_variables(template_string, case, variables)
                
                processed_case = {
                    "case_id": f"{evaluation_id}_case_{i}",
                    "original_query": case["query"],
                    "expected_response": case["response"],
                    "processed_prompt": processed_prompt,
                    "template_variables": {var: case.get(var, "") for var in variables}
                }
                
                processed_cases.append(processed_case)
                
            except Exception as e:
                context.logger.error("Error processing case %d: %s", i, str(e))
                return response.json({
                    "error": f"Error processing case {i}: {str(e)}"
                })
        
        # Store processed cases in KV store
        processed_key = f"eval_run_{evaluation_id}_processed"
        await context.kv.set("eval_processed", processed_key, {
            "evaluation_id": evaluation_id,
            "total_cases": len(processed_cases),
            "processed_cases": processed_cases,
            "template_info": {
                "original_template": template_string,
                "variables": variables
            }
        })
        
        # Update metadata
        eval_metadata_key = f"eval_run_{evaluation_id}_metadata"
        metadata_result = await context.kv.get("eval_metadata", eval_metadata_key)
        if metadata_result:
            metadata = await metadata_result.data.json()
            metadata["status"] = "templates_processed"
            metadata["processed_cases"] = len(processed_cases)
            await context.kv.set("eval_metadata", eval_metadata_key, metadata)
        
        context.logger.info("Successfully processed %d cases for evaluation: %s", len(processed_cases), evaluation_id)
        
        # Hand off to evaluation_runner agent
        return response.handoff(
            {"name": "evaluation_runner"},
            {"evaluation_id": evaluation_id},
            {"source": "template_manager"}
        )
        
    except Exception as e:
        context.logger.error("Error in template processing: %s", str(e))
        return response.json({
            "error": f"Failed to process templates: {str(e)}"
        })

def substitute_template_variables(template: str, case_data: Dict[str, Any], variables: List[str]) -> str:
    """Substitute variables in template string with values from case data"""
    
    result = template
    
    for variable in variables:
        placeholder = f"{{{{{variable}}}}}"
        
        if variable not in case_data:
            raise ValueError(f"Variable '{variable}' not found in case data")
        
        value = str(case_data[variable])
        result = result.replace(placeholder, value)
    
    # Check if there are any unsubstituted variables left
    remaining_variables = re.findall(r'\{\{(\w+)\}\}', result)
    if remaining_variables:
        raise ValueError(f"Unsubstituted variables found: {', '.join(remaining_variables)}")
    
    return result 