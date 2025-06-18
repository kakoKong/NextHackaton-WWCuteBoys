import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, MessageCircle, X, Sparkles } from 'lucide-react';
import ProductPlugin from '../components/ProductPlugin';
import Papa from 'papaparse';
import Link from 'next/link';


interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  rating?: number;
  category?: string;
}

export default function EcommerceDemo() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [showPlugin, setShowPlugin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/data/products.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed = results.data.map((row: any, index: number) => ({
              id: row.id || `${index}`,
              name: row.name,
              description: row.description,
              price: row.price,
              imageUrl: `assets/${row.imageUrl}`,
              category: row.category || 'General',
            }));
            setAllProducts(parsed);
            setDisplayedProducts(parsed);
            setTimeout(() => setIsLoading(false), 500);
          },
        });
      });
  }, []);

  const handleRecommendation = (products: Product[]) => {
    setDisplayedProducts(products);
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => prev + 1);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistItems(prev => {
      const updated = new Set(prev);
      updated.has(productId) ? updated.delete(productId) : updated.add(productId);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Animated Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 group">
            <div className="transform group-hover:rotate-12 transition-transform duration-300">
              <img src="/assets/Unibro.png" alt="Unibro Logo" className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-600 bg-clip-text text-transparent">
              Unibro
            </h1>
          </div>
          <Link href="/" className="text-xs sm:text-sm text-gray-500 font-medium no-underline">
            Powered by: <span className="text-purple-600 font-semibold">VibeShopping.AI</span>
          </Link>
        </div>
      </header>

      <div className="max-w-9xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Products Section */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 transform hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {displayedProducts.length > 0 ? 'Recommended Products' : 'No products found'}
            </h2>
            {isLoading && (
              <div className="flex items-center space-x-2 text-purple-600">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>

          {/* Loading Animation */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-t-2xl"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="group cursor-pointer transform hover:scale-[1.02] transition-all duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-500 border border-gray-100 hover:border-purple-200">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 hover:bg-white"
                      >
                        <Heart className={`w-5 h-5 transition-colors duration-300 ${wishlistItems.has(product.id)
                          ? 'text-pink-500 fill-current animate-pulse'
                          : 'text-gray-400 hover:text-pink-400'
                          }`} />
                      </button>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-3 text-lg line-clamp-2 group-hover:text-purple-700 transition-colors duration-300">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {product.price}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 active:scale-95"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Floating Assistant Button */}
        <button
          onClick={() => setShowPlugin(prev => !prev)}
          className={`cursor-pointer fixed bottom-8 right-8 z-50 group transition-all duration-500 transform hover:scale-110 active:scale-95 ${showPlugin
            ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/30'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/30'
            } text-white rounded-full shadow-2xl hover:shadow-3xl p-4 backdrop-blur-sm border border-white/20`}
        >
          <div className="flex items-center space-x-3">
            <div className={`transform transition-all duration-300 ${showPlugin ? 'rotate-180' : ''}`}>
              {showPlugin ? (
                <X className="w-6 h-6" />
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
            </div>
            <span className="font-semibold text-sm group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {showPlugin ? 'Close AI' : 'VibeShoppingAI'}
            </span>
          </div>

          {/* Animated Ring */}
          {!showPlugin && (
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
          )}

          {/* Sparkle Effect */}
          <div className="absolute -top-1 -right-1">
            <Sparkles className={`w-4 h-4 text-yellow-300 ${showPlugin ? 'animate-spin' : 'animate-pulse'}`} />
          </div>
        </button>

        {/* Enhanced Plugin Container */}
        {showPlugin && (
          <div className="fixed bottom-28 right-8 z-40 w-[380px] max-w-[calc(100vw-2rem)] animate-slideInUp">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:shadow-3xl transition-all duration-500">
              <ProductPlugin onRecommendation={handleRecommendation} />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.4s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}