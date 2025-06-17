import json
import boto3
from dotenv import load_dotenv
from opensearchpy import OpenSearch
import os
from tqdm import tqdm
import pandas as pd

# Load environment variables
load_dotenv(override=True)
AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
AWS_DEFAULT_REGION = os.environ["AWS_DEFAULT_REGION"]
AWS_OPENSEARCH_ENDPOINT = os.environ["AWS_OPENSEARCH_ENDPOINT"]
AWS_OPENSEARCH_USERNAME = os.environ["AWS_OPENSEARCH_USERNAME"]
AWS_OPENSEARCH_PASSWORD = os.environ["AWS_OPENSEARCH_PASSWORD"]

client = OpenSearch(
    hosts=[{'host': AWS_OPENSEARCH_ENDPOINT, 'port': 443}],
    http_auth=(AWS_OPENSEARCH_USERNAME, AWS_OPENSEARCH_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    ssl_show_warn=False,
)


def creating_index_body(index_name, dimension=1024):
    # Create index with mapping for embeddings
    create_index_body = {
        "settings": {
            "index": {
                "knn": True,
                "analysis": {
                    "analyzer": {
                        "analyzer_shingle": {
                            "tokenizer": "icu_tokenizer",
                            "filter": [
                                "filter_shingle"
                            ]
                        }
                    },
                    "filter": {
                        "filter_shingle": {
                            "type": "shingle",
                            "max_shingle_size": 3,
                            "min_shingle_size": 2,
                            "output_unigrams": "true"
                        }
                    }
                }
            }
        },  
        "mappings": {
            "properties": {
                "Product Name": {"type": "text"},
                "Product Description": {"type": "text", "analyzer": "analyzer_shingle"},
                "Product Price": {"type": "float"},
                "Image": {"type": "text"},
                "vector_en": {
                    "type": "knn_vector",
                    "dimension": dimension,
                    "method": {
                        "name": "hnsw",
                        "space_type": "cosinesimil"
                    }
                }
            }
        }
    }
    
    if not client.indices.exists(index=index_name):
        print(f"Index '{index_name}' does not exist. Creating a new one")
    else:
        response = client.indices.delete(index=index_name)
        print(f"Index '{index_name}' deleted successfully.")
    client.indices.create(index=index_name, body=create_index_body)
def get_titan_embedding(text: str) -> list:
    """Get embeddings with proper error handling"""
    try:
        bedrock = boto3.client(
            'bedrock-runtime', 
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_DEFAULT_REGION
        )
        
        payload = {"inputText": text}
        
        response = bedrock.invoke_model(
            modelId="amazon.titan-embed-text-v2:0",
            body=json.dumps(payload),
            contentType='application/json'
        )
        
        result = json.loads(response['body'].read())
        
        if 'embedding' not in result:
            print(f"No embedding in response: {result}")
            return None
            
        embedding = result['embedding']
        
        if not embedding or len(embedding) == 0:
            print(f"Empty embedding received")
            return None
            
        print(f"Got embedding with {len(embedding)} dimensions")
        return embedding
        
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None


def ingestion_data_opensearch(index_name, dataframe):
    # Index the documents with semantic embeddings and raw text
    for i in tqdm(range(len(dataframe)), desc="Ingesting products", unit="item"):
        # Generate embeddings
        Product_Name = dataframe.iloc[i]['Product Name']
        Product_Description = dataframe.iloc[i]['Product Description']
        Product_Price = dataframe.iloc[i]['Product Price']
        Image = dataframe.iloc[i]['Image']
        embedding = get_titan_embedding(Product_Description)

        # Index document with both raw text and embeddings
        res = client.index(index=index_name, id=i, body={
            "Product Name": Product_Name,
            "Product Description": Product_Description,
            "Product Price": Product_Price,
            "Image": Image,
            "vector_en": embedding 
        })
        # Optional: You can keep or remove this line depending on how verbose you want the output
        # print(f"Document {i} indexing result: {res['result']}")


def fuzzy_search(index_name, search_term):
    print("\nFuzzy search\n")
    # Fuzzy search
    fuzzy_query = {
        "query": {
            "fuzzy": {
                "Product Description": {  # Changed from en_character to Product Description
                    "value": search_term,
                    "fuzziness": "AUTO"  # You can adjust the fuzziness level
                }
            }
        }
    }

    res = client.search(index=index_name, body=fuzzy_query)
    print(f"Got {res['hits']['total']['value']} Hits:")
    for hit in res['hits']['hits']:
        print(f"Product: {hit['_source']['Product Name']}")
        print(f"Description: {hit['_source']['Product Description']}")
        print(f"Price: {hit['_source']['Product Price']}")
        print("---")

def semantic_search(search_term, top_k=3, index_name="product-index"):
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
        if hit['_score'] > 0.70:  # You can adjust this threshold as needed
            results_names[f"product{i}"] = hit['_source']['Product Name']
            results_descriptions[f"description{i}"] = hit['_source']['Product Description']
            results_prices[f"price{i}"] = hit['_source']['Product Price']
            results_images[f"image{i}"] = hit['_source']['Image']
            i += 1

    return (results_names, results_descriptions, results_prices, results_images)

if __name__ == "__main__":
    index_name = "product-index"
    creating_index_body(index_name)
    # Example DataFrame for testing
    df = pd.read_csv("../data.csv")
    ingestion_data_opensearch(index_name, df)
    # results = semantic_search("great product", top_k=3, index_name=index_name)
    # print("Search Results:")
    # for i in range(1, len(results[0]) + 1):
    #     print(f"Input {i}: great product")
    #     print(f"Product {i}: {results[0][f'product{i}']}")
    #     print(f"Description {i}: {results[1][f'description{i}']}")
    #     print(f"Price {i}: {results[2][f'price{i}']}")
    #     print(f"Image {i}: {results[3][f'image{i}']}")
    #     print("---")
        
        