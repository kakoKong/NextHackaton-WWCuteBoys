from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import time
import logging
import boto3
from botocore.exceptions import ClientError
import uuid
import asyncio

from function import chat_with_bedrock, image_to_text, download_file_from_s3, convert_pydantic_to_bedrock_tool, function_calling_with_bedrock, semantic_search, get_opensearch_client, invoke_bedrock_model_stream,get_bedrock_client
from prompt_template import prompt_multi_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Product Search API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class FindingDocumentsRequest(BaseModel):
    user_query: str
    image_prompt: str

class ImageCaptioningRequest(BaseModel):
    image_path: str

class GenerationRequest(BaseModel):
    question: str
    reference: str = ""

class StyleComplementRequest(BaseModel):
    user_query: str
    image_prompt: str


class DocumentResult(BaseModel):
    materials: Optional[str] = None
    description: Optional[str] = None
    brand_name: Optional[str] = None
    price: Optional[str] = None
    location: Optional[str] = None
    # thinking: List[str] = []

# class FindingDocumentsResponse(BaseModel):
#     results: List[str]
    # results: str

class SearchResult(BaseModel):
    score: float  # adjust fields according to what semantic_search returns
    id: str
    name: str
    description: str
    price: str

class DocumentResult(BaseModel):
    search_term: str
    search_results: List[SearchResult]

class FindingDocumentsResponse(BaseModel):
    results: List[DocumentResult]

class StyleComplementResponse(BaseModel):
    results: str

class ImageCaptioningResponse(BaseModel):
    results: str
    processing_time: float

class GenerationResponse(BaseModel):
    response: str

class PresignedUrlRequest(BaseModel):
    fileName: str
    fileType: str

class PresignedUrlResponse(BaseModel):
    uploadURL: str
    key: str

# Add this new endpoint
@app.post("/get-presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_url(request: PresignedUrlRequest):
    aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    try:
        s3_client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )

        # Generate unique key for the file
        file_extension = request.fileName.split('.')[-1] if '.' in request.fileName else ''
        unique_key = f"uploads/{uuid.uuid4()}-{request.fileName}"
        
        # Generate presigned URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': 'testbucketwwcuteboys',  # Replace with your actual bucket name
                'Key': unique_key,
                'ContentType': request.fileType,
                'ACL': 'private'  # Keep files private
            },
            ExpiresIn=300  # URL expires in 5 minutes
        )
        print(presigned_url)
        
        return PresignedUrlResponse(
            uploadURL=presigned_url,
            key=unique_key
        )
        
    except ClientError as e:
        logger.error(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")
    except Exception as e:
        logger.error(f"Unexpected error in get_presigned_url: {e}")
        raise HTTPException(status_code=500, detail=str(e))

client = get_opensearch_client()
bedrock_client = get_bedrock_client()
@app.post("/finding_documents", response_model=FindingDocumentsResponse)
async def finding_documents(request: FindingDocumentsRequest):
    try:
        # Assuming you have a function to convert Pydantic to Bedrock tool format
        # product_search_tool = convert_pydantic_to_bedrock_tool(ProductSearch)


        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "text": (
                            f"Chat history: {request.user_query}\n"
                            f"Image context: {request.image_prompt}\n\n"
                            f"Instructions:\n"
                            f"- Identify all distinct product mentions from the latest user message.\n"
                            f"- Generate exactly one simple query per item, staying close to user phrasing.\n"
                            f"- Return output as a JSON array of strings."
                        )
                    }
                ]
            }
        ]
        response = await function_calling_with_bedrock(messages)
        search_term = response["choices"][0]["message"]["content"]
        
        if isinstance(search_term, str):
            search_term = json.loads(search_term)  # list of strings

        # print(search_term)
        # print(search_term["response"])
        # for term in search_term["response"]:
        #     print(term)

        async def search(term):
            result = await asyncio.to_thread(semantic_search, term, client, top_k=3)
            return {
                "search_term": term,
                "search_results": result
            }

        final_search = await asyncio.gather(*(search(term) for term in search_term["response"]))
        # final_search = []
        # for term in search_term["response"]:
        #     each_term = {"search_term": term, "search_results": semantic_search(term, client, top_k=3)}
        #     final_search.append(each_term)

        return FindingDocumentsResponse(results=final_search)
        # return FindingDocumentsResponse(results=search_term)
        
    except Exception as e:
        logger.error(f"Error in finding_documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/style_complement", response_model=StyleComplementResponse)
async def style_complement(request: StyleComplementRequest):
    try:
        
        # Generate multiple queries using Bedrock
        messages = [
            {
                "role": "system", 
                "content": (
                    "You are a fashion recommendation assistant. Based on the image, assume the user already owns the outfit shown. "
                    "Your goal is to suggest what the user might want next to complete, complement, or contrast with the look. "
                    "This includes suggestions for shoes, bags, accessories, layering options, casual variations, or ways to remix items. "
                    "Avoid repeating or rephrasing what they are already wearing (e.g. gray suit or red tie). "
                    "Return only a short list (5–7 max) of helpful search queries in this format: a JSON array of strings."
                )
            },
            {
                "role": "user", 
                "content": (
                    f"User query: {request.user_query}. "
                    f"Image context: {request.image_prompt}. "
                    f"Return a list of search queries the user might want next — not descriptions."
                )
            }
        ]
        
        response = await chat_with_bedrock(messages)
        search_term = response["choices"][0]["message"]["content"]
        
        logger.info(f"Generated queries: {search_term}")
        
        return StyleComplementResponse(results=search_term)
        
    except Exception as e:
        logger.error(f"Error in finding_documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/image_captioning", response_model=ImageCaptioningResponse)
async def image_captioning(request: ImageCaptioningRequest):
    try:
        start_time = time.time()
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        # Mock image processing
        download_file_from_s3(request.image_path, "images/latest.png")
        response_caption = await image_to_text(model_id,
                        "Please describe the content of this image in detail",
                        input_image="images/latest.png")
        # caption = mock_process_image(request.image_path)
        
        processing_time = time.time() - start_time
        
        return ImageCaptioningResponse(
            results=response_caption,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in image_captioning: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generation", response_model=GenerationResponse)
async def generation(request: GenerationRequest):
    try:
        if not request.reference:
            response_text = "Hello, I am a Customer Service Assistant. Please provide a query with relevant product context."
        else:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful customer service assistant. Answer the user's question based only on the provided product information. "
                        "Recommend general dress styles that might suit the user's need, without mentioning specific product names. "
                        "Keep your tone warm and human-like, and avoid bullet points or numbered lists. "
                        "Suggest the user explore the search results for specific items. "
                        "If there isn’t enough information to answer, say 'I don't know.'"
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Based on this product information: {request.reference}\n\n"
                        f"And this question: {request.question}\n\n"
                        f"Please give a short, natural-sounding response following the instructions."
                    )
                }
            ]
            
            response = await chat_with_bedrock(messages)
            response_text = response["choices"][0]["message"]["content"]
        
        return GenerationResponse(response=response_text)
        
    except Exception as e:
        logger.error(f"Error in generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

# @app.post("/generation_stream", response_model=GenerationResponse)
# async def generation(request: GenerationRequest):
#     try:
#         # if not request.reference:
#         #     response_text = "Hello, I am a Customer Service Assistant. Please provide a query with relevant product context."
#         # else:
#         #     messages = [
#         #         {"role": "system", "content": "You are a helpful customer service assistant."},
#         #         {"role": "user", "content": f"Based on this product information: {request.reference}\n\nQuestion: {request.question}. Only use the provided product information to answer the question. If the information is not sufficient, say 'I don't know'."}
#         #     ]
            
#         #     response = await chat_with_bedrock(messages)
#         #     response_text = response["choices"][0]["message"]["content"]
        
#         invoke_bedrock_model_stream(bedrock_client, "", prompt, max_tokens=2000, temperature=0, top_p=0.9)
        
#         return GenerationResponse(response=response_text)
        
#     except Exception as e:
#         logger.error(f"Error in generation: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001)