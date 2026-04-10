"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail Store" },
  { value: "office", label: "Office Building" },
  { value: "warehouse", label: "Warehouse" },
  { value: "hotel", label: "Hotel" },
];

interface AirQuality {
  aqi: number;
  category: string;
  category_number: number;
  primary_pollutant: string;
  reporting_area: string;
  state: string;
  observed_at: string;
  all_pollutants: { name: string; aqi: number; category: string }[];
}

interface AnalysisResult {
  id: string;
  business_type: string;
  zip_code: string;
  square_footage: number;
  monthly_bill: number;
  operating_hours: number;
  egrid_subregion: string;
  emission_factor: number;
  estimated_kwh: number;
  estimated_co2_lbs: number;
  breakdown: Record<string, number>;
  actions: ActionItem[];
  energy_score: number;
  energy_grade: string;
  air_quality: AirQuality | null;
}

interface ActionItem {
  id: string;
  label: string;
  savings_percent: number;
  category: string;
  adopted: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("analyze");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Form state
  const [businessType, setBusinessType] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [sqft, setSqft] = useState("");
  const [monthlyBill, setMonthlyBill] = useState("");
  const [hours, setHours] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
    });
  }, []);

  async function getAuthHeader() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token}` };
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_URL}/api/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          business_type: businessType,
          zip_code: zipCode,
          square_footage: Number(sqft),
          monthly_bill: Number(monthlyBill),
          operating_hours: Number(hours),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      const data = await res.json();
      setAnalysis(data);
      setActiveTab("actions");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Couldn't reach the server — is it running on port 4000?";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAction(actionId: string) {
    if (!analysis) return;

    const updated = analysis.actions.map((a) =>
      a.id === actionId ? { ...a, adopted: !a.adopted } : a
    );

    // Recalculate score based on adopted actions
    const totalSavings = updated
      .filter((a) => a.adopted)
      .reduce((sum, a) => sum + a.savings_percent, 0);
    const newScore = Math.min(100, 40 + totalSavings * 3);
    const newGrade =
      newScore >= 90 ? "A" : newScore >= 75 ? "B" : newScore >= 60 ? "C" : newScore >= 40 ? "D" : "F";

    setAnalysis({
      ...analysis,
      actions: updated,
      energy_score: newScore,
      energy_grade: newGrade,
    });

    // Persist to server
    try {
      const headers = await getAuthHeader();
      await fetch(`${API_URL}/api/entries/${analysis.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ actions: updated }),
      });
    } catch {
      // Optimistic update — server sync is best-effort during the hackathon
    }
  }

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Analyze your energy footprint and build a plan to reduce it.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="analyze" className="cursor-pointer">
            Analyze
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="cursor-pointer"
            disabled={!analysis}
          >
            Action Plan
          </TabsTrigger>
          <TabsTrigger
            value="score"
            className="cursor-pointer"
            disabled={!analysis}
          >
            Score &amp; Report
          </TabsTrigger>
        </TabsList>

        {/* ── Analyze Tab ── */}
        <TabsContent value="analyze">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Tell us about your business
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business type</Label>
                    <Select
                      value={businessType}
                      onValueChange={(v) => setBusinessType(v ?? "")}
                      required
                    >
                      <SelectTrigger id="businessType" className="cursor-pointer">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((t) => (
                          <SelectItem
                            key={t.value}
                            value={t.value}
                            className="cursor-pointer"
                          >
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip code</Label>
                    <Input
                      id="zipCode"
                      placeholder="e.g. 94107"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                      maxLength={5}
                      pattern="[0-9]{5}"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square footage</Label>
                    <Input
                      id="sqft"
                      type="number"
                      placeholder="e.g. 2500"
                      value={sqft}
                      onChange={(e) => setSqft(e.target.value)}
                      required
                      min={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyBill">Monthly energy bill ($)</Label>
                    <Input
                      id="monthlyBill"
                      type="number"
                      placeholder="e.g. 800"
                      value={monthlyBill}
                      onChange={(e) => setMonthlyBill(e.target.value)}
                      required
                      min={1}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="hours">Operating hours per week</Label>
                    <Input
                      id="hours"
                      type="number"
                      placeholder="e.g. 60"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      required
                      min={1}
                      max={168}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !businessType}
                  className="cursor-pointer font-semibold"
                  style={{ background: "var(--color-cta)", color: "white" }}
                >
                  {loading ? "Crunching numbers..." : "Analyze"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Action Plan Tab ── */}
        <TabsContent value="actions">
          {analysis && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">
                    Your energy breakdown
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    EPA eGRID subregion:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {analysis.egrid_subregion}
                    </span>{" "}
                    — {analysis.emission_factor} lbs CO₂/kWh
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Est. monthly kWh
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {analysis.estimated_kwh.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Est. monthly CO₂
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {analysis.estimated_co2_lbs.toLocaleString()} lbs
                      </p>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Energy score
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {analysis.energy_score}/100
                      </p>
                    </div>
                  </div>

                  {analysis.breakdown && (
                    <div className="mt-6 space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Energy by category
                      </p>
                      {Object.entries(analysis.breakdown).map(
                        ([category, percent]) => (
                          <div key={category} className="flex items-center gap-3">
                            <span className="w-28 text-sm capitalize text-muted-foreground">
                              {category}
                            </span>
                            <Progress value={percent as number} className="flex-1" />
                            <span className="w-10 text-right text-sm font-mono text-foreground">
                              {percent}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Live AirNow data */}
                  {analysis.air_quality && (
                    <AirQualityWidget aq={analysis.air_quality} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">
                    Toggle actions to build your plan
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Each action updates your score in real time.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors duration-200 hover:bg-muted/30"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {action.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <Badge variant="secondary" className="mr-2">
                              {action.category}
                            </Badge>
                            ~{action.savings_percent}% savings
                          </p>
                        </div>
                        <Switch
                          checked={action.adopted}
                          onCheckedChange={() => toggleAction(action.id)}
                          className="cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Score & Report Tab ── */}
        <TabsContent value="score">
          {analysis && (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-col items-center py-10">
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-full font-heading text-5xl font-bold text-white"
                    style={{
                      background:
                        analysis.energy_grade === "A" || analysis.energy_grade === "B"
                          ? "#16a34a"
                          : analysis.energy_grade === "C"
                            ? "var(--color-cta)"
                            : "#dc2626",
                    }}
                  >
                    {analysis.energy_grade}
                  </div>
                  <p className="mt-4 font-heading text-2xl font-bold text-foreground">
                    Energy Score: {analysis.energy_score}/100
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {analysis.actions.filter((a) => a.adopted).length} of{" "}
                    {analysis.actions.length} actions adopted
                  </p>
                  <Progress value={analysis.energy_score} className="mt-4 w-64" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Your{" "}
                    <span className="font-medium text-foreground">
                      {analysis.business_type}
                    </span>{" "}
                    in zip code{" "}
                    <span className="font-mono font-medium text-foreground">
                      {analysis.zip_code}
                    </span>{" "}
                    (eGRID:{" "}
                    <span className="font-mono">{analysis.egrid_subregion}</span>)
                    uses an estimated{" "}
                    <span className="font-medium text-foreground">
                      {analysis.estimated_kwh.toLocaleString()} kWh/month
                    </span>
                    , producing{" "}
                    <span className="font-medium text-foreground">
                      {analysis.estimated_co2_lbs.toLocaleString()} lbs CO₂/month
                    </span>
                    .
                  </p>
                  {analysis.actions.filter((a) => a.adopted).length > 0 && (
                    <div>
                      <p className="font-medium text-foreground">
                        Adopted actions:
                      </p>
                      <ul className="mt-1 list-inside list-disc">
                        {analysis.actions
                          .filter((a) => a.adopted)
                          .map((a) => (
                            <li key={a.id}>{a.label}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <p className="rounded-lg bg-muted/50 p-3 text-xs">
                    This analysis uses EPA eGRID emission factors for the{" "}
                    {analysis.egrid_subregion} subregion. Actual savings depend
                    on implementation specifics and local utility rates.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

// ── AQI category → color mapping ──────────────────────────────────────────────
const AQI_COLORS: Record<number, { bg: string; text: string; bar: string }> = {
  1: { bg: "#dcfce7", text: "#15803d", bar: "#16a34a" },   // Good — green
  2: { bg: "#fef9c3", text: "#854d0e", bar: "#ca8a04" },   // Moderate — yellow
  3: { bg: "#ffedd5", text: "#9a3412", bar: "#ea580c" },   // USG — orange
  4: { bg: "#fee2e2", text: "#991b1b", bar: "#dc2626" },   // Unhealthy — red
  5: { bg: "#f3e8ff", text: "#6b21a8", bar: "#9333ea" },   // Very Unhealthy — purple
  6: { bg: "#1c1917", text: "#fafaf9", bar: "#7c3aed" },   // Hazardous — maroon
};

function AirQualityWidget({ aq }: { aq: AirQuality }) {
  const colors = AQI_COLORS[aq.category_number] ?? AQI_COLORS[1];

  return (
    <div
      className="mt-6 rounded-xl p-4"
      style={{ background: colors.bg }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: colors.text }}
          >
            Live air quality — {aq.reporting_area}, {aq.state}
          </p>
          <p
            className="mt-1 font-heading text-3xl font-bold"
            style={{ color: colors.text }}
          >
            AQI {aq.aqi}
            <span className="ml-2 text-base font-medium">{aq.category}</span>
          </p>
          <p className="mt-0.5 text-xs" style={{ color: colors.text, opacity: 0.75 }}>
            Primary: {aq.primary_pollutant} · {aq.observed_at}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {aq.all_pollutants.map((p) => (
            <div
              key={p.name}
              className="rounded-lg px-3 py-2 text-center"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              <p
                className="font-heading text-lg font-bold"
                style={{ color: colors.text }}
              >
                {p.aqi}
              </p>
              <p className="text-xs font-medium" style={{ color: colors.text, opacity: 0.75 }}>
                {p.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs" style={{ color: colors.text, opacity: 0.7 }}>
        Reducing your energy use lowers demand on local power plants — a direct
        driver of the pollution measured here. Source: EPA AirNow.
      </p>
    </div>
  );
}
