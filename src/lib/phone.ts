const DIAL: Record<string, string> = {
  pakistan: "92", pk: "92", india: "91", in: "91", "united states": "1", usa: "1", us: "1",
  canada: "1", ca: "1", "united kingdom": "44", uk: "44", gb: "44", australia: "61", au: "61",
  "united arab emirates": "971", uae: "971", ae: "971", "saudi arabia": "966", sa: "966",
  qatar: "974", qa: "974", kuwait: "965", kw: "965", oman: "968", om: "968", bahrain: "973", bh: "973",
  germany: "49", de: "49", france: "33", fr: "33", spain: "34", es: "34", italy: "39", it: "39",
  netherlands: "31", nl: "31", ireland: "353", ie: "353", "new zealand": "64", nz: "64",
  "south africa": "27", za: "27", nigeria: "234", ng: "234", kenya: "254", ke: "254",
  egypt: "20", eg: "20", turkey: "90", tr: "90", bangladesh: "880", bd: "880",
  malaysia: "60", my: "60", singapore: "65", sg: "65", indonesia: "62", id: "62",
  philippines: "63", ph: "63", brazil: "55", br: "55", mexico: "52", mx: "52",
  sweden: "46", se: "46", norway: "47", no: "47", denmark: "45", dk: "45", poland: "48", pl: "48",
  portugal: "351", pt: "351", belgium: "32", be: "32", switzerland: "41", ch: "41", austria: "43", at: "43",
};

/** Normalizes a phone number to international digits (no +) using the lead's country. */
export function toInternationalDigits(phone: string | null | undefined, country?: string | null) {
  if (!phone) return null;
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  const code = country ? DIAL[country.trim().toLowerCase()] : undefined;
  if (!code) return digits;
  if (digits.startsWith(code) && digits.length > 10) return digits;
  digits = digits.replace(/^0+/, "");
  return code + digits;
}

export function whatsappUrl(phoneDigits: string, text: string) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
}

export function mailtoUrl(email: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
