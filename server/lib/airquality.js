const AIRNOW_BASE = "https://www.airnowapi.org/aq/observation/zipCode/current";

/**
 * Fetch current AQI observations for a zip code from AirNow.
 * Returns an array like:
 *   [{ ParameterName: 'PM2.5', AQI: 22, Category: { Name: 'Good' }, ReportingArea: 'San Francisco', ... }]
 *
 * Returns null if the request fails or no data is available (rural zip, etc.)
 */
async function getAirQuality(zipCode) {
  const key = process.env.AIRNOW_API_KEY;
  if (!key) return null;

  const url = new URL(AIRNOW_BASE);
  url.searchParams.set("format", "application/json");
  url.searchParams.set("zipCode", zipCode);
  url.searchParams.set("distance", "25");
  url.searchParams.set("API_KEY", key);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Pick the worst (highest AQI) reading as the headline number
    const sorted = [...data].sort((a, b) => b.AQI - a.AQI);
    const worst = sorted[0];

    return {
      aqi: worst.AQI,
      category: worst.Category.Name,
      category_number: worst.Category.Number,
      primary_pollutant: worst.ParameterName,
      reporting_area: worst.ReportingArea,
      state: worst.StateCode,
      observed_at: `${worst.DateObserved} ${worst.HourObserved}:00 ${worst.LocalTimeZone}`,
      all_pollutants: data.map((d) => ({
        name: d.ParameterName,
        aqi: d.AQI,
        category: d.Category.Name,
      })),
    };
  } catch {
    return null;
  }
}

module.exports = { getAirQuality };
