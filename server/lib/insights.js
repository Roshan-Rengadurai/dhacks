/**
 * Insight enrichment layer — comparative benchmarking, CO2 equivalencies,
 * and projected savings calculations.
 *
 * Sources for equivalency factors:
 *   EPA GHG Equivalencies Calculator
 *   https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator
 */

const CO2_PER_MILE_DRIVEN = 0.89;      // lbs CO2 per mile (avg passenger vehicle)
const CO2_PER_TREE_PER_YEAR = 48.1;    // lbs CO2 absorbed by one urban tree per year
const CO2_PER_PHONE_CHARGE = 0.0176;   // lbs CO2 per smartphone charge
const CO2_PER_GALLON_GAS = 19.6;       // lbs CO2 per gallon of gasoline burned
const AVG_ELECTRICITY_RATE = 0.16;     // $ per kWh national avg (EIA 2025 commercial)

/**
 * Compare this business to the national average for its type.
 * Returns a human-readable benchmark object.
 */
function compareToBenchmark(estimatedKwh, squareFootage, profile) {
  const actualKwhPerSqft = (estimatedKwh * 12) / squareFootage; // annualized
  const avgKwhPerSqft = profile.avg_kwh_per_sqft;
  const diffPercent = Math.round(((actualKwhPerSqft - avgKwhPerSqft) / avgKwhPerSqft) * 100);

  let assessment;
  if (diffPercent <= -15) assessment = "well_below_average";
  else if (diffPercent <= -5) assessment = "below_average";
  else if (diffPercent <= 5) assessment = "average";
  else if (diffPercent <= 15) assessment = "above_average";
  else assessment = "well_above_average";

  return {
    your_kwh_per_sqft: Math.round(actualKwhPerSqft * 100) / 100,
    avg_kwh_per_sqft: avgKwhPerSqft,
    diff_percent: diffPercent,
    assessment,
    message:
      diffPercent > 0
        ? `Your ${profile.label.toLowerCase()} uses ${Math.abs(diffPercent)}% more energy per sq ft than the national average.`
        : diffPercent < 0
          ? `Your ${profile.label.toLowerCase()} uses ${Math.abs(diffPercent)}% less energy per sq ft than the national average.`
          : `Your ${profile.label.toLowerCase()} is right at the national average for energy use.`,
  };
}

/**
 * Translate a CO2 figure (lbs/month) into relatable real-world equivalencies.
 */
function co2Equivalencies(co2Lbs) {
  const annual = co2Lbs * 12;
  return {
    monthly_co2_lbs: Math.round(co2Lbs * 100) / 100,
    annual_co2_lbs: Math.round(annual * 100) / 100,
    miles_driven: Math.round(annual / CO2_PER_MILE_DRIVEN),
    trees_needed_to_offset: Math.round(annual / CO2_PER_TREE_PER_YEAR * 10) / 10,
    gallons_of_gas: Math.round(annual / CO2_PER_GALLON_GAS),
    phone_charges: Math.round(annual / CO2_PER_PHONE_CHARGE),
  };
}

/**
 * Given a list of actions and their adopted state, project annual dollar
 * and CO2 savings.
 */
function projectedSavings(actions, estimatedKwh, co2Lbs, emissionFactor) {
  const adoptedSavingsPercent = actions
    .filter((a) => a.adopted)
    .reduce((sum, a) => sum + a.savings_percent, 0);
  const potentialSavingsPercent = actions
    .reduce((sum, a) => sum + a.savings_percent, 0);

  const monthlySavedKwh = estimatedKwh * (adoptedSavingsPercent / 100);
  const monthlyPotentialKwh = estimatedKwh * (potentialSavingsPercent / 100);

  return {
    adopted: {
      savings_percent: adoptedSavingsPercent,
      monthly_kwh_saved: Math.round(monthlySavedKwh * 100) / 100,
      annual_kwh_saved: Math.round(monthlySavedKwh * 12 * 100) / 100,
      annual_dollars_saved: Math.round(monthlySavedKwh * 12 * AVG_ELECTRICITY_RATE * 100) / 100,
      annual_co2_lbs_avoided: Math.round(monthlySavedKwh * 12 * emissionFactor * 100) / 100,
    },
    potential: {
      savings_percent: potentialSavingsPercent,
      monthly_kwh_saved: Math.round(monthlyPotentialKwh * 100) / 100,
      annual_kwh_saved: Math.round(monthlyPotentialKwh * 12 * 100) / 100,
      annual_dollars_saved: Math.round(monthlyPotentialKwh * 12 * AVG_ELECTRICITY_RATE * 100) / 100,
      annual_co2_lbs_avoided: Math.round(monthlyPotentialKwh * 12 * emissionFactor * 100) / 100,
    },
  };
}

module.exports = { compareToBenchmark, co2Equivalencies, projectedSavings };
