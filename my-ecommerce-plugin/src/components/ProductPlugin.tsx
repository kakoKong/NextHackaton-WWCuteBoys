import { Search, ShoppingCart, Heart, Star, Send, Upload, X, Sparkles, Package, Palette, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category?: string;
}

interface Message {
    type: 'user' | 'bot';
    content: string;
    imageUrl?: string;
    recommendedProducts?: Product[];
}

// AI simulation functions for the plugin
const callProductMatchingAPI = async (query: string, imageFile?: File): Promise<Product[]> => {
    // Simulate API delay
    if (imageFile){
        // Store image to s3, and then return s3 url
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate product matching logic - focus on functionality and category
    return []
};

const callStyleMatchingAPI = async (query: string, imageFile?: File): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    return []
};

// AI Product Plugin Component
export default function ProductPlugin({ onRecommendation }: { onRecommendation: (products: Product[]) => void }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState<'product' | 'style'>('product');

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

        setMessages(prev => [...prev, newUserMessage]);
        setIsLoading(true);

        // Clear input
        const queryText = inputText.trim();
        setInputText('');
        const imageFile = selectedImage;
        setSelectedImage(null);
        setImagePreview(null);

        const safeImageFile = imageFile ?? undefined;
        try {
            let recommendations: Product[];

            if (currentMode === 'product') {
                recommendations = await callProductMatchingAPI(queryText, safeImageFile);
            } else {
                recommendations = await callStyleMatchingAPI(queryText, safeImageFile);
            }

            const botMessage: Message = {
                type: 'bot',
                content: currentMode === 'product'
                    ? `Found ${recommendations.length} products matching your requirements:`
                    : `Found ${recommendations.length} items with similar style aesthetics:`,
                recommendedProducts: recommendations,
            };

            setMessages(prev => [...prev, botMessage]);
            onRecommendation(recommendations);
        } catch (error) {
            const errorMessage: Message = {
                type: 'bot',
                content: 'Sorry, I encountered an error while searching. Please try again.',
            };
            setMessages(prev => [...prev, errorMessage]);
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
                {messages.length === 0 && (
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

                {messages.map((msg, index) => (
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
                                            <p className="text-sm font-bold text-indigo-600">${product.price}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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