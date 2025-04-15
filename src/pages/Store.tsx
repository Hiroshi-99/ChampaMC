import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { OrderModal } from '../components/OrderModal';

function Store() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Single banner GIF instead of multiple slide images
  const bannerGif = "/images/banner.gif";

  return (
    <div className="min-h-screen relative">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          style={{
            filter: 'brightness(0.4)'
          }}
        >
          <source src="/videos/background.mp4" type="video/mp4" />
          {/* Fallback to gradient background if video doesn't load */}
          <div 
            className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-gray-800"
          />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 sm:p-6 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <img 
              src="https://i.imgur.com/dIODmz4.jpeg" 
              alt="Champa Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-emerald-500"
            />
            <h1 className="text-white text-xl sm:text-2xl font-bold tracking-wider">CHAMPA STORE</h1>
          </div>
        </header>

        {/* Banner - Single GIF */}
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 mt-3 sm:mt-4 mb-4 sm:mb-8">
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl">
            {/* Single Banner GIF */}
            <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px]">
              <img 
                src={bannerGif}
                alt="Champa Store Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-3 sm:px-4 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl text-white font-bold text-center mb-2 sm:mb-4">Champa Economy</h2>
            <p className="text-gray-300 text-center mb-6 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              Experience the power of our premium ranks with exclusive features and benefits
            </p>
            
            {/* Features Card */}
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg sm:shadow-xl border border-gray-700 max-w-3xl mx-auto">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Premium Features</h3>
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                  <Check className="text-emerald-400 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Role Discord Access</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Exclusive access to VIP room</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                  <Check className="text-emerald-400 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Special Commands</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Access to special commands and abilities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                  <Check className="text-emerald-400 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Priority Support</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Get priority access to support services</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-gray-700/30 rounded-lg">
                  <Check className="text-emerald-400 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Custom Perks</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Unique perks based on your rank level</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOrderModalOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg py-2.5 sm:py-3 px-4 sm:px-6 flex items-center justify-center gap-2 transition duration-300 transform hover:scale-[1.02] text-sm sm:text-base font-medium"
              >
                <ShoppingCart size={16} className="sm:hidden" />
                <ShoppingCart size={18} className="hidden sm:block" />
                Purchase Now
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 sm:p-6 text-center text-white/80 text-xs sm:text-sm border-t border-white/10 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div>
              Copyright © 2024-2025 ChampaMCxDL. All Rights Reserved.
            </div>
            <div className="flex gap-4 sm:gap-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
      
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </div>
  );
}

export default Store;