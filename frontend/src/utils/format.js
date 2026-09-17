// Utility to format currency in Indian Rupees (INR) using Indian Numbering System (e.g. ₹1,49,999)
export function formatINR(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export function formatINRWithDecimals(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
