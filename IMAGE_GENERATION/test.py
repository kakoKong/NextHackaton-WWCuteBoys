import boto3, json, base64, io, random
from PIL import Image
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv(override=True)

# ---------- prep ----------
AWS_ACCESS_KEY_ID     = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_DEFAULT_REGION    = os.environ["AWS_DEFAULT_REGION"]
MODEL_ID   = "amazon.titan-image-generator-v2:0"

def to_b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()

def fix_mask(mask_path):
    """Fix the mask image to ensure it contains only 0 or 255 values"""
    # Open the mask image
    mask = Image.open(mask_path)
    # Convert to numpy array
    mask_array = np.array(mask)
    
    # For grayscale images
    if len(mask_array.shape) == 2:
        # Binarize the mask - white (255) for areas to replace, black (0) to keep
        binary_mask = (mask_array > 128).astype(np.uint8) * 255
    # For RGB/RGBA images
    else:
        # Convert to grayscale first by taking the mean of RGB channels
        grayscale = mask_array.mean(axis=2) if mask_array.shape[2] >= 3 else mask_array
        binary_mask = (grayscale > 128).astype(np.uint8) * 255
    
    # Save the fixed mask
    fixed_mask_path = "fixed_" + os.path.basename(mask_path)
    Image.fromarray(binary_mask).save(fixed_mask_path)
    print(f"Fixed mask saved to {fixed_mask_path}")
    
    return fixed_mask_path

# Fix the mask image
fixed_mask_path = fix_mask("test_mask.png")

# Use the fixed mask
src_image_b64 = to_b64("test.png")     # the picture you want to edit
mask_image_b64 = to_b64(fixed_mask_path)  # properly binarized mask

body = {
    "taskType": "INPAINTING",
    "inPaintingParams": {
        "image"     : src_image_b64,
        "maskImage" : mask_image_b64,          # or omit & use maskPrompt
        "text"      : "replace this with castle",
        # optional: "negativeText": "people, cars"
    },
    "imageGenerationConfig": {
        "quality"       : "standard",          # or "premium"
        "numberOfImages": 1,
        "cfgScale"      : 5,                   # 5–8 looks natural
        "seed"          : random.randint(0, 2**31-1)
    }
}

# ---------- call Bedrock ----------
runtime = boto3.client(
    "bedrock-runtime",
    aws_access_key_id     = AWS_ACCESS_KEY_ID,
    aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
    region_name            = AWS_DEFAULT_REGION
)

resp    = runtime.invoke_model(
    modelId     = MODEL_ID,
    body        = json.dumps(body).encode(),
    contentType = "application/json",
    accept      = "application/json"
)

# ---------- save the result ----------
out_b64 = json.loads(resp["body"].read())["images"][0]
Image.open(io.BytesIO(base64.b64decode(out_b64))).save("result.png")
