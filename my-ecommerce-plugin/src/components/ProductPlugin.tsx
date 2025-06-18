import { Search, ShoppingCart, Heart, Star, Send, Upload, X, Sparkles, Package, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRef } from 'react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    category?: string;
}

interface Message {
    type: 'user' | 'bot';
    content: string;
    imageUrl?: string;
    recommendedProducts?: Product[];
}

interface AIResponse {
    genJson: any;
    reference: Product[];
}

interface RawResult {
    search_term: string;
    search_results: {
        score: number;
        id: string;
        name: string;
        description: string;
        price: string;
    }[];
}

function flattenSearchResults(results: RawResult[]): Product[] {
    const allProducts: Product[] = [];

    results.forEach((entry) => {
        const category = entry.search_term || "General";

        entry.search_results.forEach((item, index) => {
            const fileNameWithoutExt = item.id.replace(/\.[^/.]+$/, ".png"); // remove .jpg/.png/.webp

            allProducts.push({
                id: `${fileNameWithoutExt}-${index}`,
                name: item.name,
                description: item.description,
                price: item.price,
                imageUrl: `assets/${fileNameWithoutExt}`,  // no .jpg extension here
                category: category,
            });
        });
    });

    return allProducts;
}


// AI simulation functions for the plugin
export const callProductMatchingAPI = async (query: string, imageFile?: File): Promise<AIResponse> => {
    const baseUrl = "http://localhost:8001";

    try {
        let imagePrompt = "";

        if (imageFile) {
            // 1. Upload image to S3 via presigned URL
            console.log('gt image')
            const s3Key = await uploadImageToS3(imageFile, baseUrl);

            // 2. Get image caption using S3 key
            const captionPayload = {
                image_path: s3Key  // This matches your existing ImageCaptioningRequest
            };

            const captionRes = await fetch(`${baseUrl}/image_captioning`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(captionPayload)
            });

            const captionJson = await captionRes.json();
            imagePrompt = captionJson.results;
        }

        // Rest of your code remains exactly the same...
        const findingPayload = {
            user_query: query,
            image_prompt: imagePrompt
        };

        const findRes = await fetch(`${baseUrl}/finding_documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(findingPayload)
        });

        const findJson = await findRes.json();
        const reference = findJson.results;

        const genPayload = {
            question: `${query}`,
            reference: JSON.stringify(reference)
        };

        console.log(genPayload)
        const genRes = await fetch(`${baseUrl}/generation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(genPayload)
        });

        const genJson = await genRes.json();
        return { genJson: genJson ?? '', reference: flattenSearchResults(reference) ?? [] };
    } catch (err) {
        console.error("API error", err);
        throw err;
    }
};

// Helper function for S3 upload
const uploadImageToS3 = async (file: File, baseUrl: string): Promise<string> => {
    // Get presigned URL from your backend
    const presignedRes = await fetch(`${baseUrl}/get-presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileName: file.name,
            fileType: file.type
        })
    });

    if (!presignedRes.ok) {
        throw new Error('Failed to get presigned URL');
    }
    console.log("yess")
    const { uploadURL, key } = await presignedRes.json();

    // Upload directly to S3
    const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
    });


    if (!uploadRes.ok) {
        throw new Error('Failed to upload to S3');
    }

    return key; // Return S3 key for your backend to use
};

const callStyleMatchingAPI = async (query: string, imageFile?: File): Promise<{ recommendations: Product[], genResponse: string }> => {
    const baseUrl = "http://localhost:8001";
    let imagePrompt = "";

    try {
        // 1. Upload image and get caption
        if (imageFile) {
            const s3Key = await uploadImageToS3(imageFile, baseUrl);

            const captionPayload = { image_path: s3Key };
            const captionRes = await fetch(`${baseUrl}/image_captioning`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(captionPayload)
            });

            const captionJson = await captionRes.json();
            imagePrompt = captionJson.results;
        }

        // 2. Request style complement (returns text)
        const styleCompPayload = {
            user_query: query,
            image_prompt: imagePrompt
        };

        const styleRes = await fetch(`${baseUrl}/style_complement`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(styleCompPayload)
        });

        const styleJson = await styleRes.json();
        const styleComplementText = styleJson.results;

        // 3. Use that to find relevant documents
        const docSearchPayload = {
            user_query: styleComplementText,
            image_prompt: imagePrompt
        };

        const docRes = await fetch(`${baseUrl}/finding_documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(docSearchPayload)
        });

        const docJson = await docRes.json();
        const reference = docJson.results;

        // 4. Final generation
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
        return {
            recommendations: flattenSearchResults(reference),
            genResponse: genJson.response ?? "Here's what I found for your style."
        };
    } catch (err) {
        console.error("Style matching API error:", err);
        throw err;
    }
};


// AI Product Plugin Component
export default function ProductPlugin({ onRecommendation }: { onRecommendation: (products: Product[]) => void }) {

    const bottomRef = useRef<HTMLDivElement | null>(null);
    // Separate message states for each mode
    const [productMessages, setProductMessages] = useState<Message[]>([]);
    const [styleMessages, setStyleMessages] = useState<Message[]>([]);

    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState<'product' | 'style'>('product');

    // Get the current messages based on mode
    const getCurrentMessages = () => {
        return currentMode === 'product' ? productMessages : styleMessages;
    };

    // Set messages based on current mode
    const setCurrentMessages = (messages: Message[] | ((prev: Message[]) => Message[])) => {
        if (currentMode === 'product') {
            setProductMessages(messages);
        } else {
            setStyleMessages(messages);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() && !selectedImage) return;

        const newUserMessage: Message = {
            type: 'user',
            content: inputText.trim(),
            ...(selectedImage && { imageUrl: imagePreview || '' }),
        };

        setCurrentMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        // Clear input
        const queryText = inputText.trim();
        setInputText('');
        const imageFile = selectedImage;
        setSelectedImage(null);
        setImagePreview(null);

        const safeImageFile = imageFile ?? undefined;
        try {
            let recommendations: Product[] = [];
            let botresponse = '';

            try {
                if (currentMode === 'product') {
                    const { genJson, reference } = await callProductMatchingAPI(queryText, safeImageFile);
                    recommendations = reference;
                    botresponse = genJson.response ?? '';
                } else {
                    const { recommendations: styleRecs, genResponse } = await callStyleMatchingAPI(queryText, safeImageFile);
                    recommendations = styleRecs;
                    botresponse = genResponse ?? '';
                }

                const botMessage: Message = {
                    type: 'bot',
                    content: `${botresponse}\n\nFound ${recommendations.length} ${currentMode === 'product' ? 'products matching your requirements' : 'items with similar style aesthetics'
                        }.`,
                    recommendedProducts: recommendations,
                };

                setCurrentMessages((prev) => [...prev, botMessage]);
                onRecommendation(recommendations);
            } catch (error) {
                const errorMessage: Message = {
                    type: 'bot',
                    content: 'Sorry, I encountered an error while searching. Please try again.',
                };
                setCurrentMessages((prev) => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        } catch (error) {
            const errorMessage: Message = {
                type: 'bot',
                content: 'Sorry, I encountered an error while searching. Please try again.',
            };
            setCurrentMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleMode = () => {
        setCurrentMode(prev => prev === 'product' ? 'style' : 'product');
        // Clear any pending input/image when switching modes
        setInputText('');
        setSelectedImage(null);
        setImagePreview(null);
    };

    const getModeConfig = () => {
        if (currentMode === 'product') {
            return {
                title: 'Product Matching',
                subtitle: 'Find products by function & category',
                icon: Package,
                gradient: 'from-blue-600 to-indigo-600',
                textgradient: 'from-blue-300 to-indigo-100',
                placeholder: 'Looking for wireless headphones...',
                examples: ['blue shirt', 'pink dress', 'long jeans', 'accessories']
            };
        } else {
            return {
                title: 'Style Matching',
                subtitle: 'Find items by aesthetic & style',
                icon: Palette,
                gradient: 'from-purple-600 to-pink-600',
                textgradient: 'from-purple-300 to-pink-100',
                placeholder: 'I love minimalist design...',
                examples: ['minimalist', 'vintage', 'modern', 'casual']
            };
        }
    };

    const config = getModeConfig();
    const IconComponent = config.icon;
    const currentMessages = getCurrentMessages();
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentMessages]);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl hover:scale-[1.02]">
            {/* Header with Mode Toggle */}
            <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
                <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.textgradient} bg-clip-text text-transparent mb-3`}>
                    Vibey.AI
                </h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-full">
                            <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">{config.title}</h3>
                            <p className="text-white/80 text-sm">{config.subtitle}</p>
                        </div>
                    </div>

                    <button
                        onClick={toggleMode}
                        className="cursor-pointer flex items-center space-x-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-2 transition-colors"
                    >
                        {currentMode === 'product' ? (
                            <>
                                <Package className="w-4 h-4 text-white" />
                                <ToggleRight className="w-5 h-5 text-white" />
                            </>
                        ) : (
                            <>
                                <Palette className="w-4 h-4 text-white" />
                                <ToggleLeft className="w-5 h-5 text-white" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
                {currentMessages.length === 0 && (
                    <div className="text-center text-gray-500 mt-12">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">AI-Powered {config.title}</p>
                        <p className="text-sm mb-4">{config.subtitle}</p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                            {config.examples.map((example, idx) => (
                                <span key={idx} className="bg-gray-100 px-2 py-1 rounded-full">
                                    {example}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {currentMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${msg.type === 'user'
                            ? `bg-gradient-to-r ${config.gradient} text-white`
                            : 'bg-gray-100 text-gray-800'
                            }`}>

                            <p className="text-sm">{msg.content}</p>

                            {msg.imageUrl && (
                                <div className="mt-3">
                                    <img src={msg.imageUrl} alt="Uploaded" className="w-32 h-32 rounded-lg object-cover" />
                                </div>
                            )}

                            {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {msg.recommendedProducts.map((product) => (
                                        <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border">
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-20 object-cover rounded-lg mb-2"
                                            />
                                            <p className="font-medium text-gray-900 text-xs truncate">{product.name}</p>
                                            <p className="text-sm font-bold text-indigo-600">{product.price}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div ref={bottomRef}></div>
                    </div>

                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl p-4">
                            <div className="flex items-center space-x-2">
                                <div className="animate-pulse flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {currentMode === 'product' ? 'Finding products...' : 'Analyzing style...'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        <span className="text-sm text-gray-600 flex-1">Image ready to send</span>
                        <button
                            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                        onChange={handleImageUpload}
                    />
                    <label
                        htmlFor="image-upload"
                        className="p-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <Upload className="w-5 h-5 text-gray-600" />
                    </label>

                    <input
                        type="text"
                        className="flex-1 p-3 border border-gray-300 text-black rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={config.placeholder}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={(!inputText.trim() && !selectedImage) || isLoading}
                        className={`p-3 bg-gradient-to-r ${config.gradient} text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}