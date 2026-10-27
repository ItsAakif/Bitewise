// Micronutrients for the base catalogue, per each food's stated serving.
//
// Only nutrients I can state with reasonable confidence are listed; anything
// omitted reads as "unknown" in the app rather than zero. Indian-diet gaps
// (iron, calcium, B12, folate, vitamin D) are filled wherever the food actually
// carries them.

const MICROS_BY_ID = {
  // Fruit
  'f-apple': { fiber: 4.4, sugar: 19, potassium: 195, vitaminC: 8.4 },
  'f-banana': { fiber: 3.1, sugar: 14.4, potassium: 422, vitaminC: 10.3, folate: 24 },
  'f-orange': { fiber: 3.1, sugar: 12.2, calcium: 52, potassium: 237, vitaminC: 70, folate: 39 },
  'f-strawberries': { fiber: 3, sugar: 7.4, calcium: 24, potassium: 233, vitaminC: 89, folate: 36 },
  'f-blueberries': { fiber: 3.6, sugar: 14.7, calcium: 9, potassium: 114, vitaminC: 14.4 },
  'f-grapes': { fiber: 1.4, sugar: 23.4, potassium: 288, vitaminC: 5.4 },
  'f-mango': { fiber: 2.6, sugar: 22.5, calcium: 18, potassium: 277, vitaminC: 60, folate: 71 },
  'f-avocado': { fiber: 6.7, sugar: 0.7, sodium: 7, calcium: 12, iron: 0.6, potassium: 485, vitaminC: 10, folate: 81 },

  // Vegetables
  'f-broccoli': { fiber: 2.4, sugar: 1.5, sodium: 30, calcium: 43, iron: 0.7, potassium: 288, vitaminC: 81, folate: 57 },
  'f-spinach': { fiber: 0.7, sugar: 0.1, sodium: 24, calcium: 30, iron: 0.8, magnesium: 24, potassium: 167, vitaminC: 8, folate: 58 },
  'f-carrot': { fiber: 1.7, sugar: 2.9, sodium: 42, calcium: 20, potassium: 195, vitaminC: 3.6, folate: 12 },
  'f-bell-pepper': { fiber: 2.5, sugar: 2.9, sodium: 4, calcium: 10, iron: 0.5, potassium: 251, vitaminC: 152, folate: 53 },
  'f-cucumber': { fiber: 0.6, sugar: 2, sodium: 2, calcium: 19, potassium: 176, vitaminC: 3.4 },
  'f-tomato': { fiber: 1.5, sugar: 3.2, sodium: 6, calcium: 12, potassium: 292, vitaminC: 17, folate: 18 },
  'f-sweet-potato': { fiber: 3.9, sugar: 5.4, sodium: 46, calcium: 39, iron: 0.8, potassium: 438, vitaminC: 3.1 },
  'f-potato': { fiber: 3.8, sugar: 1.3, sodium: 10, calcium: 21, iron: 1.4, potassium: 941, vitaminC: 16.6 },
  'f-onion': { fiber: 1.9, sugar: 4.7, sodium: 4, calcium: 25, potassium: 161, vitaminC: 8.1, folate: 21 },
  'f-cauliflower': { fiber: 2.1, sugar: 2, sodium: 32, calcium: 23, potassium: 320, vitaminC: 51, folate: 61 },
  'f-courgette': { fiber: 2, sugar: 3.1, sodium: 16, calcium: 32, potassium: 512, vitaminC: 35, folate: 47 },

  // Grains
  'f-white-rice': { fiber: 0.6, sugar: 0.1, sodium: 2, calcium: 15, iron: 1.9, potassium: 55, folate: 3 },
  'f-brown-rice': { fiber: 3.5, sugar: 0.7, sodium: 10, calcium: 20, iron: 1.5, magnesium: 84, potassium: 154, folate: 8 },
  'f-oats': { fiber: 4.1, sugar: 0.4, sodium: 2, calcium: 21, iron: 1.7, magnesium: 59, potassium: 152, folate: 22 },
  'f-wholemeal-bread': { fiber: 2, sugar: 1.4, sodium: 120, calcium: 30, iron: 1, potassium: 70, folate: 20 },
  'f-pasta': { fiber: 2.5, sugar: 0.8, sodium: 1, calcium: 10, iron: 1.3, potassium: 63, folate: 91 },
  'f-quinoa': { fiber: 5.2, sugar: 1.6, sodium: 13, calcium: 31, iron: 2.8, magnesium: 118, potassium: 318, folate: 78 },
  'f-tortilla': { fiber: 2.5, sugar: 1, sodium: 320, calcium: 60, iron: 1.4, potassium: 80 },
  'f-couscous': { fiber: 2.2, sugar: 0.2, sodium: 8, calcium: 13, iron: 0.6, potassium: 91, folate: 24 },

  // Protein
  'f-chicken-breast': { sodium: 74, calcium: 15, iron: 1, zinc: 1, magnesium: 29, potassium: 256, vitaminB12: 0.3, folate: 4 },
  'f-chicken-thigh': { sodium: 95, calcium: 12, iron: 1.3, zinc: 2.2, magnesium: 23, potassium: 259, vitaminB12: 0.4 },
  'f-beef-steak': { sodium: 60, calcium: 18, iron: 2.6, zinc: 4.8, magnesium: 21, potassium: 318, vitaminB12: 1.5 },
  'f-salmon': { sodium: 59, calcium: 12, iron: 0.4, zinc: 0.5, potassium: 363, vitaminB12: 2.8, vitaminD: 10.9 },
  'f-tuna': { sodium: 320, calcium: 14, iron: 1.3, zinc: 0.6, potassium: 337, vitaminB12: 2.5, vitaminD: 1.9 },
  'f-shrimp': { sodium: 111, calcium: 64, iron: 0.5, zinc: 1.6, potassium: 259, vitaminB12: 1.4 },
  'f-egg': { sodium: 71, calcium: 28, iron: 0.9, zinc: 0.6, potassium: 69, vitaminB12: 0.45, folate: 24, vitaminD: 1.1 },
  'f-egg-whites': { sodium: 166, calcium: 7, potassium: 163, folate: 4 },
  'f-tofu': { fiber: 2.3, sodium: 14, calcium: 350, iron: 5.4, zinc: 1.6, magnesium: 58, potassium: 237, folate: 29 },
  'f-black-beans': { fiber: 15, sugar: 0.6, sodium: 2, calcium: 46, iron: 3.6, zinc: 1.9, magnesium: 120, potassium: 611, folate: 256 },
  'f-chickpeas': { fiber: 12.5, sugar: 7.9, sodium: 11, calcium: 80, iron: 4.7, zinc: 2.5, magnesium: 78, potassium: 477, folate: 282 },
  'f-lentils': { fiber: 15.6, sugar: 3.6, sodium: 4, calcium: 38, iron: 6.6, zinc: 2.5, magnesium: 71, potassium: 731, folate: 358 },
  'f-turkey': { sodium: 63, calcium: 11, iron: 1, zinc: 1.7, potassium: 295, vitaminB12: 0.4 },
  'f-tempeh': { fiber: 3.8, sodium: 9, calcium: 111, iron: 2.7, zinc: 1.1, magnesium: 81, potassium: 412, vitaminB12: 0.1 },
  'f-whey': { calcium: 100, sodium: 50, potassium: 160 },

  // Dairy
  'f-greek-yogurt': { sugar: 6, sodium: 60, calcium: 190, potassium: 240, vitaminB12: 0.8, folate: 12 },
  'f-milk': { sugar: 11.7, sodium: 115, calcium: 293, potassium: 388, vitaminB12: 1.1, vitaminD: 2.9 },
  'f-cheddar': { sodium: 180, calcium: 200, zinc: 0.9, potassium: 28, vitaminB12: 0.2, vitaminD: 0.2 },
  'f-cottage-cheese': { sodium: 320, calcium: 90, potassium: 90, vitaminB12: 0.5 },
  'f-almond-milk': { calcium: 120, potassium: 40, vitaminD: 2.5, vitaminB12: 0.7 },
  'f-butter': { sodium: 90, calcium: 3, vitaminD: 0.2 },

  // Fats
  'f-olive-oil': { vitaminD: 0 },
  'f-almonds': { fiber: 3.5, sugar: 1.2, sodium: 1, calcium: 76, iron: 1, zinc: 0.9, magnesium: 76, potassium: 208, folate: 14 },
  'f-peanut-butter': { fiber: 1.6, sugar: 3.4, sodium: 150, calcium: 17, iron: 0.6, zinc: 0.9, magnesium: 50, potassium: 190, folate: 28 },
  'f-walnuts': { fiber: 1.9, sugar: 0.7, sodium: 1, calcium: 28, iron: 0.8, magnesium: 45, potassium: 125, folate: 28 },
  'f-chia': { fiber: 4.1, calcium: 77, iron: 0.9, magnesium: 40, potassium: 49 },

  // Drinks
  'f-coffee': { sodium: 5, potassium: 116 },
  'f-green-tea': { sodium: 2, potassium: 20 },
  'f-orange-juice': { sugar: 20.8, sodium: 5, calcium: 27, potassium: 496, vitaminC: 124, folate: 74 },
  'f-cola': { sugar: 39, sodium: 15, potassium: 10 },
  'f-beer': { sodium: 14, potassium: 96, folate: 21 },

  // Snacks
  'f-dark-chocolate': { fiber: 3.1, sugar: 7, sodium: 6, calcium: 22, iron: 3.6, magnesium: 64, potassium: 203 },
  'f-potato-chips': { fiber: 1.2, sugar: 0.2, sodium: 150, calcium: 7, iron: 0.5, potassium: 330, vitaminC: 8 },
  'f-granola-bar': { fiber: 3, sugar: 12, sodium: 100, calcium: 40, iron: 1.2, potassium: 120 },
  'f-popcorn': { fiber: 3.5, sugar: 0.2, sodium: 2, calcium: 2, iron: 0.8, potassium: 74 },
  'f-hummus': { fiber: 1.8, sugar: 0.9, sodium: 120, calcium: 12, iron: 0.8, magnesium: 21, potassium: 70, folate: 24 },

  // Prepared
  'f-caesar-salad': { fiber: 1.6, sugar: 3.4, sodium: 780, calcium: 160, iron: 1.4, potassium: 380, vitaminB12: 0.4, folate: 60 },
  'f-margherita-pizza': { fiber: 2.3, sugar: 3.4, sodium: 640, calcium: 190, iron: 2.2, potassium: 180, folate: 40 },
  'f-beef-burrito': { fiber: 6.4, sugar: 4, sodium: 980, calcium: 120, iron: 3.4, zinc: 3.2, potassium: 520, vitaminB12: 0.9, folate: 70 },
  'f-salmon-roll': { fiber: 1.4, sugar: 6, sodium: 620, calcium: 30, iron: 0.9, zinc: 0.6, potassium: 280, vitaminB12: 1.4, vitaminD: 3 },
  'f-veggie-stir-fry': { fiber: 5.2, sugar: 6, sodium: 700, calcium: 70, iron: 2, magnesium: 50, potassium: 560, vitaminC: 40, folate: 80 },
  'f-turkey-sandwich': { fiber: 3.4, sugar: 5, sodium: 900, calcium: 110, iron: 2.2, zinc: 1.6, potassium: 380, folate: 50 },
};

/** Merge the table above into the catalogue without touching the entry lines. */
export function withMicros(foods) {
  return foods.map((food) =>
    food.micros ? food : { ...food, micros: MICROS_BY_ID[food.id] }
  );
}

export default MICROS_BY_ID;
