const supabase = require("../lib/supabase");
const egridLookup = require("../data/egrid-lookup.json");
const businessProfiles = require("../data/business-profiles.json");
const { getAirQuality } = require("../lib/airquality");
const { compareToBenchmark, co2Equivalencies, projectedSavings } = require("../lib/insights");
const logger = require("../lib/logger");

function findSubregion(zipCode) {
  const prefix = zipCode.slice(0, 3);
  for (const [code, region] of Object.entries(egridLookup)) {
    if (region.zip_prefixes.includes(prefix)) {
      return { code, ...region };
    }
  }
  // Fallback to national average if zip isn't matched
  return { code: "US_AVG", name: "US National Average", co2_rate: 0.387 };
}

function computeAnalysis(entry, profile, region) {
  const monthlyKwh = (profile.avg_kwh_per_sqft * entry.square_footage) / 12;
  const co2Lbs = monthlyKwh * region.co2_rate;

  const actions = profile.actions.map((a) => ({
    ...a,
    adopted: false,
  }));

  // Base score — lower is worse, adjusted by how clean the grid is
  const gridCleanlinessBonus = Math.max(0, Math.round((0.6 - region.co2_rate) * 20));
  const baseScore = Math.min(50, 30 + gridCleanlinessBonus);

  return {
    egrid_subregion: region.code,
    emission_factor: region.co2_rate,
    estimated_kwh: Math.round(monthlyKwh * 100) / 100,
    estimated_co2_lbs: Math.round(co2Lbs * 100) / 100,
    breakdown: profile.breakdown,
    actions,
    energy_score: baseScore,
    energy_grade: baseScore >= 45 ? "C" : "D",
  };
}

async function getEntries(req, res) {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "Couldn't load your entries — try again in a sec" });
  }

  res.json(data);
}

async function createEntry(req, res) {
  const { business_type, zip_code, square_footage, monthly_bill, operating_hours } = req.body;

  if (!business_type || !zip_code || !square_footage || !monthly_bill || !operating_hours) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const profile = businessProfiles[business_type];
  if (!profile) {
    return res.status(400).json({
      error: `Unknown business type "${business_type}" — try restaurant, retail, office, warehouse, or hotel`,
    });
  }

  const region = findSubregion(zip_code);
  const analysis = computeAnalysis(
    { square_footage, monthly_bill, operating_hours },
    profile,
    region
  );

  // Fetch live air quality data — non-blocking, fails gracefully
  const airQuality = await getAirQuality(zip_code);

  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: req.user.id,
      business_type,
      zip_code,
      square_footage,
      monthly_bill,
      operating_hours,
      egrid_subregion: analysis.egrid_subregion,
      emission_factor: analysis.emission_factor,
      estimated_kwh: analysis.estimated_kwh,
      estimated_co2_lbs: analysis.estimated_co2_lbs,
      actions: analysis.actions,
      energy_score: analysis.energy_score,
      energy_grade: analysis.energy_grade,
    })
    .select()
    .single();

  if (error) {
    logger.error({ route: "POST /api/entries", message: "Insert failed", error: error.message });
    return res.status(500).json({
      error: "Couldn't save your entry — check that the entries table exists in Supabase",
    });
  }

  // Enrich response with insights (computed, not stored)
  const benchmark = compareToBenchmark(analysis.estimated_kwh, square_footage, profile);
  const equivalencies = co2Equivalencies(analysis.estimated_co2_lbs);
  const savings = projectedSavings(analysis.actions, analysis.estimated_kwh, analysis.estimated_co2_lbs, region.co2_rate);

  res.status(201).json({
    ...data,
    breakdown: analysis.breakdown,
    air_quality: airQuality,
    benchmark,
    equivalencies,
    savings,
  });
}

async function updateEntry(req, res) {
  const { id } = req.params;
  const { actions } = req.body;

  if (!actions) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  // Recalculate score from adopted actions
  const totalSavings = actions
    .filter((a) => a.adopted)
    .reduce((sum, a) => sum + a.savings_percent, 0);
  const newScore = Math.min(100, 40 + totalSavings * 3);
  const newGrade =
    newScore >= 90 ? "A" : newScore >= 75 ? "B" : newScore >= 60 ? "C" : newScore >= 40 ? "D" : "F";

  const { data, error } = await supabase
    .from("entries")
    .update({ actions, energy_score: newScore, energy_grade: newGrade })
    .eq("id", id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "Couldn't update — try again" });
  }

  if (!data) {
    return res.status(404).json({ error: "Entry not found or it's not yours" });
  }

  // Re-enrich with updated savings projections
  const profile = businessProfiles[data.business_type];
  const savings = projectedSavings(actions, data.estimated_kwh, data.estimated_co2_lbs, data.emission_factor);
  const equivalencies = co2Equivalencies(data.estimated_co2_lbs);

  res.json({ ...data, savings, equivalencies });
}

async function deleteEntry(req, res) {
  const { id } = req.params;

  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) {
    return res.status(500).json({ error: "Couldn't delete — try again" });
  }

  res.status(204).end();
}

async function getHistory(req, res) {
  const { data, error } = await supabase
    .from("entries")
    .select("id, business_type, zip_code, energy_score, energy_grade, estimated_kwh, estimated_co2_lbs, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({ error: "Couldn't load history" });
  }

  if (data.length < 2) {
    return res.json({
      entries: data,
      trend: null,
      message: "Submit at least 2 analyses to see your trend.",
    });
  }

  const first = data[0];
  const latest = data[data.length - 1];
  const scoreDelta = latest.energy_score - first.energy_score;
  const co2Delta = Math.round((latest.estimated_co2_lbs - first.estimated_co2_lbs) * 100) / 100;

  return res.json({
    entries: data,
    trend: {
      score_change: scoreDelta,
      co2_change_lbs: co2Delta,
      direction: scoreDelta > 0 ? "improving" : scoreDelta < 0 ? "declining" : "stable",
      message:
        scoreDelta > 0
          ? `Your energy score improved by ${scoreDelta} points since your first analysis.`
          : scoreDelta < 0
            ? `Your energy score dropped by ${Math.abs(scoreDelta)} points — review your action plan.`
            : "Your energy score is unchanged.",
    },
  });
}

module.exports = { getEntries, createEntry, updateEntry, deleteEntry, getHistory };
