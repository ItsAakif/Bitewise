import { withMicros } from './foodMicros';

// Food catalogue. Macros are per the stated `serving`; raw ingredients are per
// 100 g. `diet` values drive the filter chips: vegetarian, vegan, gluten-free,
// high-protein, low-carb. Nothing here is generated at runtime — this is the
// offline database the diary and search read from.

/** @type {import('../types').Food[]} */
const FOODS_RAW = [
  // ── Fruit ────────────────────────────────────────────────────────────────
  { id: 'f-apple', name: 'Apple', serving: '182 g', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, category: 'fruit', tags: ['fruit', 'fresh'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-banana', name: 'Banana', serving: '118 g', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, category: 'fruit', tags: ['fruit', 'fresh'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-orange', name: 'Orange', serving: '131 g', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, category: 'fruit', tags: ['fruit', 'citrus'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-strawberries', name: 'Strawberries', serving: '152 g', calories: 49, protein: 1, carbs: 11.7, fat: 0.5, category: 'fruit', tags: ['fruit', 'berries'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-blueberries', name: 'Blueberries', serving: '148 g', calories: 84, protein: 1.1, carbs: 21.4, fat: 0.5, category: 'fruit', tags: ['fruit', 'berries'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-grapes', name: 'Grapes', serving: '151 g', calories: 104, protein: 1.1, carbs: 27.3, fat: 0.2, category: 'fruit', tags: ['fruit'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-mango', name: 'Mango', serving: '165 g', calories: 99, protein: 1.4, carbs: 24.7, fat: 0.6, category: 'fruit', tags: ['fruit', 'tropical'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-avocado', name: 'Avocado', serving: '100 g', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, category: 'fruit', tags: ['fruit', 'healthy-fat'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },

  // ── Vegetables ───────────────────────────────────────────────────────────
  { id: 'f-broccoli', name: 'Broccoli', serving: '91 g', calories: 31, protein: 2.6, carbs: 6, fat: 0.3, category: 'vegetable', tags: ['vegetable', 'cruciferous'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-spinach', name: 'Spinach', serving: '30 g', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, category: 'vegetable', tags: ['vegetable', 'leafy'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-carrot', name: 'Carrot', serving: '61 g', calories: 25, protein: 0.6, carbs: 6, fat: 0.1, category: 'vegetable', tags: ['vegetable', 'root'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-bell-pepper', name: 'Bell pepper', serving: '119 g', calories: 31, protein: 1, carbs: 7.2, fat: 0.4, category: 'vegetable', tags: ['vegetable'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-cucumber', name: 'Cucumber', serving: '119 g', calories: 16, protein: 0.8, carbs: 3.8, fat: 0.1, category: 'vegetable', tags: ['vegetable'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-tomato', name: 'Tomato', serving: '123 g', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, category: 'vegetable', tags: ['vegetable'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-sweet-potato', name: 'Sweet potato', serving: '130 g', calories: 112, protein: 2, carbs: 26, fat: 0.1, category: 'vegetable', tags: ['vegetable', 'root'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-potato', name: 'Potato', serving: '173 g', calories: 161, protein: 4.3, carbs: 36.6, fat: 0.2, category: 'vegetable', tags: ['vegetable', 'root'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-onion', name: 'Onion', serving: '110 g', calories: 44, protein: 1.2, carbs: 10.3, fat: 0.1, category: 'vegetable', tags: ['vegetable'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-cauliflower', name: 'Cauliflower', serving: '107 g', calories: 27, protein: 2.1, carbs: 5.3, fat: 0.3, category: 'vegetable', tags: ['vegetable', 'cruciferous'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-courgette', name: 'Courgette', serving: '196 g', calories: 33, protein: 2.4, carbs: 6.1, fat: 0.6, category: 'vegetable', tags: ['vegetable', 'squash'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },

  // ── Grains ───────────────────────────────────────────────────────────────
  { id: 'f-white-rice', name: 'White rice, cooked', serving: '158 g', calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4, category: 'grain', tags: ['grain', 'rice'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-brown-rice', name: 'Brown rice, cooked', serving: '195 g', calories: 216, protein: 5, carbs: 45, fat: 1.8, category: 'grain', tags: ['grain', 'rice', 'wholegrain'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-oats', name: 'Rolled oats, dry', serving: '40 g', calories: 150, protein: 5, carbs: 27, fat: 3, category: 'grain', tags: ['grain', 'breakfast', 'wholegrain'], diet: ['vegetarian', 'vegan'] },
  { id: 'f-wholemeal-bread', name: 'Wholemeal bread', serving: '28 g', calories: 80, protein: 4, carbs: 14, fat: 1, category: 'grain', tags: ['grain', 'bread', 'wholegrain'], diet: ['vegetarian', 'vegan'] },
  { id: 'f-pasta', name: 'Pasta, cooked', serving: '140 g', calories: 220, protein: 8, carbs: 43, fat: 1.3, category: 'grain', tags: ['grain', 'pasta'], diet: ['vegetarian', 'vegan'] },
  { id: 'f-quinoa', name: 'Quinoa, cooked', serving: '185 g', calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6, category: 'grain', tags: ['grain', 'wholegrain'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-tortilla', name: 'Wholemeal tortilla', serving: '45 g', calories: 130, protein: 4, carbs: 22, fat: 3, category: 'grain', tags: ['grain', 'bread'], diet: ['vegetarian', 'vegan'] },
  { id: 'f-couscous', name: 'Couscous, cooked', serving: '157 g', calories: 176, protein: 6, carbs: 36, fat: 0.3, category: 'grain', tags: ['grain'], diet: ['vegetarian', 'vegan'] },

  // ── Protein ──────────────────────────────────────────────────────────────
  { id: 'f-chicken-breast', name: 'Chicken breast, grilled', serving: '100 g', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'protein', tags: ['meat', 'poultry'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-chicken-thigh', name: 'Chicken thigh, roasted', serving: '100 g', calories: 209, protein: 26, carbs: 0, fat: 10.9, category: 'protein', tags: ['meat', 'poultry'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-beef-steak', name: 'Beef steak', serving: '100 g', calories: 271, protein: 25, carbs: 0, fat: 19, category: 'protein', tags: ['meat', 'beef'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-salmon', name: 'Salmon fillet', serving: '100 g', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'protein', tags: ['fish', 'omega-3'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-tuna', name: 'Tuna, canned in water', serving: '142 g', calories: 179, protein: 39, carbs: 0, fat: 1.3, category: 'protein', tags: ['fish'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-shrimp', name: 'Shrimp', serving: '100 g', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, category: 'protein', tags: ['seafood'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-egg', name: 'Egg', serving: '50 g', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, category: 'protein', tags: ['eggs'], diet: ['vegetarian', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-egg-whites', name: 'Egg whites', serving: '99 g', calories: 51, protein: 10.8, carbs: 0.7, fat: 0.2, category: 'protein', tags: ['eggs'], diet: ['vegetarian', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-tofu', name: 'Tofu, firm', serving: '100 g', calories: 144, protein: 17.3, carbs: 2.8, fat: 8.7, category: 'protein', tags: ['soy'], diet: ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-black-beans', name: 'Black beans, cooked', serving: '172 g', calories: 227, protein: 15.2, carbs: 40.8, fat: 0.9, category: 'protein', tags: ['legume'], diet: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
  { id: 'f-chickpeas', name: 'Chickpeas, cooked', serving: '164 g', calories: 269, protein: 14.5, carbs: 45, fat: 4.3, category: 'protein', tags: ['legume'], diet: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
  { id: 'f-lentils', name: 'Lentils, cooked', serving: '198 g', calories: 230, protein: 17.9, carbs: 39.9, fat: 0.8, category: 'protein', tags: ['legume'], diet: ['vegetarian', 'vegan', 'gluten-free', 'high-protein'] },
  { id: 'f-turkey', name: 'Turkey breast', serving: '100 g', calories: 135, protein: 30, carbs: 0, fat: 1, category: 'protein', tags: ['meat', 'poultry'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-tempeh', name: 'Tempeh', serving: '100 g', calories: 192, protein: 20.3, carbs: 7.6, fat: 10.8, category: 'protein', tags: ['soy'], diet: ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-whey', name: 'Whey protein', serving: '30 g', calories: 120, protein: 24, carbs: 3, fat: 1.5, category: 'protein', tags: ['supplement'], diet: ['vegetarian', 'gluten-free', 'high-protein', 'low-carb'] },

  // ── Dairy ────────────────────────────────────────────────────────────────
  { id: 'f-greek-yogurt', name: 'Greek yogurt, plain', serving: '170 g', calories: 100, protein: 17, carbs: 6, fat: 0.7, category: 'dairy', tags: ['dairy', 'fermented'], diet: ['vegetarian', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-milk', name: 'Milk, 2%', serving: '244 g', calories: 122, protein: 8.1, carbs: 11.7, fat: 4.8, category: 'dairy', tags: ['dairy'], diet: ['vegetarian', 'gluten-free'] },
  { id: 'f-cheddar', name: 'Cheddar cheese', serving: '28 g', calories: 113, protein: 6.5, carbs: 0.4, fat: 9.3, category: 'dairy', tags: ['dairy', 'cheese'], diet: ['vegetarian', 'gluten-free', 'low-carb'] },
  { id: 'f-cottage-cheese', name: 'Cottage cheese', serving: '113 g', calories: 92, protein: 12, carbs: 4.6, fat: 2.6, category: 'dairy', tags: ['dairy'], diet: ['vegetarian', 'gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-almond-milk', name: 'Almond milk, unsweetened', serving: '240 ml', calories: 30, protein: 1, carbs: 1, fat: 2.5, category: 'dairy', tags: ['plant-milk'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-butter', name: 'Butter', serving: '14 g', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, category: 'dairy', tags: ['dairy', 'fat'], diet: ['vegetarian', 'gluten-free', 'low-carb'] },

  // ── Fats ─────────────────────────────────────────────────────────────────
  { id: 'f-olive-oil', name: 'Olive oil', serving: '14 g', calories: 119, protein: 0, carbs: 0, fat: 13.5, category: 'fat', tags: ['oil', 'healthy-fat'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-almonds', name: 'Almonds', serving: '28 g', calories: 164, protein: 6, carbs: 6.1, fat: 14.2, category: 'fat', tags: ['nuts', 'healthy-fat'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-peanut-butter', name: 'Peanut butter', serving: '32 g', calories: 188, protein: 8, carbs: 6.9, fat: 16, category: 'fat', tags: ['nuts'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-walnuts', name: 'Walnuts', serving: '28 g', calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5, category: 'fat', tags: ['nuts', 'omega-3'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-chia', name: 'Chia seeds', serving: '12 g', calories: 58, protein: 2, carbs: 5, fat: 3.7, category: 'fat', tags: ['seeds'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },

  // ── Drinks ───────────────────────────────────────────────────────────────
  { id: 'f-coffee', name: 'Black coffee', serving: '240 ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, category: 'drink', tags: ['caffeine'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-green-tea', name: 'Green tea', serving: '240 ml', calories: 2, protein: 0, carbs: 0.5, fat: 0, category: 'drink', tags: ['caffeine'], diet: ['vegetarian', 'vegan', 'gluten-free', 'low-carb'] },
  { id: 'f-orange-juice', name: 'Orange juice', serving: '248 ml', calories: 112, protein: 1.7, carbs: 25.8, fat: 0.5, category: 'drink', tags: ['juice'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-cola', name: 'Cola', serving: '355 ml', calories: 140, protein: 0, carbs: 39, fat: 0, category: 'drink', tags: ['soft-drink'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-beer', name: 'Beer', serving: '355 ml', calories: 153, protein: 1.6, carbs: 12.6, fat: 0, category: 'drink', tags: ['alcohol'], diet: ['vegetarian', 'vegan'] },

  // ── Snacks ───────────────────────────────────────────────────────────────
  { id: 'f-dark-chocolate', name: 'Dark chocolate, 70%', serving: '30 g', calories: 170, protein: 2.2, carbs: 13, fat: 12, category: 'snack', tags: ['sweet'], diet: ['vegetarian', 'gluten-free'] },
  { id: 'f-potato-chips', name: 'Potato chips', serving: '28 g', calories: 152, protein: 2, carbs: 15, fat: 10, category: 'snack', tags: ['crisps'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-granola-bar', name: 'Granola bar', serving: '40 g', calories: 190, protein: 5, carbs: 29, fat: 7, category: 'snack', tags: ['bar'], diet: ['vegetarian'] },
  { id: 'f-popcorn', name: 'Popcorn, air-popped', serving: '24 g', calories: 93, protein: 3, carbs: 18.7, fat: 1.1, category: 'snack', tags: ['wholegrain'], diet: ['vegetarian', 'vegan', 'gluten-free'] },
  { id: 'f-hummus', name: 'Hummus', serving: '30 g', calories: 71, protein: 2, carbs: 6, fat: 5, category: 'snack', tags: ['legume', 'dip'], diet: ['vegetarian', 'vegan', 'gluten-free'] },

  // ── Prepared meals ───────────────────────────────────────────────────────
  { id: 'f-caesar-salad', name: 'Chicken caesar salad', serving: '350 g', calories: 470, protein: 34, carbs: 12, fat: 32, category: 'prepared', tags: ['salad'], diet: ['gluten-free', 'high-protein', 'low-carb'] },
  { id: 'f-margherita-pizza', name: 'Margherita pizza', serving: '107 g', calories: 285, protein: 12, carbs: 36, fat: 10, category: 'prepared', tags: ['pizza'], diet: ['vegetarian'] },
  { id: 'f-beef-burrito', name: 'Beef burrito', serving: '300 g', calories: 580, protein: 26, carbs: 68, fat: 22, category: 'prepared', tags: ['wrap'], diet: ['high-protein'] },
  { id: 'f-salmon-roll', name: 'Salmon sushi roll', serving: '180 g', calories: 310, protein: 13, carbs: 42, fat: 9, category: 'prepared', tags: ['sushi'], diet: ['gluten-free'] },
  { id: 'f-veggie-stir-fry', name: 'Vegetable stir fry', serving: '300 g', calories: 260, protein: 9, carbs: 32, fat: 10, category: 'prepared', tags: ['stir-fry'], diet: ['vegetarian', 'vegan'] },
  { id: 'f-turkey-sandwich', name: 'Turkey sandwich', serving: '200 g', calories: 380, protein: 24, carbs: 42, fat: 12, category: 'prepared', tags: ['sandwich'], diet: ['high-protein'] },
];

// Micronutrients live in foodMicros.js so the entry lines stay readable.
export const FOODS = withMicros(FOODS_RAW);

export const FOOD_CATEGORIES = ['fruit', 'vegetable', 'grain', 'protein', 'dairy', 'fat', 'drink', 'snack', 'prepared'];
export const DIET_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'low-carb'];

export default FOODS;
