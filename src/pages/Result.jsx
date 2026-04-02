import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiMinusCircle,
  FiShield,
  FiTag,
  FiUser,
} from 'react-icons/fi';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const NON_VEG_KEYWORDS = [
  'egg',
  'chicken',
  'fish',
  'beef',
  'pork',
  'mutton',
  'lamb',
  'meat',
  'gelatin',
  'gelatine',
  'anchovy',
  'shrimp',
  'prawn',
  'crab',
  'tuna',
  'salmon',
  'seafood',
];

const GLUTEN_KEYWORDS = ['wheat', 'barley', 'rye', 'gluten', 'flour', 'semolina', 'spelt', 'malt'];
const DAIRY_KEYWORDS = ['milk', 'lactose', 'cream', 'butter', 'cheese', 'whey', 'casein', 'yogurt', 'dairy'];
const HIGH_SUGAR_KEYWORDS = ['sugar', 'corn syrup', 'glucose syrup', 'fructose', 'dextrose', 'maltodextrin'];
const HIGH_SODIUM_KEYWORDS = ['salt', 'sodium', 'sodium benzoate', 'sodium bicarbonate', 'msg', 'monosodium glutamate'];
const HIGH_FAT_KEYWORDS = ['palm oil', 'hydrogenated', 'shortening', 'butter', 'cream', 'palm kernel oil'];
const GOOD_INGREDIENT_KEYWORDS = [
  'oats',
  'whole grain',
  'whole wheat',
  'brown rice',
  'quinoa',
  'millet',
  'lentil',
  'chickpea',
  'bean',
  'almond',
  'walnut',
  'cashew',
  'peanut',
  'seed',
  'fruit',
  'vegetable',
  'spinach',
  'olive oil',
];
const GENERALLY_POOR_KEYWORDS = [
  'artificial flavor',
  'artificial colour',
  'artificial color',
  'preservative',
  'hydrogenated',
  'palm oil',
  'palm kernel oil',
  'high fructose corn syrup',
  'corn syrup',
  'added color',
  'caramel color',
];

const scoreToneMap = {
  good: {
    badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    card: 'bg-emerald-50 border-emerald-100',
    icon: 'text-emerald-500',
    text: 'text-emerald-700',
  },
  warning: {
    badge: 'text-red-700 bg-red-50 border-red-200',
    card: 'bg-red-50 border-red-100',
    icon: 'text-red-500',
    text: 'text-red-700',
  },
  neutral: {
    badge: 'text-amber-700 bg-amber-50 border-amber-200',
    card: 'bg-amber-50 border-amber-100',
    icon: 'text-amber-500',
    text: 'text-amber-700',
  },
};

const conditionLabels = {
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  heart_disease: 'Heart disease',
  celiac: 'Gluten sensitivity',
  lactose_intolerance: 'Lactose intolerance',
  obesity: 'Weight management',
};

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getIngredientsList = (analysisData) => {
  if (Array.isArray(analysisData?.ingredients?.raw_data)) {
    return analysisData.ingredients.raw_data;
  }

  if (Array.isArray(analysisData?.ingredients_data?.raw_data)) {
    return analysisData.ingredients_data.raw_data;
  }

  if (Array.isArray(analysisData?.ingredients_data?.ingredients)) {
    return analysisData.ingredients_data.ingredients;
  }

  return [];
};

const getNutritionData = (analysisData) => {
  if (analysisData?.nutrition?.data && typeof analysisData.nutrition.data === 'object') {
    return analysisData.nutrition.data;
  }

  if (analysisData?.nutrition_data && typeof analysisData.nutrition_data === 'object') {
    return analysisData.nutrition_data;
  }

  return {};
};

const formatScore = (score) => {
  if (!Number.isFinite(score)) {
    return 'N/A';
  }
  return score.toFixed(1);
};

const normalizeKey = (key) => key.toLowerCase().replace(/\s+/g, '_');

const getNutritionValue = (nutritionData, keys) => {
  for (const [nutritionKey, value] of Object.entries(nutritionData)) {
    const normalizedNutritionKey = normalizeKey(nutritionKey);
    for (const key of keys) {
      const normalizedKey = normalizeKey(key);
      if (
        normalizedNutritionKey === normalizedKey ||
        normalizedNutritionKey.includes(normalizedKey) ||
        normalizedKey.includes(normalizedNutritionKey)
      ) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
  }

  return 0;
};

const getScoreDetails = (score) => {
  if (score >= 90) {
    return {
      category: 'Excellent Choice',
      description: 'Strong overall nutritional quality with fewer major concerns.',
      color: 'text-emerald-600',
      ringColor: 'text-emerald-500',
    };
  }

  if (score >= 70) {
    return {
      category: 'Good With Minor Cautions',
      description: 'Reasonably balanced, but a few parts may need moderation.',
      color: 'text-lime-600',
      ringColor: 'text-lime-500',
    };
  }

  if (score >= 45) {
    return {
      category: 'Mixed Health Profile',
      description: 'Some useful nutrients, but ingredient quality or processing is a concern.',
      color: 'text-amber-600',
      ringColor: 'text-amber-500',
    };
  }

  return {
    category: 'Poor Fit For Regular Use',
    description: 'Processing, additives, or nutrient balance make this a weak option.',
    color: 'text-red-600',
    ringColor: 'text-red-500',
  };
};

const calculateCircleProgress = (score) => {
  const safeScore = Number.isFinite(score) ? score : 0;
  const normalizedScore = Math.min(Math.max(safeScore, 0), 100);
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (normalizedScore / 100) * circumference;
  return { offset, circumference };
};

const getDietType = (ingredientsList) => {
  if (!ingredientsList.length) {
    return { label: 'Unknown', reason: 'Ingredient list is missing, so diet type could not be verified.' };
  }

  const combined = ingredientsList.join(' ').toLowerCase();
  const found = NON_VEG_KEYWORDS.filter((keyword) => combined.includes(keyword));

  if (found.length > 0) {
    return {
      label: 'Non-Veg',
      reason: `Animal-derived ingredients detected: ${found.slice(0, 3).join(', ')}.`,
    };
  }

  return {
    label: 'Veg',
    reason: 'No obvious meat, fish, egg, or gelatin ingredients were detected.',
  };
};

const cleanSummary = (summary, scoreDetails, verdictText) => {
  if (summary && String(summary).trim()) {
    return String(summary).replace(/\s+/g, ' ').trim();
  }

  return `${scoreDetails.description} ${verdictText}`;
};

const getUserProfileLabel = (profile) => {
  const conditions = Array.isArray(profile?.conditions) ? profile.conditions : [];

  if (conditions.length === 0) {
    return 'general profile';
  }

  return conditions.map((condition) => conditionLabels[condition] || condition).join(', ');
};

const getPersonalInsights = (analysisData, profile) => {
  if (!profile || !Array.isArray(profile.conditions) || profile.conditions.length === 0) {
    return [];
  }

  const nutritionData = getNutritionData(analysisData);
  const ingredients = getIngredientsList(analysisData).join(' ').toLowerCase();
  const insights = [];

  const sugar = getNutritionValue(nutritionData, ['sugar', 'sugars']);
  const sodium = getNutritionValue(nutritionData, ['sodium']);
  const saturatedFat = getNutritionValue(nutritionData, ['saturated_fat', 'saturated fat']);
  const cholesterol = getNutritionValue(nutritionData, ['cholesterol']);
  const calories = getNutritionValue(nutritionData, ['calories']);
  const totalFat = getNutritionValue(nutritionData, ['fats', 'fat', 'total fat']);

  if (profile.conditions.includes('diabetes')) {
    if (sugar > 10) {
      insights.push({
        type: 'warning',
        label: 'Diabetes',
        text: `Sugar is high at ${sugar}g, so this may raise blood glucose faster than ideal.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Diabetes',
        text: `Sugar is ${sugar}g, which is a safer range than many processed snacks.`,
      });
    }
  }

  if (profile.conditions.includes('hypertension')) {
    if (sodium > 400 || ingredients.includes('salt')) {
      insights.push({
        type: 'warning',
        label: 'Blood Pressure',
        text: `Sodium looks elevated (${sodium}mg) or salt-heavy, which is not ideal for hypertension.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Blood Pressure',
        text: `Sodium appears moderate (${sodium}mg), making it more manageable for blood pressure.`,
      });
    }
  }

  if (profile.conditions.includes('heart_disease')) {
    if (saturatedFat > 5 || cholesterol > 60 || HIGH_FAT_KEYWORDS.some((item) => ingredients.includes(item))) {
      insights.push({
        type: 'warning',
        label: 'Heart Health',
        text: `Saturated fat, cholesterol, or heavier fats make this a weak choice for heart health.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Heart Health',
        text: 'This product does not show the stronger heart-health red flags.',
      });
    }
  }

  if (profile.conditions.includes('celiac')) {
    const found = GLUTEN_KEYWORDS.filter((item) => ingredients.includes(item));
    if (found.length) {
      insights.push({
        type: 'warning',
        label: 'Gluten',
        text: `Possible gluten sources detected: ${found.slice(0, 4).join(', ')}.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Gluten',
        text: 'No obvious gluten-containing ingredients were detected.',
      });
    }
  }

  if (profile.conditions.includes('lactose_intolerance')) {
    const found = DAIRY_KEYWORDS.filter((item) => ingredients.includes(item));
    if (found.length) {
      insights.push({
        type: 'warning',
        label: 'Lactose',
        text: `Dairy ingredients detected: ${found.slice(0, 4).join(', ')}.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Lactose',
        text: 'No obvious dairy ingredients were detected.',
      });
    }
  }

  if (profile.conditions.includes('obesity')) {
    if (calories > 250 || sugar > 12 || totalFat > 12) {
      insights.push({
        type: 'warning',
        label: 'Weight Management',
        text: `Calories, sugar, or fat are high enough to make regular use less suitable.`,
      });
    } else {
      insights.push({
        type: 'good',
        label: 'Weight Management',
        text: 'Calories and macros look more controlled for a lighter option.',
      });
    }
  }

  return insights;
};

const getIngredientStatus = (ingredient, profile) => {
  const lower = ingredient.toLowerCase();
  const conditions = Array.isArray(profile?.conditions) ? profile.conditions : [];
  const reasons = [];

  if (conditions.includes('celiac') && GLUTEN_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    reasons.push('gluten-sensitive');
  }

  if (conditions.includes('lactose_intolerance') && DAIRY_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    reasons.push('contains dairy');
  }

  if (conditions.includes('diabetes') && HIGH_SUGAR_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    reasons.push('high sugar trigger');
  }

  if (
    (conditions.includes('hypertension') && HIGH_SODIUM_KEYWORDS.some((keyword) => lower.includes(keyword))) ||
    (conditions.includes('heart_disease') && HIGH_FAT_KEYWORDS.some((keyword) => lower.includes(keyword)))
  ) {
    reasons.push('not ideal for your condition');
  }

  if (conditions.includes('obesity') && (HIGH_SUGAR_KEYWORDS.some((keyword) => lower.includes(keyword)) || HIGH_FAT_KEYWORDS.some((keyword) => lower.includes(keyword)))) {
    reasons.push('dense processed ingredient');
  }

  if (reasons.length > 0) {
    return {
      tone: 'warning',
      label: 'Not Good For You',
      reason: reasons[0],
    };
  }

  if (GOOD_INGREDIENT_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return {
      tone: 'good',
      label: 'Healthy',
      reason: 'generally beneficial ingredient',
    };
  }

  if (GENERALLY_POOR_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return {
      tone: 'warning',
      label: 'Not Good For You',
      reason: 'processed additive or lower-quality fat',
    };
  }

  return {
    tone: 'good',
    label: 'Okay',
    reason: 'no major issue detected for your profile',
  };
};

const getOverallVerdict = ({ totalScore, personalInsights, dietType }) => {
  const warningCount = personalInsights.filter((item) => item.type === 'warning').length;
  const goodCount = personalInsights.filter((item) => item.type === 'good').length;

  if (warningCount >= 2 || totalScore < 45 || dietType.label === 'Non-Veg') {
    return {
      title: 'Not a good overall fit',
      tone: 'warning',
      text:
        warningCount >= 2
          ? 'Your health profile shows multiple concerns with this product, so it is better treated as an occasional choice.'
          : 'The overall score and ingredient profile suggest this is not one of the better options for you.',
    };
  }

  if (warningCount === 1 || totalScore < 70) {
    return {
      title: 'Okay in moderation',
      tone: 'neutral',
      text: 'This product has some positives, but it is not clean enough to be a strong everyday recommendation.',
    };
  }

  return {
    title: 'Good fit for your profile',
    tone: 'good',
    text:
      goodCount > 0
        ? 'The current nutrition and ingredient signals align reasonably well with your health profile.'
        : 'The product looks balanced overall and does not show major conflicts for your profile.',
  };
};

const buildStructuredSummary = ({ analysisData, scoreDetails, verdict, personalInsights, dietType, healthProfile }) => {
  const nutritionData = getNutritionData(analysisData);
  const sugar = getNutritionValue(nutritionData, ['sugar', 'sugars']);
  const sodium = getNutritionValue(nutritionData, ['sodium']);
  const calories = getNutritionValue(nutritionData, ['calories']);
  const goodInsights = personalInsights.filter((item) => item.type === 'good');
  const warningInsights = personalInsights.filter((item) => item.type === 'warning');

  const positives = [];
  const concerns = [];

  if (dietType.label === 'Veg') {
    positives.push('The product appears to be veg.');
  } else if (dietType.label === 'Non-Veg') {
    concerns.push('The product contains non-veg ingredients.');
  }

  if (goodInsights.length > 0) {
    positives.push(goodInsights[0].text);
  }

  if (sugar > 0 && sugar <= 8) {
    positives.push(`Sugar is relatively controlled at ${sugar}g.`);
  }

  if (sodium > 0 && sodium <= 200) {
    positives.push(`Sodium is on the lower side at ${sodium}mg.`);
  }

  if (calories > 0 && calories <= 180) {
    positives.push(`Calories are moderate at ${calories}.`);
  }

  if (warningInsights.length > 0) {
    concerns.push(warningInsights[0].text);
  }

  if (sugar > 12) {
    concerns.push(`Sugar is high at ${sugar}g.`);
  }

  if (sodium > 400) {
    concerns.push(`Sodium is high at ${sodium}mg.`);
  }

  if (calories > 280) {
    concerns.push(`Calories are high at ${calories}.`);
  }

  return {
    headline: `${verdict.title} for ${getUserProfileLabel(healthProfile)}`,
    intro: cleanSummary(analysisData?.analysis_summary, scoreDetails, verdict.text),
    positives: positives.slice(0, 3),
    concerns: concerns.slice(0, 3),
    recommendation: verdict.text,
  };
};

export default function Result() {
  const { user } = useAuth();
  const location = useLocation();
  const analysisData = location.state?.analysisData;

  if (!analysisData) {
    return <Navigate to="/scan" replace />;
  }

  const totalScore = toNumberOrNull(analysisData?.total_score);
  const ingredientsScore = toNumberOrNull(analysisData?.ingredients?.score);
  const nutritionScore = toNumberOrNull(analysisData?.nutrition?.score);
  const ingredientsList = getIngredientsList(analysisData);
  const nutritionData = getNutritionData(analysisData);
  const scoreDetails = getScoreDetails(totalScore ?? 0);
  const { offset, circumference } = calculateCircleProgress(totalScore ?? 0);
  const dietType = getDietType(ingredientsList);

  const healthProfile = user?.weight
    ? {
        weight: user.weight,
        height: user.height,
        bmi: user.bmi,
        conditions: Array.isArray(user.conditions) ? user.conditions : [],
      }
    : (() => {
        try {
          return JSON.parse(localStorage.getItem('userHealthProfile'));
        } catch {
          return null;
        }
      })();

  const personalInsights = getPersonalInsights(analysisData, healthProfile);
  const verdict = getOverallVerdict({ totalScore: totalScore ?? 0, personalInsights, dietType });
  const verdictTone = scoreToneMap[verdict.tone];
  const productName = analysisData?.product_name || 'Analyzed Product';
  const productBrand = analysisData?.product_brand;
  const analysisTimestamp = analysisData?.timestamp;
  const summaryContent = buildStructuredSummary({
    analysisData,
    scoreDetails,
    verdict,
    personalInsights,
    dietType,
    healthProfile,
  });

  const ingredientRows = ingredientsList.map((ingredient) => ({
    name: ingredient,
    ...getIngredientStatus(ingredient, healthProfile),
  }));

  const chartEntries = Object.entries(nutritionData).filter(([, value]) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0;
  });

  const nutritionChartData = {
    labels: chartEntries.map(([key]) => key.replace(/_/g, ' ')),
    datasets: [
      {
        data: chartEntries.map(([, value]) => Number(value)),
        backgroundColor: ['#FF6B6B', '#4D96FF', '#FFD93D', '#6BCB77', '#9D4EDD', '#FF922B', '#00B8A9', '#FF85A1'],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 18,
        },
      },
    },
    maintainAspectRatio: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5] pt-20 pb-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF4081] via-[#FF5C8D] to-[#F50057] px-6 py-8 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-pink-100">Result</p>
                <h1 className="mt-2 text-3xl font-bold">{productName}</h1>
                {productBrand && <p className="mt-1 text-pink-100">{productBrand}</p>}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-pink-100 text-sm">
                    <FiTag className="h-4 w-4" />
                    Diet Type
                  </div>
                  <p className="mt-1 text-lg font-semibold text-white">{dietType.label}</p>
                </div>
                {analysisTimestamp && (
                  <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-pink-100 text-sm">
                      <FiClock className="h-4 w-4" />
                      Analyzed
                    </div>
                    <p className="mt-1 text-sm font-medium text-white">{analysisTimestamp}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[320px,1fr]">
            <div className="rounded-3xl border border-pink-100 bg-gradient-to-b from-pink-50 to-white p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800">Health Score</h2>
              <div className="relative mx-auto mt-5 inline-flex items-center justify-center">
                <svg className="h-36 w-36 -rotate-90">
                  <circle
                    className="text-pink-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="72"
                    cy="72"
                  />
                  <circle
                    className={`${scoreDetails.ringColor} transition-all duration-700`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="58"
                    cx="72"
                    cy="72"
                  />
                </svg>
                <div className="absolute">
                  <p className="text-4xl font-bold text-gray-900">{formatScore(totalScore)}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">out of 100</p>
                </div>
              </div>
              <p className={`mt-4 text-lg font-semibold ${scoreDetails.color}`}>{scoreDetails.category}</p>
              <p className="mt-2 text-sm text-gray-600">{scoreDetails.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-pink-100">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Ingredients</p>
                  <p className="mt-1 text-2xl font-bold text-[#FF4081]">{formatScore(ingredientsScore)}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-pink-100">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Nutrition</p>
                  <p className="mt-1 text-2xl font-bold text-[#FF4081]">{formatScore(nutritionScore)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className={`rounded-3xl border p-5 ${verdictTone.card}`}>
                <div className="flex items-start gap-3">
                  <FiShield className={`mt-1 h-5 w-5 flex-shrink-0 ${verdictTone.icon}`} />
                  <div>
                    <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${verdictTone.badge}`}>
                      Overall Recommendation
                    </p>
                    <h2 className={`mt-3 text-2xl font-semibold ${verdictTone.text}`}>{summaryContent.headline}</h2>
                    <p className={`mt-2 text-sm ${verdictTone.text}`}>{verdict.text}</p>
                    <p className="mt-3 text-sm text-gray-700">{dietType.reason}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <FiInfo className="h-5 w-5 text-[#FF4081]" />
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text">
                    Analysis Summary
                  </h2>
                </div>
                <p className="mt-4 leading-7 text-gray-700">{summaryContent.intro}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <FiCheckCircle className="h-5 w-5" />
                      <h3 className="font-semibold">What Looks Good</h3>
                    </div>
                    <div className="mt-3 space-y-2">
                      {summaryContent.positives.length > 0 ? (
                        summaryContent.positives.map((item, index) => (
                          <p key={`${item}-${index}`} className="text-sm text-emerald-700">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-emerald-700">No strong positive highlights were detected.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <FiAlertCircle className="h-5 w-5" />
                      <h3 className="font-semibold">Main Concerns</h3>
                    </div>
                    <div className="mt-3 space-y-2">
                      {summaryContent.concerns.length > 0 ? (
                        summaryContent.concerns.map((item, index) => (
                          <p key={`${item}-${index}`} className="text-sm text-red-700">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-red-700">No major concerns stood out from the current analysis.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#FF4081]">
                    <FiTag className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Diet Classification</h3>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">{dietType.label}</p>
                  <p className="mt-2 text-sm text-gray-600">{dietType.reason}</p>
                </div>

                <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-[#FF4081]">
                    <FiCalendar className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Session Info</h3>
                  </div>
                  <p className="mt-4 text-sm text-gray-700">
                    {analysisTimestamp ? `Generated on ${analysisTimestamp}.` : 'Latest analysis loaded from this session.'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    Ingredient and nutrition scores are shown separately so you can see what is helping or hurting the product.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {personalInsights.length > 0 && (
          <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-2">
              <FiUser className="h-5 w-5 text-[#FF4081]" />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text">
                Your Personal Health Insights
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              These insights are based on the health conditions saved in your profile.
            </p>
            <div className={`mt-4 rounded-2xl border p-4 ${verdictTone.card}`}>
              <p className={`text-sm font-semibold ${verdictTone.text}`}>
                Overall summary for you: {summaryContent.recommendation}
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {personalInsights.map((insight, index) => {
                const tone = scoreToneMap[insight.type === 'good' ? 'good' : 'warning'];
                return (
                  <div key={`${insight.label}-${index}`} className={`rounded-2xl border p-4 shadow-sm ${tone.card}`}>
                    <div className="flex items-start gap-3">
                      {insight.type === 'good' ? (
                        <FiCheckCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone.icon}`} />
                      ) : (
                        <FiAlertCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${tone.icon}`} />
                      )}
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>{insight.label}</p>
                        <p className={`mt-1 text-sm leading-6 ${tone.text}`}>{insight.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text">
                  Ingredients Analysis
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Red means the ingredient may not be a good fit for your profile. Green indicates a healthier signal.
                </p>
              </div>
              <div className="rounded-2xl bg-pink-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500">Ingredients Score</p>
                <p className="text-2xl font-bold text-[#FF4081]">{formatScore(ingredientsScore)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {ingredientRows.length > 0 ? (
                ingredientRows.map((ingredient, index) => {
                  const tone = scoreToneMap[ingredient.tone === 'warning' ? 'warning' : 'good'];
                  return (
                    <div
                      key={`${ingredient.name}-${index}`}
                      className={`min-w-[220px] rounded-2xl border px-4 py-3 shadow-sm ${tone.badge}`}
                    >
                      <div className="flex items-start gap-2">
                        {ingredient.tone === 'warning' ? (
                          <FiAlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        ) : ingredient.label === 'Okay' ? (
                          <FiMinusCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        ) : (
                          <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold">{ingredient.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide">{ingredient.label}</p>
                          <p className="mt-1 text-xs normal-case tracking-normal">{ingredient.reason}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No ingredient details available.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text">
              Nutrition Facts
            </h2>

            {chartEntries.length > 0 && (
              <div className="mt-5">
                <Pie data={nutritionChartData} options={chartOptions} />
              </div>
            )}

            <div className="mt-5 space-y-3">
              {Object.entries(nutritionData).length > 0 ? (
                Object.entries(nutritionData).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-2xl bg-pink-50 px-4 py-3">
                    <span className="text-sm font-medium capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-[#FF4081]">{value}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No nutrition details available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
