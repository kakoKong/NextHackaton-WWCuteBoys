import boto3
import json
import os
from typing import List, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
import logging
from dotenv import load_dotenv
import json
from pydantic import BaseModel, Field
from typing import List, Optional
from opensearchpy import OpenSearch
import sys

class ProductSearch(BaseModel):
    response: List[str] = Field(description="List of simple product search queries")

load_dotenv()

logger = logging.getLogger(__name__)

def load_env_file():
    """Load environment variables from .env file if it exists"""
    if os.path.exists('.env'):
        logger.info("Loading .env file...")
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        return True
    return False

# Load .env file at module import
load_env_file()

AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME")
AWS_DEFAULT_REGION = os.environ["AWS_DEFAULT_REGION"]
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
def get_bedrock_client():
    """Initialize Bedrock client with proper error handling"""
    try:
        # Check if credentials are available
        aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
        
        if not aws_access_key or not aws_secret_key:
            logger.error("AWS credentials not found in environment variables")
            logger.info("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
            return None
        
        client = boto3.client(
            "bedrock-runtime",
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )
        
        logger.info(f"Bedrock client initialized for region: {region}")
        return client
        
    except Exception as e:
        logger.error(f"Failed to initialize Bedrock client: {e}")
        return None

def get_s3_client():
    """Initialize Bedrock client with proper error handling"""
    try:
        # Check if credentials are available
        aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
        aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
        region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
        
        if not aws_access_key or not aws_secret_key:
            logger.error("AWS credentials not found in environment variables")
            logger.info("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
            return None
        
        client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )
        
        logger.info(f"Bedrock client initialized for region: {region}")
        return client
        
    except Exception as e:
        logger.error(f"Failed to initialize Bedrock client: {e}")
        return None

def get_opensearch_client():
    """
    Function use to create a client for OpenSearch
    """
    AWS_OPENSEARCH_ENDPOINT = os.environ["AWS_OPENSEARCH_ENDPOINT"]
    AWS_OPENSEARCH_USERNAME = os.environ["AWS_OPENSEARCH_USERNAME"]
    AWS_OPENSEARCH_PASSWORD = os.environ["AWS_OPENSEARCH_PASSWORD"]
    client = OpenSearch(
    hosts=[{'host': AWS_OPENSEARCH_ENDPOINT, 'port': 443}],
    http_auth=(AWS_OPENSEARCH_USERNAME, AWS_OPENSEARCH_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    ssl_show_warn=False,
    )
    return client


def invoke_bedrock_model_stream(client, id, prompt, max_tokens=2000, temperature=0, top_p=0.9):
    response = ""
    response = client.converse_stream(
        modelId=id,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        inferenceConfig={
            "temperature": temperature,
            "maxTokens": max_tokens,
            "topP": top_p
        }
    )
    # Extract and print the response text in real-time.
    for event in response['stream']:
        if 'contentBlockDelta' in event:
            chunk = event['contentBlockDelta']
            sys.stdout.write(chunk['delta']['text'])
            sys.stdout.flush()
    return


# Initialize client
bedrock_client = get_bedrock_client()
s3_client = get_s3_client()
model_id = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-haiku-20241022-v1:0')
client = get_opensearch_client()

def download_file_from_s3(path_to_file_s3: str, download_path: str) -> None:
    # Configurations
    # object_key = path_to_file_s3  # key of the image in the bucket
    # download_path = 'Images/latest.png'  # where to save the image locally
    # Download the image
    s3_client.download_file(AWS_S3_BUCKET_NAME, path_to_file_s3, download_path)
    print(f"Image downloaded to {download_path}")

async def chat_with_bedrock(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Use Bedrock's converse API for chat completion
    """
    if bedrock_client is None:
        raise Exception("Bedrock client not initialized. Please check AWS credentials.")
    
    # Convert messages to Bedrock converse format
    converse_messages = []
    system_prompts = []
    
    for msg in messages:
        if msg["role"] == "system":
            system_prompts.append({"text": msg["content"]})
        else:
            converse_messages.append({
                "role": msg["role"],
                "content": [{"text": msg["content"]}]
            })
    
    # Prepare request
    request_params = {
        "modelId": model_id,
        "messages": converse_messages,
        "inferenceConfig": {
            "maxTokens": 2048,
            "temperature": 0.1,
            "topP": 0.9
        }
    }
    
    # Add system prompts if any
    if system_prompts:
        request_params["system"] = system_prompts
    
    logger.info(f"Calling Bedrock with model: {model_id}")
    
    # Call Bedrock converse API
    response = bedrock_client.converse(**request_params)
    
    # Extract response text
    response_text = response['output']['message']['content'][0]['text']
    
    logger.info(f"Bedrock response received: {response_text[:100]}...")
    
    # Return in OpenAI-compatible format
    return {
        "choices": [{
            "message": {
                "content": response_text
            }
        }]
    }
async def function_calling_with_bedrock(messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Use Bedrock's converse API for chat completion
    """
    product_search_tool = convert_pydantic_to_bedrock_tool(ProductSearch)
    if bedrock_client is None:
        raise Exception("Bedrock client not initialized. Please check AWS credentials.")
    
    try:
        tools = [product_search_tool]

        response = bedrock_client.converse(
            modelId="anthropic.claude-3-haiku-20240307-v1:0",
            # system=system_prompt,  # System instructions go here
            messages=messages,
            inferenceConfig={
                'maxTokens': 4096,
                'temperature': 0,
                'topP': 1,
            },
            toolConfig={
                "tools": tools,
                "toolChoice": {
                    "tool": {"name": "ProductSearch"}  # Fixed: should match your actual tool name
                }
            },
        )

        output = response['output']['message']['content'][0]['toolUse']['input']
        print(output)
        
        # Return in OpenAI-compatible format
        return {
            "choices": [{
                "message": {
                    "content": output
                }
            }]
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"Bedrock ClientError - Code: {error_code}, Message: {error_message}")
        
        if error_code == 'UnauthorizedOperation':
            raise Exception("Access denied to Bedrock. Check your IAM permissions.")
        elif error_code == 'ValidationException':
            raise Exception(f"Invalid request parameters: {error_message}")
        elif error_code == 'ResourceNotFoundException':
            raise Exception(f"Model not found: {model_id}. Check if model is available in your region.")
        else:
            raise Exception(f"Bedrock API error: {error_message}")
            
    except NoCredentialsError:
        logger.error("AWS credentials not found")
        raise Exception("AWS credentials not configured properly")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise Exception(f"Chat error: {e}")

async def image_to_text(model_id,
                          input_text,
                          input_image):
    """
    Sends a message to a model.
    Args:
        bedrock_client: The Boto3 Bedrock runtime client.
        model_id (str): The model ID to use.
        input text : The input message.
        input_image : The input image.

    Returns:
        response (JSON): The conversation that the model generated.

    """

    print(f"Generating message with model {model_id}")

    # Message to send.

    with open(input_image, "rb") as f:
        image = f.read()

    message = {
        "role": "user",
        "content": [
            {
                "text": input_text
            },
            {
                    "image": {
                        "format": 'jpeg',
                        "source": {
                            "bytes": image
                        }
                    }
            }
        ]
    }

    messages = [message]

    # Send the message.
    response = bedrock_client.converse(
        modelId=model_id,
        messages=messages
    )

    return response['output']['message']['content'][0]['text']



# def mock_semantic_search(query: str) -> Dict[str, str]:
#     """
#     Mock semantic search - returns fixed product data
#     """
#     # Mock product database
#     mock_products = [
#         {
#             "materials": "100% Cotton",
#             "description": "Classic red summer dress perfect for casual occasions",
#             "brand_name": "The Mall Fashion",
#             "price": "$49.99",
#             "location": "Floor 2, Section A"
#         },
#         {
#             "materials": "Polyester blend",
#             "description": "Blue jeans with comfortable fit and modern styling",
#             "brand_name": "Denim Pro",
#             "price": "$79.99",
#             "location": "Floor 1, Section B"
#         },
#         {
#             "materials": "Leather",
#             "description": "Brown leather shoes suitable for business and casual wear",
#             "brand_name": "Shoe Gallery",
#             "price": "$129.99",
#             "location": "Floor 3, Section C"
#         }
#     ]
    
#     # Simple keyword matching for demo
#     query_lower = query.lower()
    
#     if any(word in query_lower for word in ['dress', 'red', 'summer']):
#         return mock_products[0]
#     elif any(word in query_lower for word in ['jeans', 'blue', 'pants']):
#         return mock_products[1]
#     elif any(word in query_lower for word in ['shoes', 'leather', 'brown']):
#         return mock_products[2]
#     else:
#         # Default to first product
#         return mock_products[0]

from typing import Optional, Type, Dict, Any
from pydantic import BaseModel

def convert_pydantic_to_bedrock_tool(
    model: Type[BaseModel],
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Converts a Pydantic model to a tool description for the Amazon Bedrock Converse API.
    
    Args:
        model: The Pydantic model class to convert
        description: Optional description of the tool's purpose

    Returns:
        Dict containing the Bedrock tool specification        
    """
    # Validate input model
    if not isinstance(model, type) or not issubclass(model, BaseModel):
        raise ValueError("Input must be a Pydantic model class")
    
    name = model.__name__
    input_schema = model.model_json_schema()
    tool = {
        'toolSpec': {
            'name': name,
            'description': description or f"{name} Tool",
            'inputSchema': {'json': input_schema }
        }
    }
    return tool

# def mock_process_image(image_path: str) -> str:
#     """
#     Mock image processing - returns fixed caption
#     """
#     # In a real implementation, this would:
#     # 1. Download image from S3
#     # 2. Use Bedrock Vision model or Amazon Rekognition
#     # 3. Generate caption
    
#     # For now, return mock caption based on image path
#     if 'dress' in image_path.lower():
#         return "A red dress displayed on a mannequin in a retail store"
#     elif 'shoes' in image_path.lower():
#         return "Brown leather shoes on a display shelf"
#     elif 'jeans' in image_path.lower():
#         return "Blue jeans hanging on a clothing rack"
#     else:
#         return "A product item displayed in a retail environment"



def creating_index_body(index_name, dimension=1024):
    # Create index with mapping for embeddings
    create_index_body = {
        "settings": {
            "index": {
                "knn": True,
                "analysis": {
                    "analyzer": {
                        "analyzer_shingle": {
                            "tokenizer": "icu_tokenizer",
                            "filter": [
                                "filter_shingle"
                            ]
                        }
                    },
                    "filter": {
                        "filter_shingle": {
                            "type": "shingle",
                            "max_shingle_size": 3,
                            "min_shingle_size": 2,
                            "output_unigrams": "true"
                        }
                    }
                }
            }
        },  
        "mappings": {
            "properties": {
                "name": {"type": "text"},
                "description": {"type": "text", "analyzer": "analyzer_shingle"},
                "price": {"type": "text"},
                "imageUrl": {"type": "text"},
                "vector_en": {
                    "type": "knn_vector",
                    "dimension": dimension,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil"
                    }
                }
            }
        }
    }
    
    if not client.indices.exists(index=index_name):
        print(f"Index '{index_name}' does not exist. Creating a new one")
    else:
        response = client.indices.delete(index=index_name)
        print(f"Index '{index_name}' deleted successfully.")
    client.indices.create(index=index_name, body=create_index_body)
def get_titan_embedding(text: str) -> list:
    """Get embeddings with proper error handling"""
    try:
        AWS_DEFAULT_REGION = os.environ["AWS_DEFAULT_REGION"]
        AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
        AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
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


# def fuzzy_search(index_name, search_term):
#     print("\nFuzzy search\n")
#     # Fuzzy search
#     fuzzy_query = {
#         "query": {
#             "fuzzy": {
#                 "description": {  # Changed from en_character to Product Description
#                     "value": search_term,
#                     "fuzziness": "AUTO"  # You can adjust the fuzziness level
#                 }
#             }
#         }
#     }

#     res = client.search(index=index_name, body=fuzzy_query)
#     print(f"Got {res['hits']['total']['value']} Hits:")
#     for hit in res['hits']['hits']:
#         print(f"Product: {hit['_source']['name']}")
#         print(f"Description: {hit['_source']['description']}")
#         print(f"Price: {hit['_source']['price']}")
#         print("---")

def semantic_search(search_term, client, top_k=3, index_name="product-index"):
    """
    Perform a semantic search on the specified OpenSearch index using the given search term.

    Args:
    search_term (str): The search term for the semantic search.
    client: The OpenSearch client.
    top_k (int, optional): The number of documents to retrieve from the OpenSearch database
    index_name (str, optional): The name of the OpenSearch index to search.
    
    Returns:
    list: A list of dictionaries, each containing product information
    """
    print("\nSemantic search\n")
    # Semantic search in OpenSearch
    vector_query = {
        "size": top_k,
        "query": {
            "knn": {
                "vector_en": {
                    "vector": get_titan_embedding(search_term),
                    "k": top_k
                }
            }
        }
    }

    results = []
    semantic_resp = client.search(index=index_name, body=vector_query)
    
    for i, hit in enumerate(semantic_resp['hits']['hits'], 1):
        print("CURRENT SCORE: ", hit['_score'])
        if hit['_score'] > 0:  # You can adjust this threshold as needed
            product = {
                'score': hit['_score'],
                'id': hit["_source"]["imageUrl"],
                'name': hit['_source']['name'],
                'description': hit['_source']['description'],
                'price': hit['_source']['price'],
            }
            results.append(product)

    return results