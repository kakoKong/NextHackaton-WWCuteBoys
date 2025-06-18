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
    if features == "product_matching":
        print("Performing product matching...")
        product_matching(caption_payload, user_messages)
    
    elif features == "style_matching":
        print("Performing style matching...")
        style_matching(caption_payload, user_messages)
    
if __name__ == "__main__":
    features = "style_matching"  # Change to "product_matching" for product matching
    caption_payload = {
        "image_path": ""
    }
    user_messages = {
            "messages": [
                {"role": "user", "content": "Can you help me find shirt that fit with navy shorts?"},
            ]
        }
    main(caption_payload, user_messages, features=features)
    