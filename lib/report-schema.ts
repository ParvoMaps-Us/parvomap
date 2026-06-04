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
export const REPORTER_TYPES = ['individual', 'vet', 'facility'] as const

export const ReportSchema = z.object({
  disease: z.string().min(1, 'Disease is required'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  reporterType: z.enum(REPORTER_TYPES),
  // For individuals only: true = "just reporting a sighting" (not their own dog).
  // Absent/false for an affected owner, vet, or facility.
  sighting: z.boolean().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.enum(SOURCE_VALUES).optional(),
  breed: z.string().max(50).optional(),
  notes: z.string().max(280).optional(),
})

export type ReportInput = z.infer<typeof ReportSchema>
