import { createFileRoute } from "@tanstack/react-router";

/** Publicly hosted AI-generated demo website for a lead. */
export const Route = createFileRoute("/site/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(process.env.SUPABASE_URL!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data } = await supabase
          .from("demo_sites")
          .select("html")
          .eq("slug", params.slug)
          .maybeSingle();

        if (!data?.html) {
          return new Response("<h1>Demo site not found</h1>", {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }

        return new Response(data.html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        });
      },
    },
  },
});
