from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import time
import logging

from function import chat_with_bedrock, image_to_text, download_file_from_s3, convert_pydantic_to_bedrock_tool, function_calling_with_bedrock, semantic_search, get_opensearch_client
from prompt_template import prompt_multi_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Product Search API", version="1.0.0")

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

client = get_opensearch_client()
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
        
        print(search_term["response"])
        final_search = []
        for term in search_term["response"]:
            each_term = {"search_term": term, "search_results": semantic_search(term, client, top_k=3)}
            final_search.append(each_term)

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
                "content": "You are an expert product search assistant. Your task is to generate alternative product suggestions that complement the user's style based on their query and image. Return as an array of strings."
            },
            {
                "role": "user", 
                "content": f"Generate search queries to recommend what kind of different style(s) may be best suited. Add as much context as possible. Use the following chat history focus your answer on the latest user turn: {request.user_query}. Image context: {request.image_prompt}. Return your result as an array of strings."
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
                {"role": "system", "content": "You are a helpful customer service assistant."},
                {"role": "user", "content": f"Based on this product information: {request.reference}\n\nQuestion: {request.question}. Only use the provided product information to answer the question. If the information is not sufficient, say 'I don't know'."}
            ]
            
            response = await chat_with_bedrock(messages)
            response_text = response["choices"][0]["message"]["content"]
        
        return GenerationResponse(response=response_text)
        
    except Exception as e:
        logger.error(f"Error in generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)