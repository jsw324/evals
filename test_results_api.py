#!/usr/bin/env python3
"""
Test script for the Results API agent
"""

import requests
import json

# Configuration
BASE_URL = "https://dev-uzeflmvib.agentuity.run"
AGENT_ID = "agent_b46de37831f94d01b06b2ccfd183efa0"
ENDPOINT = f"{BASE_URL}/{AGENT_ID}"

def test_operation(operation, **kwargs):
    """Test a specific operation"""
    payload = {"operation": operation, **kwargs}
    
    print(f"\n🧪 Testing operation: {operation}")
    print(f"📤 Request: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            ENDPOINT,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {json.dumps(result, indent=2)}")
            return result
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"💥 Exception: {str(e)}")
        return None

def main():
    print("🚀 Testing Results API Agent")
    print(f"🔗 Endpoint: {ENDPOINT}")
    
    # Test 1: List evaluations
    evaluations = test_operation("list_evaluations")
    
    if evaluations and "evaluations" in evaluations:
        eval_list = evaluations["evaluations"]
        print(f"\n📋 Found {len(eval_list)} evaluations")
        
        if eval_list:
            # Test 2: Get details for first evaluation
            first_eval_id = eval_list[0]["id"]
            print(f"\n🔍 Testing details for evaluation: {first_eval_id}")
            test_operation("get_evaluation_details", evaluation_id=first_eval_id)
            
            # Test 3: Get cases for first evaluation
            print(f"\n📝 Testing cases for evaluation: {first_eval_id}")
            test_operation("get_evaluation_cases", evaluation_id=first_eval_id)
        else:
            print("\n📭 No evaluations found - run some evaluations first!")
    
    # Test 4: Invalid operation
    print(f"\n🚫 Testing invalid operation")
    test_operation("invalid_operation")
    
    print(f"\n✨ Testing complete!")

if __name__ == "__main__":
    main() 