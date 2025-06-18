import { callProductMatchingAPI, callStyleMatchingAPI, MatchingStatus } from '@/utils/matchingAPIs';
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
    isLoading?: boolean;
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

// Utility function to remove duplicate products
const removeDuplicateProducts = (products: Product[]): Product[] => {
    const seen = new Set<string>();
    return products.filter(product => {
        // Use a combination of id and name for uniqueness check
        const uniqueKey = `${product.id}-${product.name.toLowerCase().trim()}`;
        if (seen.has(uniqueKey)) {
            return false;
        }
        seen.add(uniqueKey);
        return true;
    });
};

// AI Product Plugin Component
export default function ProductPlugin({ onRecommendation }: { onRecommendation: (products: Product[]) => void }) {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [productMessages, setProductMessages] = useState<Message[]>([]);
    const [styleMessages, setStyleMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [matchingStatus, setMatchingStatus] = useState<MatchingStatus>('idle');
    const [currentMode, setCurrentMode] = useState<'product' | 'style'>('product');

    const getCurrentMessages = () => {
        return currentMode === 'product' ? productMessages : styleMessages;
    };

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

        // Create a placeholder bot message that will show products first
        const placeholderBotMessage: Message = {
            type: 'bot',
            content: 'Finding products...',
            isLoading: true
        };

        setCurrentMessages(prev => [...prev, placeholderBotMessage]);

        const queryText = inputText.trim();
        setInputText('');
        const imageFile = selectedImage;
        setSelectedImage(null);
        setImagePreview(null);

        const safeImageFile = imageFile ?? undefined;

        try {
            let finalBotMessage: Message;

            // Callback to update the message with products immediately
            const onProductsFound = (products: Product[]) => {
                // Remove duplicates while preserving order
                const uniqueProducts = removeDuplicateProducts(products);
                
                const productsMessage: Message = {
                    type: 'bot',
                    content: `Found ${uniqueProducts.length} ${currentMode === 'product' ? 'products matching your requirements' : 'items with similar style aesthetics'}. Generating detailed response...`,
                    recommendedProducts: uniqueProducts,
                    isLoading: true
                };

                // Update the placeholder message with products
                setCurrentMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = productsMessage;
                    return newMessages;
                });

                // Call the parent callback with deduplicated products
                onRecommendation(uniqueProducts);
            };

            if (currentMode === 'product') {
                const { genJson, reference } = await callProductMatchingAPI(
                    queryText,
                    safeImageFile,
                    onProductsFound,
                    setMatchingStatus
                );

                // Remove duplicates from final reference as well
                const uniqueReference = removeDuplicateProducts(reference);

                finalBotMessage = {
                    type: 'bot',
                    content: genJson.response ?? `Found ${uniqueReference.length} products matching your requirements.`,
                    recommendedProducts: uniqueReference,
                };
            } else {
                const { recommendations, genResponse } = await callStyleMatchingAPI(
                    queryText,
                    safeImageFile,
                    onProductsFound,
                    setMatchingStatus
                );

                // Remove duplicates from recommendations
                const uniqueRecommendations = removeDuplicateProducts(recommendations);

                finalBotMessage = {
                    type: 'bot',
                    content: genResponse,
                    recommendedProducts: uniqueRecommendations,
                };
            }

            // Update the final message with the generated text
            setCurrentMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = finalBotMessage;
                return newMessages;
            });

        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            const errorMessage: Message = {
                type: 'bot',
                content: 'Sorry, I encountered an error while searching. Please try again.',
            };

            setCurrentMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = errorMessage;
                return newMessages;
            });
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

    const statusTextMap = {
        'idle': '',
        'analyzing-image': 'Analyzing uploaded image...',
        'searching-products': currentMode === 'product' ? 'Searching for matching products...' : 'Searching for aesthetic items...',
        'generating-response': 'Generating smart suggestions...',
    } as const;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl">
            {/* Header with Mode Toggle */}
            <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
                <h2 className={`text-2xl font-bold bg-gradient-to-r ${config.textgradient} bg-clip-text text-transparent mb-3`}>
                    VibeShopping.AI
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

                            {/* User uploaded image - shown first for user messages */}
                            {msg.type === 'user' && msg.imageUrl && (
                                <div className="mb-3">
                                    <img src={msg.imageUrl} alt="Uploaded" className="w-32 h-32 rounded-lg object-cover" />
                                </div>
                            )}

                            {/* For user messages: show content after image */}
                            {msg.type === 'user' && (
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm">{msg.content}</p>
                                </div>
                            )}

                            {/* For bot messages: show products first, then content */}
                            {msg.type === 'bot' && (
                                <>
                                    {/* Recommended products - shown FIRST for bot messages */}
                                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                                        <div className="mb-4 grid grid-cols-2 gap-3">
                                            {msg.recommendedProducts.map((product) => (
                                                <div key={`${product.id}-${product.name}`} className="bg-white p-3 rounded-xl shadow-sm border">
                                                    {/* Product image shown first */}
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-full h-20 object-cover rounded-lg mb-2"
                                                        onError={(e) => {
                                                            // Fallback for broken images
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDkuNzkgMTAuMjEgMTIgOEMxNC4yMSAxMC4yMSAxNC4yMSAxMy43OSAxMiAxNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                                                        }}
                                                    />
                                                    {/* Product details shown after image */}
                                                    <p className="font-medium text-gray-900 text-xs truncate" title={product.name}>
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm font-bold text-indigo-600">{product.price}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message content - shown AFTER products for bot messages */}
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </>
                            )}

                            {/* Loading indicator */}
                            {msg.isLoading && (
                                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm mt-3">
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                        <span className="text-sm">
                                            {statusTextMap[matchingStatus]}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <div ref={bottomRef}></div>
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