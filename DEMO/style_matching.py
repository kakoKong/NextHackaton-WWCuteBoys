from util import post_request, HEADERS, filter_reference_documents
import time


def style_matching(caption_payload, user_messages):
    """
    Perform style matching using the provided caption 
    """
    start = time.time()
    if caption_payload["image_path"] == "":
        image_caption = "No image provided"
    else:
        print("Performaing captioning...")
        result = post_request(
            "image_captioning",
            caption_payload,
            headers=HEADERS)
        image_caption = result["results"]
        print(f"Image captioning result: {image_caption}")
    
    print(f"Style Complement")
    doc_payload = {
        "user_query": f'''{user_messages}''',
        "image_prompt": ""
    }
    result = post_request(
        "style_complement",
        doc_payload,
        headers=HEADERS)
    style_complement = result["results"]
    print(f"Style complement result: {style_complement}")
    
    print(f"Finding docs")
    doc_payload = {
        "user_query": style_complement,
        "image_prompt": image_caption
    }
    result = post_request(
        "finding_documents",
        doc_payload,
        headers=HEADERS, timeout=30)
    reference = result["results"]
    reference_final = filter_reference_documents(reference)
    print(f"Reference documents: {reference_final}")
        
    print(f"Generate final response")
    payload = {
        "question": f'''{user_messages}''',
        "reference": f'''{reference}'''
    }
    result = post_request("generation", payload, headers=HEADERS, timeout=30)
    final_response = result["response"]
    print(f"Final response: {final_response}")
    end = time.time()
    print(f"Total time taken: {end - start:.2f} seconds")
    return final_response, reference_final

if __name__ == "__main__":
    ## Setting input
    ## Setting input
    caption_payload = {
        "image_path": "uploads/09161e93-5171-4dd2-8e27-c0439171c5d1-testsuit.jpg"
    }


    user_messages = {
            "messages": [
                {"role": "user", "content": "I want a pant that could match with this upper part."},
            ]
        }

    style_matching(caption_payload, user_messages)
