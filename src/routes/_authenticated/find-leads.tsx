import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gauge, Loader2, Radar, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { findLeads } from "@/lib/places.functions";
import { getLeadQuota } from "@/lib/quota.functions";
import { Progress } from "@/components/ui/progress";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { errorMessage } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/find-leads")({
  head: () => ({
    meta: [
      { title: "Find Leads — Leadlify" },
      {
        name: "description",
        content: "Search Google Places for local businesses and import them as leads.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Find Leads — Leadlify" },
      {
        property: "og:description",
        content: "Search Google Places for local businesses and import them as leads.",
      },
    ],
  }),
  component: FindLeadsPage,
});

const SUGGESTIONS = [
  "Dentist",
  "Restaurant",
  "Law firm",
  "Gym",
  "Plumber",
  "Real estate agency",
  "Hair salon",
  "Car dealership",
];

/** Industry groups shown in the filter; each one suggests matching business types. */
const INDUSTRIES: { label: string; types: string[] }[] = [
  { label: "Health & medical", types: ["Dentist", "Clinic", "Physiotherapist", "Veterinarian"] },
  { label: "Food & hospitality", types: ["Restaurant", "Café", "Bakery", "Hotel"] },
  { label: "Legal & finance", types: ["Law firm", "Accountant", "Insurance broker"] },
  { label: "Beauty & wellness", types: ["Hair salon", "Spa", "Barber shop", "Gym"] },
  { label: "Home services", types: ["Plumber", "Electrician", "Roofer", "Cleaning service"] },
  { label: "Real estate & construction", types: ["Real estate agency", "Builder", "Architect"] },
  { label: "Automotive", types: ["Car dealership", "Car repair shop", "Car wash"] },
  { label: "Retail & shops", types: ["Boutique", "Furniture store", "Pet shop"] },
  { label: "Education & training", types: ["Driving school", "Tuition centre", "Language school"] },
  { label: "Professional services", types: ["Marketing agency", "Photographer", "Event planner"] },
];

const WEBSITE_QUALITY = [
  { value: "any", label: "Any website quality" },
  { value: "none", label: "No website at all" },
  { value: "poor", label: "Poor website (score ≤ 40)" },
  { value: "needs-work", label: "Needs work (score ≤ 70)" },
  { value: "good", label: "Good website (score > 70)" },
] as const;

function FindLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = useServerFn(findLeads);
  const quotaFn = useServerFn(getLeadQuota);
  const quota = useQuery({ queryKey: ["lead-quota"], queryFn: () => quotaFn({}) });

  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [maxLeads, setMaxLeads] = useState(20);
  const [radiusKm, setRadiusKm] = useState(10);
  const [websiteQuality, setWebsiteQuality] =
    useState<(typeof WEBSITE_QUALITY)[number]["value"]>("any");
  const onlyWithoutWebsite = websiteQuality === "none";
  const typeOptions = INDUSTRIES.find((item) => item.label === industry)?.types ?? SUGGESTIONS;


  const mutation = useMutation({
    mutationFn: () =>
      search({
        data: { countryCode, city, businessType, keyword, maxLeads, radiusKm, onlyWithoutWebsite },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-quota"] });
      if (result.found === 0) {
        toast.warning("No businesses matched that search. Try a broader area or keyword.");
        return;
      }
      if (result.imported === 0) {
        toast.info(`All ${result.found} results were already in your pipeline.`);
        return;
      }
      toast.success(
        `Imported ${result.imported} new lead${result.imported === 1 ? "" : "s"}${
          result.duplicates ? ` · ${result.duplicates} duplicate skipped` : ""
        }`,
      );
      navigate({ to: "/leads" });
    },
    onError: (error) => toast.error(errorMessage(error, "The lead search failed.")),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!countryCode) {
      toast.error("Choose the country you want to search in.");
      return;
    }
    if (!businessType.trim()) {
      toast.error("Tell me what kind of business to look for.");
      return;
    }
    mutation.mutate();
  };

  return (
    <AppShell title="Find Leads" description="Pull local businesses straight from Google Places">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Radar className="text-primary size-4" />
              Search criteria
            </CardTitle>
            <CardDescription>
              Duplicates are skipped automatically, so you can re-run a search safely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Manchester"
                    value={city}
                    maxLength={80}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Business type *</Label>
                  <Input
                    id="type"
                    placeholder="Dentist"
                    value={businessType}
                    maxLength={80}
                    onChange={(e) => setBusinessType(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyword">Extra keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="cosmetic"
                    value={keyword}
                    maxLength={80}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Maximum leads</Label>
                    <span className="text-primary text-sm font-semibold tabular-nums">
                      {maxLeads}
                    </span>
                  </div>
                  <Slider
                    value={[maxLeads]}
                    min={5}
                    max={50}
                    step={5}
                    onValueChange={([v]) => setMaxLeads(v)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Search radius</Label>
                    <span className="text-primary text-sm font-semibold tabular-nums">
                      {radiusKm} km
                    </span>
                  </div>
                  <Slider
                    value={[radiusKm]}
                    min={1}
                    max={50}
                    step={1}
                    onValueChange={([v]) => setRadiusKm(v)}
                  />
                </div>
              </div>

              <div className="border-border/60 bg-muted/40 space-y-2 rounded-xl border p-4">
                <Label htmlFor="quality" className="text-sm font-medium">
                  Minimum website quality
                </Label>
                <Select
                  value={websiteQuality}
                  onValueChange={(value) =>
                    setWebsiteQuality(value as (typeof WEBSITE_QUALITY)[number]["value"])
                  }
                >
                  <SelectTrigger id="quality" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBSITE_QUALITY.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Weaker sites are the best prospects for a web design pitch. Quality filters check
                  each site live, so searching takes a little longer.
                </p>
              </div>


              <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Radar className="size-4" />
                )}
                {mutation.isPending ? "Searching Google…" : "Find leads"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-card border-border/60 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="text-primary size-4" />
                Monthly lead quota
              </CardTitle>
              <CardDescription>
                {quota.data
                  ? `${quota.data.used} of ${quota.data.quota} leads imported this month`
                  : "Loading your allowance…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress
                value={
                  quota.data
                    ? Math.min((quota.data.used / Math.max(quota.data.quota, 1)) * 100, 100)
                    : 0
                }
              />
              <p className="text-muted-foreground text-xs">
                {quota.data
                  ? `${quota.data.remaining} left · resets ${new Date(quota.data.resetsOn).toLocaleDateString()}`
                  : ""}
              </p>
              {quota.data?.remaining === 0 ? (
                <div className="pt-2">
                  <UpgradePrompt
                    title="Free lead limit reached"
                    message="Upgrade now to import more prospects this month."
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="text-secondary size-4" />
                Quick picks
              </CardTitle>
              <CardDescription>Common niches that usually have dated websites.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBusinessType(item)}
                  className="border-border bg-muted/50 hover:border-primary/40 hover:bg-primary/10 hover:text-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                >
                  {item}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
