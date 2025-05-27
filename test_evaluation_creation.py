#!/usr/bin/env python3
"""
Test script to verify evaluation creation via the dataset_loader agent
"""

import json
import requests
import time

# Configuration
AGENTUITY_BASE_URL = "https://dev-uzeflmvib.agentuity.run"
DATASET_LOADER_AGENT_ID = "agent_abcf9ad4245d2d89aed9eb38aef21fd6"
RESULTS_API_AGENT_ID = "agent_b46de37831f94d01b06b2ccfd183efa0"

def test_evaluation_creation():
    """Test creating a new evaluation"""
    
    print("🧪 Testing Evaluation Creation")
    print(f"📡 Dataset Loader Endpoint: {AGENTUITY_BASE_URL}/{DATASET_LOADER_AGENT_ID}")
    
    # Small test dataset with just 2 examples
    test_dataset = [
        {
            "query": "What is Superman's main weakness?",
            "response": "Kryptonite is Superman's main weakness."
        },
        {
            "query": "Can Batman fly?",
            "response": "No, Batman cannot fly naturally, but he uses various gadgets and vehicles."
        }
    ]
    
    # Test payload matching the frontend configuration
    test_payload = {
        "evaluation_id": f"test_eval_{int(time.time())}",
        "dataset_json": test_dataset,  # Use inline dataset instead of file
        "format": "query_response_pairs",
        "prompt_template": {
            "template": "You are an expert assistant. Answer the following question: {{query}}",
            "variables": ["query"]
        },
        "model_config": {
            "model_name": "claude-3-5-sonnet-latest",
            "max_tokens": 100,
            "temperature": 0.1
        },
        "evaluation_settings": {
            "similarity_threshold": 80,
            "judge_model": "claude-3-5-haiku-latest"
        }
    }
    
    try:
        print(f"📤 Sending request to dataset_loader agent...")
        print(f"📋 Evaluation ID: {test_payload['evaluation_id']}")
        
        response = requests.post(
            f"{AGENTUITY_BASE_URL}/{DATASET_LOADER_AGENT_ID}",
            headers={"Content-Type": "application/json"},
            json=test_payload,
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {json.dumps(result, indent=2)}")
            
            # Test if we can retrieve the evaluation from results API
            print(f"\n🔍 Testing Results API...")
            test_results_api(test_payload['evaluation_id'])
            
        else:
            print(f"❌ Failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def test_results_api(evaluation_id):
    """Test retrieving evaluation from results API"""
    
    try:
        # Test listing evaluations
        list_payload = {"operation": "list_evaluations"}
        
        response = requests.post(
            f"{AGENTUITY_BASE_URL}/{RESULTS_API_AGENT_ID}",
            headers={"Content-Type": "application/json"},
            json=list_payload,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            evaluations = result.get("evaluations", [])
            print(f"📋 Found {len(evaluations)} evaluations in results API")
            
            # Check if our evaluation is in the list
            found = any(eval_item["id"] == evaluation_id for eval_item in evaluations)
            if found:
                print(f"✅ Evaluation {evaluation_id} found in results API!")
            else:
                print(f"⚠️  Evaluation {evaluation_id} not yet visible in results API (may take a moment)")
                
        else:
            print(f"❌ Results API failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Results API test failed: {e}")

def test_with_inline_dataset():
    """Test creating evaluation with inline dataset"""
    
    print("\n🧪 Testing Evaluation Creation with Inline Dataset")
    
    # Small inline dataset for testing
    inline_dataset = [
        {
            "query": "What is Superman's main weakness?",
            "response": "Kryptonite is Superman's main weakness."
        },
        {
            "query": "Can Batman fly?",
            "response": "No, Batman cannot fly naturally, but he uses various gadgets and vehicles."
        }
    ]
    
    test_payload = {
        "evaluation_id": f"inline_test_eval_{int(time.time())}",
        "dataset_json": inline_dataset,
        "format": "query_response_pairs",
        "prompt_template": {
            "template": "Answer this superhero question: {{query}}",
            "variables": ["query"]
        },
        "model_config": {
            "model_name": "claude-3-5-haiku-latest",
            "max_tokens": 50,
            "temperature": 0.0
        },
        "evaluation_settings": {
            "similarity_threshold": 75,
            "judge_model": "claude-3-5-haiku-latest"
        }
    }
    
    try:
        print(f"📤 Sending inline dataset request...")
        print(f"📋 Evaluation ID: {test_payload['evaluation_id']}")
        print(f"📊 Dataset size: {len(inline_dataset)} items")
        
        response = requests.post(
            f"{AGENTUITY_BASE_URL}/{DATASET_LOADER_AGENT_ID}",
            headers={"Content-Type": "application/json"},
            json=test_payload,
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Inline dataset test successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Inline dataset test failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error text: {response.text}")
                
    except Exception as e:
        print(f"❌ Inline dataset test failed: {e}")

if __name__ == "__main__":
    print("🚀 AI Evaluation System - API Test")
    print("=" * 50)
    
    # Test with existing dataset
    test_evaluation_creation()
    
    # Test with inline dataset
    test_with_inline_dataset()
    
    print("\n✨ Testing complete!") 