import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <div
          className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, var(--color-cta) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full opacity-[0.05]"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Built for Divergent Hacks 2026
            </span>

            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Stop wasting energy.
              <br />
              <span style={{ color: "var(--color-cta)" }}>
                Start saving money.
              </span>
            </h1>

            <div className="max-w-2xl space-y-3 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              <p>
                Terrain pulls real EPA eGRID data by ZIP code to calculate your
                business&apos;s energy footprint and CO₂ impact using your actual
                utility grid&apos;s emission factor.
              </p>
              <p>
                Toggle proven actions like LED retrofits or fridge tune-ups to
                see live savings and score updates — California grid savings
                differ 2.7X from Midwest.
              </p>
              <p>
                Your personalized action plan ranks highest-ROI fixes for your
                location, turning energy waste into immediate profit.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="cursor-pointer text-base font-semibold"
                  style={{
                    background: "var(--color-cta)",
                    color: "white",
                  }}
                >
                  Get your energy score
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer text-base"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — Bento grid */}
      <section className="border-t border-border/40 bg-card/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Three steps to understand your footprint and start cutting it.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 — tall */}
            <div className="row-span-2 flex flex-col justify-between rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-8">
              <div>
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg font-heading text-lg font-bold text-white"
                  style={{ background: "var(--color-primary)" }}
                >
                  1
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Tell us about your business
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Select your business type, enter your zip code, square
                  footage, and monthly energy bill. We map your zip to an EPA
                  eGRID subregion to get your local emission factor — because a
                  restaurant in California has a very different carbon math than
                  one in the Midwest.
                </p>
              </div>
              <div className="mt-6 rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                CAMX (CA): 0.210 lbs CO₂/kWh
                <br />
                MROW (Midwest): 0.568 lbs CO₂/kWh
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg font-heading text-lg font-bold text-white"
                style={{ background: "var(--color-cta)" }}
              >
                2
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                See your breakdown
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Get a full energy profile — HVAC, lighting, cooking,
                refrigeration — tailored to your business type with estimated
                kWh and CO₂ emissions.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg font-heading text-lg font-bold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                3
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Build your action plan
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Toggle energy-saving actions on or off and watch your projected
                savings update in real time. Get a letter grade and a 90-day
                improvement roadmap.
              </p>
            </div>

            {/* Card 4 — wide */}
            <div
              className="flex items-center gap-4 rounded-2xl p-6 text-white shadow-sm sm:col-span-2"
              style={{ background: "var(--color-primary)" }}
            >
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold">
                  Real data, not greenwashing
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/80">
                  Every number comes from the EPA eGRID database. Your emission
                  factor is specific to your utility grid, not a national
                  average.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to know your number?
          </h2>
          <p className="mt-3 text-muted-foreground">
            It takes under two minutes. No credit card, no catch.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="mt-6 cursor-pointer text-base font-semibold"
              style={{ background: "var(--color-cta)", color: "white" }}
            >
              Analyze my energy
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
