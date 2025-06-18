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

def semantic_search(search_term, client, top_k=3, index_name="product-index"):
    """
    Perform a semantic search on the specified OpenSearch index using the given search term.

    Args:
    search_term (str): The search term for the semantic search.
    client: The OpenSearch client.
    top_k (int, optional): The number of documents to retrieve from the OpenSearch database
    index_name (str, optional): The name of the OpenSearch index to search.
    
    Returns:
    list: A list of dictionaries, each containing product information
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

    results = []
    semantic_resp = client.search(index=index_name, body=vector_query)
    
    for i, hit in enumerate(semantic_resp['hits']['hits'], 1):
        print("CURRENT SCORE: ", hit['_score'])
        if hit['_score'] > 0:  # You can adjust this threshold as needed
            product = {
                'score': hit['_score'],
                'id': hit["_source"]["imageUrl"],
                'name': hit['_source']['name'],
                'description': hit['_source']['description'],
                'price': hit['_source']['price'],
            }
            results.append(product)

    return results

if __name__ == "__main__":
    client = get_client()
    index_name = "product-index"
    
    search_term =  "The image shows a woman wearing a gray button-down dress or shirtdress. The dress has long sleeves and a collar, and is cinched at the waist with a belt. The woman is standing in what appears to be an office or workspace setting, with shelves or cabinets visible in the background. The overall style of the dress and setting suggests a professional or formal work environment."
    results = semantic_search(search_term, client, top_k=3, index_name=index_name)
    print(results) 