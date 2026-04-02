import { SignUp } from '@clerk/react';
import signupImg from '../assests/signup.jpg';

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        <div className="hidden lg:block w-5/12 relative">
          <div className="absolute inset-0 pointer-events-none">
            <svg
              className="absolute w-full h-full opacity-40"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 500 800"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="pink-gradient-signup" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FF4081', stopOpacity: 0.7 }} />
                  <stop offset="100%" style={{ stopColor: '#F50057', stopOpacity: 0.7 }} />
                </linearGradient>
              </defs>
              <path d="M0,0 L500,0 L500,800 L250,600 L0,800 Z" fill="url(#pink-gradient-signup)" />
            </svg>
          </div>

          <img src={signupImg} alt="Food Scanning" className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <div className="bg-black/50 p-6 rounded-2xl">
              <h2 className="text-3xl font-bold mb-4 text-white">Join Nutridex Today</h2>
              <p className="text-lg text-white/90">Create your account to unlock personalized analysis</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-7/12 p-10">
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text mb-8 text-center">
              Nutridex
            </h1>

            <div className="w-full flex justify-center">
              <SignUp/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
