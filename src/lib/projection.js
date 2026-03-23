/**
 * Wealth Projection Calculator
 * Calculates if user is on track to reach $20M net worth goal
 */

/**
 * Calculate future value using compound interest formula
 * FV = P * ((1 + r)^n - 1) / r
 * @param {number} monthlyAmount - Monthly investment amount
 * @param {number} annualRate - Annual interest rate (default 10%)
 * @param {number} years - Number of years to invest
 * @returns {number} Projected future value
 */
export function calculateFutureValue(monthlyAmount, annualRate = 0.10, years) {
  const r = annualRate / 12 // Monthly rate
  const n = years * 12 // Number of months

  if (r === 0) {
    return monthlyAmount * n
  }

  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r)
}

/**
 * Calculate projection to $20M goal
 * @param {number} monthlyInvestment - Monthly investment amount (savings + investing)
 * @param {number} currentAge - User's current age
 * @param {number} retirementAge - Target retirement age (default 65)
 * @param {number} currentNetWorth - Current net worth
 * @returns {object} Projection data
 */
export function projectToGoal(monthlyInvestment, currentAge, retirementAge = 65, currentNetWorth = 0) {
  const goal = 20000000
  const years = Math.max(retirementAge - currentAge, 1)
  const annualRate = 0.10 // 10% average annual return

  const investmentGains = calculateFutureValue(monthlyInvestment, annualRate, years)
  const projectedValue = currentNetWorth + investmentGains

  const onTrack = projectedValue >= goal
  const percentToGoal = Math.round((projectedValue / goal) * 100)

  // Calculate required monthly to hit goal
  let requiredMonthly = 0
  if (years > 0) {
    const r = annualRate / 12
    const n = years * 12
    requiredMonthly = (goal - currentNetWorth) / ((Math.pow(1 + r, n) - 1) / r)
  }

  return {
    currentNetWorth,
    projectedValue: Math.round(projectedValue),
    goal,
    onTrack,
    percentToGoal,
    years,
    monthlyInvestment,
    requiredMonthly: Math.round(requiredMonthly),
    shortfall: Math.max(0, goal - projectedValue),
    message: onTrack
      ? `🚀 On track! You'll reach $${(projectedValue / 1000000).toFixed(1)}M`
      : `⚠️ Short by $${((goal - projectedValue) / 1000000).toFixed(1)}M. Invest $${Math.round(requiredMonthly - monthlyInvestment)} more/month`
  }
}

/**
 * Simple projection for different monthly amounts
 * Returns as array for slider/calculator
 * @param {number} currentNetWorth
 * @param {number} currentAge
 * @param {number} retirementAge
 * @returns {array} Projection for $1k-$20k monthly increments
 */
export function generateProjectionRange(currentNetWorth = 0, currentAge = 30, retirementAge = 65) {
  const projections = []
  const step = 1000 // $1k increments

  for (let monthly = step; monthly <= 20000; monthly += step) {
    const proj = projectToGoal(monthly, currentAge, retirementAge, currentNetWorth)
    projections.push({
      monthlyAmount: monthly,
      projectedValue: proj.projectedValue,
      onTrack: proj.onTrack,
      percentToGoal: proj.percentToGoal
    })
  }

  return projections
}
