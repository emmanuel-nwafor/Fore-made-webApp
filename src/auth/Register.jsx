import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Check your network connection and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please log in instead.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Google sign-in popup was closed. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

// Generate username from full name (e.g., "Emmanuel Chinecherem" -> "emmaChi")
const generateUsername = (fullName) => {
  const nameParts = fullName.trim().split(' ').filter(part => part);
  const firstName = nameParts[0] || '';
  const lastName = nameParts[1] || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let usernameBase;
  if (firstName) {
    usernameBase = (firstName.slice(0, 4) + lastName.slice(0, 3)).toLowerCase();
  } else {
    usernameBase = 'user';
  }
  const username = (usernameBase + randomNum).replace(/[^a-z0-9]/g, '');
  return username;
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNavigation = () => {
    navigate('/login', { replace: true });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    let hasError = false;
    if (!name.trim()) {
      setNameError('Full name is required.');
      hasError = true;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      hasError = true;
    }

    if (hasError) {
      setLoadingEmail(false);
      return;
    }

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const username = generateUsername(name);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);

      const userData = {
        email: email,
        name: name,
        username: username,
        address: '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
      };
      localStorage.setItem('userData', JSON.stringify(userData));

      const firstName = name.split(' ')[0];
      setSuccessMessage(
        `Welcome, ${firstName}! Registration successful! A verification email has been sent to ${email}. Please verify your email before logging in. Check your inbox or spam folder.`
      );
      setTimeout(() => {
        setLoadingEmail(false);
        handleNavigation();
      }, 7000);
    } catch (err) {
      console.error('Registration error:', err);
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email')) {
        setEmailError(errorMessage);
      } else if (errorMessage.includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setNameError(errorMessage);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingGoogle(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const fullName = user.displayName || user.email.split('@')[0];
      const username = generateUsername(fullName);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);

      const storedUserData = localStorage.getItem('userData');
      let userData;
      if (!storedUserData) {
        userData = {
          email: user.email,
          name: fullName,
          username: username,
          address: '',
          createdAt: new Date().toISOString(),
          uid: user.uid,
        };
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        userData = JSON.parse(storedUserData);
      }

      setSuccessMessage(
        `Welcome, ${fullName}! A verification email has been sent to ${user.email}. Please verify your email before logging in. Check your inbox or spam folder.`
      );
      setTimeout(() => {
        setLoadingGoogle(false);
        handleNavigation();
      }, 7000);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setLoadingGoogle(false);
      setEmailError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8"></div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
          <p className="text-gray-600 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleRegister}>
              <div className="mb-4 relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 peer ${
                    nameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                  required
                />
                <label
                  htmlFor="name"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    name ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  Full Name
                </label>
                {nameError && <p className="text-red-600 text-[10px] mt-1">{nameError}</p>}
              </div>

              <div className="mb-4 relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 peer ${
                    emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                  required
                />
                <label
                  htmlFor="email"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  Email
                </label>
                {emailError && (
                  <p className="text-red-600 text-[10px] mt-1">
                    {emailError}{' '}
                    {emailError.includes('already in use') && (
                      <Link to="/login" className="text-blue-600 hover:underline">
                        Click here to login
                      </Link>
                    )}
                  </p>
                )}
              </div>

              <div className="mb-4 relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 peer ${
                    passwordError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="new-password"
                  required
                />
                <label
                  htmlFor="password"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  Password (6+ Characters)
                </label>
                <span className="absolute right-3 top-3 text-gray-500 cursor-pointer">👁️</span>
                {passwordError && <p className="text-red-600 text-[10px] mt-1">{passwordError}</p>}
              </div>

              {successMessage && <p className="text-green-600 text-[10px] mb-4">{successMessage}</p>}

              <button
                type="submit"
                className="w-full bg-blue-900 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
                disabled={loadingEmail}
              >
                {loadingEmail ? 'Registering...' : 'Sign Up'}
              </button>
            </form>

            <div className="flex flex-col justify-center items-center md:border-l md:pl-6">
              <p className="text-gray-600 mb-4">Or continue with</p>
              <button
                onClick={handleGoogleSignIn}
                className="w-full max-w-xs bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center mb-4 hover:bg-gray-100 transition duration-200"
                disabled={loadingGoogle}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loadingGoogle ? 'Processing...' : 'Google'}
              </button>
              <button
                className="w-full max-w-xs bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                disabled={loadingFacebook}
              >
                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
                {loadingFacebook ? 'Processing...' : 'Facebook'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}