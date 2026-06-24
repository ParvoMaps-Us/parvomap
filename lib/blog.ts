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
    slug: 'can-my-puppy-survive-parvovirus',
    title: 'Can My Puppy Survive Parvovirus?',
    description:
      'Most puppies survive parvo with prompt care. What survival actually depends on, what recovery looks like, and how breed, age, and vaccine status move the odds.',
    datePublished: '2026-06-25',
    author: 'ParvoMaps',
    coverImage: '/article-images/puppy-laying-in-crate.png',
    coverAlt: 'A puppy resting in a crate while recovering from parvovirus',
    readingMinutes: 12,
    body: [
      {
        type: 'paragraph',
        content: [
          'If you are reading this because your puppy is sick and you are terrified, here is the most important thing first: most puppies survive parvo. With prompt veterinary care, survival rates land between 85 and 95 percent. The version of this disease that lives in people\'s heads, where parvo means the puppy is gone, is outdated. The odds are on your side the moment treatment starts. But those odds are not fixed. They are being set right now, by the next decision you make.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Stop reading, stop searching, and call your vet or get in the car. Everything else in this post will still be here when you get back. If you are staying because you want to understand what your puppy is up against, keep reading. This covers everything.',
        ],
      },
      {
        type: 'heading',
        text: 'What Survival Actually Depends On',
      },
      {
        type: 'paragraph',
        content: [
          'The question underneath "will my puppy make it" is usually "did I act in time," and the honest answer is that question is still open. The outcome is not sealed. A panicking owner often feels like a passenger watching something happen to them. They are not. The puppy\'s odds are being set, in real time, by how fast the owner moves from fear to a phone call.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Survival depends on a few things, and the owner controls the most important one.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'It depends on how early treatment starts. Day one is a different disease than day three. The body still has reserves early. The gut lining has not fully broken down. Every hour of waiting trades that advantage away.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'It depends on getting real supportive care. Parvo does not have a cure that kills the virus directly. Treatment keeps the puppy alive, hydrated, and protected from secondary infection while the puppy\'s own immune system clears the virus and its body rebuilds the gut lining the virus stripped. The dog beats parvo. The treatment keeps the dog alive long enough to do it.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'It depends on getting through the first 48 to 72 hours. That is the fight. Most puppies who are going to lose this lose it in the first two or three days. A puppy that clears that window with IV support, whose white blood cell count starts climbing back, has usually turned the corner. The first two nights are the hard part. Surviving them changes the story dramatically.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'And it depends on the owner acting instead of freezing. Not on loving the dog more, not on having done everything perfectly up to this point. On moving now. The early signs of parvo are built to look like nothing, so no owner should carry guilt for not seeing it sooner. But from this moment forward, speed is the lever, and it is theirs to pull.',
        ],
      },
      {
        type: 'heading',
        text: 'What the Puppy Is Actually Going Through',
      },
      {
        type: 'paragraph',
        content: [
          'From the puppy\'s side, the hospital stay is a hard, disorienting stretch of being kept alive while its own body does the actual fighting.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Parvo attacks the rapidly dividing cells lining the intestines. As that lining breaks down, the puppy deals with relentless nausea, painful cramping, and the exhaustion of fluid pouring out through vomiting and diarrhea. On top of that is dehydration and often a fever. The dog is not just unwell. It is in genuine physical distress, weak, and frightened, in a place that smells and sounds nothing like home.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'An IV catheter is placed in a front leg and stays in for days. The puppy is tethered to fluids running around the clock. It gets handled repeatedly: temperature checks, repositioning, cleaning, injections of medication, blood draws to track the white cell count. And it is largely done alone. Because parvo is so contagious, the puppy is in isolation, separated from other animals and from its owner. A young social animal cannot understand why the people it knows have disappeared and why strangers keep handling it.',
        ],
      },
      {
        type: 'heading',
        text: 'What the Medicine Is and Is Not Doing',
      },
      {
        type: 'paragraph',
        content: [
          'Here is the idea that reframes everything. There is no drug that kills parvovirus. None of the IV fluids, none of the antibiotics, none of the anti-nausea medication attacks the virus directly. The antibiotics stop bacteria from leaking through the destroyed gut wall and causing sepsis. The fluids replace what the body is losing and keep the organs going. The anti-nausea medication makes the puppy comfortable enough to rest and eventually eat.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The actual fight against the virus is done by the puppy. The dog\'s own immune system clears parvovirus, and the dog\'s own body regenerates the stripped intestinal lining. The hospital\'s entire job is to keep the puppy alive, stable, and protected long enough for the puppy to win that fight itself. Treatment buys time. The puppy spends it.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The puppies that survive parvo are the ones that fought through it with their bodies while people kept them alive long enough to do so. The medicine holds the line. The dog wins the war.',
        ],
      },
      {
        type: 'heading',
        text: 'How Breed, Age, and Vaccine Status Affect the Odds',
      },
      {
        type: 'paragraph',
        content: [
          'These three factors move the odds in real ways, but the way most owners understand them is slightly off in directions that matter.',
        ],
      },
      {
        type: 'heading',
        text: 'Age: The Biggest Risk Factor',
      },
      {
        type: 'paragraph',
        content: [
          'Age matters more than most owners realize. The highest-risk window is roughly 6 weeks to 6 months, with the youngest end of that range being the most dangerous. Puppies here have immature immune systems, almost no physiological reserve, and they dehydrate and crash faster than older dogs.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'What is underreported is the reason this window exists, and it is genuinely counterintuitive. Puppies absorb maternal antibodies from nursing, which protect them early. But those same maternal antibodies also interfere with vaccines, neutralizing the vaccine before it can teach the puppy\'s own immune system. There is a gap, often between 6 and 16 weeks, where maternal protection has faded enough to leave the puppy susceptible to the virus but is still present enough to blunt the vaccine. The puppy is, for a stretch, neither protected by mom nor fully protected by its shots.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Most owners have no idea this gap exists. It is exactly why the vaccine series is spaced across multiple doses rather than given once. The series is designed to keep hitting the immune system until one dose lands after maternal interference clears.',
        ],
      },
      {
        type: 'heading',
        text: 'Vaccine Status: Protective, But Not a Simple On-Off Switch',
      },
      {
        type: 'paragraph',
        content: [
          'A dog that has completed its full series is very well protected. But the misunderstanding is treating vaccination as binary, vaccinated or not, when the reality is a spectrum.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'A puppy partway through its series has partial immunity. That is real and meaningful even though it is incomplete. Partially vaccinated puppies who do get sick often fight the disease better than fully unvaccinated ones.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Two things are badly underreported here. First, one shot is not protection. Immunity depends on completing the full multi-dose series on schedule, with the final dose typically given at or after 16 weeks to clear the maternal-antibody gap. A puppy who got one shot and then went to a dog park is far less protected than the owner thinks. Second, even fully vaccinated dogs can occasionally contract parvo. A vaccinated dog showing classic symptoms should still be taken seriously. The false reassurance of "it can\'t be parvo, she\'s vaccinated" costs time at the exact moment time matters most.',
        ],
      },
      {
        type: 'heading',
        text: 'Breed: Real, Consistent, and Almost Never Discussed',
      },
      {
        type: 'paragraph',
        content: [
          'This is the factor most owners have never heard about, and it is the most underreported of the three. Certain breeds have documented higher severity and higher mortality from parvo, independent of age and vaccine status. The breeds repeatedly identified include Rottweilers, Doberman Pinschers, American Pit Bull Terriers, German Shepherds, and Labrador Retrievers.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The mechanism is not fully understood, but the pattern is consistent across multiple studies and decades of clinical observation. Owners of these breeds should complete the vaccine series on time without exception. They should also move faster than other owners the moment something looks off. Those are two separate actions, and both matter. Most owners of these breeds have never been told their dog carries elevated risk. That is an information gap that changes how fast a specific owner should move.',
        ],
      },
      {
        type: 'heading',
        text: 'How the Factors Stack',
      },
      {
        type: 'paragraph',
        content: [
          'Age, breed, and vaccine history are fixed by the time symptoms appear. Timing is not. The reason awareness of these risk factors matters is that it changes behavior before the crisis, not during it. An owner who knows their breed is higher risk, knows the maternal-antibody gap leaves a window, and knows one shot is not enough is an owner who vaccinates fully and acts the moment something looks off.',
        ],
      },
      {
        type: 'heading',
        text: 'What Recovery Actually Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          'Recovery after parvo is real and usually complete, but the gap between "survived" and "back to normal" surprises almost everyone.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'When a puppy is discharged, it has cleared the virus and turned the corner, but its body is still rebuilding. Owners expect to bring home the bouncy puppy they had before. What they actually bring home is a thinner, tired, subdued version that sleeps a lot and moves carefully. That is normal. Most visible recovery happens over one to two weeks, with energy and weight returning gradually.',
        ],
      },
      {
        type: 'heading',
        text: 'Feeding Goes Slow, By Design',
      },
      {
        type: 'paragraph',
        content: [
          'The instinct after a near-death scare is to feed the puppy generously to build it back up. That is exactly wrong. A gut still healing cannot handle normal-sized meals or rich food. Most parvo survivors go home on a bland, easily digestible diet fed in small, frequent portions. Pushing too much food too fast triggers vomiting or diarrhea and sets the recovery back. The puppy returns to its normal diet gradually, on the vet\'s timeline.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Some loose stool in the first week of recovery is expected. The gut lining does not snap back overnight. What is not expected, and warrants an immediate call back to the vet, is renewed vomiting, refusal to eat, returning lethargy, or blood.',
        ],
      },
      {
        type: 'heading',
        text: 'The Contagion Surprise',
      },
      {
        type: 'paragraph',
        content: [
          'The puppy is home, recovering, clearly getting better, and is still actively shedding parvovirus in its stool for several weeks after recovery. That means the dog can still infect other dogs, and the environment around it stays contaminated. Owners who assume "survived means safe to socialize" can unknowingly expose other dogs or bring an unvaccinated puppy into a contaminated space.',
        ],
      },
      {
        type: 'heading',
        text: 'The Environmental Surprise',
      },
      {
        type: 'paragraph',
        content: [
          'Parvovirus survives in soil and on surfaces for up to a year. Ordinary household cleaners do not kill it. The yard where the puppy was sick, the crate, the bedding, and the food bowls all remain reservoirs. Surviving the disease does not decontaminate the space the dog lives in. Disinfection requires agents that actually work against parvo: diluted bleach on bleach-safe surfaces, Virkon-S for broader surface use, or other veterinary-grade disinfectants like accelerated hydrogen peroxide for areas where bleach is not practical. The yard itself needs to be treated as contaminated for months, not days. This is the single most overlooked piece of the recovery picture, and skipping it is how the same household loses a second dog.',
        ],
      },
      {
        type: 'heading',
        text: 'The Good Surprise',
      },
      {
        type: 'paragraph',
        content: [
          'For all the caution in the early weeks, the long-term picture is overwhelmingly positive. A puppy that survives parvo typically develops strong, long-lasting immunity to that strain. These are not fragile dogs marked for life. The vast majority go on to live completely normal, healthy, full lives. The crate-bound, exhausted little animal of week one becomes, a month or two later, indistinguishable from any other healthy dog. Owners brace for a permanently delicate pet and instead get their puppy back in full.',
        ],
      },
      {
        type: 'heading',
        text: 'Why ParvoMaps Exists',
      },
      {
        type: 'paragraph',
        content: [
          'Parvo is beatable. The infrastructure to beat it is already in place: vaccines that prevent it, veterinary care that supports survival, and survival rates that favor the dog when treatment starts early. The missing piece has always been information arriving in time to be useful.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'There is no public canine disease tracker. For human illness, the infrastructure is everywhere. People can look up flu activity in their county, check what is circulating before a trip, see an outbreak reported in their city. That early-warning capability is treated as basic public health.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Dogs have nothing comparable. A puppy can die of parvo on one street, and the family three blocks over, walking their unvaccinated puppy through the same patch of grass, has no way to know the virus is there. Parvo survives in soil for up to a year. The contamination outlives the dog that left it, and there is no map, no alert, no shared record that the danger ever existed. Veterinary clinics know what they are seeing locally, but that knowledge stays siloed inside individual practices. None of it reaches the person who needs it most: the owner standing in their yard wondering whether the lethargic puppy in front of them is just tired or is the first sign of something that moves in hours.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          { text: 'ParvoMaps', href: '/' },
          ' was built to close that gap. The premise is simple. The fastest, most current source of outbreak information is not a government agency or a national database. It is the community itself: the owners, vets, and shelters who just encountered a case and have no place to put what they know. Give them a place to report it, anonymously and in seconds, and scattered knowledge becomes a shared map. One owner\'s worst day becomes the warning that protects the next dog.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'A confirmed case in a ZIP code stops being a private tragedy and becomes a visible signal that shifts every nearby owner\'s threshold from wait-and-see to act-now. That shift, same-day action instead of a night of waiting, is often the entire difference between a puppy that makes it and one that does not.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'There was no public canine disease tracker. So the gap got filled. Not with a cure, because parvo does not need a new cure. It needs owners who know to act. ParvoMaps is the missing piece of infrastructure: a way for a community of dog owners to watch out for each other\'s dogs, in real time, before the next puppy gets sick.',
        ],
      },
      {
        type: 'heading',
        text: 'The Bottom Line',
      },
      {
        type: 'paragraph',
        content: [
          'Most puppies survive parvo. The odds are real, the treatment works, and the dogs that make it go on to live full, normal lives. What determines the outcome is not luck, not money, not how much someone loves their dog. It is timing, and timing is information arriving early enough to act on.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Vaccinate on schedule. Know your breed\'s risk. Learn what early parvo looks like before it looks like anything, starting with our guide on ',
          { text: 'how to know if your dog has parvo', href: '/blog/how-do-i-know-if-my-dog-has-parvo' },
          '. ',
          { text: 'Check ParvoMaps', href: '/' },
          ' if something seems off and you want to know what is moving through your area, and read more about ',
          { text: 'parvovirus itself', href: '/diseases/parvo' },
          '.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'And if your puppy is sick right now: go. The puppy is more saveable in this moment than it will be in an hour. The fear is telling you the worst is certain. It is not. What is certain is that the next thing you do matters more than anything that has happened so far.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What are the survival odds for a puppy with parvo?',
        answer:
          'With prompt veterinary care, survival rates are between 85 and 95 percent. The biggest factor in survival is how early treatment starts and getting the puppy through the first 48 to 72 hours, which is when most deaths occur. A puppy that clears that window with IV support and a recovering white blood cell count has usually turned the corner.',
      },
      {
        question: 'How does treatment cure parvo?',
        answer:
          'There is no drug that kills parvovirus. Treatment is supportive: IV fluids replace what the body loses, antibiotics prevent bacteria from leaking through the damaged gut wall and causing sepsis, and anti-nausea medication keeps the puppy comfortable enough to rest and eat. The puppy\'s own immune system clears the virus and its body regenerates the gut lining. The medicine keeps the dog alive long enough to win the fight itself.',
      },
      {
        question: 'Why are some breeds more at risk from parvo?',
        answer:
          'Rottweilers, Doberman Pinschers, American Pit Bull Terriers, German Shepherds, and Labrador Retrievers have documented higher severity and mortality from parvo, independent of age and vaccine status. The mechanism is not fully understood, but the pattern is consistent across studies. Owners of these breeds should complete the vaccine series on time and act faster the moment something looks off.',
      },
      {
        question: 'Is a puppy still contagious after surviving parvo?',
        answer:
          'Yes. A recovering puppy keeps shedding parvovirus in its stool for several weeks after it appears better, so it can still infect other dogs. Parvovirus also survives in soil and on surfaces for up to a year, and ordinary household cleaners do not kill it. The yard, crate, bedding, and bowls must be disinfected with parvo-effective agents like diluted bleach, Virkon-S, or accelerated hydrogen peroxide, and the yard should be treated as contaminated for months.',
      },
    ],
  },
  {
    slug: 'cost-of-treating-parvo-in-dogs',
    title: "What's the Cost of Treating Parvo in Dogs?",
    description:
      'Why parvo bills range from $400 to $5,000, what each line item actually pays for, and the options that exist when full hospitalization is out of reach.',
    datePublished: '2026-06-24',
    author: 'ParvoMaps',
    coverImage: '/article-images/parvo-invoice.png',
    coverAlt: 'An itemized veterinary invoice for parvo treatment',
    readingMinutes: 11,
    body: [
      {
        type: 'paragraph',
        content: [
          "If you've ever searched this question in a panic, sitting in a vet waiting room or staring at an estimate you weren't prepared for, this post is for you. The cost of treating parvo is real, and in some cases it is genuinely staggering. But the number on that invoice is not random, and it is not arbitrary. It is a direct reflection of something that happened days before the dog ever walked through the clinic door. Understanding that changes everything about how you think about this disease.",
        ],
      },
      {
        type: 'heading',
        text: 'Why Parvo Bills Range from $400 to $5,000',
      },
      {
        type: 'paragraph',
        content: [
          'The single biggest factor determining what a parvo case costs is how many days of inpatient IV care the dog needs. And that number is almost entirely decided before the owner ever walks in.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Most people sitting in a waiting room processing a large estimate experience the cost as a feature of the clinic, the city, or bad luck. What it actually is, in most cases, is a direct readout of where the disease was when treatment started.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "A dog that comes in on day one, still eating a little, mildly lethargic, first vomit, might need 48 hours of IV fluids, anti-nausea medication, and monitoring. The intestinal lining hasn't fully broken down yet. The white blood cell count is low but not collapsed. The body still has reserves. That is a $400 to $800 case at many clinics.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'A dog that comes in on day three, not standing well, bloody diarrhea, severely dehydrated, WBC cratering, needs aggressive fluid resuscitation, sometimes plasma to maintain blood pressure, multiple medications, round-the-clock monitoring, and often 5 to 7 days of hospitalization before it is stable enough to go home. That is where the $3,000 to $5,000 numbers come from. Some critical cases at specialty emergency hospitals go higher.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The disease itself did not get more expensive. The dog just arrived later, and the body absorbed more damage before anyone started helping it fight back.',
        ],
      },
      {
        type: 'heading',
        text: 'What the Estimate Actually Represents',
      },
      {
        type: 'paragraph',
        content: [
          'When an owner sees a large treatment estimate and their brain goes to negotiation mode, wondering if the vet is padding it, whether another clinic would charge less, whether they can do half the treatment and hope for the best, those instincts are understandable and almost all of them lead to worse outcomes.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "What the estimate represents is days. Each line item is roughly one day of the dog's life being supported externally while its gut lining regenerates. The gut lining of a healthy dog replaces itself every 3 to 5 days. Parvo strips it. Treatment is essentially buying time for that regeneration to happen while keeping the dog alive, hydrated, and protected from secondary bacterial infection through the open intestinal wall. You cannot shortcut the biology. You can only support it and wait.",
        ],
      },
      {
        type: 'heading',
        text: "What You're Actually Paying For: The Line Items",
      },
      {
        type: 'paragraph',
        content: [
          'Here is what a parvo bill actually breaks into when you flip it over and read it.',
        ],
      },
      {
        type: 'heading',
        text: 'Intake and Diagnostics',
      },
      {
        type: 'paragraph',
        content: [
          'The SNAP parvo test runs $40 to $70. A CBC and chemistry panel adds $80 to $200. There is usually an exam or emergency triage fee of $50 to $150, higher at an after-hours emergency hospital. If the dog is severely dehydrated, additional bloodwork to check electrolytes and blood glucose may be added, especially in small breeds prone to hypoglycemia. This part of the bill rarely surprises people. It feels diagnostic, and diagnostic feels fair.',
        ],
      },
      {
        type: 'heading',
        text: 'The Daily Hospitalization Core',
      },
      {
        type: 'paragraph',
        content: [
          'This is where most of the money lives, and it repeats every single day the dog is admitted. The daily stack typically looks like this: a hospitalization and boarding fee of $50 to $150 per day covering the cage, the isolation space, and staff time; a one-time IV catheter placement of $40 to $80; IV fluids at $50 to $120 per day, sometimes more with aggressive rates, running around the clock; medications such as anti-nausea drugs like maropitant or ondansetron, antibiotics to guard the breached gut lining against sepsis, and sometimes a gastroprotectant, roughly $30 to $100 per day combined; and nursing care and monitoring including temperature checks, weight tracking, repeated assessments, and cage cleaning, often $40 to $100 per day.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Multiply that daily stack by 3 to 7 days and you have the bulk of any large parvo bill. Nothing exotic. Just relentless, repeating, around-the-clock support.',
        ],
      },
      {
        type: 'heading',
        text: 'The Escalation Tier',
      },
      {
        type: 'paragraph',
        content: [
          "When cases climb toward $5,000, it is usually because of one or more of the following. Plasma transfusion or colloids, used when a dog is losing protein through its destroyed gut lining and blood pressure won't hold, can run $200 to $500 or more per unit. Feeding tube placement for dogs that won't eat adds $100 to $300. Critical care upgrades at specialty hospitals carry their own daily premium.",
        ],
      },
      {
        type: 'heading',
        text: "The Charges That Feel Unfair Even Though They're Legitimate",
      },
      {
        type: 'paragraph',
        content: [
          'The recurring daily hospitalization fee trips people up the most. Owners often mentally pay for the dog once and don\'t internalize that the cage and care fee hits again every midnight. Seeing "hospitalization $125" appear five times on one invoice feels like being charged repeatedly for the same thing. It isn\'t. It is five separate days of a living animal being kept alive. But emotionally it reads as duplication, and that is the line item that most often creates friction at the front desk.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The biohazard and isolation surcharge catches people off guard too. Parvo waste is genuinely hazardous. The protocols for decontaminating a parvo cage are intensive and require specific agents, because ordinary cleaning products do not kill the virus. Owners rarely expect a cleaning charge and it feels petty in the moment. It is not. It is the clinic protecting every other animal in the building from a virus that survives in the environment for up to a year.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "The overnight and emergency premium feels like a penalty for the timing of an emergency the owner didn't choose. The cost is real overhead because overnight staffing is expensive, but it lands hard on someone already in crisis.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The single best question to ask at admission: ask for an itemized estimate and ask the vet to flag which line items are daily-recurring versus one-time. An owner who understands that the bill is mostly "days of life support multiplied out" reads it completely differently than one who thinks they are being charged repeatedly for the same treatment. That thirty-second conversation prevents nearly all of the anger that happens at discharge.',
        ],
      },
      {
        type: 'heading',
        text: 'When You Cannot Afford Full Hospitalization',
      },
      {
        type: 'paragraph',
        content: [
          'This is the conversation that does not always happen clearly enough, and it needs to.',
        ],
      },
      {
        type: 'heading',
        text: 'Outpatient Treatment: The Most Underused Option',
      },
      {
        type: 'paragraph',
        content: [
          'Instead of admitting the dog for round-the-clock IV care, the vet administers subcutaneous fluids, injectable anti-nausea medication and antibiotics, and either keeps the dog for daily rechecks or teaches the owner to give fluids at home. Published studies on outpatient protocols in owned dogs show survival rates in the 50 to 80 percent range depending on how sick the dog is at presentation. That is meaningfully lower than the 85 to 95 percent of full hospitalization, but it is dramatically better than nothing, and it can bring a $3,000 to $5,000 case down to several hundred dollars.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'This is real medicine at a fraction of the cost, and it is the most underused option on the table. If cost is a barrier, ask directly: "What can we do on an outpatient basis?" A good vet will have an answer.',
        ],
      },
      {
        type: 'heading',
        text: 'CareCredit and Payment Plans',
      },
      {
        type: 'paragraph',
        content: [
          'CareCredit is a medical credit card widely accepted at vet clinics, often with a promotional interest-free window if the balance is paid inside it. For an owner who has the income to repay but not the lump sum on hand, this genuinely bridges the gap. The honest caveat is that it is credit with real interest if the promotional period lapses, and approval depends on credit history. It works for people who can repay over months. It is not a solution for someone with no path to repayment.',
        ],
      },
      {
        type: 'heading',
        text: 'Charitable Assistance Funds',
      },
      {
        type: 'paragraph',
        content: [
          'Organizations like RedRover Relief, the Brown Dog Foundation, and various breed-rescue emergency funds exist specifically to help with veterinary bills. Some local shelters and humane societies also have emergency assistance. These are real and worth contacting, but funds are limited and applications take time. Parvo moves in hours. Start the call immediately rather than after two days of deliberation.',
        ],
      },
      {
        type: 'heading',
        text: 'Crowdfunding: The Most Overrated Option',
      },
      {
        type: 'paragraph',
        content: [
          'This deserves a careful, honest answer because it is the one most likely to give false hope at the worst possible moment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Crowdfunding does work for some people. But it is the least reliable option for a parvo emergency specifically, for reasons that matter. The timing problem is the killer. Parvo decisions happen in hours. Crowdfunding raises money over days. A fundraiser posted at 9 p.m. while a puppy is crashing does not produce a usable balance by the time the treatment decision has to be made at 11 p.m. Most platforms also hold funds before they become withdrawable, so even a successful campaign does not put cash in an owner\'s hands at the clinic counter that night.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Crowdfunding is worth attempting as a parallel effort, especially to recoup costs after putting treatment on CareCredit. It is not a primary plan for an acute emergency.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Ranked honestly by what actually saves dogs when money is the constraint: outpatient treatment first, CareCredit second, assistance funds and nonprofit clinics third, crowdfunding last as a supplement rather than a lifeline. The single most powerful sentence an owner can say in that exam room is: "I can\'t afford full hospitalization. What are all of my other options?" Everything good on this list starts with that question being asked out loud.',
        ],
      },
      {
        type: 'heading',
        text: 'What About Pet Insurance?',
      },
      {
        type: 'paragraph',
        content: [
          'Pet insurance for parvo is worth it, but only if the policy is bought before the puppy is at risk. That timing is the entire issue.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Parvo is a young-puppy disease. The highest-risk window runs from roughly 6 to 20 weeks of age, which is the same stretch when people are bringing a new puppy home and putting "look into pet insurance" on a someday list. Standard accident-and-illness policies do cover parvo treatment, typically reimbursing 70 to 90 percent of eligible costs after the deductible. On paper, parvo is the textbook case for why insurance helps.',
        ],
      },
      {
        type: 'heading',
        text: 'The Gotchas Owners Find Out Too Late',
      },
      {
        type: 'paragraph',
        content: [
          'Nearly every policy imposes a waiting period before illness coverage begins, commonly around 14 days from enrollment. If an owner brings home an 8-week-old puppy, buys insurance the same day, and the puppy shows parvo symptoms on day 10, the claim falls inside the waiting period and gets denied. Parvo\'s incubation window and the insurance waiting period overlap almost exactly with the puppy\'s highest-risk weeks.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Pre-existing condition exclusions are the second trap. If the puppy showed any symptom before the policy was active, even a vague note in the vet record about being "off," the insurer can classify parvo as pre-existing and deny the claim outright.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The reimbursement structure surprises people too. "Ninety percent covered" leads owners to mentally erase the bill, but they still pay the full amount up front and get reimbursed later. An owner in the waiting room needs the cash or credit to cover everything on the spot.',
        ],
      },
      {
        type: 'heading',
        text: 'The Honest Bottom Line on Insurance',
      },
      {
        type: 'paragraph',
        content: [
          'The most valuable move is buying the policy before the puppy comes home, so the waiting period clears before the dog enters peak parvo risk. For parvo specifically, there is a strong argument that the cheapest and most effective protection is not insurance at all. It is completing the vaccine series on schedule. The full series runs roughly $75 to $150 and prevents the disease with high reliability. Insurance pays out after a dog gets sick. Vaccination keeps the dog from getting sick in the first place. You can read more about how the disease works and spreads on our ',
          { text: 'parvovirus page', href: '/diseases/parvo' },
          '.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Where insurance earns its keep is everything else a dog\'s life will throw at it: the swallowed sock, the torn ACL, the cancer at age nine. The clearest framing: vaccinate to prevent parvo, and insure to survive the dozen unpredictable things vaccination cannot touch.',
        ],
      },
      {
        type: 'heading',
        text: 'The Frame That Actually Changes Behavior',
      },
      {
        type: 'paragraph',
        content: [
          'The thing worth walking away knowing is not "act early or you are a bad owner." It is that early is when you are strong.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'In parvo, timing, cost, and outcome are not three separate things. They are the same line read at three different moments. The bill on day three is not bad luck. It is a readout of how long the dog waited before help started. The survival odds on day three are lower for the same reason. Timing sets cost and outcome simultaneously, and timing is the one variable an owner fully controls.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Early is when a vet has the most tools, the dog has the most fight, and the bill is the smallest. Waiting does not just risk a worse outcome. It actively spends down the leverage you start with. The dog is never more saveable, and never cheaper to save, than in the window when the owner is most tempted to wait and see.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'This is also where tools like ',
          { text: 'ParvoMaps', href: '/' },
          ' fit without any guilt attached. An owner who sees a confirmed parvo case reported two ZIP codes over does not need to feel afraid. They just need that information to move their internal threshold from "let\'s see how tonight goes" to "we\'re going in this afternoon." That is the entire function. It turns a vague worry into a same-day decision at exactly the moment the decision is cheapest to make. You can ',
          { text: 'check the live map', href: '/' },
          ' or ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The practical rule an owner can actually hold onto: a young or unvaccinated dog showing lethargy and appetite loss for more than 12 hours gets a same-day vet call, not a wait-and-see night. Not because something terrible will definitely happen. Because that call, made early, is the cheapest and most powerful thing they will ever be able to do for that dog, and the power only exists inside that window. If you are still not sure what you are looking at, our guide on ',
          { text: 'how to know if your dog has parvo', href: '/blog/how-do-i-know-if-my-dog-has-parvo' },
          ' walks through the early signs.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The owner who acts early and the owner who waits usually love their dog exactly the same. The difference between them was never love. It was information, arriving in time to be useful.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much does it cost to treat parvo in a dog?',
        answer:
          'Parvo treatment typically ranges from $400 to $5,000. A dog caught early may need only 48 hours of IV care, costing $400 to $800. A dog that arrives later, severely dehydrated with a collapsing white blood cell count, can need 5 to 7 days of hospitalization, driving the bill to $3,000 to $5,000 or more at specialty hospitals. The biggest cost driver is how many days of inpatient IV care the dog needs, which is largely determined by how early treatment starts.',
      },
      {
        question: 'Why are parvo bills so expensive?',
        answer:
          'Most of the cost is daily hospitalization that repeats every day the dog is admitted: a boarding/isolation fee, IV fluids, medications, and nursing care, each charged per day. Treatment buys time for the gut lining to regenerate (a 3 to 5 day process) while keeping the dog alive and protected from infection. The bill is essentially days of life support multiplied out, not a single procedure.',
      },
      {
        question: 'What can I do if I cannot afford full parvo hospitalization?',
        answer:
          'Ask your vet directly about outpatient treatment, which uses subcutaneous fluids and injectable medications and can bring a $3,000 to $5,000 case down to several hundred dollars, with survival rates around 50 to 80 percent. Other options include CareCredit, charitable assistance funds like RedRover Relief and the Brown Dog Foundation, and nonprofit clinics. The most powerful thing you can say is: "I can\'t afford full hospitalization. What are all of my other options?"',
      },
      {
        question: 'Does pet insurance cover parvo?',
        answer:
          'Standard accident-and-illness policies do cover parvo, typically reimbursing 70 to 90 percent after the deductible, but only if the policy was active before symptoms began. Most policies have a roughly 14-day waiting period that overlaps with a puppy\'s highest-risk weeks, and any prior symptom can trigger a pre-existing condition denial. Reimbursement also comes after you pay up front. For parvo specifically, completing the $75 to $150 vaccine series is cheaper and more effective protection.',
      },
    ],
  },
  {
    slug: 'how-do-i-know-if-my-dog-has-parvo',
    title: 'How Do I Know If My Dog Has Parvo?',
    description:
      'What parvo actually looks like in real life, how it is diagnosed, the honest survival odds, and why acting the same day is the single biggest variable.',
    datePublished: '2026-06-23',
    author: 'ParvoMaps',
    coverImage: '/article-images/puppy-testing-positive-for-parvo.png',
    coverAlt: 'A puppy at the vet testing positive for parvovirus',
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
