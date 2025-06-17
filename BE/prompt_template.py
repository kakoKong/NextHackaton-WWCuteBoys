def prompt_multi_query(question, image_prompt):
    system_prompt = f"""You always answer the questions with markdown formatting using GitHub syntax. The markdown formatting you support: headings, bold, italic, links, tables, lists, code blocks, and blockquotes. You must omit that you answer the questions with markdown.

Any HTML tags must be wrapped in block quotes, for example ```<html>```. You will be penalized for not rendering code in block quotes.

When returning code blocks, specify language.

You are a helpful, respectful and honest assistant. Always answer as helpfully as possible, while being safe. 
Your answers should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. Please ensure that your responses are socially unbiased and positive in nature.

If a question does not make any sense, or is not factually coherent, explain why instead of answering something not correct. If you don't know the answer to a question, please don't share false information."""
    
    user_prompt_1 = f"""Please break only if the question mentions more than one product (not location or places)
question: Chat history: Do you have 10 pieces of this item?\nImage Description: Product Name: Nike Air Max Sneakers\n\nProduct Description: Athletic sneakers from Nike's Air Max collection, size 10, priced at $150.00.
Specific Instruction:
- If the question **mentions more than one product**, respond with a list of products, e.g., `["item1", "item2"]`.
- If there is only one product, respond with `["item1"]`.
- If there is no product mentioned, respond with an empty list `[]`."""
    
    assistant_prompt_1 = f"""["Nike Air Max Sneakers"]"""
    
    user_prompt_2 = f"""Please break only if the question mentions more than one product (not location or places)
question: Chat history:     {{
      "role": "user",
      "content": "Hey, do you have any good moisturizers for dry skin?"
    }}, Image Description: None
Specific Instruction:
- If the question **mentions more than one product**, respond with a list of products, e.g., `["item1", "item2"]`.
- If there is only one product, respond with `["item1"]`.
- If there is no product mentioned, respond with an empty list `[]`."""
    
    assistant_prompt_2 = f"""["Moisturizer for dry skin"]"""

    user_prompt_3 = f"""Please break only if the question mentions more than one product (not location or places)
question: {question}
Specific Instruction:
- If the question **mentions more than one product**, respond with a list of products, e.g., `["item1", "item2"]`.
- If there is only one product, respond with `["item1"]`.
- If there is no product mentioned, respond with an empty list `[]`."""
    
    return system_prompt, user_prompt_1, assistant_prompt_1, user_prompt_2, assistant_prompt_2, user_prompt_3