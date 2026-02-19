import { useState } from 'react';
import { FiActivity, FiClock, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DUMMY_HISTORY = [
  {
    id: 1,
    created_at: '2026-02-15T10:23:00Z',
    scores: { total: 72.5, ingredients: 68.0 },
    analysis_summary: 'This product has a good nutritional profile with moderate processing. Contains some beneficial ingredients but watch out for sodium levels.',
    ingredients_data: { raw_data: ['Whole Wheat Flour', 'Water', 'Sugar', 'Yeast', 'Salt', 'Vegetable Oil', 'Niacin', 'Iron'] },
    nutrition_data: { calories: 120, protein: 4, total_fat: 2.5, carbohydrates: 22, sugar: 3, sodium: 180, fiber: 2 }
  },
  {
    id: 2,
    created_at: '2026-02-12T14:45:00Z',
    scores: { total: 45.3, ingredients: 40.0 },
    analysis_summary: 'Moderately processed product with higher sugar content. Nutritional value is limited. Consider healthier alternatives.',
    ingredients_data: { raw_data: ['Sugar', 'Enriched Flour', 'Palm Oil', 'Cocoa Powder', 'Salt', 'Soy Lecithin', 'Vanillin'] },
    nutrition_data: { calories: 160, protein: 2, total_fat: 7, carbohydrates: 24, sugar: 12, sodium: 110, fiber: 1 }
  },
  {
    id: 3,
    created_at: '2026-02-10T09:10:00Z',
    scores: { total: 88.0, ingredients: 85.5 },
    analysis_summary: 'Excellent nutritional profile. Minimal processing with wholesome ingredients. High in fiber and protein.',
    ingredients_data: { raw_data: ['Oats', 'Honey', 'Almonds', 'Dried Cranberries', 'Sunflower Seeds', 'Coconut Oil'] },
    nutrition_data: { calories: 200, protein: 6, total_fat: 8, carbohydrates: 28, sugar: 10, sodium: 50, fiber: 4 }
  },
  {
    id: 4,
    created_at: '2026-02-08T17:30:00Z',
    scores: { total: 32.1, ingredients: 28.0 },
    analysis_summary: 'Highly processed product with multiple artificial additives. High in sodium and saturated fats.',
    ingredients_data: { raw_data: ['Water', 'Modified Starch', 'Sodium Phosphate', 'Artificial Flavors', 'Yellow 5', 'Red 40'] },
    nutrition_data: { calories: 250, protein: 3, total_fat: 12, carbohydrates: 32, sugar: 18, sodium: 480, fiber: 0 }
  },
  {
    id: 5,
    created_at: '2026-02-05T12:00:00Z',
    scores: { total: 61.8, ingredients: 60.0 },
    analysis_summary: 'Reasonably healthy product with moderate processing. Good source of vitamins and minerals.',
    ingredients_data: { raw_data: ['Skim Milk', 'Strawberries', 'Sugar', 'Pectin', 'Citric Acid', 'Vitamin D3'] },
    nutrition_data: { calories: 130, protein: 5, total_fat: 0, carbohydrates: 26, sugar: 20, sodium: 75, fiber: 1 }
  }
];

export default function Profile() {
  const { user, logout } = useAuth();
  const [historyData] = useState(DUMMY_HISTORY);
  const navigate = useNavigate();

  const profileData = {
    full_name: user?.full_name || 'Demo User',
    email: user?.email || 'demo@nutridex.com',
    date_joined: user?.date_joined || new Date().toISOString()
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleHistoryClick = (historyItem) => {
    navigate('/history', { state: { historyData: historyItem } });
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5] px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-[#FF4081] to-[#F50057]">
            {/* Profile Info */}
            <div className="px-8 pt-20 pb-24 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl text-[#FF4081] font-bold">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{user?.full_name}</h1>
                  <p className="text-pink-100 mt-1">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Curved bottom */}
            <div className="absolute bottom-0 inset-x-0">
              <svg viewBox="0 0 224 12" fill="white" className="w-full">
                <path d="M0,0 C48.8902582,6.27314026 86.2235915,9.40971039 112,9.40971039 C137.776408,9.40971039 175.109742,6.27314026 224,0 L224,12.0145422 L0,12.0145422 L0,0Z"/>
              </svg>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100">
                <div className="flex items-center space-x-3 text-[#FF4081] mb-4">
                  <FiUser className="w-5 h-5" />
                  <h3 className="font-semibold">Account Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="text-gray-800 font-medium mt-1">{profileData?.full_name || user?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email Address</label>
                    <p className="text-gray-800 font-medium mt-1">{profileData?.email || user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Member Since</label>
                    <p className="text-gray-800 font-medium mt-1">
                      {new Date(profileData?.date_joined || Date.now()).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100">
                <div className="flex items-center space-x-3 text-[#FF4081] mb-4">
                  <FiActivity className="w-5 h-5" />
                  <h3 className="font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {historyData.length === 0 ? (
                    <p className="text-center text-gray-600">No recent activity</p>
                  ) : (
                    historyData.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleHistoryClick(item)}
                        className="w-full p-3 rounded-lg bg-white hover:bg-pink-50 
                          transition-colors border border-pink-100 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-800">
                              Analysis Score: {item.scores.total.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleString()}
                            </div>
                          </div>
                          <FiClock className="text-[#FF4081] w-5 h-5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF4081] to-[#F50057] 
                  text-white font-semibold rounded-xl transition-all duration-300 
                  hover:scale-105 hover:shadow-xl shadow-[#FF4081]/30 transform"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
