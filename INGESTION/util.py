import boto3
from dotenv import load_dotenv
from opensearchpy import OpenSearch
import os 
import json

load_dotenv(override=True)
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_DEFAULT_REGION = os.environ["AWS_DEFAULT_REGION"]
AWS_OPENSEARCH_ENDPOINT = os.environ["AWS_OPENSEARCH_ENDPOINT"]
AWS_OPENSEARCH_USERNAME = os.environ["AWS_OPENSEARCH_USERNAME"]
AWS_OPENSEARCH_PASSWORD = os.environ["AWS_OPENSEARCH_PASSWORD"]



def get_client():
    """
    Function use to create a client for OpenSearch
    """
    client = OpenSearch(
    hosts=[{'host': AWS_OPENSEARCH_ENDPOINT, 'port': 443}],
    http_auth=(AWS_OPENSEARCH_USERNAME, AWS_OPENSEARCH_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    ssl_show_warn=False,
    )
    return client

def get_titan_embedding(text: str) -> list:
    """Get embeddings with proper error handling"""
    try:
        bedrock = boto3.client(
            'bedrock-runtime', 
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_DEFAULT_REGION
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
            
        #print(f"Got embedding with {len(embedding)} dimensions")
        return embedding
        
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

