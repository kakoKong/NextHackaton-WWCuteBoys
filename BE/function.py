import boto3
import json
import os
from typing import List, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
import logging
from dotenv import load_dotenv
import json

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

# Initialize client
bedrock_client = get_bedrock_client()
s3_client = get_s3_client()
model_id = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-haiku-20241022-v1:0')

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
    
    try:
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


def mock_semantic_search(query: str) -> Dict[str, str]:
    """
    Mock semantic search - returns fixed product data
    """
    # Mock product database
    mock_products = [
        {
            "materials": "100% Cotton",
            "description": "Classic red summer dress perfect for casual occasions",
            "brand_name": "The Mall Fashion",
            "price": "$49.99",
            "location": "Floor 2, Section A"
        },
        {
            "materials": "Polyester blend",
            "description": "Blue jeans with comfortable fit and modern styling",
            "brand_name": "Denim Pro",
            "price": "$79.99",
            "location": "Floor 1, Section B"
        },
        {
            "materials": "Leather",
            "description": "Brown leather shoes suitable for business and casual wear",
            "brand_name": "Shoe Gallery",
            "price": "$129.99",
            "location": "Floor 3, Section C"
        }
    ]
    
    # Simple keyword matching for demo
    query_lower = query.lower()
    
    if any(word in query_lower for word in ['dress', 'red', 'summer']):
        return mock_products[0]
    elif any(word in query_lower for word in ['jeans', 'blue', 'pants']):
        return mock_products[1]
    elif any(word in query_lower for word in ['shoes', 'leather', 'brown']):
        return mock_products[2]
    else:
        # Default to first product
        return mock_products[0]

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