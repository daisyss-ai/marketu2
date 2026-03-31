import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthSlide = () => {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="relative w-full max-w-3xl h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full transition-transform duration-500"
          style={{
            transform: showSignup ? 'translateX(-100%)' : 'translateX(0%)',
            display: 'flex',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <Login onSlideToSignup={() => setShowSignup(true)} />
          </div>
          <div className="w-full h-full flex items-center justify-center">
            <Signup onSlideToLogin={() => setShowSignup(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSlide;
