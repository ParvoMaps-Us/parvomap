import { z } from 'zod'

export const SOURCE_VALUES = [
  'vet-diagnosed',
  'positive-test',
  'owner-observed',
  'neighbor-report',
  'social-media',
  'other',
] as const

export const ReportSchema = z.object({
  disease: z.string().min(1, 'Disease is required'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.enum(SOURCE_VALUES).optional(),
  breed: z.string().max(50).optional(),
  notes: z.string().max(280).optional(),
})

export type ReportInput = z.infer<typeof ReportSchema>
