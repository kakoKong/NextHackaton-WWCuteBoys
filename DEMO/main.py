from product_matching import product_matching
from style_matching import style_matching


def main(caption_payload, user_messages, features):
    """
    Main function to perform product and style matching based on user input and image captioning.
    
    Args:
        caption_payload: Dictionary containing image path for captioning
        user_messages: User messages for context
        features: List of features to determine which matching to perform
    """
    if "product_matching" in features:
        print("Performing product matching...")
        product_matching(caption_payload, user_messages)
    
    if "style_matching" in features:
        print("Performing style matching...")
        style_matching(caption_payload, user_messages)
    
if __name__ == "__main__":
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
    main(caption_payload, user_messages, features=["product_matching"])
    