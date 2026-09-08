/**
 * Payroll calculation service with Telangana professional tax slabs.
 * PT Slabs (Telangana):
 *  - ₹0 to ₹15,000: ₹0
 *  - ₹15,001 to ₹20,000: ₹150/month
 *  - ₹20,001 and above: ₹200/month
 */

function calculateProfessionalTax(grossSalary) {
  if (grossSalary <= 15000) return 0;
  if (grossSalary <= 20000) return 150;
  return 200;
}

/**
 * Calculate PF (Employee contribution): 12% of basic salary (capped at ₹15,000 basic).
 */
function calculatePF(basic) {
  const pfBasic = Math.min(basic, 15000);
  return Math.round(pfBasic * 0.12);
}

/**
 * Simplified TDS calculation (for payroll record — actual TDS would require annual projection).
 * Using flat 10% of net taxable income above exemption as approximation.
 */
function calculateTDS(annualTaxableIncome) {
  // Basic slab-based calculation (old regime simplified)
  let tax = 0;
  if (annualTaxableIncome <= 250000) {
    tax = 0;
  } else if (annualTaxableIncome <= 500000) {
    tax = (annualTaxableIncome - 250000) * 0.05;
  } else if (annualTaxableIncome <= 1000000) {
    tax = 12500 + (annualTaxableIncome - 500000) * 0.20;
  } else {
    tax = 112500 + (annualTaxableIncome - 1000000) * 0.30;
  }
  // Monthly TDS
  return Math.round(tax / 12);
}

/**
 * Build a complete payslip structure.
 */
function generatePayslipData({ basic, hra, allowances, other_deductions = 0 }) {
  const grossSalary = basic + hra + allowances;
  const pfDeduction = calculatePF(basic);
  const professionalTax = calculateProfessionalTax(grossSalary);

  // Annual taxable income for TDS = (Gross * 12) - standard deduction (50000) - PF*12
  const annualGross = grossSalary * 12;
  const annualTaxable = Math.max(0, annualGross - 50000 - pfDeduction * 12);
  const tds = calculateTDS(annualTaxable);

  const totalDeductions = pfDeduction + professionalTax + tds + other_deductions;
  const netPay = grossSalary - totalDeductions;

  return {
    basic,
    hra,
    allowances,
    gross_salary: grossSalary,
    pf_deduction: pfDeduction,
    professional_tax: professionalTax,
    tds,
    other_deductions,
    total_deductions: totalDeductions,
    net_pay: Math.max(0, netPay),
  };
}

module.exports = { generatePayslipData, calculateProfessionalTax, calculatePF, calculateTDS };
