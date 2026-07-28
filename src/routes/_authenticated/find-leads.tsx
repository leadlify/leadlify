import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Radar, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { findLeads } from "@/lib/places.functions";
import { errorMessage } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/find-leads")({
  head: () => ({
    meta: [
      { title: "Find Leads — LeadForge" },
      {
        name: "description",
        content: "Search Google Places for local businesses and import them as leads.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Find Leads — LeadForge" },
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

function FindLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = useServerFn(findLeads);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [maxLeads, setMaxLeads] = useState(20);
  const [radiusKm, setRadiusKm] = useState(10);
  const [onlyWithoutWebsite, setOnlyWithoutWebsite] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      search({
        data: { country, city, businessType, keyword, maxLeads, radiusKm, onlyWithoutWebsite },
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="United Kingdom"
                    value={country}
                    maxLength={80}
                    onChange={(e) => setCountry(e.target.value)}
                  />
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

              <div className="border-border/60 bg-muted/40 flex items-start justify-between gap-4 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="no-website" className="text-sm font-medium">
                    Only businesses without a website
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Best prospects for a web design pitch. Searching may take a little longer.
                  </p>
                </div>
                <Switch
                  id="no-website"
                  checked={onlyWithoutWebsite}
                  onCheckedChange={setOnlyWithoutWebsite}
                />
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
    </AppShell>
  );
}
