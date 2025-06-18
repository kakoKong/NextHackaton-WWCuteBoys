import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Heart, Star, Send, Upload, X, Sparkles } from 'lucide-react';
import ProductPlugin from '../components/ProductPlugin';
import Papa from 'papaparse';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  rating?: number;
  category?: string;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  imageUrl?: string;
  recommendedProducts?: Product[];
}

// Main E-commerce Demo Component
// Main Component
export default function EcommerceDemo() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const S3_BASE_URL = "https://testbucketwwcuteboys.s3-us-west-2.amazonaws.com/assets";

  useEffect(() => {
    fetch('/data/products.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedProducts = results.data.map((row: any, index: number) => ({
              id: row.id || `${index}`,
              name: row.name,
              description: row.description,
              price: row.price,
              imageUrl: `assets/${row.imageUrl}`,
              category: row.category || 'General'
            }));
            setAllProducts(parsedProducts);
          }
        });
      });
  }, []);


  console.log(displayedProducts)

  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(0);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate pagination
  const productsToShow = searchQuery ? filteredProducts : allProducts;
  const totalPages = Math.ceil(productsToShow.length / itemsPerPage);

  // Update displayed products when filters or pagination changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedProducts(productsToShow.slice(startIndex, endIndex));
  }, [productsToShow, currentPage, itemsPerPage]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleRecommendation = (products: Product[]) => {
    setDisplayedProducts(products);
    setCurrentPage(1); // Reset pagination when showing recommendations
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => prev + 1);
  };

  const toggleWishlist = (productId: string) => {
    setWishlistItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800 bg-clip-text">
                XFashionX
              </h1>
            </div>

            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
                <Heart className="w-6 h-6" />
                {wishlistItems.size > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems.size}
                  </span>
                )}
              </button>
              <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Products Grid - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Products {searchQuery && `(${productsToShow.length} results)`}
                </h2>
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedProducts.map((product) => (
                  <div key={product.id} className="group cursor-pointer">
                    <div className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                      <div className="aspect-[3/4] relative">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => toggleWishlist(product.id)}
                          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                        >
                          <Heart
                            className={`w-5 h-5 ${wishlistItems.has(product.id)
                              ? 'text-pink-500 fill-current'
                              : 'text-gray-400'
                              }`}
                          />
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        {product.rating && (
                          <div className="flex items-center mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(product.rating!)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                    }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {product.rating}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-purple-600">
                            ${product.price}
                          </span>
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${currentPage === i + 1
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}

              {displayedProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ProductPlugin onRecommendation={handleRecommendation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}