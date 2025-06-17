import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8001"

def test_health_check():
    """Test the health check endpoint"""
    print("=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_finding_documents():
    """Test the finding documents endpoint"""
    print("=== Testing Finding Documents ===")
    
    payload = {
        "user_query": "I'm looking for a red dress for summer",
        "image_prompt": "casual summer clothing"
    }
    
    response = requests.post(
        f"{BASE_URL}/finding_documents",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Results count: {len(result['results'])}")
        for i, item in enumerate(result['results']):
            print(f"  Result {i+1}:")
            print(f"    Brand: {item['brand_name']}")
            print(f"    Description: {item['description']}")
            print(f"    Price: {item['price']}")
            print(f"    Location: {item['location']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_image_captioning():
    """Test the image captioning endpoint"""
    print("=== Testing Image Captioning ===")
    
    payload = {
        "image_path": "images/red_dress_photo.jpg"
    }
    
    response = requests.post(
        f"{BASE_URL}/image_captioning",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Caption: {result['results']}")
        print(f"Processing time: {result['processing_time']:.2f}s")
    else:
        print(f"Error: {response.text}")
    print()

def test_generation():
    """Test the generation endpoint"""
    print("=== Testing Generation ===")
    
    # Test with reference
    payload = {
        "question": "What sizes are available?",
        "reference": "Red summer dress, 100% cotton, available in multiple sizes, priced at $49.99"
    }
    
    response = requests.post(
        f"{BASE_URL}/generation",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {result['response']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_generation_no_reference():
    """Test the generation endpoint without reference"""
    print("=== Testing Generation (No Reference) ===")
    
    payload = {
        "question": "What products do you have?",
        "reference": ""
    }
    
    response = requests.post(
        f"{BASE_URL}/generation",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {result['response']}")
    else:
        print(f"Error: {response.text}")
    print()

def test_all_endpoints():
    """Run all tests"""
    print("Starting API tests...\n")
    
    test_health_check()
    test_finding_documents()
    test_image_captioning()
    test_generation()
    test_generation_no_reference()
    
    print("All tests completed!")

if __name__ == "__main__":
    # You can run individual tests or all tests
    
    # Run all tests
    test_all_endpoints()
    
    # Or run individual tests:
    # test_health_check()
    # test_finding_documents()
    # test_image_captioning()
    # test_generation()

# Example using requests.Session for multiple calls
def example_with_session():
    """Example using session for multiple API calls"""
    print("=== Example with Session ===")
    
    with requests.Session() as session:
        session.headers.update({"Content-Type": "application/json"})
        
        # Health check
        health = session.get(f"{BASE_URL}/health")
        print(f"Health: {health.json()}")
        
        # Find documents
        docs_payload = {
            "user_query": "blue jeans",
            "image_prompt": "denim clothing"
        }
        docs = session.post(f"{BASE_URL}/finding_documents", json=docs_payload)
        print(f"Found {len(docs.json()['results'])} products")
        
        # Generate response based on found products
        if docs.status_code == 200:
            first_product = docs.json()['results'][0]
            gen_payload = {
                "question": "Tell me more about this product",
                "reference": f"{first_product['description']} - {first_product['brand_name']} - {first_product['price']}"
            }
            gen = session.post(f"{BASE_URL}/generation", json=gen_payload)
            print(f"Generated response: {gen.json()['response']}")

# Async example using aiohttp (requires: pip install aiohttp)
async def async_example():
    """Example using async requests"""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        # Test finding documents
        payload = {
            "user_query": "leather shoes",
            "image_prompt": "footwear"
        }
        
        async with session.post(
            f"{BASE_URL}/finding_documents",
            json=payload
        ) as response:
            result = await response.json()
            print(f"Async result: {result}")

# Uncomment to run async example:
# import asyncio
# asyncio.run(async_example())