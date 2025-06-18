from function import semantic_search


if __name__ == "__main__":
    index_name = "product-index"
    #creating_index_body(index_name)
    # Example DataFrame for testing
    #df = pd.read_csv("../data.csv")
    #ingestion_data_opensearch(index_name, df)
    results = semantic_search("The image shows a woman wearing a gray button-down dress or shirtdress. The dress has long sleeves and a collar, and is cinched at the waist with a belt. The woman is standing in what appears to be an office or workspace setting, with shelves or cabinets visible in the background. The overall style of the dress and setting suggests a professional or formal work environment.", top_k=3, index_name=index_name)
    print("Search Results:")
    print(results)
    for i in range(1, len(results[0]) + 1):
        print(f"Input {i}")
        print(f"Product {i}: {results[0][f'product{i}']}")
        print(f"Description {i}: {results[1][f'description{i}']}")
        print(f"Price {i}: {results[2][f'price{i}']}")
        print(f"Image {i}: {results[3][f'image{i}']}")
        print("---")
        
     