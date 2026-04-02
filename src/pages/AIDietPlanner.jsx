import { Sparkles, Salad, Utensils, HeartPulse, Target, ClipboardList, Flame, Beef } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'dietPlannerProfile';
const LOGGER_STORAGE_KEY = 'dietLoggerEntries';
const PLANNER_STATE_KEY = 'dietPlannerState';

const MEAL_OPTIONS = [
  { value: 'roti-sabji', label: 'Roti Sabji' },
  { value: 'daal-rice', label: 'Daal Rice' },
  { value: 'south-indian', label: 'South Indian' },
  { value: 'high-protein', label: 'High Protein' },
  { value: 'mixed', label: 'Mixed / Other' }
];

const GOAL_OPTIONS = [
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'muscle-gain', label: 'Muscle Gain' }
];

const CONDITION_LABELS = {
  diabetes: 'Diabetes',
  heart_disease: 'Heart Disease',
  hypertension: 'Hypertension',
  celiac: 'Celiac / Gluten Intolerance',
  lactose_intolerance: 'Lactose Intolerance',
  obesity: 'Obesity / Weight Management'
};

const MEAL_LOG_FIELDS = [
  { key: 'breakfast', label: 'Breakfast', placeholder: 'Example: 2 idli, sambar, 1 glass milk' },
  { key: 'lunch', label: 'Lunch', placeholder: 'Example: 2 roti, dal, aloo gobi, salad' },
  { key: 'snacks', label: 'Snacks', placeholder: 'Example: banana, roasted chana, tea' },
  { key: 'dinner', label: 'Dinner', placeholder: 'Example: rice, rajma, curd' }
];

const FOOD_LIBRARY = [
  { keywords: ['roti', 'chapati', 'phulka'], calories: 110, protein: 3, carbs: 22, fat: 1 },
  { keywords: ['rice'], calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
  { keywords: ['dal', 'daal'], calories: 140, protein: 8, carbs: 18, fat: 3 },
  { keywords: ['sabji', 'vegetable curry', 'veg curry'], calories: 120, protein: 3, carbs: 12, fat: 6 },
  { keywords: ['paneer'], calories: 265, protein: 18, carbs: 6, fat: 20 },
  { keywords: ['tofu'], calories: 145, protein: 15, carbs: 4, fat: 8 },
  { keywords: ['curd', 'yogurt', 'dahi'], calories: 98, protein: 5, carbs: 7, fat: 4 },
  { keywords: ['milk'], calories: 120, protein: 6, carbs: 10, fat: 5 },
  { keywords: ['egg'], calories: 78, protein: 6, carbs: 1, fat: 5 },
  { keywords: ['poha'], calories: 250, protein: 6, carbs: 45, fat: 5 },
  { keywords: ['upma'], calories: 220, protein: 5, carbs: 38, fat: 6 },
  { keywords: ['idli'], calories: 58, protein: 2, carbs: 12, fat: 0.4 },
  { keywords: ['dosa'], calories: 168, protein: 4, carbs: 30, fat: 4 },
  { keywords: ['sambar'], calories: 90, protein: 4, carbs: 12, fat: 3 },
  { keywords: ['chilla', 'cheela'], calories: 180, protein: 9, carbs: 20, fat: 7 },
  { keywords: ['banana'], calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { keywords: ['apple'], calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { keywords: ['chana'], calories: 120, protein: 6, carbs: 18, fat: 2 },
  { keywords: ['sprouts'], calories: 110, protein: 8, carbs: 16, fat: 1 },
  { keywords: ['rajma'], calories: 150, protein: 9, carbs: 27, fat: 1 },
  { keywords: ['oats'], calories: 150, protein: 5, carbs: 27, fat: 3 },
  { keywords: ['nuts', 'almonds', 'peanuts'], calories: 170, protein: 6, carbs: 6, fat: 15 }
];

const readStoredProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const readStoredMealLog = () => {
  try {
    return JSON.parse(localStorage.getItem(LOGGER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const readStoredPlannerState = () => {
  try {
    return JSON.parse(localStorage.getItem(PLANNER_STATE_KEY) || 'null');
  } catch {
    return null;
  }
};

const getGoalTargets = (goal) => {
  if (goal === 'weight-loss') {
    return { calories: 1600, protein: 90, carbs: 170, fat: 50 };
  }
  if (goal === 'muscle-gain') {
    return { calories: 2400, protein: 130, carbs: 280, fat: 70 };
  }
  return { calories: 2000, protein: 100, carbs: 220, fat: 60 };
};

const estimateMealEntry = (entry) => {
  const normalized = (entry || '').toLowerCase();
  const matches = FOOD_LIBRARY.filter((food) => food.keywords.some((keyword) => normalized.includes(keyword)));

  return matches.reduce((totals, food) => ({
    calories: totals.calories + food.calories,
    protein: totals.protein + food.protein,
    carbs: totals.carbs + food.carbs,
    fat: totals.fat + food.fat
  }), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
};

const sumNutrition = (entries) => Object.values(entries).reduce((totals, entry) => {
  const mealTotals = estimateMealEntry(entry);
  return {
    calories: totals.calories + mealTotals.calories,
    protein: totals.protein + mealTotals.protein,
    carbs: totals.carbs + mealTotals.carbs,
    fat: totals.fat + mealTotals.fat
  };
}, {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
});

const buildDietFeedback = (actual, targets) => {
  const feedback = [];

  if (actual.calories < targets.calories * 0.8) feedback.push('Calories look lower than the current target.');
  else if (actual.calories > targets.calories * 1.1) feedback.push('Calories are above the current target range.');
  else feedback.push('Calories are close to the target range.');

  if (actual.protein < targets.protein * 0.8) feedback.push('Protein is low. Add paneer, tofu, dal, curd, eggs, or sprouts.');
  else feedback.push('Protein intake looks reasonable for the selected goal.');

  if (actual.carbs > targets.carbs * 1.15) feedback.push('Carbs are trending high, so reduce one starch portion or add more vegetables.');
  if (actual.fat > targets.fat * 1.15) feedback.push('Fat may be high, so watch fried foods and heavy gravies.');

  return feedback;
};

const getMealSuggestions = (preference) => {
  switch (preference) {
    case 'roti-sabji':
      return {
        breakfast: 'Vegetable poha with curd or besan chilla with mint chutney',
        lunch: '2 rotis, seasonal sabji, dal, cucumber salad',
        snack: 'Roasted chana or fruit with buttermilk',
        dinner: '2 rotis, paneer or soy sabji, light salad'
      };
    case 'daal-rice':
      return {
        breakfast: 'Idli with sambar or oats upma',
        lunch: '1 bowl rice, dal, sabji, salad, curd',
        snack: 'Sprouts chaat or coconut water with peanuts',
        dinner: 'Smaller rice portion with dal, sauteed vegetables, soup'
      };
    case 'south-indian':
      return {
        breakfast: 'Idli or dosa with sambar and chutney',
        lunch: 'Rice, sambar, poriyal, curd, kosambari salad',
        snack: 'Sundal or fruit bowl',
        dinner: 'Vegetable uttapam or millet dosa with soup'
      };
    case 'high-protein':
      return {
        breakfast: 'Paneer bhurji or moong chilla with yogurt',
        lunch: 'Roti, dal, paneer or tofu, salad',
        snack: 'Greek yogurt or protein-rich sprouts bowl',
        dinner: 'Grilled tofu or paneer with stir-fried vegetables'
      };
    default:
      return {
        breakfast: 'Any balanced breakfast with protein plus fiber',
        lunch: 'One staple, one protein source, one sabji, one salad',
        snack: 'Fruit, nuts, seeds, or roasted snacks',
        dinner: 'Lighter balanced dinner with vegetables and protein'
      };
  }
};

const getGoalGuidance = (goal) => {
  if (goal === 'weight-loss') {
    return 'Focus on controlled portions, high-fiber meals, and protein in every meal.';
  }
  if (goal === 'muscle-gain') {
    return 'Increase protein density, add one recovery snack, and avoid skipping meals.';
  }
  return 'Use a balanced plate method and keep meal timing consistent.';
};

const getConditionGuidance = (conditions) => {
  const guidance = [];
  if (conditions.includes('diabetes')) guidance.push('Prefer low sugar meals and pair carbs with protein or fiber.');
  if (conditions.includes('hypertension')) guidance.push('Keep sodium lower by limiting packaged sauces and papads.');
  if (conditions.includes('heart_disease')) guidance.push('Choose less fried food and keep saturated fat moderate.');
  if (conditions.includes('celiac')) guidance.push('Avoid wheat-based roti and choose rice, millet, or gluten-free options.');
  if (conditions.includes('lactose_intolerance')) guidance.push('Use lactose-free curd, tofu, or plant-based alternatives.');
  if (conditions.includes('obesity')) guidance.push('Build meals around vegetables and protein before adding starch.');
  return guidance;
};

const buildDietPlan = (profile) => {
  const meals = getMealSuggestions(profile.mealPreference);
  return {
    summary: `This plan is tailored around your ${profile.goal.replace('-', ' ')} goal and ${MEAL_OPTIONS.find((item) => item.value === profile.mealPreference)?.label || 'preferred meals'}.`,
    calories:
      profile.goal === 'weight-loss' ? 'Aim for a mild calorie deficit with satisfying high-volume meals.' :
      profile.goal === 'muscle-gain' ? 'Aim for a slight calorie surplus with more protein-rich snacks.' :
      'Aim for steady, balanced intake across the day.',
    meals,
    guidance: [
      getGoalGuidance(profile.goal),
      ...getConditionGuidance(profile.conditions)
    ]
  };
};

export default function AIDietPlanner() {
  const { isAuthenticated, user } = useAuth();
  const planRef = useRef(null);
  const [profile, setProfile] = useState({
    weight: '',
    height: '',
    conditions: [],
    goal: 'maintenance',
    mealPreference: 'roti-sabji',
    dislikes: '',
    notes: ''
  });
  const [planReady, setPlanReady] = useState(false);
  const [mealLog, setMealLog] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: ''
  });
  const [logReady, setLogReady] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    const storedPlannerState = readStoredPlannerState();
    const source = isAuthenticated && user
      ? {
          weight: user.weight || '',
          height: user.height || '',
          conditions: Array.isArray(user.conditions) ? user.conditions : []
        }
      : {
          weight: stored?.weight || '',
          height: stored?.height || '',
          conditions: Array.isArray(stored?.conditions) ? stored.conditions : []
        };

    setProfile((current) => ({
      ...current,
      ...(stored || {}),
      ...source
    }));

    setPlanReady(Boolean(storedPlannerState?.planReady));
    setLogReady(Boolean(storedPlannerState?.logReady));

    const storedLog = readStoredMealLog();
    if (storedLog) {
      setMealLog((current) => ({
        ...current,
        ...storedLog
      }));
    }
  }, [isAuthenticated, user]);

  const bmi = useMemo(() => {
    const weight = parseFloat(profile.weight);
    const height = parseFloat(profile.height);
    if (!weight || !height) {
      return null;
    }
    return (weight / ((height / 100) ** 2)).toFixed(1);
  }, [profile.height, profile.weight]);

  const plan = useMemo(() => buildDietPlan(profile), [profile]);
  const nutritionTargets = useMemo(() => getGoalTargets(profile.goal), [profile.goal]);
  const actualNutrition = useMemo(() => sumNutrition(mealLog), [mealLog]);
  const dietFeedback = useMemo(() => buildDietFeedback(actualNutrition, nutritionTargets), [actualNutrition, nutritionTargets]);
  const matchedMealCount = useMemo(() => {
    return Object.values(mealLog).filter((value) => value.trim()).length;
  }, [mealLog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(LOGGER_STORAGE_KEY, JSON.stringify(mealLog));
  }, [mealLog]);

  useEffect(() => {
    localStorage.setItem(PLANNER_STATE_KEY, JSON.stringify({ planReady, logReady }));
  }, [planReady, logReady]);

  const toggleCondition = (condition) => {
    setProfile((current) => ({
      ...current,
      conditions: current.conditions.includes(condition)
        ? current.conditions.filter((item) => item !== condition)
        : [...current.conditions, condition]
    }));
  };

  const handleGenerate = () => {
    setPlanReady(true);
    requestAnimationFrame(() => {
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleLogAnalyze = () => {
    setLogReady(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5] pt-32 pb-16">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text mb-4 tracking-tight">
            AI Diet Planner
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use your onboarding details and food preferences to generate a simple diet plan around meals you actually like.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            {isAuthenticated ? 'Your saved onboarding data is prefilled below.' : 'Guest mode is enabled. Your inputs are kept locally in this browser.'}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#FF4081]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tell us how you eat</h2>
                <p className="text-sm text-gray-500">We combine profile basics with your preferred meals.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(event) => setProfile((current) => ({ ...current, weight: event.target.value }))}
                  className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(event) => setProfile((current) => ({ ...current, height: event.target.value }))}
                  className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                  placeholder="170"
                />
              </div>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Primary goal</label>
                <select
                  value={profile.goal}
                  onChange={(event) => setProfile((current) => ({ ...current, goal: event.target.value }))}
                  className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                >
                  {GOAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred food style</label>
                <select
                  value={profile.mealPreference}
                  onChange={(event) => setProfile((current) => ({ ...current, mealPreference: event.target.value }))}
                  className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                >
                  {MEAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Health conditions</label>
              <div className="flex flex-wrap gap-3">
                {Object.entries(CONDITION_LABELS).map(([key, label]) => {
                  const selected = profile.conditions.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCondition(key)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? 'border-[#FF4081] bg-pink-50 text-[#F50057]'
                          : 'border-pink-100 text-gray-600 hover:bg-pink-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foods you dislike or avoid</label>
              <input
                type="text"
                value={profile.dislikes}
                onChange={(event) => setProfile((current) => ({ ...current, dislikes: event.target.value }))}
                className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                placeholder="Example: brinjal, mushrooms, spicy food"
              />
            </div>

            <div className="mt-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Extra notes</label>
              <textarea
                value={profile.notes}
                onChange={(event) => setProfile((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                placeholder="Example: office lunch, gym in evening, prefer vegetarian meals"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold py-3.5 px-7 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#FF4081]/30"
              >
                <Sparkles className="w-5 h-5" />
                Generate Diet Plan
              </button>
              {bmi && (
                <span className="inline-flex items-center rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-[#F50057]">
                  BMI {bmi}
                </span>
              )}
            </div>
          </section>

          <aside ref={planRef} className="space-y-6">
            {!planReady ? (
              <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#FF4081]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Your diet plan will appear here</h3>
                <p className="mt-3 text-gray-600">
                  Fill in your details and click <span className="font-semibold text-[#F50057]">Generate Diet Plan</span>.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-[#FF4081]" />
                    <h3 className="text-xl font-bold text-gray-900">Planner summary</h3>
                  </div>
                  <p className="text-gray-600">{plan.summary}</p>
                  <p className="mt-4 text-sm text-gray-500">{plan.calories}</p>
                  {profile.dislikes && (
                    <p className="mt-4 text-sm text-gray-600">
                      We will avoid or reduce: <span className="font-semibold">{profile.dislikes}</span>
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <HeartPulse className="w-6 h-6 text-[#FF4081]" />
                    <h3 className="text-xl font-bold text-gray-900">Smart guidance</h3>
                  </div>
                  <div className="space-y-3">
                    {plan.guidance.map((item) => (
                      <div key={item} className="rounded-2xl bg-pink-50 px-4 py-3 text-sm text-gray-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Salad className="w-6 h-6 text-[#FF4081]" />
                    <h3 className="text-xl font-bold text-gray-900">Suggested meal flow</h3>
                  </div>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900">Breakfast</p>
                      <p>{plan.meals.breakfast}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Lunch</p>
                      <p>{plan.meals.lunch}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Snack</p>
                      <p>{plan.meals.snack}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Dinner</p>
                      <p>{plan.meals.dinner}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#FF4081] to-[#F50057] rounded-3xl shadow-xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Utensils className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Your plan is ready</h3>
                  </div>
                  <p className="text-sm text-pink-50">
                    Use this as a daily starting point, then refine portions based on hunger, activity, and your doctor or dietitian advice.
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ClipboardList className="w-6 h-6 text-[#FF4081]" />
                    <h3 className="text-xl font-bold text-gray-900">Diet logger</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-5">
                    Log what you had for breakfast, lunch, snacks, and dinner. We will estimate nutrition and compare it with your current plan.
                  </p>

                  <div className="space-y-4">
                    {MEAL_LOG_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                        <textarea
                          rows={2}
                          value={mealLog[field.key]}
                          onChange={(event) => setMealLog((current) => ({ ...current, [field.key]: event.target.value }))}
                          className="w-full rounded-xl border border-pink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF4081]"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleLogAnalyze}
                      className="flex items-center gap-2 bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#FF4081]/30"
                    >
                      <ClipboardList className="w-5 h-5" />
                      Analyze Logged Meals
                    </button>
                    <span className="text-sm text-gray-500">
                      Logged meals: {matchedMealCount}/4
                    </span>
                  </div>
                </div>

                {logReady && (
                  <>
                    <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Flame className="w-6 h-6 text-[#FF4081]" />
                        <h3 className="text-xl font-bold text-gray-900">Estimated intake</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-2xl bg-pink-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Calories</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(actualNutrition.calories)}</p>
                          <p className="text-xs text-gray-500">Target {nutritionTargets.calories}</p>
                        </div>
                        <div className="rounded-2xl bg-pink-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Protein</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(actualNutrition.protein)}g</p>
                          <p className="text-xs text-gray-500">Target {nutritionTargets.protein}g</p>
                        </div>
                        <div className="rounded-2xl bg-pink-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Carbs</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(actualNutrition.carbs)}g</p>
                          <p className="text-xs text-gray-500">Target {nutritionTargets.carbs}g</p>
                        </div>
                        <div className="rounded-2xl bg-pink-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Fat</p>
                          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(actualNutrition.fat)}g</p>
                          <p className="text-xs text-gray-500">Target {nutritionTargets.fat}g</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Beef className="w-6 h-6 text-[#FF4081]" />
                        <h3 className="text-xl font-bold text-gray-900">Plan match feedback</h3>
                      </div>
                      <div className="space-y-3">
                        {dietFeedback.map((item) => (
                          <div key={item} className="rounded-2xl bg-pink-50 px-4 py-3 text-sm text-gray-700">
                            {item}
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
                        These numbers are estimates based on common foods mentioned in your meal log, not a medical-grade nutrition calculation.
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
