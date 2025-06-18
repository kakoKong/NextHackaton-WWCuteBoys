import time 
from util import post_request, HEADERS, filter_reference_documents

def product_matching(caption_payload, user_messages):
    """
    Perform product matching using the provided caption payload
    """
    start_time = time.time()
    if caption_payload["image_path"] == "":
        print("No image provided for captioning")
        image_caption = "No image provided"
    else:
        print("Performing captioning...")
        result = post_request(
            "image_captioning",
            caption_payload,
            headers=HEADERS)
        print(f"Captioning result: {result}")
        image_caption = result["results"]
    
    print(f"Image captioning result: {image_caption}")
    
    print(f"Finding docs")
    doc_payload = {
        "user_query": f'''{user_messages}''',
        "image_prompt": image_caption
    }
    result = post_request(
        "finding_documents",
        doc_payload,
        headers=HEADERS)
    
    reference = result["results"]
    reference_final = filter_reference_documents(reference) 
    print(f"Reference documents: {reference_final}")
    
    print(f"Generate final response")
    payload = {
        "question": f'''{user_messages}''',
        "reference":f'''{reference}'''
    }
    
    result = post_request("generation", payload, headers=HEADERS, timeout=30)
    final_response = result["response"]
    print(f"Final response: {final_response}")
    end_time = time.time()
    print(f"Total time taken: {end_time - start_time:.2f} seconds")
    return final_response, reference 

if __name__ == "__main__":
    ## Setting input
    caption_payload = {
        "image_path": "Data/Image12.png"
    }
    user_messages = {
            "messages": [
                {"role": "user", "content": "Hey, I'm shopping on Vibe and looking for outfits for summer."},
                {"role": "assistant", "content": "Sure! Do you have a specific style or occasion in mind?"},
                {"role": "user", "content": "Yes, I'm going to a beach party and I want something casual but cute."},
                {"role": "assistant", "content": "We have floral maxi dresses and off-shoulder sundresses perfect for the beach."},
                {"role": "user", "content": "Okay, I also want something for a formal dinner."},
                {"role": "assistant", "content": "Great! Our satin slip dresses and belted midi dresses would be ideal."},
                {"role": "user", "content": "I want the following items"}
            ]
        }
    product_matching(caption_payload, user_messages)