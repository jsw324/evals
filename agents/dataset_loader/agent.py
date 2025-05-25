from agentuity import AgentRequest, AgentResponse, AgentContext
import json
import os
import aiohttp
from typing import List, Dict, Any

# {
#   "evaluation_id": "sentiment_classification_eval_002", 
#   "dataset_path": "datasets/text_classification.json",
#   "format": "query_response_pairs",
#   "prompt_template": {
#     "template": "Classify the sentiment of the following text as either 'positive', 'negative', or 'neutral'. Text: {{query}}\n\nSentiment:",
#     "variables": ["query"]
#   }
# }

def welcome():
    return {
        "welcome": "Dataset Loader Agent - I load and validate ground truth evaluation datasets from local files, external URLs, or inline JSON, along with prompt templates",
        "prompts": [
            {
                "data": json.dumps({
                    "dataset_path": "datasets/math_word_problems.json",
                    "evaluation_id": "math_eval_001",
                    "prompt_template": {
                        "template": "Solve this math problem and provide only the numerical answer: {{query}}",
                        "variables": ["query"]
                    }
                }),
                "contentType": "application/json"
            },
            {
                "data": json.dumps({
                    "dataset_path": "datasets/text_classification.json",
                    "evaluation_id": "sentiment_eval_001",
                    "prompt_template": {
                        "template": "{{query}}",
                        "variables": ["query"]
                    }
                }),
                "contentType": "application/json"
            },
            {
                "data": json.dumps({
                    "dataset_url": "https://raw.githubusercontent.com/your-repo/datasets/main/superhero_powers.json",
                    "evaluation_id": "superhero_url_eval_001",
                    "format": "query_response_pairs",
                    "prompt_template": {
                        "template": "{{query}}",
                        "variables": ["query"]
                    }
                }),
                "contentType": "application/json"
            },
            {
                "data": json.dumps({
                    "dataset_json": [
                        {
                            "query": "How effective would teleportation be for avoiding traffic jams?",
                            "response": "Extremely effective - instant commute, zero gas costs, but you'd miss out on car karaoke and podcast time."
                        },
                        {
                            "query": "Rate the usefulness of mind-reading for online shopping.",
                            "response": "Moderately useful - you'd know what products really think about you, but also discover your credit card's existential dread."
                        }
                    ],
                    "evaluation_id": "inline_eval_001",
                    "format": "query_response_pairs",
                    "prompt_template": {
                        "template": "{{query}}",
                        "variables": ["query"]
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
        dataset_path = data.get("dataset_path")
        dataset_url = data.get("dataset_url")
        dataset_json = data.get("dataset_json")
        evaluation_id = data.get("evaluation_id")
        dataset_format = data.get("format", "query_response_pairs")
        prompt_template = data.get("prompt_template")
        
        # Validate input - need either path, URL, or inline JSON
        if not evaluation_id:
            return response.json({
                "error": "Missing required field: evaluation_id"
            })
        
        # Validate template information
        if not prompt_template:
            return response.json({
                "error": "Missing required field: prompt_template"
            })
        
        template_validation = validate_template(prompt_template)
        if not template_validation["valid"]:
            return response.json({
                "error": f"Template validation failed: {template_validation['error']}"
            })
        
        source_count = sum(1 for x in [dataset_path, dataset_url, dataset_json] if x is not None)
        
        if source_count == 0:
            return response.json({
                "error": "Must provide one of: dataset_path (local file), dataset_url (external URL), or dataset_json (inline data)"
            })
        
        if source_count > 1:
            return response.json({
                "error": "Provide only ONE of: dataset_path, dataset_url, or dataset_json"
            })
        
        # Determine source and load dataset
        source_info = {}
        if dataset_path:
            context.logger.info("Loading dataset from local file: %s for evaluation: %s", dataset_path, evaluation_id)
            dataset, source_info = await load_local_dataset(dataset_path)
        elif dataset_url:
            context.logger.info("Loading dataset from URL: %s for evaluation: %s", dataset_url, evaluation_id)
            dataset, source_info = await load_remote_dataset(dataset_url)
        else:
            context.logger.info("Loading dataset from inline JSON for evaluation: %s", evaluation_id)
            dataset, source_info = load_inline_dataset(dataset_json)
        
        # Validate dataset format
        validation_result = validate_dataset(dataset, dataset_format)
        if not validation_result["valid"]:
            return response.json({
                "error": f"Dataset validation failed: {validation_result['error']}"
            })
        
        # Store dataset in key-value store for other agents
        dataset_key = f"eval_run_{evaluation_id}_dataset"
        await context.kv.set("eval_datasets", dataset_key, {
            "dataset": dataset,
            "source": source_info,
            "format": dataset_format,
            "total_cases": len(dataset)
        })
        
        # Store template in key-value store
        template_key = f"eval_run_{evaluation_id}_template"
        await context.kv.set("eval_templates", template_key, prompt_template)
        
        # Store evaluation metadata
        eval_metadata_key = f"eval_run_{evaluation_id}_metadata"
        await context.kv.set("eval_metadata", eval_metadata_key, {
            "evaluation_id": evaluation_id,
            "status": "dataset_loaded",
            "total_cases": len(dataset),
            "source": source_info,
            "format": dataset_format,
            "template_variables": prompt_template.get("variables", [])
        })
        context.logger.info("Successfully loaded %d cases from dataset: %s", len(dataset), source_info.get("location", "unknown"))
        context.logger.info("Handing off to template_manager agent: %s", evaluation_id)
        
        # Hand off to template_manager agent
        return response.handoff(
            {"name": "template_manager"},
            {"evaluation_id": evaluation_id},
            {"source": "dataset_loader"}
        )
        
    except json.JSONDecodeError as e:
        context.logger.error("JSON decode error: %s", str(e))
        return response.json({
            "error": f"Invalid JSON in dataset: {str(e)}"
        })
    
    except Exception as e:
        context.logger.error("Error in dataset_loader: %s", str(e))
        return response.json({
            "error": f"Error in dataset_loader: {str(e)}"
        })

async def load_local_dataset(dataset_path: str) -> tuple[List[Dict[str, Any]], Dict[str, str]]:
    """Load dataset from local file"""
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    
    with open(dataset_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)
    
    source_info = {
        "type": "local_file",
        "location": dataset_path,
        "absolute_path": os.path.abspath(dataset_path)
    }
    
    return dataset, source_info

async def load_remote_dataset(dataset_url: str) -> tuple[List[Dict[str, Any]], Dict[str, str]]:
    """Load dataset from external URL"""
    async with aiohttp.ClientSession() as session:
        async with session.get(dataset_url) as response:
            if response.status != 200:
                raise Exception(f"Failed to fetch dataset from URL: {dataset_url} (status: {response.status})")
            
            content = await response.text()
            dataset = json.loads(content)
    
    source_info = {
        "type": "external_url",
        "location": dataset_url,
        "status_code": response.status
    }
    
    return dataset, source_info

def load_inline_dataset(dataset_json: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], Dict[str, str]]:
    """Load dataset from inline JSON payload"""
    if not isinstance(dataset_json, list):
        raise ValueError("Inline dataset_json must be a list of objects")
    
    source_info = {
        "type": "inline_json",
        "location": "request_payload",
        "size_bytes": len(str(dataset_json))
    }
    
    return dataset_json, source_info

def validate_dataset(dataset: List[Dict[str, Any]], format_type: str) -> Dict[str, Any]:
    """Validate the dataset format and structure"""
    
    if not isinstance(dataset, list):
        return {"valid": False, "error": "Dataset must be a list of objects"}
    
    if len(dataset) == 0:
        return {"valid": False, "error": "Dataset cannot be empty"}
    
    if format_type == "query_response_pairs":
        for i, item in enumerate(dataset):
            if not isinstance(item, dict):
                return {"valid": False, "error": f"Item {i} must be an object"}
            
            if "query" not in item or "response" not in item:
                return {"valid": False, "error": f"Item {i} must have 'query' and 'response' fields"}
            
            if not isinstance(item["query"], str) or not isinstance(item["response"], str):
                return {"valid": False, "error": f"Item {i} 'query' and 'response' must be strings"}
    
    return {"valid": True, "error": None}

def validate_template(template: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the prompt template structure"""
    
    if not isinstance(template, dict):
        return {"valid": False, "error": "Template must be an object"}
    
    if "template" not in template:
        return {"valid": False, "error": "Template must have a 'template' field"}
    
    if not isinstance(template["template"], str):
        return {"valid": False, "error": "Template 'template' field must be a string"}
    
    if "variables" not in template:
        return {"valid": False, "error": "Template must have a 'variables' field"}
    
    if not isinstance(template["variables"], list):
        return {"valid": False, "error": "Template 'variables' field must be a list"}
    
    # Check that all variables in the template string are listed in variables array
    template_string = template["template"]
    declared_variables = set(template["variables"])
    
    # Simple variable extraction (looking for {{variable}} patterns)
    import re
    found_variables = set(re.findall(r'\{\{(\w+)\}\}', template_string))
    
    undeclared_variables = found_variables - declared_variables
    if undeclared_variables:
        return {"valid": False, "error": f"Template uses undeclared variables: {', '.join(undeclared_variables)}"}
    
    unused_variables = declared_variables - found_variables
    if unused_variables:
        return {"valid": False, "error": f"Template declares unused variables: {', '.join(unused_variables)}"}
    
    return {"valid": True, "error": None}