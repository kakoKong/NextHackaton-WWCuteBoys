from util import get_client, get_titan_embedding

def fuzzy_search(index_name, search_term,client):
    print("\nFuzzy search\n")
    # Fuzzy search
    fuzzy_query = {
        "query": {
            "fuzzy": {
                "description": {  # Changed from en_character to Product Description
                    "value": search_term,
                    "fuzziness": "AUTO"  # You can adjust the fuzziness level
                }
            }
        }
    }

    res = client.search(index=index_name, body=fuzzy_query)
    print(f"Got {res['hits']['total']['value']} Hits:")
    for hit in res['hits']['hits']:
        print(f"Product: {hit['_source']['name']}")
        print(f"Description: {hit['_source']['description']}")
        print(f"Price: {hit['_source']['price']}")
        print("---")

def semantic_search(search_term, client,top_k=3,index_name="product-index"):
    """
    Perform a semantic search on the specified OpenSearch index using the given search term.

    Args:
    search_term (str): The search term for the semantic search.
    top_k (int, optional): The number of documents to retrieve from the OpenSearch database
    index_name (str, optional): The name of the OpenSearch index to search.
    
    Returns:
    dict: A dictionary with product information
    """
    print("\nSemantic search\n")
    # Semantic search in OpenSearch
    vector_query = {
        "size": top_k,
        "query": {
            "knn": {
                "vector_en": {
                    "vector": get_titan_embedding(search_term),
                    "k": top_k
                }
            }
        }
    }

    results_names = {}
    results_descriptions = {}
    results_prices = {}
    results_images = {}

    i = 1
    semantic_resp = client.search(index=index_name, body=vector_query)
    
    for hit in semantic_resp['hits']['hits']:
        print("CURRENT SCORE: ", hit['_score'])
        if hit['_score'] > 0:  # You can adjust this threshold as needed
            results_names[f"product{i}"] = hit['_source']['name']
            results_descriptions[f"description{i}"] = hit['_source']['description']
            results_prices[f"price{i}"] = hit['_source']['price']
            results_images[f"image{i}"] = hit['_source']['imageUrl']
            i += 1

    return [results_names, results_descriptions, results_prices, results_images]

if __name__ == "__main__":
    client = get_client()
    index_name = "product-index"
    
    search_term =  "The image shows a woman wearing a gray button-down dress or shirtdress. The dress has long sleeves and a collar, and is cinched at the waist with a belt. The woman is standing in what appears to be an office or workspace setting, with shelves or cabinets visible in the background. The overall style of the dress and setting suggests a professional or formal work environment."
    results = semantic_search(search_term, client, top_k=3, index_name=index_name)
    print("Search Results:")
    for i in range(1, len(results[0]) + 1):
        print(f"Input {i}")
        print(f"Product {i}: {results[0][f'product{i}']}")
        print(f"Description {i}: {results[1][f'description{i}']}")
        print(f"Price {i}: {results[2][f'price{i}']}")
        print(f"Image {i}: {results[3][f'image{i}']}")
        print("---")
        
     
    