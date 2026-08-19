/**
 * Community alert feed — STATIC MOCK DATA.
 * Later this becomes a read from an anonymized alerts table / API.
 */

export interface CommunityAlert {
  id: string;
  city: string;
  pattern: string;
  agoHours: number;
  severity: "high" | "medium";
}

export const communityAlerts: CommunityAlert[] = [
  { id: "a1", city: "Delhi", pattern: "Fake bank fraud-alert call", agoHours: 3, severity: "high" },
  { id: "a2", city: "Pune", pattern: "Cloned voice of a relative asking for emergency money", agoHours: 6, severity: "high" },
  { id: "a3", city: "Bengaluru", pattern: "Fake CEO requesting an urgent transfer", agoHours: 9, severity: "medium" },
  { id: "a4", city: "Jaipur", pattern: "Fake courier / customs clearance fee call", agoHours: 14, severity: "medium" },
  { id: "a5", city: "Kolkata", pattern: "Fake police 'digital arrest' threat call", agoHours: 21, severity: "high" },
];
