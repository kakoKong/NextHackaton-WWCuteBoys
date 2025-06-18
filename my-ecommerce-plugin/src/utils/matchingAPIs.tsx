// utils/matchingAPI.tsx

export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    category?: string;
}

export interface AIResponse {
    genJson: any;
    reference: Product[];
}

export interface RawResult {
    search_term: string;
    search_results: {
        score: number;
        id: string;
        name: string;
        description: string;
        price: string;
    }[];
}

export type MatchingStatus = 'idle' | 'analyzing-image' | 'searching-products' | 'generating-response';

export function flattenSearchResults(results: RawResult[]): Product[] {
    const allProducts: Product[] = [];
    const seen = new Set<string>(); // for tracking duplicates

    results.forEach((entry) => {
        const category = entry.search_term || "General";

        entry.search_results.forEach((item, index) => {
            const fileNameWithoutExt = item.id.replace(/\.[^/.]+$/, ".png");
            const uniqueKey = `${item.id}-${item.name.toLowerCase().trim()}`;

            if (!seen.has(uniqueKey)) {
                // detect dulp
                seen.add(uniqueKey);

                allProducts.push({
                    id: `${fileNameWithoutExt}-${index}`,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    imageUrl: `assets/${fileNameWithoutExt}`,
                    category,
                });
            }
        });
    });

    return allProducts;
}

export const uploadImageToS3 = async (file: File, baseUrl: string, setStatus?: (status: MatchingStatus) => void): Promise<string> => {
    if (setStatus) setStatus('analyzing-image');

    const presignedRes = await fetch(`${baseUrl}/get-presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
    });

    if (!presignedRes.ok) throw new Error('Failed to get presigned URL');

    const { uploadURL, key } = await presignedRes.json();

    const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
    });

    if (!uploadRes.ok) throw new Error('Failed to upload to S3');

    return key;
};

export const callProductMatchingAPI = async (
    query: string,
    imageFile?: File,
    onProductsFound?: (products: Product[]) => void,
    setStatus?: (status: MatchingStatus) => void
): Promise<AIResponse> => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT ?? "http://localhost:8001";
    let imagePrompt = "";

    try {
        if (imageFile) {
            const s3Key = await uploadImageToS3(imageFile, baseUrl, setStatus);
            const captionPayload = { image_path: s3Key };

            const captionRes = await fetch(`${baseUrl}/image_captioning`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(captionPayload)
            });

            const captionJson = await captionRes.json();
            imagePrompt = captionJson.results;
        }

        if (setStatus) setStatus('searching-products');

        const findingPayload = { user_query: query, image_prompt: imagePrompt };
        const findRes = await fetch(`${baseUrl}/finding_documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(findingPayload)
        });

        const findJson = await findRes.json();
        const reference = findJson.results;
        const products = flattenSearchResults(reference);

        if (onProductsFound) onProductsFound(products);

        if (setStatus) setStatus('generating-response');

        const genPayload = {
            question: query,
            reference: JSON.stringify(reference)
        };

        const genRes = await fetch(`${baseUrl}/generation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(genPayload)
        });

        const genJson = await genRes.json();
        return { genJson: genJson ?? '', reference: products };
    } catch (err) {
        console.error("API error", err);
        throw err;
    }
};

export const callStyleMatchingAPI = async (
    query: string,
    imageFile?: File,
    onProductsFound?: (products: Product[]) => void,
    setStatus?: (status: MatchingStatus) => void
): Promise<{ recommendations: Product[]; genResponse: string }> => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT ?? "http://localhost:8001";
    let imagePrompt = "";

    try {
        if (imageFile) {
            const s3Key = await uploadImageToS3(imageFile, baseUrl, setStatus);
            const captionPayload = { image_path: s3Key };

            const captionRes = await fetch(`${baseUrl}/image_captioning`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(captionPayload)
            });

            const captionJson = await captionRes.json();
            imagePrompt = captionJson.results;
        }

        if (setStatus) setStatus('searching-products');

        const styleCompPayload = { user_query: query, image_prompt: imagePrompt };
        const styleRes = await fetch(`${baseUrl}/style_complement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(styleCompPayload)
        });

        const styleJson = await styleRes.json();
        const styleComplementText = styleJson.results;

        const docSearchPayload = { user_query: styleComplementText, image_prompt: "" };
        const docRes = await fetch(`${baseUrl}/finding_documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(docSearchPayload)
        });

        const docJson = await docRes.json();
        const reference = docJson.results;
        const products = flattenSearchResults(reference);

        if (onProductsFound) onProductsFound(products);

        if (setStatus) setStatus('generating-response');

        const genPayload = { question: query, reference: JSON.stringify(reference) };
        const genRes = await fetch(`${baseUrl}/generation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(genPayload)
        });

        const genJson = await genRes.json();
        return {
            recommendations: products,
            genResponse: genJson.response ?? "Here's what I found for your style."
        };
    } catch (err) {
        console.error("Style matching API error:", err);
        throw err;
    }
};