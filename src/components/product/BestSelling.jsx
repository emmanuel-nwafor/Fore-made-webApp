import { useState, useEffect } from 'react';
import db from '../../db.json';
import ProductCard from '../home/ProductCard';
import SkeletonLoader from '../common/SkeletonLoader';

const BestSelling = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5-second delay
        const bestSellingData = db.products
          .filter((product) => product.rating >= 4.0)
          .sort((a, b) => b.rating - a.rating) // Sort by rating descending
          .slice(0, 8); // Limit to 8 products
        setProducts(bestSellingData);
      } catch (err) {
        console.error('Error loading best selling products from db.json:', err);
        setError('Failed to load best selling products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonLoader type="recommended" count={8} />
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <p className="text-center col-span-full">No best selling products available.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default BestSelling;