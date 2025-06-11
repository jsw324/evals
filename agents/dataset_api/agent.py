from agentuity import AgentRequest, AgentResponse, AgentContext
import json
import os
from typing import List, Dict, Any
from datetime import datetime

class DatasetAPI:
    def __init__(self):
        self.datasets_dir = "datasets"
    
    def list_datasets(self) -> List[Dict[str, Any]]:
        """List all available datasets with metadata"""
        datasets = []
        
        if not os.path.exists(self.datasets_dir):
            return datasets
            
        for filename in os.listdir(self.datasets_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.datasets_dir, filename)
                try:
                    # Get file stats
                    stat = os.stat(filepath)
                    file_size = stat.st_size
                    modified_time = datetime.fromtimestamp(stat.st_mtime).isoformat()
                    
                    # Read dataset to count items
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        item_count = len(data) if isinstance(data, list) else 0
                    
                    datasets.append({
                        "name": filename,
                        "size": file_size,
                        "items": item_count,
                        "lastModified": modified_time,
                        "type": "json",
                        "path": filepath
                    })
                except (json.JSONDecodeError, OSError) as e:
                    # Skip files that can't be read or parsed
                    continue
        
        # Sort by name
        datasets.sort(key=lambda x: x['name'])
        return datasets
    
    def get_dataset_preview(self, filename: str, max_items: int = 3) -> Dict[str, Any]:
        """Get a preview of dataset contents"""
        filepath = os.path.join(self.datasets_dir, filename)
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset {filename} not found")
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                if not isinstance(data, list):
                    raise ValueError("Dataset must be a JSON array")
                
                preview_items = data[:max_items]
                
                return {
                    "filename": filename,
                    "total_items": len(data),
                    "preview": preview_items,
                    "schema": self._infer_schema(data)
                }
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in dataset {filename}: {str(e)}")
    
    def _infer_schema(self, data: List[Dict]) -> Dict[str, str]:
        """Infer the schema from dataset items"""
        if not data:
            return {}
        
        schema = {}
        first_item = data[0]
        
        for key, value in first_item.items():
            if isinstance(value, str):
                schema[key] = "string"
            elif isinstance(value, (int, float)):
                schema[key] = "number"
            elif isinstance(value, bool):
                schema[key] = "boolean"
            elif isinstance(value, list):
                schema[key] = "array"
            elif isinstance(value, dict):
                schema[key] = "object"
            else:
                schema[key] = "unknown"
        
        return schema

async def welcome(request: AgentRequest, context: AgentContext) -> AgentResponse:
    return {
        "welcome": "Dataset API Agent - I provide real-time access to evaluation datasets from the filesystem",
        "operations": [
            "list_datasets - Get all available datasets with metadata",
            "get_dataset_preview - Get preview of dataset contents",
            "validate_dataset - Validate dataset format"
        ],
        "examples": [
            {
                "operation": "list_datasets",
                "description": "Returns list of all JSON datasets in the datasets directory"
            },
            {
                "operation": "get_dataset_preview",
                "data": json.dumps({"filename": "superhero_powers.json", "max_items": 2}),
                "description": "Returns preview of dataset with first 2 items"
            }
        ]
    }

async def run(request: AgentRequest, context: AgentContext) -> AgentResponse:
    try:
        data = request.data
        operation = data.get('operation')
        
        dataset_api = DatasetAPI()
        
        if operation == 'list_datasets':
            datasets = dataset_api.list_datasets()
            return {
                "success": True,
                "datasets": datasets,
                "count": len(datasets)
            }
        
        elif operation == 'get_dataset_preview':
            filename = data.get('filename')
            max_items = data.get('max_items', 3)
            
            if not filename:
                return {
                    "success": False,
                    "error": "filename is required for preview operation"
                }
            
            preview = dataset_api.get_dataset_preview(filename, max_items)
            return {
                "success": True,
                **preview
            }
        
        elif operation == 'validate_dataset':
            filename = data.get('filename')
            
            if not filename:
                return {
                    "success": False,
                    "error": "filename is required for validation"
                }
            
            try:
                # Try to get preview (which validates the format)
                dataset_api.get_dataset_preview(filename, 1)
                return {
                    "success": True,
                    "valid": True,
                    "message": f"Dataset {filename} is valid"
                }
            except Exception as e:
                return {
                    "success": True,
                    "valid": False,
                    "error": str(e)
                }
        
        else:
            return {
                "success": False,
                "error": f"Unknown operation: {operation}. Supported operations: list_datasets, get_dataset_preview, validate_dataset"
            }
    
    except Exception as e:
        context.logger.error("Dataset API error: %s", str(e))
        return {
            "success": False,
            "error": f"Internal error: {str(e)}"
        }