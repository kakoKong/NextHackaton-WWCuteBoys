import requests

BASE_URL = "http://localhost:8001"
HEADERS = {"Content-Type": "application/json"}

def post_request(endpoint: str, payload: dict, headers: dict, timeout: int = 14):
    url = f"{BASE_URL}/{endpoint}"
    try:
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=timeout
        )
        print(f"\n📡 POST to {endpoint}")
        print(f"Status Code: {response.status_code}")
        print(f"Response Time: {response.elapsed.total_seconds():.1f}s")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Request successful!")
            return result
        else:
            print(f"❌ Request failed: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None

def filter_reference_documents(reference_documents):
    """
    Filter the reference documents to only include search_term and limited search_results fields.
    
    Args:
        reference_documents: The original reference documents with full details
        
    Returns:
        Filtered reference documents with only the required fields
    """
    filtered_documents = []
    
    for doc in reference_documents:
        filtered_results = []
        for result in doc["search_results"]:
            filtered_results.append({
                "score": result["score"],
                "id": result["id"],
                "name": result["name"],
                "price": result["price"]
            })
        
        filtered_documents.append({
            "search_term": doc["search_term"],
            "search_results": filtered_results
        })
    
    return filtered_documents
