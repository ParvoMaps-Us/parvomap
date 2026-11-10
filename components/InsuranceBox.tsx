import Link from 'next/link'
import InsuranceLink from '@/components/InsuranceLink'
import { INSURANCE_PARTNER, insuranceUrl } from '@/lib/insurance'

// Puppy insurance box (affiliate). Server component; renders nothing until the
// affiliate link is set (see lib/insurance.ts for the switch and the copy rules).
// `placement` tags the GA4 click event so we can see which page earns the clicks.
export default function InsuranceBox({ placement }: { placement: string }) {
  const url = insuranceUrl()
  if (!url) return null
  const { name, minAge, illnessWaitDays } = INSURANCE_PARTNER

  return (
    <aside className="ins-box" aria-labelledby={`ins-title-${placement}`}>
      <p className="ins-sick">
        <strong>Is your dog sick right now?</strong> Call a vet first. Insurance can&rsquo;t pay for an illness
        that has already started.
      </p>

      <div className="ins-body">
        <div className="ins-eyebrow">Puppy insurance · Ad · We earn a fee</div>
        <h2 id={`ins-title-${placement}`} className="ins-title">
          Puppy insurance only works before a dog gets sick
        </h2>
        <p className="ins-lead">
          A hospital stay for parvo can cost{' '}
          <Link href="/blog/cost-of-treating-parvo-in-dogs">thousands of dollars</Link>. Pet insurance can help pay
          for it, but only if your dog gets sick after the plan&rsquo;s wait is over.
        </p>

        <ul className="ins-list">
          <li>{name} says it takes puppies from {minAge} old.</li>
          <li>{name} says illness coverage starts {illnessWaitDays} days after you sign up.</li>
          <li>
            It won&rsquo;t pay for an illness that showed signs before then. If your dog was near a sick dog, do not
            count on a new plan.
          </li>
          <li>Keep shots on schedule. A plan can deny a parvo claim if shots are behind.</li>
        </ul>

        <InsuranceLink href={url} placement={placement}>See {name} plans<span aria-hidden="true">→</span></InsuranceLink>

        <p className="ins-fine">
          ParvoMaps earns a fee if you sign up through this link. It costs you nothing extra. We are not an
          insurance company or agent. Read the policy to see what is covered.{' '}
          <Link href="/privacy#affiliate-links">How this link works</Link>
        </p>
      </div>
    </aside>
  )
}
