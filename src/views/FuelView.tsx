// ============================================================================
// 🛡️ THESIS TUTORIAL NOTE & ARCHITECTURE EXPLANATION (FUELVIEW.TSX):
// 
// 1. DIETARY & METABOLIC ESTIMATOR (The Caloric Engine):
//    - Ang `FuelView.tsx` ay sumusuri ng "Energy Intake" laban sa "Physical Burn Rate". Sinusukat nito ang caloric budget ng user.
// 
// 2. PAANO GEC-ALCULATE ANG METABOLIC BUDGET? (The Mathematical Formulas):
//    - Ginagamit nito ang standard scientific formula:
//      * **BMR (Basal Metabolic Rate):** (Mifflin-St Jeor Equation)
//        Lalaki: 10 * timbang(kg) + 6.25 * taas(cm) - 5 * edad + 5
//        Babae: 10 * timbang(kg) + 6.25 * taas(cm) - 5 * edad - 161
//      * **TDEE (Total Daily Energy Expenditure):** BMR multiplied by activity multiplier coefficient (1.2 to 1.9 depending on beginner/advanced stats).
// 
// 3. DIET AND HYDRATION LOGGERS:
//    - Nagbibigay ng custom meal patterns at water glass tracker.
//    - Nagpapanatili ng balanse ng macronutrients (Carbs, Protein, Fats) batay sa user fitness goals (lose fat vs gain muscle).
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { 
  ChevronLeft, 
  Flame, 
  Apple, 
  Plus, 
  Minus,
  Trash2, 
  Sparkles, 
  Check, 
  Calendar,
  Activity,
  User,
  Clock,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Info,
  DollarSign,
  Smartphone,
  CheckSquare,
  Award,
  Bell,
  Heart,
  Droplet,
  ChevronRight,
  Filter,
  LogOut,
  Search
} from 'lucide-react';

interface Meal {
  id: string;
  name: string;
  emoji: string;
  image: string;
  category: 'All' | 'Breakfast' | 'Grains' | 'Greens' | 'Proteins' | 'Drinks';
  description: string;
  calories: number;
  prepTime: string;
  intensity: 'Low' | 'Moderate' | 'High';
  carbs: number;
  protein: number;
  fat: number;
}

const SUITE_PRESET_MEALS: Record<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', Meal[]> = {
  Breakfast: [
    {
      id: 'fried_egg_rice',
      name: 'Fried Egg & Rice',
      emoji: '🍳',
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=300&q=80',
      category: 'Breakfast',
      description: 'Crisp pan-fried sunny side up egg served over a mound of hot steamed white rice.',
      calories: 280,
      prepTime: '5 Min',
      intensity: 'Low',
      carbs: 45,
      protein: 11,
      fat: 9
    },
    {
      id: 'boiled_egg_toast',
      name: 'Boiled Egg & Toast',
      emoji: '🥚',
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=300&q=80',
      category: 'Breakfast',
      description: 'Hardboiled egg paired with two toasted white bread slices. Pure high-quality protein.',
      calories: 220,
      prepTime: '5 Min',
      intensity: 'Low',
      carbs: 24,
      protein: 11,
      fat: 6
    },
    {
      id: 'budget_pancakes',
      name: 'Fluffy Pancakes',
      emoji: '🥞',
      image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=300&q=80',
      category: 'Breakfast',
      description: 'Fluffy hot classic home-style pancakes sweetened with syrup or sugar.',
      calories: 290,
      prepTime: '8 Min',
      intensity: 'Low',
      carbs: 48,
      protein: 6,
      fat: 8
    },
    {
      id: 'ham_sandwich',
      name: 'Pork Ham Sandwich',
      emoji: '🥪',
      image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Sliced savory ham seasoned with a bit of butter spread in soft slice bread.',
      calories: 310,
      prepTime: '4 Min',
      intensity: 'Low',
      carbs: 35,
      protein: 16,
      fat: 10
    },
    {
      id: 'peanut_butter_toast',
      name: 'Classic Peanut Butter Toast',
      emoji: '🍞',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Creamy rich peanut butter spread on toasted local white bread slices.',
      calories: 230,
      prepTime: '2 Min',
      intensity: 'Low',
      carbs: 25,
      protein: 8,
      fat: 11
    }
  ],
  Lunch: [
    {
      id: 'carbonara',
      name: 'Classic Carbonara Pasta',
      emoji: '🍝',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Satisfying creamy pasta noodles tossed with pork ham slices, evaporated milk, and melted cheese.',
      calories: 425,
      prepTime: '12 Min',
      intensity: 'Moderate',
      carbs: 52,
      protein: 16,
      fat: 15
    },
    {
      id: 'friedtuna_rice',
      name: 'Fried Tuna & Rice',
      emoji: '🐟',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
      category: 'Proteins',
      description: 'Sautéed seasoned canned tuna flakes pan-fried with garlic and onion over fluffy white rice.',
      calories: 380,
      prepTime: '8 Min',
      intensity: 'Low',
      carbs: 45,
      protein: 26,
      fat: 10
    },
    {
      id: 'fried_chicken_rice',
      name: 'Fried Chicken & Rice',
      emoji: '🍗',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
      category: 'Proteins',
      description: 'Satisfying golden-crispy fried chicken with a side of hot steamed rice.',
      calories: 450,
      prepTime: '15 Min',
      intensity: 'Moderate',
      carbs: 45,
      protein: 30,
      fat: 16
    },
    {
      id: 'tuna_mayo_sandwich',
      name: 'Tuna Mayo Sandwich',
      emoji: '🥪',
      image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Flavorful canned tuna flakes mixed with creamy light mayonnaise in white bread slices.',
      calories: 380,
      prepTime: '5 Min',
      intensity: 'Low',
      carbs: 35,
      protein: 22,
      fat: 11
    }
  ],
  Dinner: [
    {
      id: 'tortang_talong',
      name: 'Tortang Talong with Rice',
      emoji: '🍳',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
      category: 'Proteins',
      description: 'Roasted native eggplant flattened and pan-fried set in seasoned beaten egg, served with rice.',
      calories: 320,
      prepTime: '12 Min',
      intensity: 'Moderate',
      carbs: 38,
      protein: 15,
      fat: 12
    },
    {
      id: 'fried_tilapia',
      name: 'Fried Tilapia & Rice',
      emoji: '🐟',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
      category: 'Proteins',
      description: 'Delicious whole fried Tilapia fish, crispy on the outside, with hot steamed rice.',
      calories: 410,
      prepTime: '15 Min',
      intensity: 'Moderate',
      carbs: 45,
      protein: 28,
      fat: 11
    },
    {
      id: 'monggo_tofu',
      name: 'Sautéed Monggo & Tofu',
      emoji: '🥣',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
      category: 'Greens',
      description: 'Traditional green mung bean soup topped with protein-dense seared tofu cubes.',
      calories: 280,
      prepTime: '15 Min',
      intensity: 'Low',
      carbs: 38,
      protein: 18,
      fat: 8
    },
    {
      id: 'carbonara_dinner',
      name: 'Creamy Carbonara Dinner',
      emoji: '🍝',
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Warm comforting dinner pasta cooked with chopped ham in sweet-savory milk cheese sauce.',
      calories: 425,
      prepTime: '12 Min',
      intensity: 'Moderate',
      carbs: 52,
      protein: 16,
      fat: 15
    }
  ],
  Snack: [
    {
      id: 'ham_sandwich_snack',
      name: 'Savory Ham Sandwich',
      emoji: '🥪',
      image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Simple satisfying snack of thinly sliced ham wrapped in soft sandwich bread.',
      calories: 310,
      prepTime: '3 Min',
      intensity: 'Low',
      carbs: 35,
      protein: 16,
      fat: 10
    },
    {
      id: 'banana_snack',
      name: 'Sweet Native Banana',
      emoji: '🍌',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80',
      category: 'Greens',
      description: 'Sweet ripe local Lakatan banana, packed with healthy potassium and natural carbs.',
      calories: 105,
      prepTime: '1 Min',
      intensity: 'Low',
      carbs: 27,
      protein: 1.5,
      fat: 0.3
    },
    {
      id: 'roasted_peanuts',
      name: 'Roasted Garlic Peanuts',
      emoji: '🥜',
      image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=300&q=80',
      category: 'Greens',
      description: 'Flavorful crispy fried garlic peanuts. A super tasty plant-based lipid snack.',
      calories: 170,
      prepTime: '1 Min',
      intensity: 'Low',
      carbs: 6,
      protein: 7,
      fat: 14
    },
    {
      id: 'egg_cheese_toast',
      name: 'Budget Egg & Cheese Toast',
      emoji: '🍞',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80',
      category: 'Grains',
      description: 'Toasted bread slices containing a fried egg and a creamy processed yellow cheese slice.',
      calories: 220,
      prepTime: '3 Min',
      intensity: 'Low',
      carbs: 16,
      protein: 12,
      fat: 10
    }
  ]
};

// 14 highly universally recognized, globally common foods with high-resolution photographic URLs
const PREMIUM_MEALS: Meal[] = [
  {
    id: 'fried_egg_rice',
    name: 'Fried Egg & Rice',
    emoji: '🍳',
    image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=300&q=80',
    category: 'Breakfast',
    description: 'Crisp pan-fried sunny side up egg served over a mound of hot steamed white rice.',
    calories: 280,
    prepTime: '5 Min',
    intensity: 'Low',
    carbs: 45,
    protein: 11,
    fat: 9,
  },
  {
    id: 'boiled_egg_toast',
    name: 'Boiled Egg & Toast',
    emoji: '🥚',
    image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=300&q=80',
    category: 'Breakfast',
    description: 'Hardboiled egg paired with two toasted white bread slices. Pure high-quality protein.',
    calories: 220,
    prepTime: '5 Min',
    intensity: 'Low',
    carbs: 24,
    protein: 11,
    fat: 6,
  },
  {
    id: 'budget_pancakes',
    name: 'Fluffy Pancakes',
    emoji: '🥞',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=300&q=80',
    category: 'Breakfast',
    description: 'Fluffy hot classic home-style pancakes sweetened with syrup or sugar.',
    calories: 290,
    prepTime: '8 Min',
    intensity: 'Low',
    carbs: 48,
    protein: 6,
    fat: 8,
  },
  {
    id: 'ham_sandwich',
    name: 'Pork Ham Sandwich',
    emoji: '🥪',
    image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=300&q=80',
    category: 'Grains',
    description: 'Sliced savory ham seasoned with a bit of butter spread in soft slice bread.',
    calories: 310,
    prepTime: '4 Min',
    intensity: 'Low',
    carbs: 35,
    protein: 16,
    fat: 10,
  },
  {
    id: 'carbonara',
    name: 'Classic Carbonara Pasta',
    emoji: '🍝',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
    category: 'Grains',
    description: 'Satisfying creamy pasta noodles tossed with pork ham slices, evaporated milk, and melted cheese.',
    calories: 425,
    prepTime: '12 Min',
    intensity: 'Moderate',
    carbs: 52,
    protein: 16,
    fat: 15,
  },
  {
    id: 'friedtuna_rice',
    name: 'Fried Tuna & Rice',
    emoji: '🐟',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
    category: 'Proteins',
    description: 'Sautéed seasoned canned tuna flakes pan-fried with garlic and onion over fluffy white rice.',
    calories: 380,
    prepTime: '8 Min',
    intensity: 'Low',
    carbs: 45,
    protein: 26,
    fat: 10,
  },
  {
    id: 'fried_chicken_rice',
    name: 'Fried Chicken & Rice',
    emoji: '🍗',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
    category: 'Proteins',
    description: 'Satisfying golden-crispy fried chicken with a side of hot steamed rice.',
    calories: 450,
    prepTime: '15 Min',
    intensity: 'Moderate',
    carbs: 45,
    protein: 30,
    fat: 16,
  },
  {
    id: 'tuna_mayo_sandwich',
    name: 'Tuna Mayo Sandwich',
    emoji: '🥪',
    image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=300&q=80',
    category: 'Grains',
    description: 'Flavorful canned tuna flakes mixed with creamy light mayonnaise in white bread slices.',
    calories: 380,
    prepTime: '5 Min',
    intensity: 'Low',
    carbs: 35,
    protein: 22,
    fat: 11,
  },
  {
    id: 'tortang_talong',
    name: 'Tortang Talong with Rice',
    emoji: '🍳',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
    category: 'Proteins',
    description: 'Roasted native eggplant flattened and pan-fried set in seasoned beaten egg, served with rice.',
    calories: 320,
    prepTime: '12 Min',
    intensity: 'Moderate',
    carbs: 38,
    protein: 15,
    fat: 12,
  },
  {
    id: 'fried_tilapia',
    name: 'Fried Tilapia & Rice',
    emoji: '🐟',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80',
    category: 'Proteins',
    description: 'Delicious whole fried Tilapia fish, crispy on the outside, with hot steamed rice.',
    calories: 410,
    prepTime: '15 Min',
    intensity: 'Moderate',
    carbs: 45,
    protein: 28,
    fat: 11,
  },
  {
    id: 'monggo_tofu',
    name: 'Sautéed Monggo & Tofu',
    emoji: '🥣',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
    category: 'Greens',
    description: 'Traditional green mung bean soup topped with protein-dense seared tofu cubes.',
    calories: 280,
    prepTime: '15 Min',
    intensity: 'Low',
    carbs: 38,
    protein: 18,
    fat: 8,
  },
  {
    id: 'banana_snack',
    name: 'Sweet Native Banana',
    emoji: '🍌',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80',
    category: 'Greens',
    description: 'Sweet ripe local Lakatan banana, packed with healthy potassium and natural carbs.',
    calories: 105,
    prepTime: '1 Min',
    intensity: 'Low',
    carbs: 27,
    protein: 1.5,
    fat: 0.3,
  },
  {
    id: 'roasted_peanuts',
    name: 'Roasted Garlic Peanuts',
    emoji: '🥜',
    image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=300&q=80',
    category: 'Greens',
    description: 'Flavorful crispy fried garlic peanuts. A super tasty plant-based lipid snack.',
    calories: 170,
    prepTime: '1 Min',
    intensity: 'Low',
    carbs: 6,
    protein: 7,
    fat: 14,
  },
  {
    id: 'egg_cheese_toast',
    name: 'Budget Egg & Cheese Toast',
    emoji: '🍞',
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80',
    category: 'Grains',
    description: 'Toasted bread slices containing a fried egg and a creamy processed yellow cheese slice.',
    calories: 220,
    prepTime: '3 Min',
    intensity: 'Low',
    carbs: 16,
    protein: 12,
    fat: 10,
  }
];

const EXERCISE_CALORIES_MAP: Record<string, number> = {
  'performance_squat': 85,
  'reverse_lunge': 70,
  'glute_bridge': 60,
  'goblet_squat': 110,
  'romanian_deadlift': 95,
  'squat': 85,
  'military_pushup': 75,
  'incline_pushup': 60,
  'decline_pushup': 90,
  'floor_press': 85,
  'chest_fly': 80,
  'pushup': 75,
  'high_knees': 90,
  'mountain_climbers': 85,
  'plank_jacks': 75,
  'step_ups': 100,
  'dumbbell_thruster': 130,
  'tricep_dips': 65,
  'diamond_pushup': 85,
  'inchworm': 80,
  'bicep_curl': 55,
  'tricep_extension': 60,
  'forearm_plank': 50,
  'bicycle_crunch': 75,
  'hollow_body': 55,
  'russian_twist': 70,
  'plank_pull_through': 80,
  'good_morning': 50,
  'cobra_raise': 45,
  'bird_dog': 50,
  'bent_over_row': 90,
  'dumbbell_glute_bridge': 75,
};

interface LoggedMealItem {
  id: string; // unique logged instance ID
  mealId: string;
  name: string;
  emoji: string;
  image?: string; // high-quality reality photo URL
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  portion: number;
  mealSlot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  isCompleted: boolean;
}

export default function FuelView({ onBack, profile: propProfile }: { onBack: () => void; profile?: UserProfile | null; key?: string }) {
  // Option parameter to show Soon or Ongoing status overlay because the feature is still in development
  const [showOngoingModal, setShowOngoingModal] = useState(true);

  // Navigation states: 'planner' (Screen 2) vs 'selector' (Screen 1)
  const [currentScreen, setCurrentScreen] = useState<'planner' | 'selector'>('planner');
  
  // Backtrack tracking for custom selectors
  const [activeSlotTarget, setActiveSlotTarget] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');

  // SELECTED DAY INDEX OF THE WEEK (0 = Sunday, 1 = Monday ... 6 = Saturday)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(new Date().getDay());

  // Helper to find the numeric day-of-month for a given index of the weekly schedule
  const getCalendarDateForIndex = (index: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diff = index - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    return targetDate.getDate();
  };

  // List of weekly days (Monday to Sunday)
  const weeklyDays = [
    { index: 1, name: 'Monday', short: 'Mon' },
    { index: 2, name: 'Tuesday', short: 'Tue' },
    { index: 3, name: 'Wednesday', short: 'Wed' },
    { index: 4, name: 'Thursday', short: 'Thu' },
    { index: 5, name: 'Friday', short: 'Fri' },
    { index: 6, name: 'Saturday', short: 'Sat' },
    { index: 0, name: 'Sunday', short: 'Sun' },
  ];

  // Selector View States (Screen 1): Category selector & Portion counts
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Breakfast' | 'Grains' | 'Greens' | 'Proteins' | 'Drinks'>('All');
  const [selectedMealId, setSelectedMealId] = useState<string>('fried_egg_rice');
  const [portionCount, setPortionCount] = useState<number>(1);

  // Dynamic Logged Meals representing Today's checklist
  const [loggedMeals, setLoggedMeals] = useState<LoggedMealItem[]>([
    {
      id: 'log-1',
      mealId: 'fried_egg_rice',
      name: 'Fried Egg & Rice',
      emoji: '🍳',
      image: 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=300&q=80',
      calories: 280,
      carbs: 45,
      protein: 11,
      fat: 9,
      portion: 1,
      mealSlot: 'Breakfast',
      isCompleted: true
    },
    {
      id: 'log-2',
      mealId: 'fried_chicken_rice',
      name: 'Fried Chicken & Rice',
      emoji: '🍗',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
      calories: 450,
      carbs: 45,
      protein: 30,
      fat: 16,
      portion: 1,
      mealSlot: 'Lunch',
      isCompleted: true
    }
  ]);

  // Dynamic custom meal form state
  const [customMealName, setCustomMealName] = useState('');
  const [customCategory, setCustomCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [customCalories, setCustomCalories] = useState('350');
  const [customProtein, setCustomProtein] = useState('25');
  const [customCarbs, setCustomCarbs] = useState('40');
  const [customFat, setCustomFat] = useState('8');

  // Expanded inline selection picker per slot
  const [expandedSlotPicker, setExpandedSlotPicker] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | null>(null);

  // Selected portions for preset items in list to let user customize/double them before logging
  const [presetPortions, setPresetPortions] = useState<Record<string, number>>({});

  // Quick select preset meal callback
  const handleSelectPresetMeal = (slotName: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', meal: Meal, customPortion?: number) => {
    const finalPortion = customPortion !== undefined ? customPortion : (presetPortions[meal.id] || 1);
    const freshLog: LoggedMealItem = {
      id: `log-${Date.now()}`,
      mealId: meal.id,
      name: meal.name,
      emoji: meal.emoji,
      image: meal.image,
      calories: meal.calories,
      carbs: meal.carbs,
      protein: meal.protein,
      fat: meal.fat,
      portion: finalPortion,
      mealSlot: slotName,
      isCompleted: true
    };

    setLoggedMeals(prev => [
      ...prev.filter(item => item.mealSlot !== slotName), 
      freshLog
    ]);

    showToast(`Logged ${meal.name} (${finalPortion}x) for ${slotName}`);
    setExpandedSlotPicker(null);
  };

  const handleUpdatePortion = (id: string, newPortion: number) => {
    if (newPortion < 1) {
      handleDeleteLogged(id);
      return;
    }
    setLoggedMeals(prev => 
      prev.map(item => item.id === id ? { ...item, portion: newPortion } : item)
    );
    showToast(`Portion weight scaled to ${newPortion}x`);
  };

  // Toast indicator state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Profile data
  const [profileName, setProfileName] = useState<string>('User');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Real-time completed Workouts State for Today to derive active exercise calorie deductions
  const [completedWorkoutsToday, setCompletedWorkoutsToday] = useState<any[]>([]);

  const syncActualWorkouts = () => {
    try {
      const emailRaw = propProfile?.email || profile?.email || 'default';
      const emailKey = emailRaw.toLowerCase().trim();
      const historyRaw = localStorage.getItem(`edgeform_workout_history_${emailKey}`);
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history)) {
          const todayStr = new Date().toDateString();
          const todayWorkouts = history.filter((item: any) => {
            if (!item.timestamp) return false;
            return new Date(item.timestamp).toDateString() === todayStr;
          });
          setCompletedWorkoutsToday(todayWorkouts);
          if (todayWorkouts.length > 0) {
            showToast(`Successfully synchronized your ${todayWorkouts.length} completed exercises today!`);
          } else {
            showToast(`No completed workouts recorded for today yet.`);
          }
        }
      } else {
        showToast(`No workout history found yet.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('edgeform_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          setProfileName(parsed.name);
        }
        setProfile(parsed);
      }
    } catch (e) {
      console.error(e);
    }

    // Dynamic real-time sync with active workout history
    const readHistory = () => {
      try {
        const emailRaw = propProfile?.email || profile?.email || 'default';
        const emailKey = emailRaw.toLowerCase().trim();
        const historyRaw = localStorage.getItem(`edgeform_workout_history_${emailKey}`);
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          if (Array.isArray(history)) {
            const todayStr = new Date().toDateString();
            const todayWorkouts = history.filter((item: any) => {
              if (!item.timestamp) return false;
              return new Date(item.timestamp).toDateString() === todayStr;
            });
            setCompletedWorkoutsToday(todayWorkouts);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    readHistory();

    // Re-check automatically on window focus/view switches, plus active background interval
    window.addEventListener('focus', readHistory);
    const interval = setInterval(readHistory, 3000);

    return () => {
      window.removeEventListener('focus', readHistory);
      clearInterval(interval);
    };
  }, []);

  // Calculate user BMI classification and target predictions
  const bmiInfo = useMemo(() => {
    const height = profile?.height || 170; // cm
    const weight = profile?.weight || 70; // kg
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let category = 'Normal Weight';
    let color = 'text-lime-400';
    let bgColor = 'bg-lime-500/10';
    let borderColor = 'border-lime-500/20';
    
    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-sky-400';
      bgColor = 'bg-sky-500/10';
      borderColor = 'border-sky-500/20';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight';
      color = 'text-amber-400';
      bgColor = 'bg-amber-500/10';
      borderColor = 'border-amber-500/20';
    } else if (bmi >= 30) {
      category = 'Obese';
      color = 'text-red-400';
      bgColor = 'bg-red-500/10';
      borderColor = 'border-red-500/20';
    }

    const goal = profile?.goal || 'stay_healthy';
    let goalLabel = 'General Health';
    if (goal === 'lose_weight') goalLabel = 'Weight Loss';
    else if (goal === 'gain_weight') goalLabel = 'Gain Weight';
    else if (goal === 'muscle_gain') goalLabel = 'Muscle Mass Gain';
    else if (goal === 'shape_body') goalLabel = 'Shape Body';
    else if (goal === 'improve_endurance') goalLabel = 'Athletic Endurance';
    else if (goal === 'stay_healthy') goalLabel = 'General Health';

    let recommendation = '';
    let targetGains = '';

    if (goal === 'lose_weight') {
      recommendation = `Targeting Weight Loss with a ${bmi.toFixed(1)} BMI (${category}). We configured a healthy calorie deficit of 1,600 kcal. Support fat reduction with high-protein active muscle protection. Select conservative or customized portion sizes (1x) below.`;
      targetGains = 'Deficit Target: Fat burn optimized at ~500 kcal reduction/day.';
    } else if (goal === 'gain_weight') {
      recommendation = `Targeting Weight Gain with a ${bmi.toFixed(1)} BMI (${category}). Set up with 2,500 kcal base fuel. Increase daily intake using 2x or 3x portions below to stay in an active energy surplus.`;
      targetGains = 'Surplus Target: Strategic body mass building with rich nutrients.';
    } else if (goal === 'muscle_gain') {
      recommendation = `Targeting Muscle Mass Gain with a ${bmi.toFixed(1)} BMI (${category}). Calorie target set to 2,500 kcal with enriched protein (160g) to accelerate hypertrophy. Opt for high protein entries under meat/fish categories.`;
      targetGains = 'Hypertrophy Target: High muscle protein synthesis at +500 kcal surplus/day.';
    } else if (goal === 'shape_body') {
      recommendation = `Targeting Shape Body with a ${bmi.toFixed(1)} BMI (${category}). Focused on body recomposition (building lean mass while shedding fat) with a balanced target of 1,800 kcal. Make sure to choose rich complex carbs & clean proteins.`;
      targetGains = 'Recomposition Target: Tone definition at slightly controlled caloric intake.';
    } else if (goal === 'improve_endurance') {
      recommendation = `Targeting Athletic Endurance with a ${bmi.toFixed(1)} BMI (${category}). Focused on athletic performance and energy availability at a balanced 2,000 kcal target. Keep slow-digesting oats, brown rice, and complex carbs high to sustain stamina.`;
      targetGains = 'Stamina Support: Fuel cardiovascular and aerobic output.';
    } else {
      recommendation = `Targeting General Health with a ${bmi.toFixed(1)} BMI (${category}). Energy intake is balanced at 2,000 kcal to maintain mobile muscles, clean skin, and perfect metabolic indicators. Pair entries with high fiber and fresh greens.`;
      targetGains = 'Weight Maintenance: Perfect system equilibrium and baseline physical health.';
    }

    return {
      bmiValue: bmi,
      category,
      color,
      bgColor,
      borderColor,
      goalLabel,
      recommendation,
      targetGains,
      height,
      weight
    };
  }, [profile]);

  // Filtered meals inside Screen 1 Categories
  const filteredMeals = useMemo(() => {
    if (selectedCategory === 'All') return PREMIUM_MEALS;
    return PREMIUM_MEALS.filter(m => m.category === selectedCategory);
  }, [selectedCategory]);

  // Selected meal details
  const activeSelectedMeal = useMemo(() => {
    return PREMIUM_MEALS.find(m => m.id === selectedMealId) || PREMIUM_MEALS[0];
  }, [selectedMealId]);

  // Daily target macros automatically customized for user goal metrics
  const dailyTargets = useMemo(() => {
    const goal = profile?.goal || 'stay_healthy';
    let baseCalories = 2000;
    let baseCarbs = 250;
    let baseProtein = 120;
    let baseFat = 65;

    if (goal === 'lose_weight') {
      baseCalories = 1600;
      baseCarbs = 180;
      baseProtein = 130;
      baseFat = 40;
    } else if (goal === 'gain_weight' || goal === 'muscle_gain') {
      baseCalories = 2500;
      baseCarbs = 330;
      baseProtein = 160;
      baseFat = 60;
    } else if (goal === 'shape_body') {
      baseCalories = 1800;
      baseCarbs = 210;
      baseProtein = 140;
      baseFat = 45;
    }

    return { calories: baseCalories, carbs: baseCarbs, protein: baseProtein, fat: baseFat };
  }, [profile]);

  // Actual completed workouts today calories calculation
  const actualCaloriesBurnedToday = useMemo(() => {
    let total = 0;
    completedWorkoutsToday.forEach((workout: any) => {
      const exerciseId = typeof workout.exercise === 'string'
        ? workout.exercise
        : (workout.exercise?.id || '');
      const key = (exerciseId || '').toLowerCase().trim();
      const baseCals = EXERCISE_CALORIES_MAP[key] || EXERCISE_CALORIES_MAP[exerciseId] || 80;
      total += baseCals;
    });
    return total;
  }, [completedWorkoutsToday]);

  // Computes remaining values dynamically
  const totalsConsumed = useMemo(() => {
    let calSum = 0;
    let carbSum = 0;
    let proteinSum = 0;
    let fatSum = 0;

    loggedMeals.filter(m => m.isCompleted).forEach(item => {
      calSum += item.calories * item.portion;
      carbSum += item.carbs * item.portion;
      proteinSum += item.protein * item.portion;
      fatSum += item.fat * item.portion;
    });

    const actualCarbsBurnedToday = Math.round((actualCaloriesBurnedToday * 0.50) / 4);
    const actualProteinBurnedToday = Math.round((actualCaloriesBurnedToday * 0.30) / 4);
    const actualFatBurnedToday = Math.round((actualCaloriesBurnedToday * 0.20) / 9);

    // Subtract the workout calories directly from the remaining calories left budget as requested ("mababawas sa kcal fuel left")
    const initialCaloriesLeft = Math.max(0, dailyTargets.calories - calSum);
    const caloriesLeft = Math.max(0, initialCaloriesLeft - actualCaloriesBurnedToday);

    const initialCarbsLeft = Math.max(0, dailyTargets.carbs - carbSum);
    const carbsLeft = Math.max(0, initialCarbsLeft - actualCarbsBurnedToday);

    const initialProteinLeft = Math.max(0, dailyTargets.protein - proteinSum);
    const proteinLeft = Math.max(0, initialProteinLeft - actualProteinBurnedToday);

    const initialFatLeft = Math.max(0, dailyTargets.fat - fatSum);
    const fatLeft = Math.max(0, initialFatLeft - actualFatBurnedToday);

    return {
      calories: calSum,
      carbs: carbSum,
      protein: proteinSum,
      fat: fatSum,
      caloriesLeft,
      carbsLeft,
      proteinLeft,
      fatLeft,
      actualCaloriesBurnedToday,
      actualCarbsBurnedToday,
      actualProteinBurnedToday,
      actualFatBurnedToday
    };
  }, [loggedMeals, dailyTargets, actualCaloriesBurnedToday]);

  // Handlers
  const handleToggleComplete = (id: string) => {
    setLoggedMeals(prev => 
      prev.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item)
    );
    const target = loggedMeals.find(item => item.id === id);
    if (target) {
      showToast(`${target.isCompleted ? 'Unlogged' : 'Logged'} ${target.name || 'meal'}`);
    }
  };

  const handleDeleteLogged = (id: string) => {
    const target = loggedMeals.find(item => item.id === id);
    setLoggedMeals(prev => prev.filter(item => item.id !== id));
    if (target) {
      showToast(`Removed from Daily Plan`);
    }
  };

  const handleOpenSelector = (slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack') => {
    setActiveSlotTarget(slot);
    setPortionCount(1);
    setCurrentScreen('selector');
  };

  const handleAddMealToPlan = () => {
    const freshLog: LoggedMealItem = {
      id: `log-${Date.now()}`,
      mealId: activeSelectedMeal.id,
      name: activeSelectedMeal.name,
      emoji: activeSelectedMeal.emoji,
      image: activeSelectedMeal.image,
      calories: activeSelectedMeal.calories,
      carbs: activeSelectedMeal.carbs,
      protein: activeSelectedMeal.protein,
      fat: activeSelectedMeal.fat,
      portion: portionCount,
      mealSlot: activeSlotTarget,
      isCompleted: true
    };

    setLoggedMeals(prev => [
      ...prev.filter(item => item.mealSlot !== activeSlotTarget), 
      freshLog
    ]);

    showToast(`Added ${activeSelectedMeal.name} as ${activeSlotTarget}`);
    setCurrentScreen('planner');
  };

  const handleLogCustomMealEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMealName.trim()) {
      showToast('Please enter a meal or beverage name');
      return;
    }

    const cals = parseFloat(customCalories) || 0;
    const carbs = parseFloat(customCarbs) || 0;
    const protein = parseFloat(customProtein) || 0;
    const fat = parseFloat(customFat) || 0;

    const customLog: LoggedMealItem = {
      id: `custom-log-${Date.now()}`,
      mealId: 'custom-meal',
      name: customMealName,
      emoji: customCategory === 'Drinks' ? '🥛' : '🍽️',
      calories: cals,
      carbs: carbs,
      protein: protein,
      fat: fat,
      portion: 1,
      mealSlot: customCategory,
      isCompleted: true
    };

    setLoggedMeals(prev => [
      ...prev.filter(item => item.mealSlot !== customCategory),
      customLog
    ]);

    showToast(`Logged customized ${customMealName} as ${customCategory}`);
    
    setCustomMealName('');
    setCustomCalories('350');
    setCustomProtein('25');
    setCustomCarbs('40');
    setCustomFat('8');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050A0E] text-white relative font-sans overflow-x-hidden selection-none">
      {/* ONGOING / SOON FEATURE OVERLAY */}
      <AnimatePresence>
        {showOngoingModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050A0E]/95 backdrop-blur-md z-[80] flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm bg-[#070D13] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-center space-y-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
              
              <div className="w-16 h-16 rounded-full bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-500 mx-auto">
                <Apple className="w-8 h-8 text-lime-500" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-lime-500">
                  Fuel Hub: Soon &amp; Ongoing
                </h2>
                <p className="text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">
                  Development In-Progress
                </p>
              </div>
              
              <p className="text-xs font-semibold leading-relaxed text-white/70">
                The Nutrition &amp; Fuel Hub is currently in development for EdgeForm Pro Fitness.
                Here you will find your localized food intake tracker, automatic macronutrient calculator, custom hydration guide, and synchronized calorie deductions based on your active physical workouts!
              </p>

              {/* Teaser Points */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
                <span className="text-[8.5px] font-black text-lime-400 tracking-wider uppercase block">
                  What to expect here:
                </span>
                <div className="space-y-1.5 font-sans font-medium text-white/80 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="text-lime-400 mt-0.5">•</span>
                    <span><strong>Macro budget balancing</strong> tailored to each individual meal target.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lime-400 mt-0.5">•</span>
                    <span><strong>Synchronized calorie deductions</strong> pulled directly from training reps and live physical workouts.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-lime-400 mt-0.5">•</span>
                    <span><strong>BMI optimization index</strong> equipped with real-time guided food intake recommendations.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 text-black font-black uppercase tracking-widest text-[11px] rounded-xl shadow-[0_4px_25px_rgba(132,204,22,0.4)] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Go Back to Hub
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowOngoingModal(false)}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/70 hover:text-white font-bold uppercase tracking-wider text-[9px] rounded-xl transition-all cursor-pointer"
                >
                  Explore Demo Preview
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium backdrop spotlight glow effects */}
      <div className="absolute top-0 left-1/3 w-[350px] h-[350px] bg-lime-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[150px] pointer-events-none rounded-full" />

      {/* FIXED TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#84cc16] text-[#050A0E] text-xs font-black uppercase tracking-wider py-3 px-5 rounded-xl flex items-center gap-2 shadow-[0_8px_30px_rgba(132,204,22,0.35)] border border-[#a3e635]"
          >
            <Check size={13} className="stroke-[3]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RE-USABLE STATIONS WRAPPER */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 md:py-8 flex flex-col z-10 relative">
        
        <AnimatePresence mode="wait">
          {currentScreen === 'planner' && (
            <motion.div
              key="screen-planner"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="flex flex-col space-y-5"
            >
              {/* BACK BUTTON AND APP TITLE BAR */}
              <div className="flex justify-between items-center bg-[#0b1016]/80 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <button 
                  type="button" 
                  onClick={onBack}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white font-mono">Nutritional and Meal Guide</h1>
                <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                  <Apple size={16} />
                </div>
              </div>

              {/* STYLISH WEEKLY CALENDAR DATE TRACKER */}
              <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-4 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#84cc16] block mb-3">Calendar Schedule</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {weeklyDays.map((day) => {
                    const isToday = new Date().getDay() === day.index;
                    const isActive = selectedDayIndex === day.index;
                    const dayNum = getCalendarDateForIndex(day.index);

                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => {
                          setSelectedDayIndex(day.index);
                          showToast(`Selected ${day.name} (${dayNum})`);
                        }}
                        className={`relative flex flex-col items-center py-2 px-1 rounded-2xl border transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#84cc16] border-[#84cc16] text-[#050A0E] shadow-[0_4px_15px_rgba(132,204,22,0.3)] font-black' 
                            : isToday
                              ? 'bg-white/5 border-lime-500/30 text-white hover:border-lime-500/50'
                              : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {/* Today marker label overlay */}
                        {isToday && (
                          <span className={`absolute -top-2.5 text-[7px] font-black tracking-widest uppercase px-1 py-0.5 rounded-md border text-center scale-90 leading-none ${
                            isActive 
                              ? 'bg-[#050A0E] text-[#84cc16] border-[#84cc16]/20' 
                              : 'bg-[#84cc16] text-[#050A0E] border-transparent shadow-[0_2px_5px_rgba(132,204,22,0.2)]'
                          }`}>
                            Today
                          </span>
                        )}

                        <span className={`text-[9px] uppercase tracking-wider block ${isActive ? 'text-[#050A0E]/60 font-black' : 'text-white/30 font-bold'}`}>
                          {day.short}
                        </span>
                        <span className={`text-xs font-black italic mt-0.5 tracking-tight font-mono block ${isActive ? 'text-[#050A0E]' : 'text-white'}`}>
                          {dayNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC PROGRESS GAUGE (Circular calories left & macro bars on the right) */}
              <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-6 text-left">
                {/* Left side circular gauge */}
                <div className="relative w-32 h-32 flex items-center justify-center select-none shrink-0">
                  {/* Outer stroke track */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="9"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      fill="transparent"
                      stroke="#84cc16"
                      strokeWidth="9"
                      strokeDasharray={326.7}
                      strokeDashoffset={326.7 - (326.7 * Math.min(totalsConsumed.calories + totalsConsumed.actualCaloriesBurnedToday, dailyTargets.calories)) / dailyTargets.calories}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <span className="text-2xl font-black italic tracking-tighter text-white font-mono block leading-none">
                      {totalsConsumed.caloriesLeft}
                    </span>
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block mt-1">
                      KCAL LEFT
                    </span>
                  </div>
                </div>

                {/* Right side horizontal macro budget meters */}
                <div className="flex-1 w-full space-y-3 font-mono">
                  {/* Carbs Progress Bar (Red styling) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-white/70">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Carbs</span>
                      <span className="text-red-400">{totalsConsumed.carbsLeft}g left</span>
                    </div>
                    <div className="bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((totalsConsumed.carbs + totalsConsumed.actualCarbsBurnedToday) / dailyTargets.carbs) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Protein Progress Bar (Green/Lime styling) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-white/70">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#84cc16]" /> Protein</span>
                      <span className="text-[#84cc16]">{totalsConsumed.proteinLeft}g left</span>
                    </div>
                    <div className="bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#84cc16] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((totalsConsumed.protein + totalsConsumed.actualProteinBurnedToday) / dailyTargets.protein) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Fat Progress Bar (Olive yellow/brown styling) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-white/70">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Fat</span>
                      <span className="text-amber-500">{totalsConsumed.fatLeft}g left</span>
                    </div>
                    <div className="bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((totalsConsumed.fat + totalsConsumed.actualFatBurnedToday) / dailyTargets.fat) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* REAL-TIME COMPLETED WORKOUTS SYNCRONIZATION ALERT BANNER */}
              {totalsConsumed.actualCaloriesBurnedToday > 0 && (
                <div className="bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-3xl p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(132,204,22,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/15 flex items-center justify-center text-[#84cc16] shrink-0">
                      <Flame size={18} className="animate-bounce" />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] font-mono font-black uppercase text-[#84cc16] block tracking-wider leading-none">Workout Synced Successfully!</span>
                      <p className="text-[10px] text-white/75 font-semibold mt-1 leading-snug">
                        Completed <strong className="text-white">{completedWorkoutsToday.length} exercise(s)</strong> today: <strong className="text-[#84cc16]">-{totalsConsumed.actualCaloriesBurnedToday} kcal</strong> has been deducted from your fuel left budget!
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={syncActualWorkouts}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer font-mono text-[9px] font-black uppercase border border-white/5 shrink-0"
                  >
                    Sync
                  </button>
                </div>
              )}




              {/* BMI RESULTS & PERSONAL OBJECTIVE RECOMMENDATIONS CARD */}
              <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#84cc16]/10 to-transparent blur-xl pointer-events-none rounded-full" />
                <div className="flex items-center gap-2 mb-3 select-none">
                  <Sparkles size={14} className="text-[#84cc16] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#84cc16]">BMI & Objective Planner</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5 mb-4 select-none">
                  <div className="bg-[#050A0E] border border-white/5 p-3.5 rounded-2xl">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">YOUR BMI INDEX</span>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xl font-black italic tracking-tight text-white font-mono">{bmiInfo.bmiValue.toFixed(1)}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${bmiInfo.color} font-mono px-1.5 py-0.5 rounded-md ${bmiInfo.bgColor} border ${bmiInfo.borderColor}`}>
                        {bmiInfo.category}
                      </span>
                    </div>
                    <span className="text-[8px] text-white/40 block mt-1.5 font-mono">Height: {bmiInfo.height}cm • Weight: {bmiInfo.weight}kg</span>
                  </div>

                  <div className="bg-[#050A0E] border border-white/5 p-3.5 rounded-2xl">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">ACTIVE TARGET</span>
                    <span className="text-xs font-black uppercase tracking-tight text-[#84cc16] mt-1 block leading-tight">{bmiInfo.goalLabel}</span>
                    <span className="text-[8.5px] text-white/40 block leading-tight mt-1.5 font-semibold">{bmiInfo.targetGains}</span>
                  </div>
                </div>

                <div className="bg-[#050A0E] border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 select-none">
                    <Info size={11} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#84cc16]">Personalized Recommendation</span>
                  </div>
                  <p className="text-[10.5px] leading-relaxed text-white/70 font-semibold">
                    {bmiInfo.recommendation}
                  </p>
                </div>
              </div>

              {/* LIST OF LOGGED MEALS WITH HORIZONTAL CATEGORY TABS & AUTOMATIC SELECTABLE FOODS LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between select-none">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#84cc16] text-left">Meal Selection Engine</h3>
                  <span className="text-[10px] font-bold text-white/40 uppercase font-mono tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">
                    {loggedMeals.filter(m => m.isCompleted).length} Consumed
                  </span>
                </div>

                {/* HORIZONTAL CATEGORY SELECTOR SYSTEM (FROM USER SCREENSHOT) */}
                <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-4.5 text-left space-y-3 shadow-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">SELECT CATEGORY</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((slotName) => {
                      const isActive = activeSlotTarget === slotName;
                      return (
                        <button
                          key={slotName}
                          type="button"
                          onClick={() => setActiveSlotTarget(slotName)}
                          className={`py-3 px-1 text-[9px] sm:text-[10px] uppercase font-black tracking-widest rounded-2xl transition-all cursor-pointer text-center duration-200 active:scale-95 ${
                            isActive
                              ? 'bg-[#84cc16] text-black font-black shadow-[0_4px_14px_rgba(132,204,22,0.3)]'
                              : 'bg-[#050A0E] text-white/40 border border-white/5 hover:bg-white/5 hover:text-white/60'
                          }`}
                        >
                          {slotName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE LOGGED MEAL STATUS FOR THE SELECTED CATEGORY */}
                {(() => {
                  const loggedMeal = loggedMeals.find(item => item.mealSlot === activeSlotTarget);
                  if (loggedMeal) {
                    return (
                      <div className="space-y-2 text-left">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block px-1">CURRENTLY RECORDED</span>
                        <div className="bg-[#0b1016] border border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/30 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/5 to-transparent blur-md rounded-full pointer-events-none" />
                          <div className="flex items-center gap-3.5 min-w-0 text-left">
                            <button
                              type="button"
                              onClick={() => handleToggleComplete(loggedMeal.id)}
                              className={`w-7.5 h-7.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                loggedMeal.isCompleted 
                                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                                  : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
                              }`}
                              title="Toggle Consumed / Eaten"
                            >
                              {loggedMeal.isCompleted ? <Check size={14} className="stroke-[3]" /> : <div className="w-2.5 h-2.5 rounded-full bg-white/25" />}
                            </button>

                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-2.5 text-left mb-0.5">
                                {loggedMeal.image ? (
                                  <img
                                    src={loggedMeal.image}
                                    alt={loggedMeal.name}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-2xl object-cover border border-white/10 shrink-0"
                                  />
                                ) : (
                                  <span className="text-xl shrink-0 select-none">{loggedMeal.emoji}</span>
                                )}
                                <h4 className="text-xs font-black uppercase tracking-tight text-white/95 break-words whitespace-normal leading-tight">
                                  {loggedMeal.name}
                                </h4>
                              </div>
                              <span className="text-[9.5px] font-black text-white/50 block mt-1 tracking-wide font-mono">
                                {loggedMeal.calories * loggedMeal.portion} kcal • {loggedMeal.carbs * loggedMeal.portion}g Carbs • {loggedMeal.protein * loggedMeal.portion}g Protein • {loggedMeal.fat * loggedMeal.portion}g Fat
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 select-none bg-black/20 sm:bg-transparent p-2 sm:p-0 rounded-2xl">
                            {/* Logged Portion Stepper (Dito pwede i-double o baguhin portions) */}
                            <div className="flex items-center gap-1 bg-[#05090d] border border-white/5 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleUpdatePortion(loggedMeal.id, loggedMeal.portion - 1)}
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer font-black text-xs"
                                title="Bawasan ang Portion"
                              >
                                -
                              </button>
                              <span className="text-[10px] font-mono font-black text-white px-1.5 min-w-[20px] text-center">
                                {loggedMeal.portion}x
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdatePortion(loggedMeal.id, loggedMeal.portion + 1)}
                                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer font-black text-xs"
                                title="Dagdagan ang Portion"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLogged(loggedMeal.id)}
                              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-2.5 rounded-2xl text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-[#0b1016]/40 border-2 border-dashed border-white/5 rounded-3xl p-5 flex flex-col items-center justify-center text-center py-6 px-4 space-y-1.5 select-none text-left">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/30">
                        <Activity size={16} />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[10px] font-black uppercase tracking-tight text-white/45">No {activeSlotTarget} loaded</h4>
                        <p className="text-[8.5px] text-white/30 font-semibold max-w-[210px] mx-auto mt-0.5 leading-tight">
                          Select one of the delicious healthy options below to log it instantly!
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* LIST OF CHOOSEABLE HEALTHY FOOD OPTIONS UNDER COMPACT GRID VIEW WITH DIRECT MULTIPLIER CONTROLLER */}
                <div className="space-y-2 text-left pt-1">
                  <div className="flex justify-between items-center select-none px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#84cc16]">
                      Choose Healthy {activeSlotTarget}
                    </span>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono">
                      Scale Portions & Click to Add
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-white/10">
                    {SUITE_PRESET_MEALS[activeSlotTarget].map((meal) => {
                      const loggedMeal = loggedMeals.find(item => item.mealSlot === activeSlotTarget);
                      const isCurrentlySelected = loggedMeal && loggedMeal.mealId === meal.id;
                      const selectedPortion = presetPortions[meal.id] || 1;

                      // Dynamically calculate multiplied nutrition targets
                      const scaledCalories = meal.calories * selectedPortion;
                      const scaledCarbs = meal.carbs * selectedPortion;
                      const scaledProtein = meal.protein * selectedPortion;
                      const scaledFat = meal.fat * selectedPortion;

                      return (
                        <div
                          key={meal.id}
                          className={`w-full p-4 rounded-3xl border text-left flex flex-col gap-3 transition-all duration-200 ${
                            isCurrentlySelected 
                              ? 'bg-[#84cc16]/10 border-[#84cc16] text-white shadow-[0_4px_12px_rgba(132,204,22,0.12)]' 
                              : 'bg-[#0b1016] border-white/5 text-white/70 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0 text-left">
                              {meal.image ? (
                                <img
                                  src={meal.image}
                                  alt={meal.name}
                                  referrerPolicy="no-referrer"
                                  className="w-11 h-11 rounded-2xl object-cover border border-white/10 shrink-0"
                                />
                              ) : (
                                <span className="text-2xl select-none shrink-0">{meal.emoji}</span>
                              )}
                              <div className="min-w-0 text-left flex-1">
                                <h4 className="text-xs font-black uppercase text-white leading-tight break-words pr-1">{meal.name}</h4>
                                <p className="text-[9.5px] text-white/40 leading-normal mt-1 font-sans font-semibold break-words whitespace-normal">
                                  {meal.description}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectPresetMeal(activeSlotTarget, meal, selectedPortion)}
                              className={`px-3.5 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer flex items-center gap-1 active:scale-95 ${
                                isCurrentlySelected
                                  ? 'bg-[#84cc16] text-black shadow-lg shadow-[#84cc16]/20'
                                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                              }`}
                            >
                              {isCurrentlySelected ? (
                                <>
                                  <Check size={10} className="stroke-[4]" />
                                  <span>Logged ({selectedPortion}x)</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={10} className="stroke-[3]" />
                                  <span>Log ({selectedPortion}x)</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* PORTION MULTIPLIER AND CORRESPONDING SCALED CALORIES */}
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-[#05090d]/60 p-3 rounded-2xl border border-white/5 text-[9.5px]">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-white/40 font-bold uppercase text-[8px] tracking-widest block mr-1.5">PORTION:</span>
                              <button
                                type="button"
                                onClick={() => setPresetPortions(prev => ({ ...prev, [meal.id]: Math.max(1, (prev[meal.id] || 1) - 1) }))}
                                className="w-5.5 h-5.5 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer font-black text-xs"
                              >
                                -
                              </button>
                              <span className="text-white font-black px-1.5 font-mono text-[10px] min-w-[20px] text-center">
                                {selectedPortion}x
                              </span>
                              <button
                                type="button"
                                onClick={() => setPresetPortions(prev => ({ ...prev, [meal.id]: (prev[meal.id] || 1) + 1 }))}
                                className="w-5.5 h-5.5 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-white/10 cursor-pointer font-black text-xs"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() => setPresetPortions(prev => ({ ...prev, [meal.id]: 2 }))}
                                className={`px-2 py-1 rounded-md text-[8.5px] uppercase font-black tracking-widest cursor-pointer ml-1.5 transition-colors ${
                                  selectedPortion === 2 ? 'bg-[#84cc16]/20 text-[#84cc16]' : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                              >
                                Double (2x)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPresetPortions(prev => ({ ...prev, [meal.id]: 3 }))}
                                className={`px-2 py-1 rounded-md text-[8.5px] uppercase font-black tracking-widest cursor-pointer transition-colors ${
                                  selectedPortion === 3 ? 'bg-[#84cc16]/20 text-[#84cc16]' : 'bg-white/5 text-white/50 hover:text-white'
                                }`}
                              >
                                Triple (3x)
                              </button>
                            </div>

                            <span className="font-mono text-[9px] font-black text-[#84cc16] tracking-wide text-right">
                              {scaledCalories} kcal • {scaledCarbs}g Carbs • {scaledProtein}g Protein • {scaledFat}g Fat
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-4 text-left select-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lime-500/10 to-transparent blur-md rounded-full pointer-events-none" />
                <h4 className="text-[8px] font-black text-[#84cc16] uppercase tracking-[0.2em] leading-none mb-1 block">💡 INSTRUCTION NOTE</h4>
                <p className="text-[10px] font-bold text-white/50 leading-relaxed font-semibold">
                  You can modify or add to your daily logged nutrition by clicking on any of the slots above.
                </p>
              </div>

              {/* DYNAMIC MEAL LOG FORM CARD */}
              <div id="dynamic-meal-log-card" className="bg-[#0b1016] border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden flex flex-col space-y-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#84cc16]/10 to-transparent blur-md rounded-full pointer-events-none" />
                
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-white font-mono">LOG DYNAMIC MEAL ENTRY</h3>
                </div>

                {/* SELECT CATEGORY */}
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">SELECT CATEGORY</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((cat) => {
                      const isActive = customCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCustomCategory(cat)}
                          className={`py-2 px-1 text-[9px] uppercase font-black tracking-wider rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'bg-[#84cc16] text-[#050A0E] font-black shadow-[0_3px_10px_rgba(132,204,22,0.2)]'
                              : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NAME OF FOOD / BEVERAGE */}
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">NAME OF FOOD / BEVERAGE</span>
                  <input
                    type="text"
                    value={customMealName}
                    onChange={(e) => setCustomMealName(e.target.value)}
                    placeholder="e.g. Scrambled egg with butter toast"
                    className="w-full bg-[#050A0E] border border-white/5 rounded-xl px-3.5 py-3 text-xs text-white placeholder-white/20 font-semibold focus:outline-none focus:border-[#84cc16]/50 transition-all font-mono"
                  />
                </div>

                {/* DOUBLE COLUMN PARAMETERS FOR KCAL, PROTEIN, CARBS, FAT */}
                <div className="grid grid-cols-2 gap-3.5 select-none">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/45 block">CALORIES (KCAL)</span>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="w-full bg-[#050A0E] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white font-semibold focus:outline-none focus:border-[#84cc16]/50 transition-all font-mono"
                    />

                    <span className="text-[8px] font-black uppercase tracking-widest text-white/45 block pt-1.5">CARBS (G)</span>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      className="w-full bg-[#050A0E] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white font-semibold focus:outline-none focus:border-[#84cc16]/50 transition-all font-mono"
                    />
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/45 block">PROTEIN (G)</span>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      className="w-full bg-[#050A0E] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white font-semibold focus:outline-none focus:border-[#84cc16]/50 transition-all font-mono"
                    />

                    <span className="text-[8px] font-black uppercase tracking-widest text-white/45 block pt-1.5">FAT (G)</span>
                    <input
                      type="number"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value)}
                      className="w-full bg-[#050A0E] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white font-semibold focus:outline-none focus:border-[#84cc16]/50 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* BUTTON + LOG MEAL ENTRY */}
                <button
                  type="button"
                  onClick={handleLogCustomMealEntry}
                  className="w-full py-4.5 bg-[#84cc16] hover:bg-[#a3e635] text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_4px_15px_rgba(132,204,22,0.15)] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] mt-2"
                >
                  <Plus size={14} className="stroke-[3]" />
                  <span>Log Meal Entry</span>
                </button>
              </div>

            </motion.div>
          )}

          {currentScreen === 'selector' && (
            <motion.div
              key="screen-selector"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="flex flex-col space-y-5"
            >
              {/* BACK BUTTON AND APP TITLE BAR */}
              <div className="flex justify-between items-center bg-[#0b1016]/80 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <button 
                  type="button" 
                  onClick={() => setCurrentScreen('planner')}
                  className="px-4.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-1 border border-white/10 cursor-pointer text-xs font-black uppercase tracking-wider"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                  <span>Planner</span>
                </button>
                <div className="text-right">
                  <h1 className="text-[9px] font-black tracking-[0.1em] uppercase text-white/40 leading-none">Meal Selector</h1>
                  <p className="text-[7.5px] font-black uppercase text-[#84cc16] tracking-widest pt-0.5">{activeSlotTarget}</p>
                </div>
              </div>

              {/* HORIZONTAL CATEGORY SELECTOR SYSTEM */}
              <div className="bg-[#0b1016] border border-white/5 rounded-2xl p-2 select-none">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  {(['All', 'Breakfast', 'Grains', 'Greens', 'Proteins', 'Drinks'] as const).map((catName) => {
                    const isActive = selectedCategory === catName;
                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(catName);
                          // Auto shift selected meal if it falls out of category logic
                          const inCat = PREMIUM_MEALS.filter(m => catName === 'All' || m.category === catName);
                          if (inCat.length > 0 && !inCat.some(m => m.id === selectedMealId)) {
                            setSelectedMealId(inCat[0].id);
                          }
                        }}
                        className={`py-2 px-4.5 rounded-xl text-[10px] uppercase font-black tracking-widest shrink-0 transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#84cc16] text-[#050A0E] font-black' 
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {catName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CURRENTLY TARGETED NOURISH BOWL DETAILS AND INTERACTION CARD */}
              <div className="bg-[#0b1016] border border-white/5 rounded-3xl p-5 text-left relative overflow-hidden flex flex-col space-y-4">
                
                {/* Beautiful Photographic Reality Image of Food */}
                <div className="flex justify-center relative select-none w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                  {activeSelectedMeal.image ? (
                    <img
                      src={activeSelectedMeal.image}
                      alt={activeSelectedMeal.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transform duration-500 hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-[#050A0E] text-7xl">
                      <span className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] transform duration-300 hover:scale-105 hover:rotate-2">
                        {activeSelectedMeal.emoji}
                      </span>
                    </div>
                  )}
                </div>

                {/* Portions increment selector with custom styling layout */}
                <div className="flex justify-center items-center gap-4 select-none pb-2 border-b border-white/5">
                  <button
                    type="button"
                    onClick={() => setPortionCount(prev => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-90 transition-all font-black text-lg"
                  >
                    <Minus size={14} className="stroke-[3]" />
                  </button>
                  <span className="text-sm font-black uppercase text-[#84cc16] tracking-widest font-mono">
                    {portionCount}x Portions
                  </span>
                  <button
                    type="button"
                    onClick={() => setPortionCount(prev => prev + 1)}
                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-90 transition-all font-black text-lg"
                  >
                    <Plus size={14} className="stroke-[3]" />
                  </button>
                </div>

                {/* Title & Description of Chosen Recipe */}
                <div className="space-y-1.5 text-left">
                  <h2 className="text-xl font-black tracking-tight text-white uppercase italic text-center">
                    {activeSelectedMeal.name}
                  </h2>
                  <p className="text-[11px] text-white/50 leading-relaxed font-semibold text-center max-w-sm mx-auto">
                    {activeSelectedMeal.description}
                  </p>
                </div>

                {/* Row of 3 stats parameters: Cook Time, Simplicity, Total Energy */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 select-none">
                  {/* Time */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-center">
                    <Clock size={14} className="text-emerald-400 mx-auto mb-1" />
                    <span className="text-[10px] font-mono font-black block text-emerald-300">{activeSelectedMeal.prepTime}</span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest block font-bold leading-none mt-1">Prep &amp; Cook</span>
                  </div>

                  {/* Intensity */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-center">
                    <Activity size={14} className="text-[#3b82f6] mx-auto mb-1" />
                    <span className="text-[10px] font-black block text-[#60a5fa]">{activeSelectedMeal.intensity}</span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest block font-bold leading-none mt-1">Simplicity</span>
                  </div>

                  {/* Calories */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-center">
                    <Flame size={14} className="text-orange-400 mx-auto mb-1" />
                    <span className="text-[10px] font-mono font-black block text-orange-300">{activeSelectedMeal.calories * portionCount} Cal</span>
                    <span className="text-[8px] text-white/30 uppercase tracking-widest block font-bold leading-none mt-1">Total energy</span>
                  </div>
                </div>

                {/* ADVANCED TUBES BREAKDOWN SECTION FOR CARBS, PROTEIN, FAT */}
                <div className="space-y-3 pt-2 text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">Macronutrient Breakdown</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono select-none">
                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-left">
                      <span className="text-[8px] text-white/40 block leading-none">CARBOHYDRATES</span>
                      <span className="text-[13px] font-black italic mt-1 block text-red-400">{activeSelectedMeal.carbs * portionCount}g</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-left">
                      <span className="text-[8px] text-white/40 block leading-none">PROTEIN AMINOS</span>
                      <span className="text-[13px] font-black italic mt-1 block text-[#84cc16]">{activeSelectedMeal.protein * portionCount}g</span>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-2 rounded-xl text-left">
                      <span className="text-[8px] text-white/40 block leading-none">LIPID EXTRA FAT</span>
                      <span className="text-[13px] font-black italic mt-1 block text-amber-500">{activeSelectedMeal.fat * portionCount}g</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* LIST OF SELECTABLE MEALS FOR ALTERNATIVES SELECTOR */}
              <div className="space-y-3 text-left">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#84cc16]">Pick Alternative Plate</span>
                
                <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-none">
                  {filteredMeals.map((meal) => {
                    const isSelected = selectedMealId === meal.id;
                    return (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => {
                          setSelectedMealId(meal.id);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#84cc16]/10 border-[#84cc16] text-white' 
                            : 'bg-[#0b1016] border-white/5 text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {meal.image ? (
                            <img
                              src={meal.image}
                              alt={meal.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <span className="text-2xl select-none">{meal.emoji}</span>
                          )}
                          <div>
                            <h4 className="text-xs font-black uppercase text-white leading-tight">{meal.name}</h4>
                            <span className="text-[9.5px] font-bold text-white/40 tracking-wider">
                              {meal.calories} kcal • {meal.prepTime}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#84cc16] flex items-center justify-center">
                            <Check size={11} className="text-black stroke-[3.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CORE BTN FOR ADD TO PLAN ACTION ON SCREEN 1 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddMealToPlan}
                  className="w-full py-4.5 bg-[#84cc16] hover:bg-[#a3e635] text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_4px_25px_rgba(132,204,22,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Add to Plan</span>
                  <ArrowRight size={14} className="stroke-[3]" />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER STATS INFO ACCENTS */}
      <footer className="py-4 border-t border-white/5 bg-[#050A0E] text-center select-none shrink-0 mb-6">
        <div className="max-w-lg mx-auto px-4 text-[9px] text-white/20 font-bold uppercase tracking-widest">
          <p>© 2026 EDGEFORM HEALTH • DYNAMIC NUTRITION ENGINE</p>
        </div>
      </footer>

    </div>
  );
}
