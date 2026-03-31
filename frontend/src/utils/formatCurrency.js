/**
 * Format number to Indian currency format
 * @param {number} value
 * @param {boolean} short - If true, use L/Cr format
 * @returns {string}
 */
export const formatINR = (value, short = false) => {
  if (!value || isNaN(value)) return "₹0"

  const num = parseFloat(value)

  if (short) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`
    return `₹${num.toFixed(0)}`
  }

  // Full Indian number format: ₹12,53,650
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format area with unit
 * @param {number} sqft
 * @param {string} unit - "sqft" or "m2"
 * @returns {string}
 */
export const formatArea = (sqft, unit = "sqft") => {
  if (!sqft) return "0 sq ft"

  if (unit === "m2") {
    const m2 = sqft / 10.7639
    return `${m2.toFixed(1)} m²`
  }

  return `${Math.round(sqft).toLocaleString("en-IN")} sq ft`
}