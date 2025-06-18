from util import get_client, get_titan_embedding
import pandas as pd
from tqdm import tqdm



def creating_index_body(index_name, client,dimension=1024):
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
                "name": {"type": "text"},
                "description": {"type": "text", "analyzer": "analyzer_shingle"},
                "price": {"type": "text"},
                "imageUrl": {"type": "text"},
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

def ingestion_data_opensearch(index_name, dataframe, client):
    # Index the documents with semantic embeddings and raw text
    for i in tqdm(range(len(dataframe)), desc="Ingesting products", unit="item"):
        # Generate embeddings
        Product_Name = dataframe.iloc[i]['name']
        Product_Description = dataframe.iloc[i]['description']
        Product_Price = dataframe.iloc[i]['price']
        Image = dataframe.iloc[i]['imageUrl']
        embedding = get_titan_embedding(Product_Description)

        # Index document with both raw text and embeddings
        res = client.index(index=index_name, id=i, body={
            "name": Product_Name,
            "description": Product_Description,
            "price": Product_Price,
            "imageUrl": Image,
            "vector_en": embedding 
        })

