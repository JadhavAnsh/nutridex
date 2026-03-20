import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { FiAlertCircle, FiCheckCircle, FiUser } from 'react-icons/fi';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Generate personalised warnings based on stored health profile
function getPersonalisedInsights(analysisData, profile) {
  if (!profile) return [];
  const insights = [];
  const nutrition = analysisData?.nutrition?.data || {};
  const ingredients = (analysisData?.ingredients?.raw_data || []).join(' ').toLowerCase();

  const findValue = (keys) => {
    for (const key of keys) {
      if (nutrition[key] !== undefined) return nutrition[key];
      // Try fuzzy match (ignore case and units)
      const normalizedKey = key.toLowerCase();
      const foundKey = Object.keys(nutrition).find(k => {
        const kLow = k.toLowerCase();
        return kLow === normalizedKey || 
               kLow.startsWith(normalizedKey + ' ') || 
               kLow.startsWith(normalizedKey + '(');
      });
      if (foundKey !== undefined) return nutrition[foundKey];
    }
    return 0;
  };

  const sodium   = parseFloat(findValue(['Sodium', 'sodium', 'Salt', 'salt']));
  const sugar    = parseFloat(findValue(['Sugar', 'sugar', 'Sugars', 'sugars']));
  const satFat   = parseFloat(findValue(['Saturated Fat', 'saturated_fat', 'Saturates', 'saturates']));
  const chol     = parseFloat(findValue(['Cholesterol', 'cholesterol', 'Chol']));
  const calories = parseFloat(findValue(['Calories', 'calories', 'Energy', 'energy']));
  const totalFat = parseFloat(findValue(['Total Fat', 'total_fat', 'Fats', 'fats', 'Total Lipids']));

  if (profile.conditions && profile.conditions.length > 0) {
    if (profile.conditions.includes('diabetes')) {
      if (sugar > 10)
        insights.push({ type: 'warning', icon: '🩸', label: 'Diabetes', text: `High sugar content (${sugar}g) — may spike blood glucose. Limit intake.` });
      else
        insights.push({ type: 'good', icon: '🩸', label: 'Diabetes', text: `Sugar level (${sugar}g) is within a safe range for most diabetics.` });
    }
    if (profile.conditions.includes('hypertension') || profile.conditions.includes('heart_disease')) {
      if (sodium > 400)
        insights.push({ type: 'warning', icon: '💢', label: 'Blood Pressure', text: `High sodium (${sodium}mg) — exceeds recommended limits for hypertension/heart health.` });
      else
        insights.push({ type: 'good', icon: '💢', label: 'Blood Pressure', text: `Sodium level (${sodium}mg) is acceptable for blood pressure management.` });
    }
    if (profile.conditions.includes('heart_disease')) {
      if (satFat > 5 || chol > 60)
        insights.push({ type: 'warning', icon: '❤️', label: 'Heart Health', text: `Saturated fat (${satFat}g) or cholesterol (${chol}mg) is elevated — not ideal for heart disease management.` });
      else
        insights.push({ type: 'good', icon: '❤️', label: 'Heart Health', text: `Saturated fat and cholesterol levels are within heart-healthy limits.` });
    }
    if (profile.conditions.includes('celiac')) {
      const glutenIngreds = ['wheat', 'barley', 'rye', 'gluten', 'flour', 'semolina', 'spelt', 'malt'];
      const found = glutenIngreds.filter(g => ingredients.includes(g));
      if (found.length > 0)
        insights.push({ type: 'warning', icon: '🌾', label: 'Gluten', text: `Contains possible gluten sources: ${found.join(', ')}. Not safe for celiac disease.` });
      else
        insights.push({ type: 'good', icon: '🌾', label: 'Gluten', text: 'No obvious gluten-containing ingredients detected.' });
    }
    if (profile.conditions.includes('lactose_intolerance')) {
      const dairyIngreds = ['milk', 'lactose', 'cream', 'butter', 'cheese', 'whey', 'casein', 'dairy'];
      const found = dairyIngreds.filter(d => ingredients.includes(d));
      if (found.length > 0)
        insights.push({ type: 'warning', icon: '🥛', label: 'Lactose', text: `Contains dairy ingredients: ${found.join(', ')}. May cause issues with lactose intolerance.` });
      else
        insights.push({ type: 'good', icon: '🥛', label: 'Lactose', text: 'No dairy ingredients detected — safe for lactose intolerance.' });
    }
    if (profile.conditions.includes('obesity')) {
      if (calories > 250 || totalFat > 12)
        insights.push({ type: 'warning', icon: '⚖️', label: 'Weight Management', text: `Calorie-dense product (${calories} kcal, ${totalFat}g fat). Consume in moderation.` });
      else
        insights.push({ type: 'good', icon: '⚖️', label: 'Weight Management', text: `Relatively low calorie content (${calories} kcal) — suitable for weight management.` });
    }
  }

  // BMI note
  if (profile.bmi) {
    let bmiNote = null;
    if (profile.bmi >= 30 && calories > 300)
      bmiNote = { type: 'warning', icon: '📊', label: 'BMI Note', text: `Your BMI is ${profile.bmi}. This high-calorie food (${calories} kcal) may not align with your weight goals.` };
    if (bmiNote) insights.push(bmiNote);
  }

  return insights;
}

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Result() {
  const { user } = useAuth();
  const location = useLocation();
  const analysisData = location.state?.analysisData;
  const [bannerOpacity, setBannerOpacity] = useState(1);

  // Add banner animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerOpacity(prev => prev === 1 ? 0.7 : 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Redirect if no data is present
  if (!analysisData) {
    return <Navigate to="/scan" replace />;
  }

  // Helper function to format score and calculate circle
  const formatScore = (score) => {
    return score.toFixed(1);
  };

  const calculateCircleProgress = (score) => {
    const normalizedScore = Math.min(Math.max(score, 0), 100); // Ensure score is between 0 and 100
    const circumference = 2 * Math.PI * 58;
    const offset = circumference - (normalizedScore / 100) * circumference;
    return { offset, circumference };
  };

  // Helper function to get score category and color
  const getScoreDetails = (score) => {
    if (score >= 90) {
      return {
        category: "Superfoods & Whole Foods",
        description: "Excellent nutritional value with minimal processing",
        color: "text-emerald-500",
        ringColor: "text-emerald-500"
      };
    } else if (score >= 60) {
      return {
        category: "Healthy but Some Processing",
        description: "Good nutritional profile with moderate processing",
        color: "text-yellow-500",
        ringColor: "text-yellow-500"
      };
    } else if (score >= 30) {
      return {
        category: "Moderately Processed & Less Nutritious",
        description: "Higher processing with some nutritional concerns",
        color: "text-orange-500",
        ringColor: "text-orange-500"
      };
    } else {
      return {
        category: "Highly Processed & Poor Nutrition",
        description: "Heavy processing with significant nutritional concerns",
        color: "text-red-500",
        ringColor: "text-red-500"
      };
    }
  };

  // Get circle values and category details
  const { offset, circumference } = calculateCircleProgress(analysisData.total_score);
  const scoreDetails = getScoreDetails(analysisData.total_score);

  // Personalized health insights
  const healthProfile = user?.weight ? {
    weight: user.weight,
    height: user.height,
    bmi: user.bmi,
    conditions: user.conditions
  } : (() => {
    try { return JSON.parse(localStorage.getItem('userHealthProfile')); }
    catch { return null; }
  })();
  const personalInsights = getPersonalisedInsights(analysisData, healthProfile);

  // Prepare data for pie chart
  const nutritionChartData = {
    labels: Object.keys(analysisData.nutrition.data).map(key => 
      key.replace(/([A-Z])/g, ' $1').trim()
    ),
    datasets: [{
      data: Object.values(analysisData.nutrition.data),
      backgroundColor: [
        'rgb(255, 99, 71)',     // Tomato Red
        'rgb(30, 144, 255)',    // Dodger Blue
        'rgb(255, 215, 0)',     // Gold
        'rgb(138, 43, 226)',    // Blue Violet
        'rgb(50, 205, 50)',     // Lime Green
        'rgb(255, 140, 0)',     // Dark Orange
        'rgb(0, 206, 209)',     // Turquoise
        'rgb(219, 112, 147)',   // Pale Violet Red
        'rgb(0, 128, 128)',     // Teal
      ],
      borderColor: '#FFF',
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          },
          padding: 20
        }
      }
    },
    maintainAspectRatio: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5]">
      <div className="mt-16"> {/* Add margin-top to account for navbar */}
        <div 
          className="w-full bg-yellow-50 border-y border-yellow-200 p-3"
          style={{ 
            opacity: bannerOpacity,
            transition: 'opacity 1s ease-in-out'
          }}
        >
          <p className="text-center text-yellow-800 font-medium flex items-center justify-center gap-2">
            <span className="animate-pulse">⚠️</span>
            NutriDex ratings may sometimes misjudge food products. Always verify before making dietary decisions!
          </p>
        </div>
      </div>

      <div className="pt-8 pb-10 px-4"> {/* Adjusted padding-top */}
        <div className="container mx-auto max-w-4xl">
          {/* Health Score */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
            <h2 className="text-2xl font-semibold 
              bg-gradient-to-r from-[#FF4081] to-[#F50057] 
              text-transparent bg-clip-text mb-4">
              Health Score
            </h2>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  className="text-gray-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`${scoreDetails.ringColor} transition-all duration-500`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
              </svg>
              <span className="absolute text-3xl font-bold text-gray-800">
                {formatScore(analysisData.total_score)}%
              </span>
            </div>
            <div className="mt-4">
              <p className={`text-lg font-semibold ${scoreDetails.color}`}>
                {scoreDetails.category}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {scoreDetails.description}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold 
              bg-gradient-to-r from-[#FF4081] to-[#F50057] 
              text-transparent bg-clip-text mb-4">
              Analysis Summary
            </h2>
            <p className="text-gray-600">{analysisData.analysis_summary}</p>
          </div>

          {/* Personalised Health Insights */}
          {healthProfile && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="w-5 h-5 text-[#FF4081]" />
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#FF4081] to-[#F50057] text-transparent bg-clip-text">
                  Your Personal Health Insights
                </h2>
              </div>
              <div className="space-y-3">
                {personalInsights.length > 0 ? (
                  personalInsights.map((ins, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                        ins.type === 'warning'
                          ? 'bg-red-50 border-red-100'
                          : 'bg-emerald-50 border-emerald-100'
                      }`}
                    >
                      <span className="text-xl leading-none mt-0.5">{ins.icon}</span>
                      <div className="flex-1">
                        <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                          ins.type === 'warning' ? 'text-red-400' : 'text-emerald-500'
                        }`}>{ins.label}</p>
                        <p className={`text-sm ${
                          ins.type === 'warning' ? 'text-red-700' : 'text-emerald-700'
                        }`}>{ins.text}</p>
                      </div>
                      {ins.type === 'warning'
                        ? <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        : <FiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <FiCheckCircle className="w-6 h-6 text-emerald-500" />
                    <p className="text-sm text-emerald-800 font-medium">
                      Based on your health profile, no specific dietary warnings were triggered for this product.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingredients Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold 
                bg-gradient-to-r from-[#FF4081] to-[#F50057] 
                text-transparent bg-clip-text mb-4">
                Ingredients Analysis
              </h2>
              {/* Add Ingredients Score */}
              <div className="mb-4 p-4 bg-pink-50 rounded-lg">
                <p className="text-gray-700 font-medium mb-2">Ingredients Score</p>
                <div className="flex items-baseline">
                  <span className="text-4xl md:text-5xl font-bold text-[#FF4081]">
                    {formatScore(analysisData.ingredients.score)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1 mt-2">/100</span>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-[#FF4081] h-2.5 rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `${analysisData.ingredients.score}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-4">
                {analysisData.ingredients.raw_data.map((ingredient, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors">
                    <div>
                      <h3 className="font-medium text-gray-900">{ingredient}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Facts */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold 
                bg-gradient-to-r from-[#FF4081] to-[#F50057] 
                text-transparent bg-clip-text mb-4">
                Nutrition Facts
              </h2>
              
              {/* Add Pie Chart */}
              <div className="mb-6">
                <Pie data={nutritionChartData} options={chartOptions} />
              </div>

              {/* Existing nutrition facts table */}
              <div className="space-y-3">
                {Object.entries(analysisData.nutrition.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-pink-200">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium text-[#FF4081]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}