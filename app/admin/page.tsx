import { redirect } from 'next/navigation'

// The standalone moderation page merged into /dashboard (which renders the
// same flagged-reports section alongside stats). Kept as a redirect so old
// bookmarks and the login flow's history keep working.
export default function AdminPage() {
  redirect('/dashboard')
}
