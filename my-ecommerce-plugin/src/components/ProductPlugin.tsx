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

// Convert your CSV data to products
const csvProducts: Product[] = [
    {
        id: '1',
        name: 'Zara Sequin Maxi Skirt',
        description: 'This captivating black sequin maxi skirt is designed to shimmer and reflect light with every step, creating a dynamic and luxurious visual effect.',
        price: 129.90,
        imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop',
        category: 'Clothing'
    },
    {
        id: '2',
        name: 'Korean V-Neck Blouse',
        description: 'This charming light pink blouse features a gentle V-neckline adorned with subtle, color-matched buttons running down the front.',
        price: 49.90,
        imageUrl: 'https://images.unsplash.com/photo-1564257577-6a4b7197a74e?w=400&h=600&fit=crop',
        category: 'Clothing'
    },
    {
        id: '3',
        name: 'Pink Corduroy Jacket',
        description: 'This stylish pink corduroy jacket reinterprets the classic trucker jacket design with a delightful pastel hue.',
        price: 89.90,
        imageUrl: 'https://images.unsplash.com/photo-1551698618-04cedc5c1b3c?w=400&h=600&fit=crop',
        category: 'Clothing'
    },
    // Additional mock products for demonstration
    {
        id: '4',
        name: 'Vintage Denim Jacket',
        description: 'Classic vintage-style denim jacket with distressed details and comfortable fit.',
        price: 79.90,
        imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=600&fit=crop',
        category: 'Clothing'
    },
    {
        id: '5',
        name: 'Floral Summer Dress',
        description: 'Light and airy floral dress perfect for summer occasions.',
        price: 69.90,
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop',
        category: 'Clothing'
    },
    {
        id: '6',
        name: 'Striped Casual Shirt',
        description: 'Comfortable striped shirt with modern fit and breathable fabric.',
        price: 39.90,
        imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=600&fit=crop',
        category: 'Clothing'
    }
];

// AI simulation functions for the plugin
const callProductMatchingAPI = async (query: string, imageFile?: File): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate product matching logic - focus on functionality and category
    let results = [...csvProducts];

    if (query.toLowerCase().includes('sequin') || query.toLowerCase().includes('glamorous')) {
        results = results.filter(p => p.name.toLowerCase().includes('sequin'));
    } else if (query.toLowerCase().includes('pink') || query.toLowerCase().includes('feminine')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('pink') ||
            p.description.toLowerCase().includes('pink') ||
            p.name.toLowerCase().includes('korean')
        );
    } else if (query.toLowerCase().includes('jacket') || query.toLowerCase().includes('casual')) {
        results = results.filter(p => p.name.toLowerCase().includes('jacket'));
    } else if (query.toLowerCase().includes('dress') || query.toLowerCase().includes('summer')) {
        results = results.filter(p => p.name.toLowerCase().includes('dress'));
    } else if (query.toLowerCase().includes('shirt') || query.toLowerCase().includes('blouse')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('shirt') ||
            p.name.toLowerCase().includes('blouse')
        );
    } else {
        // For general queries, return a random selection
        const shuffled = [...results].sort(() => 0.5 - Math.random());
        results = shuffled.slice(0, 3);
    }

    return results.slice(0, 4);
};

const callStyleMatchingAPI = async (query: string, imageFile?: File): Promise<Product[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulate style matching logic - focus on aesthetics and style
    let results = [...csvProducts];

    if (query.toLowerCase().includes('feminine') || query.toLowerCase().includes('cute')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('korean') ||
            p.name.toLowerCase().includes('pink') ||
            p.description.toLowerCase().includes('feminine')
        );
    } else if (query.toLowerCase().includes('elegant') || query.toLowerCase().includes('glamorous')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('sequin') ||
            p.description.toLowerCase().includes('elegant')
        );
    } else if (query.toLowerCase().includes('casual') || query.toLowerCase().includes('comfortable')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('jacket') ||
            p.description.toLowerCase().includes('casual')
        );
    } else if (query.toLowerCase().includes('vintage') || query.toLowerCase().includes('retro')) {
        results = results.filter(p =>
            p.name.toLowerCase().includes('corduroy') ||
            p.description.toLowerCase().includes('vintage')
        );
    } else {
        // Return a diverse style mix
        const shuffled = [...results].sort(() => 0.5 - Math.random());
        results = shuffled.slice(0, 3);
    }

    return results.slice(0, 4);
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

        try {
            let recommendations: Product[];

            if (currentMode === 'product') {
                recommendations = await callProductMatchingAPI(queryText, imageFile);
            } else {
                recommendations = await callStyleMatchingAPI(queryText, imageFile);
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
                placeholder: 'Looking for wireless headphones...',
                examples: ['electronics', 'clothing', 'home decor', 'accessories']
            };
        } else {
            return {
                title: 'Style Matching',
                subtitle: 'Find items by aesthetic & style',
                icon: Palette,
                gradient: 'from-purple-600 to-pink-600',
                placeholder: 'I love minimalist design...',
                examples: ['minimalist', 'vintage', 'modern', 'casual']
            };
        }
    };

    const config = getModeConfig();
    const IconComponent = config.icon;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Header with Mode Toggle */}
            <div className={`bg-gradient-to-r ${config.gradient} p-4`}>
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
                        className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-2 transition-colors"
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
                        className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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