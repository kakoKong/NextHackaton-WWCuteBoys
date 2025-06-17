import boto3
import json
import os
from dotenv import load_dotenv
from opensearchpy import OpenSearch
import uuid
import pandas as pd

load_dotenv(override=True)

def get_titan_embedding(text: str) -> list:
    """
    Get embeddings with proper error handling
    """
    try: 
        bedrock = boto3.client(
            'bedrock-runtime', 
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name= os.getenv("AWS_DEFAULT_REGION")
        )
        
        payload = {"inputText": text}
        
        response = bedrock.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            body=json.dumps(payload),
            contentType='application/json'
        )
        
        result = json.loads(response['body'].read())
        
        if 'embedding' not in result:
            print(f"No embedding in response: {result}")
            return None
            
        embedding = result['embedding']
        
        if not embedding or len(embedding) == 0:
            print(f"Empty embedding received")
            return None
            
        print(f"Got embedding with {len(embedding)} dimensions")
        return embedding
        
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def setup_opensearch_client():
    """
    Funtion use to setup OpenSearch client with proper error handling     
    """
    endpoint = os.getenv("AWS_OPENSEARCH_ENDPOINT")
    username = os.getenv("AWS_OPENSEARCH_USERNAME")
    password = os.getenv("AWS_OPENSEARCH_PASSWORD")
    if not endpoint:
        print("AWS_OPENSEARCH_ENDPOINT not found in .env file")
        return None
    if endpoint.startswith('https://'):
        endpoint = endpoint.replace('https://', '')
    
    try:
        client = OpenSearch(
            hosts=[{'host': endpoint, 'port': 443}],
            http_auth=(username, password) if username and password else None,
            use_ssl=True,
            verify_certs=True,
            ssl_show_warn=False
        )
        print("OpenSearch client setup successfully")
        return client
    
    except Exception as e:
        print(f"Error setting up OpenSearch client: {e}")
        return None

client = setup_opensearch_client()
if client:
    index_name = "test-index"  # Name of the index to create or use
    # Updated index config for 1024 dimensions (Titan v2)
    index_config = {
        "settings": {
            "index": {
                "knn": True
            }
        },
        "mappings": {
            "properties": {
                "text": {"type": "text"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": 1024,  # Updated to match Titan v2
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil",
                        "engine": "nmslib"
                    }
                }
            }
        }
    }
    try:
        if not client.indices.exists(index=index_name):
            client.indices.create(
                index=index_name,
                body=index_config
            )
            print(f"Index '{index_name}' created successfully")
        else:
            print(f"Index '{index_name}' already exists")
    except Exception as e:
        print(f"Error creating index: {e}")
    
def index_text(text: str):
    """
    Index text with
    """
    if not client:
        print("Opensearch Client not available")
        return False 

    if not text or text.strip() == "":
        print("Text is empty, skipping indexing")
        return False
    
    try:
        embedding = get_titan_embedding(text)
        
        if embedding is None:
            print(f"Failed to get embedding for text: {text}")
            return False

        doc_id = str(uuid.uuid4())
        doc = {
            "text": text,
            "embedding": embedding
        }
        response = client.index(
            index=index_name,
            id=doc_id,
            body=doc,
        )
        return True
    except Exception as e:
        print(f"Error indexing text '{text}': {e}")
        return False

def search_similar_text(query: str, k: int = 5):
    """
    Search for similar text using the indexed embeddings
    """
    if not client:
        print("Opensearch Client not available")
        return []
    try:
        embedding = get_titan_embedding(query)
        if embedding is None:
            print(f"Failed to get embedding for query: {query}")
            return []
        body = {
            "size": k,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": embedding,
                        "k": k
                    }
                }
            }
        }
        response = client.search(index=index_name, body=body)
        results = []
        for hit in response['hits']['hits']:
            results.append({
                'text': hit['_source']['text'],
                'score': hit['_score']
            })
        return results
    except Exception as e:
        print(f"Error searching similar text for query '{query}': {e}")
        return []
    
    
    
if __name__ == "__main__":
    if client:
        print(f"\n=== Indexing Documents ===")
        texts = [
            "The capital of France is Paris.",
            "Machine learning is a branch of AI.",
            "Bananas are yellow.",
            "Python is a programming language.",
            "The sky is blue during the day."
        ]
        for text in texts:
            index_text(text)
        print("\n=== Searching Similar Text ===")
        query = "What is the capital of France?"
        results = search_similar_text(query, k=3)
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['text']} (Score: {result['score']})")
    else:
        print("OpenSearch client not available, cannot index or search.") 