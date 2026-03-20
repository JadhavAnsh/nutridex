import { useState } from 'react';
import { FiActivity, FiArrowLeft, FiArrowRight, FiCheck, FiHeart, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';

const CONDITIONS = [
  {
    key: 'diabetes',
    label: 'Diabetes',
    icon: '🩸',
    description: "We'll flag high sugar & high GI foods"
  },
  {
    key: 'heart_disease',
    label: 'Heart Disease',
    icon: '❤️',
    description: "We'll warn about saturated fats & cholesterol"
  },
  {
    key: 'hypertension',
    label: 'Hypertension (High BP)',
    icon: '💢',
    description: "We'll highlight high sodium content"
  },
  {
    key: 'celiac',
    label: 'Celiac / Gluten Intolerance',
    icon: '🌾',
    description: "We'll detect gluten-containing ingredients"
  },
  {
    key: 'lactose_intolerance',
    label: 'Lactose Intolerance',
    icon: '🥛',
    description: "We'll flag dairy-based ingredients"
  },
  {
    key: 'obesity',
    label: 'Obesity / Weight Management',
    icon: '⚖️',
    description: "We'll emphasise calorie density & fat content"
  }
];

export default function OnboardingModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    weight: '',
    height: '',
    conditions: []
  });
  const [errors, setErrors] = useState({});

  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const toggleCondition = (key) => {
    setProfile(prev => ({
      ...prev,
      conditions: prev.conditions.includes(key)
        ? prev.conditions.filter(c => c !== key)
        : [...prev.conditions, key]
    }));
  };

  const validateStep1 = () => {
    const e = {};
    const w = parseFloat(profile.weight);
    const h = parseFloat(profile.height);
    if (!profile.weight || isNaN(w) || w < 20 || w > 300) e.weight = 'Enter a valid weight (20–300 kg)';
    if (!profile.height || isNaN(h) || h < 100 || h > 250) e.height = 'Enter a valid height (100–250 cm)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleFinish = async () => {
    const bmiVal = parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2);
    const healthProfile = {
      weight: parseFloat(profile.weight),
      height: parseFloat(profile.height),
      bmi: parseFloat(bmiVal.toFixed(1)),
      conditions: profile.conditions
    };

    try {
      const response = await axiosInstance.post('/update-onboarding/', healthProfile);
      updateProfile(response.data.user);
      localStorage.removeItem('showOnboarding');
      onClose();
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('showOnboarding');
    onClose();
  };

  const bmiPreview = () => {
    const w = parseFloat(profile.weight);
    const h = parseFloat(profile.height);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      let cat = '';
      let color = '';
      if (bmi < 18.5) { cat = 'Underweight'; color = 'text-blue-500'; }
      else if (bmi < 25) { cat = 'Normal weight'; color = 'text-emerald-500'; }
      else if (bmi < 30) { cat = 'Overweight'; color = 'text-yellow-500'; }
      else { cat = 'Obese'; color = 'text-red-500'; }
      return { bmi: bmi.toFixed(1), cat, color };
    }
    return null;
  };

  const bmi = bmiPreview();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Top gradient bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#FF4081] to-[#F50057]" />

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-gradient-to-r from-[#FF4081] to-[#F50057]'
                  : s < step
                  ? 'w-3 bg-[#FF4081]/60'
                  : 'w-3 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="px-8 pb-8 pt-4">
          {/* ── STEP 1: Body Stats ── */}
          {step === 1 && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-50 mb-3">
                  <FiUser className="w-7 h-7 text-[#FF4081]" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">
                  Welcome, {firstName}! 👋
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Help us personalise your nutrition insights
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Weight (kg)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={profile.weight}
                        onChange={e => setProfile(p => ({ ...p, weight: e.target.value }))}
                        placeholder="e.g. 70"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.weight ? 'border-red-400' : 'border-pink-200'
                        } focus:outline-none focus:ring-2 focus:ring-[#FF4081] transition-all`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                    </div>
                    {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Height (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={profile.height}
                        onChange={e => setProfile(p => ({ ...p, height: e.target.value }))}
                        placeholder="e.g. 170"
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.height ? 'border-red-400' : 'border-pink-200'
                        } focus:outline-none focus:ring-2 focus:ring-[#FF4081] transition-all`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                    </div>
                    {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                  </div>
                </div>

                {/* Live BMI Preview */}
                {bmi && (
                  <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                    <FiActivity className="w-5 h-5 text-[#FF4081] flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-500">Your BMI: </span>
                      <span className="font-bold text-gray-800">{bmi.bmi}</span>
                      <span className={`ml-2 text-sm font-semibold ${bmi.color}`}>({bmi.cat})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Health Conditions ── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pink-50 mb-3">
                  <FiHeart className="w-7 h-7 text-[#FF4081]" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">
                  Any health conditions?
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Select all that apply — we'll tailor warnings just for you
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {CONDITIONS.map(cond => {
                  const selected = profile.conditions.includes(cond.key);
                  return (
                    <button
                      key={cond.key}
                      type="button"
                      onClick={() => toggleCondition(cond.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                        selected
                          ? 'border-[#FF4081] bg-pink-50 shadow-sm shadow-pink-100'
                          : 'border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/40'
                      }`}
                    >
                      <span className="text-2xl leading-none">{cond.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${selected ? 'text-[#FF4081]' : 'text-gray-800'}`}>
                          {cond.label}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{cond.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selected ? 'bg-[#FF4081] border-[#FF4081]' : 'border-gray-300'
                      }`}>
                        {selected && <FiCheck className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {profile.conditions.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  No conditions? That's great — select "None apply" by leaving empty
                </p>
              )}
            </div>
          )}

          {/* ── Buttons ── */}
          <div className="flex items-center justify-between mt-7 gap-3">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-pink-200 text-[#FF4081] font-semibold text-sm hover:bg-pink-50 transition-all"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-2"
              >
                Skip for now
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-7 py-2.5 rounded-full bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold text-sm hover:scale-105 hover:shadow-lg shadow-[#FF4081]/30 transition-all"
              >
                Next
                <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-7 py-2.5 rounded-full bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold text-sm hover:scale-105 hover:shadow-lg shadow-[#FF4081]/30 transition-all"
              >
                <FiCheck className="w-4 h-4" />
                All Done!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
