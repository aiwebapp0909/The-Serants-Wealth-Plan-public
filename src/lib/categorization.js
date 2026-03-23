/**
 * Smart Transaction Categorization
 * Auto-tags transactions based on merchant names
 */

const categoryMappings = {
  'Transportation': [
    'uber', 'lyft', 'taxi', 'uber delivery', 'gas', 'chevron', 'shell', 
    'exxon', 'bp', 'parking', 'metro', 'bus', 'train', 'amtrak', 'delta',
    'united', 'southwest', 'airline', 'rental car', 'hertz', 'avis', 'cars'
  ],
  'Food': [
    'grocery', 'trader joe', 'whole foods', 'kroger', 'safeway', 'sprouts',
    'costco', 'target', 'walmart', 'supermarket', 'market', 'grocery store',
    'restaurant', 'coffee', 'starbucks', 'doordash', 'uber eats', 'grubhub',
    'chipotle', 'mcdonalds', 'pizza', 'pasta', 'cafe', 'bakery', 'deli',
    'food delivery', 'instacart', 'walmart grocery'
  ],
  'Dining': [
    'restaurant', 'cafe', 'bar', 'pub', 'bistro', 'dinner', 'lunch',
    'breakfast', 'brunch', 'grill', 'steakhouse', 'sushi', 'pizza',
    'burger', 'taco', 'ramen', 'thai', 'chinese', 'italian', 'mexican',
    'diner', 'tavern', 'lounge', 'club'
  ],
  'Entertainment': [
    'cinema', 'movie', 'theater', 'netflix', 'hulu', 'disney', 'spotify',
    'apple music', 'gaming', 'steam', 'playstation', 'xbox', 'concert',
    'ticket', 'sports', 'gym', 'fitness', 'yoga', 'massage', 'spa',
    'museum', 'amusement', 'park', 'zoo'
  ],
  'Utilities': [
    'electric', 'water', 'gas', 'power', 'utility', 'energy', 'verizon',
    'at&t', 'comcast', 't-mobile', 'phone', 'internet', 'cable',
    'trash', 'sewage'
  ],
  'Shopping': [
    'amazon', 'ebay', 'mall', 'retail', 'store', 'shop', 'clothing',
    'apparel', 'fashion', 'nike', 'adidas', 'zara', 'h&m', 'uniqlo',
    'macy', 'nordstrom', 'saks', 'gap', 'forever 21', 'urban outfitters'
  ],
  'Healthcare': [
    'pharmacy', 'cvs', 'walgreens', 'hospital', 'clinic', 'doctor',
    'dentist', 'dental', 'optometrist', 'medical', 'health', 'prescription',
    'medicine', 'drug'
  ],
  'Home': [
    'home depot', 'lowes', 'ikea', 'wayfair', 'furniture', 'paint',
    'hardware', 'lumber', 'tool', 'rent', 'landlord', 'mortgage',
    'property management'
  ],
  'Savings': [
    'transfer', 'savings', 'investment', 'broker', 'stock'
  ]
}

/**
 * Auto-categorize transaction based on merchant name
 * @param {string} merchantName - Name from transaction merchant
 * @param {string[]} categories - Available budget categories
 * @returns {string} Suggested category name
 */
export function autoTagTransaction(merchantName, categories = []) {
  if (!merchantName) return 'Other'

  const lowerMerchant = merchantName.toLowerCase()

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      if (lowerMerchant.includes(keyword.toLowerCase())) {
        // Return category if it exists in user's budget, otherwise continue
        if (categories.length === 0 || categories.includes(category)) {
          return category
        }
      }
    }
  }

  // Fallback to first available category or "Other"
  return categories.length > 0 ? categories[0] : 'Other'
}

/**
 * Get suggested category with confidence score
 * @param {string} merchantName - Transaction merchant
 * @returns {object} { category, confidence }
 */
export function suggestCategory(merchantName) {
  if (!merchantName) return { category: null, confidence: 0 }

  const lowerMerchant = merchantName.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      if (lowerMerchant.includes(keywordLower)) {
        // Score higher for longer keyword matches (more specific)
        const score = (keywordLower.length / lowerMerchant.length) * 100
        if (score > bestScore) {
          bestScore = score
          bestMatch = category
        }
      }
    }
  }

  // Confidence threshold: only suggest if match is reasonably strong
  const confidence = bestScore > 30 ? Math.min(bestScore, 95) : 0

  return {
    category: bestMatch,
    confidence: Math.round(confidence)
  }
}

/**
 * Get all available categories for selection
 */
export function getAllCategories() {
  return Object.keys(categoryMappings)
}

/**
 * Manual mapping user can customize
 * Load from user settings
 */
export function createCustomMappings(userOverrides = {}) {
  return {
    ...categoryMappings,
    ...userOverrides
  }
}
