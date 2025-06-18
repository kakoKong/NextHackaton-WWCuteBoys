import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import ProductPlugin from '../components/ProductPlugin';
import Papa from 'papaparse';

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
            setDisplayedProducts(parsed); // Show all by default
          },
        });
      });
  }, []);

  const handleRecommendation = (products: Product[]) => {
    setDisplayedProducts(products); // Replace list with recommended ones
  };

  const addToCart = (product: Product) => setCartItems(prev => prev + 1);

  const toggleWishlist = (productId: string) => {
    setWishlistItems(prev => {
      const updated = new Set(prev);
      updated.has(productId) ? updated.delete(productId) : updated.add(productId);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-gray-800">XFashionX</h1>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-pink-500">
              <Heart className="w-6 h-6" />
              {wishlistItems.size > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistItems.size}
                </span>
              )}
            </button>
            <button className="relative p-2 text-gray-600 hover:text-purple-600">
              <ShoppingCart className="w-6 h-6" />
              {cartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-9xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {displayedProducts.length > 0 ? 'Recommended Products' : 'No products found'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                <div className="bg-gray-50 rounded-2xl overflow-hidden hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <div className="aspect-[3/4] relative">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    <button onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition">
                      <Heart className={`w-5 h-5 ${wishlistItems.has(product.id) ? 'text-pink-500 fill-current' : 'text-gray-400'}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-purple-600">{product.price}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full hover:scale-105 transition-all"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProductPlugin onRecommendation={handleRecommendation} />
          </div>
        </div>
      </div>
    </div>
  );
}
