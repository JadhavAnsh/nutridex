import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiClock, FiLogOut, FiSave, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const CONDITIONS = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'heart_disease', label: 'Heart Disease' },
  { key: 'hypertension', label: 'Hypertension' },
  { key: 'celiac', label: 'Celiac / Gluten Intolerance' },
  { key: 'lactose_intolerance', label: 'Lactose Intolerance' },
  { key: 'obesity', label: 'Obesity / Weight Management' },
];

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatHistoryScore = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(1)}%` : 'N/A';
};

export default function Profile() {
  const { user, logout, updateProfile, isAuthenticated, isClerkReady } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    conditions: [],
  });
  const navigate = useNavigate();
  const displayFullName = user?.full_name || profileData?.full_name || 'Your Profile';
  const displayEmail = user?.email || profileData?.email || '';
  const backendJoinedAt = parseDateValue(profileData?.date_joined || user?.date_joined);
  const clerkCreatedAt = parseDateValue(user?.clerk_created_at);
  const memberSinceDate =
    backendJoinedAt && clerkCreatedAt
      ? new Date(Math.min(backendJoinedAt.getTime(), clerkCreatedAt.getTime()))
      : backendJoinedAt || clerkCreatedAt;
  const displayMemberSince = memberSinceDate
    ? memberSinceDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unavailable';

  const bmiPreview = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0) {
      return null;
    }
    const bmi = w / Math.pow(h / 100, 2);
    return bmi.toFixed(1);
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (!isClerkReady || !isAuthenticated || !user) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/profile/');
        setProfileData(response.data);
        setError('');
        setFormData({
          weight: response.data?.weight ?? '',
          height: response.data?.height ?? '',
          conditions: Array.isArray(response.data?.conditions) ? response.data.conditions : [],
        });
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get('/user-history/?limit=5&include_ai=0');
        if (response.data.success) {
          setHistoryData(response.data.history);
        }
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchProfile();
    fetchHistory();
  }, [isAuthenticated, isClerkReady, user]);

  const handleConditionToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(key)
        ? prev.conditions.filter((item) => item !== key)
        : [...prev.conditions, key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        weight: formData.weight === '' ? null : parseFloat(formData.weight),
        height: formData.height === '' ? null : parseFloat(formData.height),
        conditions: formData.conditions,
      };
      const response = await axiosInstance.patch('/profile/health/', payload);
      setProfileData((prev) => ({ ...prev, ...response.data.user }));
      updateProfile(response.data.user);
      localStorage.removeItem('showOnboardingDismissed');
      setSuccess('Profile health data updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update health profile');
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-[#FF4081] to-[#F50057]">
            <div className="px-8 pt-20 pb-24 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center text-4xl text-[#FF4081] font-bold">
                  {displayFullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{displayFullName}</h1>
                  <p className="text-pink-100 mt-1">{displayEmail}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 inset-x-0">
              <svg viewBox="0 0 224 12" fill="white" className="w-full">
                <path d="M0,0 C48.8902582,6.27314026 86.2235915,9.40971039 112,9.40971039 C137.776408,9.40971039 175.109742,6.27314026 224,0 L224,12.0145422 L0,12.0145422 L0,0Z" />
              </svg>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100">
                <div className="flex items-center space-x-3 text-[#FF4081] mb-4">
                  <FiUser className="w-5 h-5" />
                  <h3 className="font-semibold">Account Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="text-gray-800 font-medium mt-1">{displayFullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email Address</label>
                    <p className="text-gray-800 font-medium mt-1">{displayEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Member Since</label>
                    <p className="text-gray-800 font-medium mt-1">{displayMemberSince}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100">
                <div className="flex items-center space-x-3 text-[#FF4081] mb-4">
                  <FiActivity className="w-5 h-5" />
                  <h3 className="font-semibold">Health Preferences</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                    />
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  BMI: <span className="font-semibold text-[#FF4081]">{bmiPreview || profileData?.bmi || 'N/A'}</span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((condition) => {
                      const selected = formData.conditions.includes(condition.key);
                      return (
                        <button
                          key={condition.key}
                          type="button"
                          onClick={() => handleConditionToggle(condition.key)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            selected
                              ? 'bg-pink-100 border-pink-300 text-[#FF4081]'
                              : 'bg-white border-pink-100 text-gray-600 hover:bg-pink-50'
                          }`}
                        >
                          {condition.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold rounded-xl hover:scale-[1.01] transition-transform disabled:opacity-70"
                >
                  <FiSave />
                  {saving ? 'Saving...' : 'Save Health Profile'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border border-pink-100 mt-6">
              <div className="flex items-center space-x-3 text-[#FF4081] mb-4">
                <FiActivity className="w-5 h-5" />
                <h3 className="font-semibold">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {historyLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className="w-full rounded-lg border border-pink-100 bg-white p-3 animate-pulse"
                      >
                        <div className="h-4 w-40 rounded bg-pink-100" />
                        <div className="mt-2 h-3 w-28 rounded bg-pink-50" />
                      </div>
                    ))}
                  </div>
                ) : historyData.length === 0 ? (
                  <p className="text-center text-gray-600">No recent activity</p>
                ) : (
                  historyData.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleHistoryClick(item)}
                      className="w-full p-3 rounded-lg bg-white hover:bg-pink-50 transition-colors border border-pink-100 text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">Analysis Score: {formatHistoryScore(item?.scores?.total)}</div>
                          <div className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                        <FiClock className="text-[#FF4081] w-5 h-5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {(error || success) && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {error || success}
              </div>
            )}

            <div className="flex justify-end mt-8">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#FF4081]/30 transform"
              >
                <FiLogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-center text-[#FF4081]">Loading profile...</div>}
      </div>
    </div>
  );
}
