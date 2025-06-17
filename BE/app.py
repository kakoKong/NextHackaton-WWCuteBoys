from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import time
import logging

from function import chat_with_bedrock, mock_semantic_search, image_to_text, download_file_from_s3, convert_pydantic_to_bedrock_tool, function_calling_with_bedrock
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

class FindingDocumentsResponse(BaseModel):
    results: List[str]
    # results: str

class StyleComplementResponse(BaseModel):
    results: str

class ImageCaptioningResponse(BaseModel):
    results: str
    processing_time: float

class GenerationResponse(BaseModel):
    response: str

# @app.post("/finding_documents", response_model=FindingDocumentsResponse)
# async def finding_documents(request: FindingDocumentsRequest):
#     try:
#         system_prompt, user_prompt_1, assistant_prompt_1, user_prompt_2, assistant_prompt_2, user_prompt_3 = prompt_multi_query("Here are the chat histories " + request.user_query + "\n" + "IMAGE CAPTIONING: ", request.image_prompt)
        
#         # For Bedrock conversation format
#         messages = [
#             {
#                 "role": "system",
#                 "content": system_prompt
#             },
#             {
#                 "role": "user",
#                 "content": user_prompt_1
#             },
#             {
#                 "role": "assistant", 
#                 "content": assistant_prompt_1
#             },
#             {
#                 "role": "user",
#                 "content": user_prompt_2
#             },
#             {
#                 "role": "assistant", 
#                 "content": assistant_prompt_2
#             },
#             {
#                 "role": "user",
#                 "content": user_prompt_3
#             }
#         ]
        
#         response = await chat_with_bedrock(messages)
#         print(response)
#         search_term = response["choices"][0]["message"]["content"]
        
#         logger.info(f"Generated queries: {search_term}")
        
#         # try:
#         #     question_arr = json.loads(model_response.strip())
#         # except json.JSONDecodeError:
#         #     question_arr = [request.user_query]  # Fallback to original query
        
#         # if not question_arr:
#         #     question_arr = [request.user_query]
        
#         # Search for each query
#         final_responses = []
#         search_results = mock_semantic_search(search_term)
#         final_responses.append(DocumentResult(
#             materials=search_results["materials"],
#             description=search_results["description"],
#             brand_name=search_results["brand_name"],
#             price=search_results["price"],
#             location=search_results["location"],
#             # thinking=search_term
#         ))
        
#         # processing_time = time.time() - start_time
#         # logger.info(f"Processing time: {processing_time:.2f}s")
        
#         return FindingDocumentsResponse(results=search_term)
#         # return FindingDocumentsResponse(results=search_term)
        
#     except Exception as e:
#         logger.error(f"Error in finding_documents: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/finding_documents", response_model=FindingDocumentsResponse)
# async def finding_documents(request: FindingDocumentsRequest):
#     try:
#         start_time = time.time()
        
#         # Generate multiple queries using Bedrock
#         # messages = [
#         #     {
#         #         "role": "system", 
#         #         "content": "You are an expert product search assistant. Your task is to generate effective search queries that will help find relevant products in our inventory. Respond as an array of strings."
#         #     },
#         #     {
#         #         "role": "user", 
#         #         "content": f"Generate search query based on how many unique items to search for and add as much context as possible per each item. Use the following chat history focus your answer on the latest user turn: {request.user_query}. Image context: {request.image_prompt}. Respond as an array of strings, where each element is a descriptive query to search per unique item."
#         #     }
#         # ]
#         messages = [
#             {
#                 "role": "system",
#                 "content": (
#                     "You are a product search assistant. Your task is to extract each **unique item** the user is interested in, "
#                     "and generate **one simple, literal search query per item**. Keep each query close to the user's original wording, "
#                     "and do not add extra descriptive or inferred details. If color or brand is mentioned, include it. "
#                     "Do not try to enhance or rewrite the query. Return the result as a JSON array of strings—**one query per item**."
#                 )
#             },
#             {
#                 "role": "user",
#                 "content": (
#                     f"Chat history: {request.user_query}\n"
#                     f"Image context: {request.image_prompt}\n\n"
#                     f"Instructions:\n"
#                     f"- Identify all distinct product mentions from the latest user message.\n"
#                     f"- Generate exactly one simple query per item, staying close to user phrasing.\n"
#                     f"- Return output as a JSON array of strings."
#                 )
#             }
#         ]
        
#         response = await chat_with_bedrock(messages)
#         search_term = response["choices"][0]["message"]["content"]
        
#         logger.info(f"Generated queries: {search_term}")
        
#         # try:
#         #     question_arr = json.loads(model_response.strip())
#         # except json.JSONDecodeError:
#         #     question_arr = [request.user_query]  # Fallback to original query
        
#         # if not question_arr:
#         #     question_arr = [request.user_query]
        
#         # Search for each query
#         final_responses = []
#         search_results = mock_semantic_search(search_term)
#         final_responses.append(DocumentResult(
#             materials=search_results["materials"],
#             description=search_results["description"],
#             brand_name=search_results["brand_name"],
#             price=search_results["price"],
#             location=search_results["location"],
#             # thinking=search_term
#         ))
        
#         # processing_time = time.time() - start_time
#         # logger.info(f"Processing time: {processing_time:.2f}s")
        
#         return FindingDocumentsResponse(results=search_term)
#         # return FindingDocumentsResponse(results=search_term)
        
#     except Exception as e:
#         logger.error(f"Error in finding_documents: {e}")
#         raise HTTPException(status_code=500, detail=str(e))







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
        
        # try:
        #     question_arr = json.loads(model_response.strip())
        # except json.JSONDecodeError:
        #     question_arr = [request.user_query]  # Fallback to original query
        
        # if not question_arr:
        #     question_arr = [request.user_query]
        
        # Search for each query
        # final_responses = []
        # search_results = mock_semantic_search(search_term)
        # final_responses.append(DocumentResult(
        #     materials=search_results["materials"],
        #     description=search_results["description"],
        #     brand_name=search_results["brand_name"],
        #     price=search_results["price"],
        #     location=search_results["location"],
        #     # thinking=search_term
        # ))
        
        # processing_time = time.time() - start_time
        # logger.info(f"Processing time: {processing_time:.2f}s")
        # print(type(search_term["response"]))
        print(search_term["response"])
        return FindingDocumentsResponse(results=search_term["response"])
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