/**
 * Blog content source (Option B from docs/blog-playbook.md): a typed array, the
 * same pattern that drives lib/diseases.ts and lib/recalls.ts. New posts are
 * added to BLOG_POSTS and flow automatically into the index, the post route, and
 * app/sitemap.ts. Body is a small block model (heading / paragraph / image) that
 * supports the things posts need: headings, paragraphs with inline links, and an
 * in-body image. Keep copy free of em dashes.
 */

/** A run of text inside a paragraph, optionally a link. Strings render as plain
 *  text; objects render as an <a href>. Internal links are the priority here. */
export type InlineSpan = string | { text: string; href: string }

export type BlogBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; content: InlineSpan[] }
  | { type: 'image'; src: string; alt: string; caption?: string }

export interface BlogFaq {
  question: string
  answer: string
}

export interface BlogPost {
  /** lowercase, hyphenated, keyword-rich */
  slug: string
  title: string
  description: string
  /** ISO date, e.g. "2026-06-23" */
  datePublished: string
  dateModified?: string
  author: string
  /** Path under /public, e.g. "/blog/<slug>/cover.jpg" (landscape, ~1200x630) */
  coverImage: string
  coverAlt: string
  readingMinutes: number
  body: BlogBlock[]
  /** Optional FAQ block. When present, renders an FAQPage JSON-LD. */
  faqs?: BlogFaq[]
}

/**
 * Posts, newest first. Replace the placeholder once real content is provided.
 * Every post must link OUT to real pages and is linked IN from /blog (the index
 * reachable from the header) so it never becomes an orphan.
 */
const POSTS: BlogPost[] = [
  {
    slug: 'how-do-i-know-if-my-dog-has-parvo',
    title: 'How Do I Know If My Dog Has Parvo?',
    description:
      'What parvo actually looks like in real life, how it is diagnosed, the honest survival odds, and why acting the same day is the single biggest variable.',
    datePublished: '2026-06-23',
    author: 'ParvoMaps',
    coverImage: '/og-image.png',
    coverAlt: 'A quiet, lethargic puppy resting, an early warning sign of parvo',
    readingMinutes: 9,
    body: [
      {
        type: 'paragraph',
        content: [
          "If you're reading this because your puppy is acting a little off and something in your gut is telling you it's more than just an upset stomach, trust that instinct. With parvo, the owners who act on that quiet feeling are the ones who give their dogs a real chance. The ones who wait to see if the dog \"bounces back\" are often the ones sitting in an emergency clinic 48 hours later wishing they hadn't.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          "This post is going to walk you through what parvo actually looks like in real life, not just the clinical checklist, but what it feels like to watch, what the diagnosis process involves, and what survival honestly looks like when all the cards are on the table.",
        ],
      },
      {
        type: 'heading',
        text: 'The Biggest Mistake Dog Owners Make',
      },
      {
        type: 'paragraph',
        content: [
          'The single most dangerous thing owners do when they suspect parvo is wait.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "It starts understandably. A puppy doesn't finish breakfast. Sleeps in a weird spot. Seems a little quiet. Nothing about that picture screams emergency. So the owner gives it a day. Then another. By the time bloody diarrhea appears, which is what most people associate with parvo, the virus has already had 24 to 48 extra hours to destroy the intestinal lining. The dog is severely dehydrated. What might have been a $500 outpatient treatment is now a $3,000 to $5,000 ICU stay. Or worse.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          "The most dangerous misconception underneath all of this is that parvo looks dramatic from the start. It doesn't. The early signs are quiet, and they're easy to dismiss.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'A secondary misconception worth naming directly: "My dog is vaccinated, so it can\'t be parvo." Vaccines are highly effective, but not perfect. Puppies in the middle of their vaccine series have real gaps in immunity that owners often underestimate. A vaccinated dog showing ',
          { text: 'parvo symptoms', href: '/diseases/parvo' },
          ' still needs a same-day vet call.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The rule of thumb that could save your dog\'s life: any puppy or young unvaccinated dog showing lethargy, appetite loss, and GI symptoms for more than 12 hours deserves a call to your vet today, not a "let\'s see how tonight goes."',
        ],
      },
      {
        type: 'heading',
        text: 'What Early Parvo Actually Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          "The early parvo dog doesn't look sick the way owners expect sick to look.",
        ],
      },
      {
        type: 'heading',
        text: 'What Owners Describe',
      },
      {
        type: 'paragraph',
        content: [
          'The most common thing owners say when they bring a dog in at that early stage is some version of "he\'s just not himself." Not "he\'s dying." Just off. They\'ll say the dog didn\'t finish breakfast, almost apologetically, like they\'re embarrassed for coming in over something so minor. They\'ll mention the dog slept in a weird spot, or didn\'t run to the door when they got home, or just seemed quiet. That word comes up constantly: quiet. These are often puppies who are normally chaotic little tornados, so quiet registers, but it doesn\'t register as emergency.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Some owners describe one vomit, maybe two, and chalked it up to the dog eating grass or getting into something in the yard. At this stage, the vomit is usually just bile or undigested food. Nothing that looks alarming.',
        ],
      },
      {
        type: 'heading',
        text: 'What the Dog Actually Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          "The dog is ambulatory. That's what makes it so deceptive. It's not collapsed, not screaming, not visibly in distress. It'll walk into the clinic on its own. But if someone who knows dogs watches closely, the picture shifts fast.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The eyes are slightly dull, not the bright, darting curiosity of a healthy puppy. The posture is subtly hunched, like the abdomen is mildly uncomfortable. Touch the belly gently and the dog will tighten, not yelp, just tighten. The gums might still be pink. The coat looks fine. Nothing on the surface screams parvo yet.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Where it gets unmistakable, even early, is energy response. A healthy puppy in a vet clinic, even a scared one, has a baseline reactivity. It flinches, strains toward smells, whines. The early parvo puppy just stands there. There\'s a flatness to it that\'s hard to describe in clinical terms but is immediately recognizable once you\'ve seen it. Experienced vet techs often catch it before any test is run.',
        ],
      },
      {
        type: 'heading',
        text: 'The False Rally',
      },
      {
        type: 'paragraph',
        content: [
          'Many owners describe the night before a crash as "actually, he seemed a little better around dinner." That false rally is common and cruel. The dog perks up briefly, the owner exhales, goes to bed relieved, and wakes up to a dog in crisis. That one night of misplaced reassurance is the thing owners carry with them afterward.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The early parvo dog doesn\'t ask for help loudly. It just quietly disappears into itself, and the window to act is measured in hours, not days.',
        ],
      },
      {
        type: 'heading',
        text: 'How Parvo Is Diagnosed',
      },
      {
        type: 'paragraph',
        content: [
          'The diagnosis is faster and more straightforward than most owners expect, which is one of the more relieving parts of an otherwise terrifying situation.',
        ],
      },
      {
        type: 'heading',
        text: 'The Test',
      },
      {
        type: 'paragraph',
        content: [
          'The standard frontline test is an antigen ELISA test. Most clinics run it in-house as a SNAP test. It works off a fecal swab. A tech swabs the rectum, mixes the sample with a solution, drops it on a small cassette, and reads the result in about ten minutes. It looks and works almost identically to a human COVID rapid test. Most owners are sitting in the exam room when the result comes back.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Sensitivity is high but not perfect, somewhere in the 80 to 95 percent range depending on the stage of infection. Very early infection, before the virus is shedding heavily in the stool, can produce a false negative. That caveat matters.',
        ],
      },
      {
        type: 'heading',
        text: 'What to Expect When You Walk In',
      },
      {
        type: 'paragraph',
        content: [
          'Once the front desk hears "possible parvo," things move fast. Most clinics will triage that dog ahead of routine appointments, not for drama, but because parvo is highly contagious and they don\'t want an infected dog in the waiting room next to healthy animals. Expect to be moved to an isolation room or asked to wait outside while the dog is brought directly to the back.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'While the SNAP test runs, the vet will often pull a blood panel. A CBC tells them a lot about severity. Parvo destroys the intestinal lining and hammers the immune system, so a crashing white blood cell count alongside a positive SNAP is a serious indicator.',
        ],
      },
      {
        type: 'heading',
        text: "What a Negative Result Doesn't Mean",
      },
      {
        type: 'paragraph',
        content: [
          'This is where owners need to stay alert. A negative SNAP on a dog that still looks wrong should not end the conversation. A good vet will say something like: the test is negative, but the clinical picture is concerning, so we\'re going to treat this as presumptive parvo or retest in 24 hours. Owners who accept a negative result and go home without that follow-up conversation are sometimes the ones who come back the next day in crisis.',
        ],
      },
      {
        type: 'heading',
        text: 'The One Thing to Do Before You Walk In',
      },
      {
        type: 'paragraph',
        content: [
          'Call ahead. A 30-second phone call letting the clinic know you have a puppy with vomiting and lethargy lets them prepare an isolation pathway before the dog enters the building. It protects other patients, and it often means the dog gets seen faster. That one step makes the whole experience smoother and safer for everyone.',
        ],
      },
      {
        type: 'heading',
        text: 'How to Check for Nearby Outbreaks Before You Go',
      },
      {
        type: 'paragraph',
        content: [
          'One tool that changes the risk calculation for owners in that uncertain window is ',
          { text: 'ParvoMaps', href: '/' },
          '.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'ParvoMaps is a real-time, crowdsourced map tracking ',
          { text: 'canine disease outbreaks across the US', href: '/diseases' },
          ', including parvo, distemper, kennel cough, leptospirosis, and more. Anyone who spots a confirmed case can submit a report anonymously by entering a ZIP code or pinning a location. Reports go live after email verification. Veterinarians, boarding facilities, and individual owners can all submit, and the platform identifies the source type so the community can weigh reports accordingly.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'One detail worth noting: parvo pins stay active on the map for 12 months, because canine parvovirus survives in soil for up to a year. That\'s not just a design choice. It reflects how the biology actually works.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The tool is most powerful not after a dog is already sick, but in that quiet window of "should I be worried about this?" A dog owner whose puppy is just a little off, who ',
          { text: 'checks the map', href: '/' },
          ' and sees a confirmed parvo pin two ZIP codes over from three weeks ago, goes to the vet that afternoon instead of waiting until morning. That gap, same-day versus next-day, is often the entire ballgame with parvo. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area so a new nearby case reaches you before your dog ever shows a symptom.',
        ],
      },
      {
        type: 'heading',
        text: 'Survival Odds: The Honest Version',
      },
      {
        type: 'paragraph',
        content: [
          'Survival odds with parvo are genuinely good. But that sentence has a condition attached that changes everything: with early, aggressive treatment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "The number cited most often is 85 to 95 percent survival with prompt hospitalization and IV supportive care. Without treatment, that number flips. Somewhere around 85 to 91 percent of untreated dogs die. The disease itself isn't the sentence. The timing and the treatment are the sentence.",
        ],
      },
      {
        type: 'heading',
        text: 'What Actually Determines Whether a Dog Makes It',
      },
      {
        type: 'paragraph',
        content: [
          'Age matters enormously. Puppies between 6 and 20 weeks are in the highest-risk window. Their immune systems are immature, their reserves are thin, and they deteriorate faster than older dogs. A 10-week-old and a 14-month-old with identical presentations on day one can have meaningfully different trajectories.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Breed carries real weight that doesn\'t get said loudly enough. Rottweilers, Dobermans, American Pit Bull Terriers, and Labrador Retrievers have documented higher severity and mortality rates with parvo compared to other breeds. A Rottweiler puppy with parvo should be treated as higher acuity from the first moment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'White blood cell count at presentation is probably the single most telling clinical indicator. A dog that comes in with a WBC that\'s low but not catastrophic has more runway than one whose immune system has already collapsed. A rising WBC over the first 24 to 48 hours is one of the first real signs a dog is starting to turn a corner.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'How early in the disease course the dog arrives matters more than almost anything else. Day one versus day three isn\'t a small difference. It\'s a different disease in terms of what the body has already lost and what it can still recover.',
        ],
      },
      {
        type: 'heading',
        text: "What Vets Sometimes Don't Say Out Loud",
      },
      {
        type: 'paragraph',
        content: [
          'The first thing is about money, and it\'s uncomfortable but real. The gap between outpatient treatment and full hospitalization is significant, sometimes $300 versus $3,000 to $5,000 depending on the clinic and the region. Some owners, when they hear the high end, quietly shut down. A good vet will present outpatient protocols, including fluids under the skin, anti-nausea medication, and close monitoring at home, as a legitimate option for owners who cannot afford inpatient care. Something is always better than nothing. If cost is a barrier, ask directly: what can we do if I can\'t afford hospitalization? A vet worth their license will have an answer.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The second thing is about the 48-hour window. Most dogs that are going to die do so in the first 48 to 72 hours. If a dog makes it past day three with IV support and the white blood cell count starts recovering, the odds shift dramatically in their favor. The first two nights are the fight. If the dog clears that, the story usually changes.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The third thing almost no one says: guilt is not useful information. The owners sitting in those clinics who waited a day too long because they didn\'t know, because nothing in their life prepared them to recognize a quiet, lethargic puppy as a medical emergency, those are not bad owners. Parvo is specifically, almost cruelly, designed to look like nothing at first. The early symptoms are indistinguishable from a dozen benign things. The only antidote to that going forward is awareness, not self-punishment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The fourth thing: survivors are genuinely survivors. Dogs that make it through parvo typically develop strong, long-lasting immunity. They are not fragile afterward. Most go on to live completely normal lives. That\'s worth saying, because owners in the middle of it sometimes can\'t see past the crisis to imagine the dog they\'re going to get back on the other side.',
        ],
      },
      {
        type: 'heading',
        text: 'The Bottom Line',
      },
      {
        type: 'paragraph',
        content: [
          'Parvo is beatable. The odds are real. The window is narrow. And the single most powerful variable in the whole equation is the person who notices something is wrong and acts on it the same day.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If your puppy is quiet, off their food, or just not themselves, don\'t wait until the symptoms get louder. ',
          { text: 'Check ParvoMaps', href: '/' },
          ' to see if there are reports near you, read more about ',
          { text: 'parvovirus in dogs', href: '/diseases/parvo' },
          ', and call your vet. You don\'t need to be certain. You just need to make the call.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What are the earliest signs of parvo in a puppy?',
        answer:
          'The earliest signs are quiet and easy to dismiss: lethargy, not finishing meals, sleeping in unusual spots, a subtly hunched posture, and one or two episodes of vomiting (often just bile). Bloody diarrhea tends to come later, after the virus has already done significant damage. Any puppy or young unvaccinated dog with lethargy, appetite loss, and GI symptoms lasting more than 12 hours warrants a same-day vet call.',
      },
      {
        question: 'Can a vaccinated dog still get parvo?',
        answer:
          'Yes. Vaccines are highly effective but not perfect, and puppies partway through their vaccine series have real gaps in immunity. A vaccinated dog showing parvo symptoms still needs a same-day veterinary evaluation.',
      },
      {
        question: 'How is parvo diagnosed?',
        answer:
          'The frontline test is an antigen ELISA (SNAP) test run in-house from a fecal swab, with results in about ten minutes. Vets often add a CBC blood panel to gauge severity. Sensitivity is roughly 80 to 95 percent, so very early infection can produce a false negative; a negative result on a dog that still looks sick should be treated as presumptive parvo or retested in 24 hours.',
      },
      {
        question: 'What are the survival odds for a dog with parvo?',
        answer:
          'With prompt hospitalization and IV supportive care, survival is roughly 85 to 95 percent. Untreated, around 85 to 91 percent of dogs die. Most deaths occur in the first 48 to 72 hours, so early, aggressive treatment is the single biggest factor in survival.',
      },
      {
        question: 'How long does parvo survive in the environment?',
        answer:
          'Canine parvovirus can survive in soil for up to a year. That is why ParvoMaps keeps parvo pins active on the map for 12 months: the contamination risk in an area persists long after the original case.',
      },
    ],
  },
]

/** Posts sorted newest-first by datePublished. */
export const BLOG_POSTS: BlogPost[] = [...POSTS].sort(
  (a, b) => Date.parse(b.datePublished) - Date.parse(a.datePublished),
)

export function getPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find(p => p.slug === slug) ?? null
}
