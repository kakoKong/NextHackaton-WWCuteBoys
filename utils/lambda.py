import boto3
import json
import csv
import io

s3 = boto3.client('s3')
bedrock = boto3.client('bedrock-runtime')

BUCKET_NAME = 'your-fashion-bucket'  # <-- Replace with your bucket
CSV_KEY = 'products.csv'

def generate_product_description_claude(text_label):
    prompt = f"""
You are a fashion product copywriter. Based on the following product context, generate a structured output with the following fields only:

1. Product Name  
2. Product Description — This must include fit, fabric, style, material, use cases, available sizes, care instructions, and overall fashion vibe. Make it detailed and descriptive.  
3. Price in SGD (based on a mid-range fashion brand)

Product context: {text_label}
"""

    body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 800,
        "temperature": 0.7,
        "stop_sequences": []
    })

    response = bedrock.invoke_model(
        modelId="anthropic.claude-v2",  # Change to claude-3 if available
        body=body,
        contentType="application/json",
        accept="application/json"
    )

    output = json.loads(response['body'].read())
    return output['completion']

def parse_description_to_row(desc_text):
    lines = desc_text.strip().split('\n')
    name = ""
    description = ""
    price = ""

    for line in lines:
        if line.lower().startswith("product name"):
            _, val = line.split(":", 1)
            name = val.strip()
        elif line.lower().startswith("product description"):
            _, val = line.split(":", 1)
            description = val.strip()
        elif line.lower().startswith("price"):
            _, val = line.split(":", 1)
            price = val.strip()

    return [name, description, price]

def lambda_handler(event, context):
    # Get uploaded file info
    image_key = event['Records'][0]['s3']['object']['key']

    # Use filename as context (e.g. "Boho_Mustard_Dress.jpg" -> "Boho Mustard Dress")
    product_context = image_key.replace('_', ' ').replace('-', ' ').replace('.jpg', '').replace('.png', '')

    # Step 1: Generate description from Claude via Bedrock
    desc_text = generate_product_description_claude(product_context)
    
    # Step 2: Convert response to CSV row
    row = parse_description_to_row(desc_text)

    # Step 3: Load existing CSV (or initialize new)
    try:
        obj = s3.get_object(Bucket=BUCKET_NAME, Key=CSV_KEY)
        content = obj['Body'].read().decode('utf-8')
        rows = list(csv.reader(io.StringIO(content)))
    except s3.exceptions.NoSuchKey:
        rows = [["Product Name", "Product Description", "Price"]]

    rows.append(row)

    # Step 4: Write updated CSV to S3
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)

    s3.put_object(Bucket=BUCKET_NAME, Key=CSV_KEY, Body=output.getvalue().encode('utf-8'))

    return {
        'statusCode': 200,
        'body': f"Processed image: {image_key}"
    }
