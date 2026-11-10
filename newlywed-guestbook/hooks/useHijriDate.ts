"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { WEDDING } from "@/lib/config";

/** Reads the editable Hijri date from `site_settings`, falling back to the configured default. */
export function useHijriDate() {
  const [hijri, setHijri] = useState<string>(WEDDING.hijriFallback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase()
          .from("site_settings")
          .select("value")
          .eq("key", "hijri_date")
          .maybeSingle();
        if (!cancelled && data?.value) setHijri(data.value);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return hijri;
}
