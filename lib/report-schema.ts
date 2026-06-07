import { z } from 'zod'

export const SOURCE_VALUES = [
  'vet-diagnosed',
  'positive-test',
  'owner-observed',
  'neighbor-report',
  'social-media',
  'other',
] as const

// Who is submitting. Drives follow-up questions, confidence, and lead routing.
export const REPORTER_TYPES = ['individual', 'vet', 'facility', 'news'] as const

// Place-based environmental hazards: tied to a specific lake/canyon/trail, not a
// sick dog. These get an optional "specific location" field on the form.
export const LOCATION_DETAIL_DISEASES = ['cyano', 'tickspot'] as const

// Lost-dog reports reuse the verify-and-pin pipeline but collect different
// info: an exact address (no privacy masking — you WANT it found), a photo,
// and public contact details. 'owner' = my dog is lost; 'sighting' = I spotted
// a loose/lost dog.
export const LOST_KINDS = ['owner', 'sighting'] as const

export const ReportSchema = z.object({
  // What kind of report this is. Defaults to a disease/hazard report.
  kind: z.enum(['disease', 'lost']).optional().default('disease'),
  // Required for disease reports; for lost-dog reports it's set to 'lost' below.
  disease: z.string().min(1, 'Disease is required'),
  // ZIP is optional: remote-area reporters can instead pin an exact place
  // (locationLat/Lng). A cross-field check below requires one or the other.
  // Accept '' (form sends empty when omitted) or a valid 5-digit ZIP.
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits').optional().or(z.literal('')),
  reporterType: z.enum(REPORTER_TYPES),
  // For individuals only: true = "just reporting a sighting" (not their own dog).
  // Absent/false for an affected owner, vet, or facility.
  sighting: z.boolean().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.enum(SOURCE_VALUES).optional(),
  breed: z.string().max(50).optional(),
  notes: z.string().max(280).optional(),
  // Specific spot for place-based hazards (lake/canyon/trail name or coordinates).
  locationDetail: z.string().max(120).optional(),
  // Exact coordinates captured when the reporter picks a place from autocomplete.
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  // Source article link for news/media reports. http(s) only (popup renders it).
  sourceUrl: z
    .string()
    .max(500)
    .optional()
    .refine(u => !u || /^https?:\/\/.+/i.test(u), 'Link must be a valid http(s) URL'),

  // ─── Lost-dog fields (only used when kind === 'lost') ───
  lostKind: z.enum(LOST_KINDS).optional(),
  dogName: z.string().max(60).optional(),
  dogBreed: z.string().max(60).optional(),
  dogDescription: z.string().max(280).optional(),
  // Public exact street address where the dog was lost/seen (lost dogs aren't
  // privacy-masked the way disease reports are).
  address: z.string().max(200).optional(),
  // When the dog was last seen (ISO string from a datetime-local input).
  lastSeen: z.string().max(40).optional(),
  // Public contact shown on the map so finders can reach the owner.
  contact: z.string().max(120).optional(),
  // Public photo URL (uploaded via /api/upload → Vercel Blob).
  photoUrl: z
    .string()
    .max(600)
    .optional()
    .refine(u => !u || /^https?:\/\/.+/i.test(u), 'Photo URL must be http(s)'),
}).refine(
  d => /^\d{5}$/.test(d.zip ?? '') || (d.locationLat != null && d.locationLng != null),
  { message: 'Enter a ZIP code or pin an exact location', path: ['zip'] },
)

export type ReportInput = z.infer<typeof ReportSchema>
