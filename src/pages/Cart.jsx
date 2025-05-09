import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import db from '../db.json';
import { getCart, updateCart, clearCart } from '/src/utils/cartUtils.js';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Load cart from cartUtils on mount
  useEffect(() => {
    try {
      setLoading(true);
      const cartItems = getCart();
      console.log('Loaded cart from cartUtils in Cart.jsx:', cartItems);
      if (Array.isArray(cartItems)) {
        // Validate product IDs
        const validCart = cartItems.filter((item) => {
          const productExists = db.products.some((p) => p.id === item.productId);
          if (!productExists) {
            console.log(`Product ID ${item.productId} not found in db.json, removing from cart.`);
          }
          return productExists;
        });
        setCart(validCart);
        if (validCart.length !== cartItems.length) {
          updateCart(validCart);
          setError('Some cart items were invalid and have been removed.');
        }
      } else {
        setCart([]);
        updateCart([]);
        setError('Cart data was invalid and has been reset.');
      }
    } catch (err) {
      console.error('Error loading cart from cartUtils:', err);
      setCart([]);
      updateCart([]);
      setError('Failed to load cart. It has been reset.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Map cart items to include product details from db.json
  const cartItems = cart.map((item) => {
    const product = db.products.find((p) => p.id === item.productId);
    console.log(`Mapping cart item - Product ID: ${item.productId}, Found Product:`, product);
    return { ...item, product };
  });
  console.log('Cart items after mapping:', cartItems);

  // Calculate totals
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = cart.length;
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.product ? item.product.price * item.quantity : 0);
  }, 0);
  const taxRate = 0.075; // 7.5% tax
  const tax = subtotal * taxRate;
  const shipping = subtotal > 0 ? 500 : 0; // Flat 500 NGN shipping
  const totalPrice = subtotal + tax + shipping;

  // Handlers for cart actions
  const updateCartQuantity = (productId, quantity) => {
    const item = cartItems.find((i) => i.productId === productId);
    if (!item.product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
    } else if (quantity > item.product.stock) {
      setMessage(`Cannot add more than ${item.product.stock} units of ${item.product.name}.`);
      const updatedCart = cart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.product.stock } : item
      );
      setCart(updatedCart);
      updateCart(updatedCart);
    } else {
      const updatedCart = cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      setCart(updatedCart);
      updateCart(updatedCart);
      setMessage(`Updated quantity of ${item.product.name} to ${quantity}.`);
    }
  };

  const removeFromCart = (productId) => {
    const item = cartItems.find((i) => i.productId === productId);
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    updateCart(updatedCart);
    setMessage(`Removed ${item.product?.name || 'item'} from cart.`);
  };

  const handleClearCart = () => {
    setCart([]);
    clearCart();
    setMessage('Cart cleared successfully!');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    // Validate stock availability
    const stockIssues = cartItems.filter((item) => item.quantity > (item.product?.stock || 0));
    if (stockIssues.length > 0) {
      const issueMessages = stockIssues.map(
        (item) => `Only ${item.product.stock} units of ${item.product.name} available.`
      );
      setError(`Cannot proceed to checkout:\n${issueMessages.join('\n')}`);
      return;
    }

    // Navigate to checkout page
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>
      {error && (
        <p className="text-red-600 mb-4 whitespace-pre-line">{error}</p>
      )}
      {message && (
        <p className="text-green-600 mb-4">{message}</p>
      )}
      {cartItems.length === 0 ? (
        <p className="text-gray-600">
          Your cart is empty.{' '}
          <Link to="/products" className="text-blue-600 hover:underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cart Items Section */}
          <div className="flex-1">
            {/* Cart Stats */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
              <p className="text-sm text-gray-600">
                Total Items: <span className="font-bold">{totalItems}</span>
              </p>
              <p className="text-sm text-gray-600">
                Unique Products: <span className="font-bold">{uniqueProducts}</span>
              </p>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => {
                const stock = item.product?.stock || 0;
                const isOutOfStock = stock === 0;

                if (!item.product) {
                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-100 rounded-lg"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Image N/A</span>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-sm font-bold text-gray-800">Product Not Found</h3>
                        <p className="text-xs text-gray-600">Item ID: {item.productId}</p>
                        <p className="text-xs text-red-600">This product is no longer available.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove unavailable product from cart"
                        >
                          <i className="bx bx-trash text-xl"></i>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-100 rounded-lg"
                  >
                    <Link to={`/product/${item.productId}`}>
                      <img
                        src={item.product.image || 'https://via.placeholder.com/64'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/64')}
                      />
                    </Link>
                    <div className="flex-1 text-center sm:text-left">
                      <Link
                        to={`/product/${item.productId}`}
                        className="text-sm font-bold text-gray-800 hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-600">
                        Unit Price: ₦{item.product.price.toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-600">
                        Total: ₦{(item.product.price * item.quantity).toLocaleString('en-NG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-600">
                        Stock:{' '}
                        <span className={isOutOfStock ? 'text-red-600' : 'text-green-600'}>
                          {isOutOfStock ? 'Out of stock' : `${stock} units available`}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={stock}
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 p-1 border border-gray-300 rounded text-center"
                        disabled={isOutOfStock}
                        aria-label={`Quantity of ${item.product.name}`}
                      />
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <i className="bx bx-trash text-xl"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary Section */}
          <div className="w-full md:w-1/3">
            <div className="p-4 bg-gray-50 rounded-lg shadow-sm sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Items ({totalItems})</span>
                  <span>
                    ₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7.5%)</span>
                  <span>₦{tax.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    ₦{shipping.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>Grand Total</span>
                  <span>
                    ₦{totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCheckout}
                  className={`flex-1 px-6 py-2 rounded-lg text-white transition ${
                    cart.length === 0 || cartItems.some((item) => item.quantity > (item.product?.stock || 0))
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={cart.length === 0 || cartItems.some((item) => item.quantity > (item.product?.stock || 0))}
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={handleClearCart}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition ${
                    cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={cart.length === 0}
                  aria-label="Clear cart"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;