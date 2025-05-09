import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userData, setUserData] = useState(null);
  const [orderCount, setOrderCount] = useState(0);

  const mockWishlistCount = 3;
  const mockWalletBalance = 100.50;
  const mockLoyaltyPoints = 250;
  const ORDER_HISTORY_KEY = 'orderHistory_1';

  const getOrderCount = () => {
    try {
      const storedOrders = localStorage.getItem(ORDER_HISTORY_KEY);
      return storedOrders ? JSON.parse(storedOrders).length : 0;
    } catch (err) {
      console.error('Error getting order count:', err);
      return 0;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setLoading(true);
      if (!user) {
        setError('Please sign in to view your profile.');
        setIsAuthError(true);
        setLoading(false);
        return;
      }

      const storedUserData = localStorage.getItem('userData');
      let additionalData = {};
      if (storedUserData) {
        try {
          additionalData = JSON.parse(storedUserData);
          if (typeof additionalData.name !== 'string' || additionalData.name.includes('{')) {
            console.warn('Corrupted name field:', additionalData.name);
            additionalData.name = 'Emmanuel Chinecherem';
          }
          if (typeof additionalData.username !== 'string') {
            additionalData.username = 'emmaChi';
          }
        } catch (err) {
          console.error('Error parsing userData:', err);
          additionalData = {};
        }
      }

      setUserData({
        email: user.email || 'test@example.com',
        username: additionalData.username || user.displayName || 'emmaChi',
        name: additionalData.name || user.displayName || 'Emmanuel Chinecherem',
        profileImage: additionalData.profileImage || null,
        createdAt: additionalData.createdAt || '2025-05-04T23:28:48.857Z',
        address: additionalData.address || 'Not provided',
        country: additionalData.country || 'Nigeria',
        phone: additionalData.phone || '+234-8052975966',
        uid: user.uid,
      });

      setOrderCount(getOrderCount());
      setLoading(false);
    });

    const handleOrderPlaced = () => setOrderCount(getOrderCount());
    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => {
      unsubscribe();
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.');
      return;
    }

    setProfileImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setUploadError('');
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;

    try {
      setUploading(true);
      setUploadError('');

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) clearInterval(interval);
      }, 200);

      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result;
        setUserData((prev) => {
          const updatedData = { ...prev, profileImage: base64Image };
          localStorage.setItem('userData', JSON.stringify(updatedData));
          return updatedData;
        });
        setProfileImage(null);
        setImagePreview(null);
        setUploadProgress(0);
        setUploading(false);
      };
      reader.readAsDataURL(profileImage);
    } catch (err) {
      console.error('Image upload error:', err);
      setUploadError('Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not available';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        ) : (
          <button
            onClick={() => setError('')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar userData={userData} orderCount={orderCount} wishlistCount={mockWishlistCount} />
        <div className="md:w-3/4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link to="/orders" className="rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition">
              <p className="text-gray-400">Orders</p>
              <p className="text-lg font-semibold text-gray-800">{orderCount}</p>
            </Link>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Wish List</p>
              <p className="text-lg font-semibold text-gray-800">{mockWishlistCount}</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Wallet</p>
              <p className="text-lg font-semibold text-gray-800">₦{mockWalletBalance.toFixed(2)}</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Loyalty Points</p>
              <p className="text-lg font-semibold text-gray-800">{mockLoyaltyPoints} <i className="bx bx-star text-yellow-500"></i></p>
            </div>
          </div>
          <div className="rounded-lg p-6 mb-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : userData.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <i className="bx bx-user text-gray-500 text-4xl"></i>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer text-blue-600 hover:underline flex items-center">
                  <i className="bx bx-upload mr-1"></i> Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className={`px-4 py-2 rounded-lg bg-blue-500 text-white flex items-center ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                    >
                      <i className="bx bx-cloud-upload mr-1"></i> {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setProfileImage(null);
                        setUploadError('');
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 flex items-center"
                    >
                      <i className="bx bx-x mr-1"></i> Cancel
                    </button>
                  </div>
                )}
                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                {uploadError && (
                  <p className="text-red-600 text-sm mt-2">{uploadError}</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <Link
                to="/edit"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
              >
                <i className="bx bx-edit mr-1"></i> Edit Profile
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400">Username</p>
                <p className="font-semibold text-gray-800">{userData.username}</p>
              </div>
              <div>
                <p className="text-slate-400">First Name</p>
                <p className="font-semibold text-gray-800">{userData.name.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-slate-400">Last Name</p>
                <p className="font-semibold text-gray-800">{userData.name.split(' ').slice(1).join(' ') || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-semibold flex items-center text-gray-800">
                  {userData.email}
                  <i className="bx bx-check-circle ml-2 text-green-500"></i>
                </p>
              </div>
              <div>
                <p className="text-slate-400">Country</p>
                <p className="font-semibold text-gray-800">{userData.country}</p>
              </div>
              <div>
                <p className="text-slate-400">Phone</p>
                <p className="font-semibold text-gray-800">{userData.phone}</p>
              </div>
              <div>
                <p className="text-slate-400">Date Joined</p>
                <p className="font-semibold text-gray-800">{formatDate(userData.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Address</p>
                <p className="font-semibold text-gray-800">{userData.address}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">My Addresses</h3>
              <Link
                to="/profile/add-address"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
              >
                <i className="bx bx-map mr-1"></i> Add Address
              </Link>
            </div>
            <div className="text-center">
              <div className="inline-block p-4 rounded-full mb-2 bg-gray-100">
                <i className="bx bx-map text-2xl"></i>
              </div>
              <p className="text-gray-400">No address found!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}