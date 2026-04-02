import { ClipboardList, Flame, Beef } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const LOGGER_STORAGE_KEY = 'dietLoggerEntries';
const PLANNER_STORAGE_KEY = 'dietPlannerProfile';

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

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
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

export default function DietLogger() {
  const [mealLog, setMealLog] = useState({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: ''
  });
  const [logReady, setLogReady] = useState(false);
  const [goal, setGoal] = useState('maintenance');

  useEffect(() => {
    const storedLog = readJson(LOGGER_STORAGE_KEY);
    const storedPlanner = readJson(PLANNER_STORAGE_KEY);

    if (storedLog) {
      setMealLog((current) => ({ ...current, ...storedLog }));
    }

    if (storedPlanner?.goal) {
      setGoal(storedPlanner.goal);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOGGER_STORAGE_KEY, JSON.stringify(mealLog));
  }, [mealLog]);

  const nutritionTargets = useMemo(() => getGoalTargets(goal), [goal]);
  const actualNutrition = useMemo(() => sumNutrition(mealLog), [mealLog]);
  const dietFeedback = useMemo(() => buildDietFeedback(actualNutrition, nutritionTargets), [actualNutrition, nutritionTargets]);
  const matchedMealCount = useMemo(() => Object.values(mealLog).filter((value) => value.trim()).length, [mealLog]);

  const handleAnalyze = () => {
    setLogReady(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5] pt-32 pb-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text mb-4 tracking-tight">
            Diet Logger
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Log what you ate today and estimate calories, protein, carbs, and fat against your current diet goal.
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl shadow-2xl border border-pink-100 p-8">
            <div className="flex items-center gap-3 mb-4">
              <ClipboardList className="w-6 h-6 text-[#FF4081]" />
              <h2 className="text-2xl font-bold text-gray-900">Today&apos;s meals</h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              If you already created a diet plan, this logger will use that saved goal as the comparison target.
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
                onClick={handleAnalyze}
                className="flex items-center gap-2 bg-gradient-to-r from-[#FF4081] to-[#F50057] text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-[#FF4081]/30"
              >
                <ClipboardList className="w-5 h-5" />
                Analyze Logged Meals
              </button>
              <span className="text-sm text-gray-500">
                Logged meals: {matchedMealCount}/4
              </span>
            </div>
          </section>

          {logReady && (
            <>
              <section className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
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
              </section>

              <section className="bg-white rounded-3xl shadow-xl border border-pink-100 p-6">
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
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
