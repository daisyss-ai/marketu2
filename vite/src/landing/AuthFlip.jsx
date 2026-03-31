import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';

const AuthFlip = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  const handleFlipToSignup = () => {
    setIsFlipped(true);
  };

  const handleFlipToLogin = () => {
    setIsFlipped(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ perspective: '1200px' }}>
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s',
        }}
      >
        {/* Login Side (Front) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <Login onFlipToSignup={handleFlipToSignup} />
        </div>

        {/* Signup Side (Back) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0"
        >
          <Signup onFlipToLogin={handleFlipToLogin} />
        </div>
      </div>
    </div>
  );
};

export default AuthFlip;
