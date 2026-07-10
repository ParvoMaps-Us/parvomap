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

/** Topic clusters used to group posts on the /blog index. Add a new value here
 *  (and to BLOG_CATEGORIES below) before using it on a post. */
export type BlogCategory =
  | 'Symptoms'
  | 'Treatment & Recovery'
  | 'Prevention & Risk'

/** Categories in display order, each with a one-line intro for its section
 *  header on the index. A category with no posts is skipped when rendering. */
export const BLOG_CATEGORIES: { name: BlogCategory; description: string }[] = [
  {
    name: 'Symptoms',
    description: 'Spotting the early signs of illness and knowing when something is off.',
  },
  {
    name: 'Treatment & Recovery',
    description: 'What treatment costs, what it does, and what recovery looks like.',
  },
  {
    name: 'Prevention & Risk',
    description: 'Vaccines, risk factors, and keeping every dog protected.',
  },
]

export interface BlogPost {
  /** lowercase, hyphenated, keyword-rich */
  slug: string
  title: string
  description: string
  /** Topic cluster this post is grouped under on the index. */
  category: BlogCategory
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
    slug: 'kennel-cough-vs-dog-flu',
    title: "What's the Difference Between Kennel Cough and Dog Flu?",
    description:
      'Kennel cough and dog flu both cause coughing after daycare or boarding, but dog flu hits harder. How to tell them apart, what to do, and the vaccines for each.',
    category: 'Symptoms',
    datePublished: '2026-07-10',
    author: 'ParvoMaps',
    coverImage: '/article-images/kennel-cough-vs-dog-flu.webp',
    coverAlt: 'A coughing dog kept away from others while sick with kennel cough or dog flu',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          'If your dog has a sudden cough after daycare, boarding, or the dog park, this is one of the most common questions owners end up asking, and the honest answer is that the two conditions overlap enough that even vets sometimes need testing to tell them apart with certainty.',
        ],
      },
      {
        type: 'heading',
        text: 'What Kennel Cough Is',
      },
      {
        type: 'paragraph',
        content: [
          { text: 'Kennel cough', href: '/diseases/kennel' },
          ', more formally canine infectious tracheobronchitis, is not one single germ. It is an umbrella term for a group of viruses and bacteria that cause similar symptoms, most commonly the bacteria Bordetella bronchiseptica along with canine parainfluenza virus and adenovirus. The hallmark symptom is a dry, hacking cough often described as sounding like a goose honk. Most cases are mild and resolve within 10 to 20 days without needing much beyond supportive care.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'For more on how long a dog stays contagious and when it is safe to return to group settings, see our guide on ',
          { text: 'how long kennel cough is contagious', href: '/blog/how-long-is-kennel-cough-contagious' },
          '.',
        ],
      },
      {
        type: 'heading',
        text: 'What Dog Flu Is',
      },
      {
        type: 'paragraph',
        content: [
          { text: 'Canine influenza', href: '/diseases/influenza' },
          ' is a specific viral infection, caused by either the H3N8 or H3N2 strain, and it tends to hit harder. Because dogs have little to no natural immunity to these relatively newer viruses, nearly all exposed dogs become infected, and roughly 80 percent go on to show visible symptoms while the rest remain contagious without looking sick.',
        ],
      },
      {
        type: 'heading',
        text: 'How to Tell Them Apart',
      },
      {
        type: 'paragraph',
        content: [
          'This is genuinely difficult, because both conditions share overlapping symptoms: coughing, nasal discharge, and sometimes fever. A few patterns lean one way or the other.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Kennel cough tends to produce a milder illness with a dog that otherwise acts fairly normal, still eating and playing between coughing fits. Dog flu more often comes with additional symptoms beyond the cough: fever, lethargy, reduced appetite, and a cough that can last longer, often 10 to 21 days.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Dog flu carries a higher chance of progressing to pneumonia and, though rare, can be fatal, while uncomplicated kennel cough almost never is. Vets often describe severe canine influenza as looking like "a really bad case of kennel cough," which captures how much overlap there is on the surface.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Because the symptoms genuinely mimic each other, a definitive diagnosis usually requires lab testing, such as PCR or antigen tests, rather than relying on how the cough sounds or looks.',
        ],
      },
      {
        type: 'heading',
        text: 'What to Do Either Way',
      },
      {
        type: 'paragraph',
        content: [
          'Regardless of which one your dog has, the same basic steps apply: isolate them from other dogs, avoid daycare, boarding, and dog parks until they are cleared, and watch closely for signs of worsening, especially labored breathing, high fever, or lethargy, which push the situation toward needing more aggressive treatment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "Vaccines exist for both. The kennel cough vaccine targets Bordetella specifically, and separate vaccines cover the H3N8 and H3N2 flu strains. If your dog is regularly around other dogs at daycare, boarding, or dog parks, both vaccines are worth discussing with your vet, since having one does not protect against the other.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If there has been a reported cluster of respiratory illness at a specific facility or park near you, ',
          { text: 'ParvoMaps', href: '/' },
          ' tracks kennel cough and dog flu reports, which can help you decide whether it is worth avoiding a location for a while before your dog\'s next visit. And if your dog has been sick, ',
          { text: 'reporting your own case', href: '/' },
          ' helps the map grow and protect other dog owners. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the difference between kennel cough and dog flu?',
        answer:
          'Both cause coughing after daycare, boarding, or the dog park, but kennel cough is usually milder, with a dog that still eats and plays between honking coughing fits. Dog flu (canine influenza, H3N8 or H3N2) tends to hit harder, adding fever, lethargy, and reduced appetite, a longer cough of 10 to 21 days, and a higher chance of progressing to pneumonia. The symptoms overlap so much that lab testing is often needed to be sure.',
      },
      {
        question: 'How do vets tell kennel cough and dog flu apart?',
        answer:
          'Because the symptoms genuinely mimic each other, a definitive diagnosis usually requires lab testing such as PCR or antigen tests, not just how the cough sounds. Vets often describe severe canine influenza as looking like a really bad case of kennel cough, which is why testing matters when a dog is sicker than expected.',
      },
      {
        question: 'What should I do if my dog has a cough after daycare or boarding?',
        answer:
          'Either way, isolate your dog from other dogs and skip daycare, boarding, and dog parks until they are cleared. Watch closely for worsening signs, especially labored breathing, high fever, or lethargy, which mean it is time for more aggressive veterinary treatment rather than waiting it out.',
      },
      {
        question: 'Is there a vaccine for kennel cough and dog flu?',
        answer:
          'Yes, but they are separate. The kennel cough vaccine targets Bordetella specifically, while separate vaccines cover the H3N8 and H3N2 canine influenza strains. Having one does not protect against the other, so if your dog is regularly around other dogs, both are worth discussing with your vet.',
      },
    ],
  },
  {
    slug: 'dog-diarrhea-giardia',
    title: 'My Dog Has Diarrhea, Is It Giardia or Something Else?',
    description:
      'Giardia is a common, easily missed cause of dog diarrhea. What giardia diarrhea looks like, how it differs from other causes, and how it is tested and treated.',
    category: 'Symptoms',
    datePublished: '2026-07-10',
    author: 'ParvoMaps',
    coverImage: '/article-images/giardia-diarrhea.webp',
    coverAlt: 'A dog being examined at the vet for giardia, a common cause of diarrhea',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          'Diarrhea is one of the most common reasons dog owners end up searching the internet at 11pm, and ',
          { text: 'giardia', href: '/diseases/giardia' },
          ' is one of the most common causes that gets overlooked because the symptoms overlap with so many other things.',
        ],
      },
      {
        type: 'heading',
        text: 'What Giardia Actually Is',
      },
      {
        type: 'paragraph',
        content: [
          "Giardia is a microscopic parasite that lives in the intestines and gets picked up by drinking or coming into contact with water, soil, or food contaminated with the parasite's cysts. It is genuinely common. Estimates suggest around 15 percent of dogs carry it at some point, and many never show symptoms at all.",
        ],
      },
      {
        type: 'heading',
        text: 'What Giardia Diarrhea Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          'When giardia does cause symptoms, the classic presentation is soft, watery, foul-smelling diarrhea that sometimes has a greenish tinge and may contain mucus. Dogs pass several loose stools a day rather than just one or two. Vomiting can happen alongside it in some dogs, along with bloating, gas, and gradual weight loss if it goes untreated.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Puppies, senior dogs, and dogs with weakened immune systems tend to show more severe and more obvious symptoms. A healthy adult dog can sometimes carry giardia with barely noticeable symptoms, while a puppy with the same infection might show clear, persistent diarrhea.',
        ],
      },
      {
        type: 'heading',
        text: 'How It Is Different From Other Causes of Diarrhea',
      },
      {
        type: 'paragraph',
        content: [
          'This is the hard part, because giardia diarrhea does not look dramatically different from diarrhea caused by a dietary change, stress, mild food poisoning, or other intestinal parasites. There is no single symptom that says "this is definitely giardia" without testing.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'A few things nudge the odds toward giardia specifically: diarrhea that persists for more than a day or two rather than resolving on its own, a foul or unusually strong odor, and any known exposure to shared water sources, dog parks, or other dogs with diarrhea. If your dog drinks from puddles, communal water bowls, or natural water sources, that raises the likelihood.',
        ],
      },
      {
        type: 'heading',
        text: 'How Vets Diagnose It',
      },
      {
        type: 'paragraph',
        content: [
          'Diagnosis requires a fecal test, since giardia cysts are shed intermittently, meaning a single test can sometimes miss it even when the parasite is present. Vets sometimes run a specific antigen test in addition to a standard fecal exam for this reason, or repeat testing if giardia is strongly suspected but the first test comes back negative.',
        ],
      },
      {
        type: 'heading',
        text: 'Treatment and Recovery',
      },
      {
        type: 'paragraph',
        content: [
          'Giardia is treated with antiparasitic medication, most commonly fenbendazole or metronidazole, sometimes both together for stubborn cases. Most dogs improve within five to eight days of starting treatment. Vets typically recommend retesting 24 to 48 hours after treatment ends to confirm the parasite is actually cleared, since reinfection is common if cysts remain in the yard or home environment.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Reinfection is a real risk specifically because giardia cysts can survive in the environment for months. Cleaning up feces promptly, washing bedding in hot water, and bathing your dog periodically during treatment all reduce the odds of your dog picking it back up right after clearing it.',
        ],
      },
      {
        type: 'heading',
        text: 'When It Is More Than a Nuisance',
      },
      {
        type: 'paragraph',
        content: [
          'Giardia is not usually considered a medical emergency on its own, but puppies and dogs with severe, persistent diarrhea should get emergency attention to prevent dehydration. It is also worth knowing that giardia can spread to humans, particularly children, elderly family members, or anyone immunocompromised, so hand washing and environmental cleanup matter for the whole household, not just the dog.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          "If your dog's diarrhea does not resolve within a day or two, or comes with blood, repeated vomiting, or lethargy, that is the point where it is worth ruling out something more serious, starting with our guide on ",
          { text: 'how to know if your dog has parvo', href: '/blog/how-do-i-know-if-my-dog-has-parvo' },
          '. ',
          { text: 'Check ParvoMaps', href: '/' },
          ' if you are unsure whether something more concerning has been reported near you, since severe GI symptoms overlap across several diseases and exposure history is often the clearest clue. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What does giardia diarrhea look like in dogs?',
        answer:
          'The classic presentation is soft, watery, foul-smelling diarrhea that sometimes has a greenish tinge and may contain mucus, with several loose stools a day. Some dogs also have vomiting, bloating, gas, and gradual weight loss if untreated. Puppies, seniors, and immunocompromised dogs usually show more obvious symptoms than healthy adults.',
      },
      {
        question: 'How is giardia diagnosed in dogs?',
        answer:
          'It requires a fecal test. Because giardia cysts are shed intermittently, a single test can miss it even when the parasite is present, so vets often add a specific antigen test to the standard fecal exam or repeat testing if giardia is strongly suspected but the first result is negative.',
      },
      {
        question: 'How is giardia treated and how long does recovery take?',
        answer:
          'Giardia is treated with antiparasitic medication, most commonly fenbendazole or metronidazole, sometimes both for stubborn cases. Most dogs improve within five to eight days. Vets usually retest 24 to 48 hours after treatment ends, since reinfection is common if cysts remain in the environment. Prompt feces cleanup, hot-water washing of bedding, and periodic bathing during treatment lower that risk.',
      },
      {
        question: 'Can giardia spread from dogs to humans?',
        answer:
          'Yes, giardia can spread to people, particularly children, elderly family members, and anyone immunocompromised. Hand washing and environmental cleanup matter for the whole household during and after treatment, not just for the dog.',
      },
    ],
  },
  {
    slug: 'dog-swam-in-lake-blue-green-algae',
    title: 'My Dog Swam in a Lake and Is Acting Weird, Is It Algae Poisoning?',
    description:
      'Blue-green algae poisoning can kill a dog within an hour of a swim. How fast symptoms appear, what to watch for, and why rinsing and calling your vet cannot wait.',
    category: 'Symptoms',
    datePublished: '2026-07-10',
    author: 'ParvoMaps',
    coverImage: '/article-images/blue-green-algae.webp',
    coverAlt: 'A lake with a blue-green algae bloom where a dog was swimming',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          'If your dog was just in a lake or pond and is suddenly vomiting, stumbling, drooling excessively, or acting disoriented, treat this as a potential emergency right now. ',
          { text: 'Blue-green algae poisoning', href: '/diseases/cyano' },
          ' moves faster than almost anything else, and there is no antidote once symptoms take hold.',
        ],
      },
      {
        type: 'heading',
        text: 'What Blue-Green Algae Actually Is',
      },
      {
        type: 'paragraph',
        content: [
          'Despite the name, blue-green algae is not algae at all. It is a bacteria called cyanobacteria that grows in warm, nutrient-rich, often stagnant water like lakes, ponds, and slow rivers, especially during hot summer months. Blooms can appear blue, green, brown, or red, sometimes looking like spilled paint or pea soup floating on the surface. Not every bloom is toxic, but there is no reliable way to tell just by looking, so the safest approach is to treat any visible bloom as dangerous.',
        ],
      },
      {
        type: 'heading',
        text: 'How Fast Symptoms Appear',
      },
      {
        type: 'paragraph',
        content: [
          'This is the detail that matters most. Symptoms of blue-green algae poisoning can show up anywhere from 15 minutes to a few hours after exposure, and in severe cases, dogs have died within an hour of swimming in contaminated water. This is dramatically faster than almost any other disease, which is why "wait and see" is especially dangerous here.',
        ],
      },
      {
        type: 'heading',
        text: 'What the Symptoms Actually Look Like',
      },
      {
        type: 'paragraph',
        content: [
          'Watch for vomiting, diarrhea, excessive drooling, weakness, disorientation, difficulty standing, tremors, seizures, and labored breathing. The two main toxin types cause different symptom patterns. One attacks the liver and can cause jaundice, dark urine, and abdominal pain as it progresses. The other attacks the nervous system and can cause seizures, muscle tremors, and paralysis. Both can lead to shock, respiratory failure, and death within hours to days if untreated.',
        ],
      },
      {
        type: 'heading',
        text: 'What to Do Right Now if You Suspect Exposure',
      },
      {
        type: 'paragraph',
        content: [
          'Rinse your dog thoroughly with clean, fresh water immediately to remove any algae from their fur, since dogs often ingest more toxin later by licking themselves clean. Do not wait to see if symptoms develop. Call your vet or an emergency animal hospital immediately and let them know you suspect algae exposure so they can prepare.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'There is no antidote for the toxins involved. If your dog is caught early enough and is still stable, a vet may be able to induce vomiting, perform gastric lavage, or administer activated charcoal to reduce how much toxin gets absorbed. Once a dog becomes symptomatic from the liver or nervous system toxins, prognosis becomes poor to grave even with aggressive treatment, which is exactly why speed before symptoms appear matters so much.',
        ],
      },
      {
        type: 'heading',
        text: 'Why This Disease Deserves Extra Caution',
      },
      {
        type: 'paragraph',
        content: [
          'Unlike ',
          { text: 'parvo', href: '/diseases/parvo' },
          ' or ',
          { text: 'lepto', href: '/diseases/leptospira' },
          ', there is no supportive care that just buys time while the body fights it off. The damage from these toxins can be severe and fast, and some dogs who survive initial exposure still go on to develop chronic liver problems afterward.',
        ],
      },
      {
        type: 'heading',
        text: 'How to Avoid This Entirely',
      },
      {
        type: 'paragraph',
        content: [
          'Avoid letting your dog swim in or drink from water that looks stagnant, discolored, scummy, or has a foul smell, especially during warm months. Bring clean water for your dog on hikes and outings so they are not tempted to drink from natural sources. If your dog does swim in water you are unsure about, rinse them off immediately afterward rather than waiting until you get home.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Because this moves so much faster than other outbreak categories, checking ',
          { text: 'ParvoMaps', href: '/' },
          ' before choosing a swimming spot is one of the more genuinely useful precautions available. A ',
          { text: 'reported case at a specific lake or pond', href: '/diseases/cyano' },
          ' is the kind of warning that can be the entire difference between a fun afternoon and an emergency vet visit. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How quickly does blue-green algae poisoning affect dogs?',
        answer:
          'Very quickly. Symptoms can appear anywhere from 15 minutes to a few hours after exposure, and in severe cases dogs have died within an hour of swimming in contaminated water. This is far faster than most other dog diseases, which is why waiting to see if symptoms develop is especially dangerous.',
      },
      {
        question: 'What are the symptoms of algae poisoning in dogs?',
        answer:
          'Watch for vomiting, diarrhea, excessive drooling, weakness, disorientation, difficulty standing, tremors, seizures, and labored breathing. Liver-type toxins can also cause jaundice, dark urine, and abdominal pain; nervous-system toxins can cause seizures, muscle tremors, and paralysis. Both can progress to shock, respiratory failure, and death within hours to days.',
      },
      {
        question: 'What should I do if my dog swam in water that might have algae?',
        answer:
          'Rinse your dog thoroughly with clean, fresh water right away so they do not swallow more toxin licking themselves clean, and call your vet or an emergency animal hospital immediately, telling them you suspect algae exposure. Do not wait for symptoms. If caught early and still stable, a vet may induce vomiting or give activated charcoal to limit toxin absorption.',
      },
      {
        question: 'Is there a cure for blue-green algae poisoning?',
        answer:
          'No. There is no antidote for the cyanobacteria toxins. Treatment is limited to reducing absorption early (inducing vomiting, gastric lavage, activated charcoal) and supportive care. Once a dog is symptomatic from the liver or nervous-system toxins the prognosis is poor to grave, so prevention and acting before symptoms appear matter most.',
      },
    ],
  },
  {
    slug: 'how-long-tick-attached-to-transmit-lyme',
    title: 'How Long Does a Tick Have to Be Attached to Transmit Lyme Disease?',
    description:
      'Most ticks need 24 to 48 hours attached to transmit Lyme disease, often closer to 36 to 48. Why early removal matters most, plus symptoms, removal, and prevention.',
    category: 'Prevention & Risk',
    datePublished: '2026-07-05',
    author: 'ParvoMaps',
    coverImage: '/article-images/tick-lyme-transmission.webp',
    coverAlt: 'A tick attached to a dog being removed with fine-tipped tweezers',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          "If you just pulled a tick off your dog and you are trying to figure out whether you caught it in time, here is the most useful number to know: in most cases, a tick needs to be attached for roughly 24 to 48 hours before it can transmit ",
          { text: 'Lyme disease', href: '/diseases/lyme' },
          ', and transmission most commonly happens closer to the 36 to 48 hour mark.',
        ],
      },
      {
        type: 'heading',
        text: 'Why the Timing Matters So Much',
      },
      {
        type: 'paragraph',
        content: [
          "This window exists because the Lyme bacteria, Borrelia burgdorferi, lives in the tick's gut and needs time to migrate to the tick's saliva before it can pass into your dog's bloodstream. That migration takes time, which is exactly why early removal is the single most effective thing an owner can do.",
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If you find and remove a tick within roughly 24 hours of attachment, the risk of transmission drops significantly. This is also why daily tick checks matter so much for dogs that spend time outdoors, especially in tall grass, brush, marshes, or wooded areas where these ticks are most commonly picked up.',
        ],
      },
      {
        type: 'heading',
        text: 'A Caveat Worth Knowing',
      },
      {
        type: 'paragraph',
        content: [
          "The 24 to 48 hour window is the standard, well-established guideline, and it remains the most useful number to plan around. That said, some newer research has raised questions about whether transmission can occasionally happen faster than previously thought, particularly with smaller, harder-to-spot nymph-stage ticks. The practical takeaway is not to panic over exact hours. It is that removing a tick as soon as you find it is always the right move, and that even a fast removal does not guarantee zero risk, especially with the tiny nymph ticks that are easy to miss entirely.",
        ],
      },
      {
        type: 'heading',
        text: 'What Symptoms Actually Look Like',
      },
      {
        type: 'paragraph',
        content: [
          'Even after a transmission event happens, symptoms do not show up right away. Signs of Lyme disease in dogs typically take anywhere from a few weeks to a few months to appear, which means a tick bite today might not translate into visible illness until well after the bite itself is forgotten.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'When symptoms do appear, the most common signs are lameness that can shift from leg to leg, swollen joints, fever, lethargy, and reduced appetite. Left unaddressed, Lyme disease can also affect the kidneys in more serious cases.',
        ],
      },
      {
        type: 'heading',
        text: 'What to Do Right After Finding a Tick',
      },
      {
        type: 'paragraph',
        content: [
          'Remove it with fine-tipped tweezers, grasping as close to the skin as possible, and pull upward with steady, even pressure. Do not twist. The goal is to remove the entire tick including the mouthparts. Avoid crushing it, since contact with tick fluids carries its own small risk.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'After removal, keep an eye on the bite site and on your dog\'s overall behavior for the following weeks. A Lyme test can detect antibodies within three to five weeks of a bite, even before symptoms show up, so if you know your dog picked up a tick in a high-risk area, that is worth mentioning at their next vet visit even if nothing looks wrong yet.',
        ],
      },
      {
        type: 'heading',
        text: 'Reducing the Odds in the First Place',
      },
      {
        type: 'paragraph',
        content: [
          'Tick prevention medication, checking your dog daily after time in wooded or grassy areas, and avoiding known tick-heavy trails during peak season are the most effective layers of protection. The Lyme vaccine is available and worth discussing with your vet if you live in or travel to a higher-risk region, including the Northeast, Upper Midwest, and parts of the Pacific Coast, though risk has been expanding beyond those traditional zones in recent years.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If you want to know whether Lyme cases have been reported near a trail or park before you go, ',
          { text: 'ParvoMaps', href: '/' },
          ' tracks ',
          { text: 'Lyme disease', href: '/diseases/lyme' },
          ' alongside other regional outbreak data, which can help you decide whether extra tick precautions are worth taking that day. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does a tick have to be attached to transmit Lyme disease to a dog?',
        answer:
          'In most cases a tick needs to be attached for roughly 24 to 48 hours, with transmission most common closer to the 36 to 48 hour mark. The Lyme bacteria (Borrelia burgdorferi) lives in the tick\'s gut and needs time to migrate to its saliva before it can pass into the dog. Removing a tick within about 24 hours drops the risk significantly, though tiny nymph ticks can occasionally transmit faster and are easy to miss.',
      },
      {
        question: 'How soon do Lyme disease symptoms appear in dogs?',
        answer:
          'Symptoms usually take a few weeks to a few months to appear, so a bite today may not cause visible illness until well after it is forgotten. The most common signs are shifting-leg lameness, swollen joints, fever, lethargy, and reduced appetite. A Lyme test can detect antibodies within three to five weeks of a bite, even before symptoms show.',
      },
      {
        question: 'What is the right way to remove a tick from a dog?',
        answer:
          'Use fine-tipped tweezers, grasp as close to the skin as possible, and pull upward with steady, even pressure. Do not twist, and aim to remove the entire tick including the mouthparts. Avoid crushing it, since contact with tick fluids carries its own small risk, then watch the bite site and your dog for the following weeks.',
      },
      {
        question: 'Is there a Lyme vaccine for dogs?',
        answer:
          'Yes. A canine Lyme vaccine is available and worth discussing with your vet, especially if you live in or travel to higher-risk regions like the Northeast, Upper Midwest, or parts of the Pacific Coast. It works best alongside tick prevention medication and daily tick checks, since risk has been expanding beyond those traditional zones.',
      },
    ],
  },
  {
    slug: 'early-signs-of-lepto-in-dogs',
    title: 'What Are the Early Signs of Lepto in Dogs?',
    description:
      'The early signs of leptospirosis look like a dozen milder problems. What to watch for, why exposure history is the key, and why acting early prevents organ damage.',
    category: 'Symptoms',
    datePublished: '2026-07-04',
    author: 'ParvoMaps',
    coverImage: '/article-images/lepto-early-signs.webp',
    coverAlt: 'A dog drinking from a puddle, a common source of leptospirosis',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          { text: 'Leptospirosis', href: '/diseases/leptospira' },
          ' is one of the sneakier diseases dog owners deal with, because the early signs look almost identical to a dozen less serious problems. Catching it early matters enormously, since this is a disease where delay can mean permanent kidney or liver damage.',
        ],
      },
      {
        type: 'heading',
        text: 'The Early, Easy-to-Miss Signs',
      },
      {
        type: 'paragraph',
        content: [
          'The most common early indicators are loss of appetite, lethargy, and fever. Some dogs also show a change in how much they are drinking and urinating, either noticeably more or noticeably less than usual. Vomiting and diarrhea often show up around the same time.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'One pattern that throws owners off is a fever that spikes, then seems to break and improve, then returns. That temporary dip can create false reassurance that the dog is getting better on their own, when the infection is actually still active underneath.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'None of these signs are unique to lepto on their own. That is exactly the problem. A dog that is just "a little off" with reduced appetite and some lethargy could have lepto, or could have a dozen more benign things going on. The distinguishing factor is not the symptom itself, it is the exposure history.',
        ],
      },
      {
        type: 'heading',
        text: 'When Lepto Should Be on Your Radar',
      },
      {
        type: 'paragraph',
        content: [
          'Leptospirosis spreads through contact with urine from infected animals, most often wildlife like rats, raccoons, skunks, and deer, and it thrives in standing or slow-moving water. Dogs get infected by drinking from puddles, ponds, or slow streams, or through mucous membranes or skin cuts coming into contact with contaminated soil or water.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If your dog has recently been around standing water, spent time in a rural or wooded area, or lives somewhere with active wildlife traffic, even just in the backyard, and starts showing any combination of the early signs above, that combination is worth a same-day call to your vet. Leptospirosis affects dogs of any age, breed, or lifestyle. It is not limited to rural or outdoor-heavy dogs, since even a fenced urban backyard can be contaminated by a rodent or raccoon passing through.',
        ],
      },
      {
        type: 'heading',
        text: 'What Happens as It Progresses',
      },
      {
        type: 'paragraph',
        content: [
          'Left unaddressed, lepto typically moves toward kidney involvement, showing up as back pain, changes in urination, and worsening dehydration. It can also affect the liver, sometimes causing yellowing of the gums, skin, or eyes. Some dogs develop bleeding disorders that show up as nosebleeds, bruising, or blood in the stool. Respiratory symptoms and even sudden behavior changes can appear in severe cases.',
        ],
      },
      {
        type: 'heading',
        text: 'Why Early Action Matters So Much Here',
      },
      {
        type: 'paragraph',
        content: [
          'When leptospirosis is caught and treated early with antibiotics, most commonly doxycycline, the chance of full recovery is good. Even with prompt, thorough treatment, though, a portion of infected dogs do not survive, which is exactly why vague early symptoms should not get written off as "let\'s wait and see."',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'This disease is also zoonotic, meaning it can spread from dogs to people through contact with urine. If your dog is diagnosed, that is a conversation to have with your own doctor too, not just your vet.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The leptospirosis vaccine protects against the most common strains and is now considered a core vaccine for most dogs. It does not cover every strain that exists, so even a vaccinated dog showing these signs after a likely exposure deserves a vet visit rather than automatic reassurance.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          { text: 'ParvoMaps', href: '/' },
          ' tracks ',
          { text: 'leptospirosis reports', href: '/diseases/leptospira' },
          ' alongside other outbreak categories, which is useful specifically because lepto exposure is tied so closely to environment. Knowing whether cases have been reported near a lake, trail, or park you frequent can change how quickly you act if your dog starts looking off after a visit there. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What are the early signs of leptospirosis in dogs?',
        answer:
          'The most common early signs are loss of appetite, lethargy, and fever, often with increased or decreased drinking and urination, plus vomiting and diarrhea. A telltale pattern is a fever that spikes, seems to break, then returns. None of these are unique to lepto on their own, so recent exposure to standing water or wildlife is the key distinguishing factor.',
      },
      {
        question: 'How do dogs catch leptospirosis?',
        answer:
          'Lepto spreads through contact with urine from infected animals, most often wildlife like rats, raccoons, skunks, and deer, and it thrives in standing or slow-moving water. Dogs get infected by drinking from puddles, ponds, or slow streams, or through mucous membranes and skin cuts contacting contaminated soil or water. Even a fenced urban backyard can be contaminated by a rodent or raccoon passing through.',
      },
      {
        question: 'Can a vaccinated dog still get lepto?',
        answer:
          'Yes. The leptospirosis vaccine is now considered a core vaccine and protects against the most common strains, but it does not cover every strain. A vaccinated dog showing the early signs after a likely exposure still deserves a vet visit rather than automatic reassurance.',
      },
      {
        question: 'Is leptospirosis contagious to humans?',
        answer:
          'Yes, lepto is zoonotic and can spread from dogs to people through contact with infected urine. If your dog is diagnosed, mention it to your own doctor as well as your vet, and take care handling urine and contaminated areas during recovery.',
      },
    ],
  },
  {
    slug: 'how-long-is-kennel-cough-contagious',
    title: 'How Long Is Kennel Cough Contagious?',
    description:
      'How long kennel cough stays contagious depends on the pathogen. The general timeline, the boarding rule of thumb, why it spreads so easily, and when to see a vet.',
    category: 'Prevention & Risk',
    datePublished: '2026-07-04',
    author: 'ParvoMaps',
    coverImage: '/article-images/kennel-cough-contagious.webp',
    coverAlt: 'A dog with a honking cough being kept away from other dogs',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          "If your dog has that unmistakable honking cough and you are trying to figure out when it is safe to be around other dogs again, the honest answer depends on which pathogen is behind it, and that is part of what makes ",
          { text: 'kennel cough', href: '/diseases/kennel' },
          ' tricky to plan around.',
        ],
      },
      {
        type: 'heading',
        text: 'The General Timeline',
      },
      {
        type: 'paragraph',
        content: [
          'Kennel cough, more accurately called canine infectious tracheobronchitis, is not caused by a single germ. It is a syndrome caused by a combination of viruses and bacteria, most commonly Bordetella bronchiseptica along with canine parainfluenza virus and adenovirus. Most cases resolve on their own within 10 to 20 days.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Contagiousness does not line up perfectly with symptoms, though. Dogs infected with Bordetella specifically can remain contagious for up to 14 days after their coughing has fully stopped. Some dogs, depending on the exact pathogen involved, can shed and spread the infection for several weeks or even months in less common cases.',
        ],
      },
      {
        type: 'heading',
        text: 'The Boarding and Daycare Rule of Thumb',
      },
      {
        type: 'paragraph',
        content: [
          'Most boarding facilities and daycares use a general guideline of 7 days symptom-free before a dog is cleared to return. That is a reasonable middle ground, but it is a guideline, not a guarantee, since some dogs keep shedding pathogens beyond that window. If your dog had a more severe or prolonged case, ask your vet directly whether more time is warranted before reintroducing them to group settings.',
        ],
      },
      {
        type: 'heading',
        text: 'Why It Spreads So Easily',
      },
      {
        type: 'paragraph',
        content: [
          'Part of what makes kennel cough so persistent in group environments is that the pathogens involved can survive on surfaces for weeks, sometimes longer, in an environment that is not properly cleaned. A quick spray and wipe is not enough. Effective disinfection requires several minutes of contact time with a product that actually kills the specific pathogens involved, which is why outbreaks move so efficiently through kennels, shelters, and dog parks.',
        ],
      },
      {
        type: 'heading',
        text: 'Does the Vaccine Prevent It?',
      },
      {
        type: 'paragraph',
        content: [
          'The kennel cough vaccine typically protects against Bordetella specifically. Since kennel cough can be caused by more than a dozen different viruses and bacteria in combination, a vaccinated dog can still catch a version of it caused by a different pathogen the vaccine does not cover. This is why some vaccinated dogs still come down with a cough after daycare or boarding, and it does not mean the vaccine failed. It means a different piece of the kennel cough puzzle got through.',
        ],
      },
      {
        type: 'heading',
        text: "When It's More Than Just Kennel Cough",
      },
      {
        type: 'paragraph',
        content: [
          'Kennel cough is rarely dangerous on its own, but it can escalate into pneumonia in puppies, senior dogs, or dogs with weakened immune systems. If the cough is paired with lethargy, appetite loss, fever, or labored breathing, that is no longer a simple kennel cough case and needs a same-day vet visit.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If you are weighing whether it is safe to bring your dog to a park or daycare where a case has been reported, ',
          { text: 'ParvoMaps', href: '/' },
          ' tracks kennel cough reports alongside other contagious conditions, so you can ',
          { text: 'see if something has been circulating', href: '/diseases/kennel' },
          ' in your area before you go. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' so a nearby case reaches you first.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long is kennel cough contagious?',
        answer:
          'It depends on the pathogen. Most cases resolve within 10 to 20 days, but dogs infected with Bordetella can stay contagious for up to 14 days after coughing stops, and some dogs shed the infection for several weeks or even months in less common cases. Contagiousness does not line up perfectly with visible symptoms.',
      },
      {
        question: 'How long should a dog stay home from daycare or boarding with kennel cough?',
        answer:
          'Most facilities use a rule of thumb of 7 days symptom-free before a dog returns. That is a reasonable middle ground but not a guarantee, since some dogs keep shedding beyond that window. After a severe or prolonged case, ask your vet whether more time is warranted before group settings.',
      },
      {
        question: 'Can a vaccinated dog still get kennel cough?',
        answer:
          'Yes. The vaccine typically protects against Bordetella specifically, but kennel cough can be caused by more than a dozen viruses and bacteria in combination. A vaccinated dog can still catch a version caused by a pathogen the vaccine does not cover. That is not vaccine failure; it means a different piece of the puzzle got through.',
      },
      {
        question: 'When is kennel cough serious enough to see a vet?',
        answer:
          'Kennel cough is rarely dangerous on its own, but it can progress to pneumonia in puppies, senior dogs, and immunocompromised dogs. If the cough comes with lethargy, appetite loss, fever, or labored breathing, treat it as urgent and get a same-day vet visit.',
      },
    ],
  },
  {
    slug: 'parvo-vs-distemper-symptoms',
    title: "What's the Difference Between Parvo and Distemper Symptoms?",
    description:
      'Parvo and distemper look alike early but attack different systems. How to tell the symptoms apart, why the first move is the same, and what prevents both.',
    category: 'Symptoms',
    datePublished: '2026-07-03',
    author: 'ParvoMaps',
    coverImage: '/article-images/parvo-vs-distemper.webp',
    coverAlt: 'A sick dog being examined at the vet for parvo or distemper',
    readingMinutes: 6,
    body: [
      {
        type: 'paragraph',
        content: [
          'Parvo and distemper get confused constantly, and it makes sense why. Both are serious, both hit young unvaccinated dogs hardest, and both start with symptoms that look a lot like a generic stomach bug. But they are different viruses attacking different parts of the body, and knowing the distinction matters for how urgently you act and what your vet tests for.',
        ],
      },
      {
        type: 'heading',
        text: 'What Parvo Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          { text: 'Parvovirus', href: '/diseases/parvo' },
          ' goes after the gut first. The signature symptoms are severe vomiting and profuse, often bloody diarrhea with a distinctive foul odor. Appetite loss and lethargy show up early, followed quickly by dehydration as fluids pour out through vomiting and diarrhea. Parvo is diagnosed with a fecal swab test that most clinics run in-house in about ten minutes.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Parvo stays contained to the gastrointestinal system and, in very young puppies, can affect the heart. It does not typically cause neurological symptoms like seizures or tremors. If you want the full picture of how it presents, our guide on ',
          { text: 'how to know if your dog has parvo', href: '/blog/how-do-i-know-if-my-dog-has-parvo' },
          ' walks through the early signs.',
        ],
      },
      {
        type: 'heading',
        text: 'What Distemper Looks Like',
      },
      {
        type: 'paragraph',
        content: [
          { text: 'Distemper', href: '/diseases/distemper' },
          ' is a different animal entirely, in more ways than one. It starts similarly, with fever, lethargy, appetite loss, and sometimes vomiting or diarrhea, which is exactly why the two get mixed up in the early stages. But distemper does not stop at the gut. It moves through the respiratory system, causing coughing and nasal or eye discharge, then can progress into the nervous system, causing muscle twitching, seizures, and uncoordinated movement.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Distemper is caused by a virus related to measles and spreads through airborne droplets and direct contact, not just fecal exposure like parvo. It also affects wildlife including raccoons, foxes, and skunks, which means a dog can be exposed without ever encountering another sick dog directly.',
        ],
      },
      {
        type: 'heading',
        text: 'The Key Differences to Watch For',
      },
      {
        type: 'paragraph',
        content: [
          'The clearest distinguishing signs come later in the disease course, but a few patterns help separate them early.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Parvo centers on the gut: bloody diarrhea and repeated vomiting are the hallmark. Distemper centers on multiple systems: respiratory symptoms like coughing and eye discharge often show up alongside or before GI symptoms.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Neurological symptoms, including twitching, seizures, and muscle spasms sometimes described as looking like chewing gum, point toward distemper, not parvo. And distemper can come from wildlife exposure alone, while parvo requires exposure to contaminated feces or a contaminated environment.',
        ],
      },
      {
        type: 'heading',
        text: "Why the Distinction Matters Less Than You'd Think in the Moment",
      },
      {
        type: 'paragraph',
        content: [
          'Here is the practical truth. If your dog is showing any combination of lethargy, appetite loss, vomiting, or diarrhea, the correct move is the same regardless of which virus it turns out to be: get to a vet today, not tomorrow. Vets can test for both, and treatment for both is supportive care rather than a virus-specific cure. The urgency does not change based on which one it is. What changes is what your vet watches for next, and whether other dogs or wildlife in the area might be at risk too.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Both diseases are preventable with the same core vaccine series, usually combined into one shot often labeled DAPP or DA2PP. Staying current on that vaccine protects against both at once.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If there is a confirmed case of either reported near you, ',
          { text: 'ParvoMaps', href: '/' },
          ' tracks both parvo and distemper separately, since they spread differently and carry different risks. Checking ',
          { text: 'the live map', href: '/' },
          ' before a walk in a new area, especially one with wildlife activity, is a low-effort way to catch a warning most owners never get. You can also ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' for your area.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the main difference between parvo and distemper symptoms?',
        answer:
          'Parvo centers on the gut: severe vomiting and profuse, often bloody diarrhea are the hallmark. Distemper attacks multiple systems, so it adds respiratory signs like coughing and nasal or eye discharge, and can progress to neurological symptoms such as twitching, seizures, and uncoordinated movement. Both can start with fever, lethargy, and appetite loss, which is why they get confused early.',
      },
      {
        question: 'Do parvo and distemper spread the same way?',
        answer:
          'No. Parvo spreads through contaminated feces and environments, so it requires exposure to the virus a sick dog shed. Distemper spreads through airborne droplets and direct contact, and it also infects wildlife like raccoons, foxes, and skunks, meaning a dog can catch it without ever meeting another sick dog.',
      },
      {
        question: 'Does the same vaccine prevent both parvo and distemper?',
        answer:
          'Yes. Both are covered by the same core vaccine series, usually combined into one shot labeled DAPP or DA2PP. Staying current on that vaccine protects against both at once.',
      },
      {
        question: 'If I cannot tell whether it is parvo or distemper, what should I do?',
        answer:
          'Treat it as urgent either way. Any combination of lethargy, appetite loss, vomiting, or diarrhea in a young or unvaccinated dog warrants a same-day vet visit. Vets can test for both, and treatment for both is supportive care, so the urgency does not change based on which virus it turns out to be.',
      },
    ],
  },
  {
    slug: 'can-adult-dogs-get-parvo',
    title: 'Can Adult Dogs Get Parvo, or Is It Just Puppies?',
    description:
      'Yes, adult dogs can get parvo. Why adult cases get missed, what raises the risk, and the booster schedule that keeps older dogs protected.',
    category: 'Prevention & Risk',
    datePublished: '2026-07-03',
    author: 'ParvoMaps',
    coverImage: '/article-images/dog-parvo-early.webp',
    coverAlt: 'A lethargic dog showing early signs of parvo',
    readingMinutes: 8,
    body: [
      {
        type: 'paragraph',
        content: [
          'Parvo gets talked about as a puppy disease, and for good reason. Puppies are where it hits hardest and most often. But the honest answer to this question is yes, adult dogs can get ',
          { text: 'parvo', href: '/diseases/parvo' },
          ' too, and the fact that most owners do not know this is exactly why some adult cases get missed until it is serious.',
        ],
      },
      {
        type: 'heading',
        text: 'Why Parvo Is Thought of as a Puppy-Only Disease',
      },
      {
        type: 'paragraph',
        content: [
          'Puppies between roughly 6 weeks and 6 months old are the highest-risk group by a wide margin. Their immune systems are still developing, they have not completed their vaccine series yet, and their bodies have almost no reserve to draw on if they get sick. That combination is why the overwhelming majority of severe parvo cases, and nearly all the fatal ones, happen in young puppies.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'This is also why almost everything written about parvo focuses on puppies. It is not wrong. It is just incomplete.',
        ],
      },
      {
        type: 'heading',
        text: 'Adult Dogs Are Not Immune',
      },
      {
        type: 'paragraph',
        content: [
          'Any unvaccinated or incompletely vaccinated dog can get parvo, regardless of age. A three-year-old dog who never received the full puppy vaccine series, or whose owner let boosters lapse, carries real risk. So does an adult dog with a weakened immune system from another illness, cancer treatment, or long-term steroid use.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Even fully vaccinated adult dogs can occasionally get what is called a breakthrough infection. No vaccine is 100 percent effective in 100 percent of dogs, and parvo is no exception. These cases are uncommon and the vaccine remains the single most effective tool against the disease, but "vaccinated" does not mean "impossible."',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Senior dogs carry a similar risk profile to other unvaccinated adults. If an older dog never had the puppy series, or if their immune system has weakened with age or illness, they are just as exposed as any other unprotected dog.',
        ],
      },
      {
        type: 'heading',
        text: 'Why Adult Cases Get Missed More Often',
      },
      {
        type: 'paragraph',
        content: [
          'Here is the part that matters most for owners. When an adult or senior dog gets parvo, the symptoms are often milder than what is seen in puppies, because a more mature immune system can put up more of a fight. Lethargy, appetite loss, vomiting, and diarrhea in an older dog get chalked up to something else almost every time: a stomach bug, something they ate, just getting old.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'That assumption is understandable, but it is the same trap that costs puppies their best treatment window. An unvaccinated adult dog with vomiting, diarrhea, and lethargy deserves a parvo test just as much as a puppy does, especially if there is any gap in their vaccine history or any known exposure to a sick dog or a contaminated environment. If you are trying to tell the difference between an upset stomach and something worse, our guide on ',
          { text: 'how to know if your dog has parvo', href: '/blog/how-do-i-know-if-my-dog-has-parvo' },
          ' walks through the early signs.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Adult dogs with milder symptoms can also still shed the virus and infect other dogs, including puppies in the same household, without ever looking seriously ill themselves.',
        ],
      },
      {
        type: 'heading',
        text: 'What Puts an Adult Dog at Higher Risk',
      },
      {
        type: 'paragraph',
        content: [
          'A few factors stack the odds against an adult dog if they are exposed.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'No vaccine history or an incomplete puppy series. Vaccine boosters that have lapsed past the recommended schedule. A compromised immune system from illness, medication, or age.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'Breeds with documented higher susceptibility, including Rottweilers, Doberman Pinschers, American Pit Bull Terriers, Labrador Retrievers, and English Springer Spaniels.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'And recent exposure to an infected dog, a contaminated yard, or shared spaces like dog parks and boarding facilities. None of these guarantee a bad outcome, but they are the pattern worth knowing if you have an adult dog with an uncertain vaccine history.',
        ],
      },
      {
        type: 'heading',
        text: 'The Vaccine Schedule Adult Dogs Still Need',
      },
      {
        type: 'paragraph',
        content: [
          'The puppy series is only the start. After the initial series finishes around 16 weeks, dogs need a booster at one year old, followed by boosters roughly every three years for the rest of their life. Skipping these boosters is one of the more common reasons an adult dog ends up unprotected without the owner realizing it.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'If you have adopted an adult dog and do not have clear vaccine records, that is worth a conversation with your vet. Catching an adult dog up on a lapsed or unknown vaccine history is a straightforward fix for what is otherwise a real and preventable risk.',
        ],
      },
      {
        type: 'heading',
        text: 'Why This Matters Beyond the Individual Dog',
      },
      {
        type: 'paragraph',
        content: [
          'An adult dog with a mild, easy-to-miss case of parvo can still contaminate a yard for months. The virus survives in soil and on surfaces for a long time, regardless of the age of the dog that shed it there. That means an under-recognized case in an older dog can quietly become the reason a puppy in the same household, or the next puppy brought into that yard, gets seriously sick later. If that happens, our guide on ',
          { text: 'whether a puppy can survive parvovirus', href: '/blog/can-my-puppy-survive-parvovirus' },
          ' covers what treatment and recovery actually look like.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'This is part of why checking ',
          { text: 'ParvoMaps', href: '/' },
          ' is useful even for owners of adult dogs. A confirmed case reported nearby does not only matter to puppy owners. If your adult dog\'s vaccine history is uncertain and there has been a recent report in your area, that is a reason to get their status confirmed rather than assume age alone protects them. You can ',
          { text: 'set up outbreak alerts', href: '/alerts' },
          ' so a new nearby case reaches you before your dog ever shows a symptom.',
        ],
      },
      {
        type: 'heading',
        text: 'The Bottom Line',
      },
      {
        type: 'paragraph',
        content: [
          'Parvo is not exclusively a puppy disease. It is overwhelmingly a disease of unprotected dogs, and most of those happen to be puppies because that is the age window with the biggest protection gap. But any dog without full, current vaccination carries real risk, at any age.',
        ],
      },
      {
        type: 'paragraph',
        content: [
          'The safest assumption is not "my dog is too old for this." It is "my dog is protected because their vaccines are current," which is a fact you can actually confirm. If something seems off and you want to know what is moving through your area, ',
          { text: 'check the live map', href: '/' },
          ' and read more about ',
          { text: 'parvovirus itself', href: '/diseases/parvo' },
          '.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can adult dogs get parvo?',
        answer:
          'Yes. Any unvaccinated or incompletely vaccinated dog can get parvo regardless of age, including adults and seniors whose puppy series was never finished or whose boosters have lapsed. Even fully vaccinated adult dogs can occasionally get a breakthrough infection, because no vaccine is 100 percent effective in every dog. Parvo is best understood as a disease of unprotected dogs, not strictly a puppy disease.',
      },
      {
        question: 'Why do adult parvo cases get missed?',
        answer:
          'A more mature immune system often produces milder symptoms, so lethargy, appetite loss, vomiting, and diarrhea in an adult dog get blamed on a stomach bug, something they ate, or old age. That delay is the same trap that costs puppies their best treatment window. An unvaccinated adult dog with those symptoms deserves a parvo test, especially with any gap in vaccine history or known exposure to a sick dog or contaminated environment.',
      },
      {
        question: 'Do adult dogs need parvo booster shots?',
        answer:
          'Yes. After the puppy series finishes around 16 weeks, dogs need a booster at one year old, then boosters roughly every three years for life. Lapsed boosters are a common reason an adult dog ends up unprotected without the owner realizing it. If you adopted an adult dog without clear vaccine records, ask your vet about catching them up.',
      },
      {
        question: 'Can a vaccinated dog still get parvo?',
        answer:
          'It is uncommon, but yes. No vaccine is 100 percent effective in 100 percent of dogs, so a fully vaccinated dog can occasionally have a breakthrough infection. The vaccine remains the single most effective tool against parvo, but a vaccinated dog showing classic symptoms should still be taken seriously rather than dismissed.',
      },
    ],
  },
  {
    slug: 'can-my-puppy-survive-parvovirus',
    title: 'Can My Puppy Survive Parvovirus?',
    description:
      'Most puppies survive parvo with prompt care. What survival actually depends on, what recovery looks like, and how breed, age, and vaccine status move the odds.',
    category: 'Treatment & Recovery',
    datePublished: '2026-06-25',
    author: 'ParvoMaps',
    coverImage: '/article-images/puppy-laying-in-crate.webp',
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
    category: 'Treatment & Recovery',
    datePublished: '2026-06-24',
    author: 'ParvoMaps',
    coverImage: '/article-images/parvo-invoice.webp',
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
    category: 'Symptoms',
    datePublished: '2026-06-23',
    author: 'ParvoMaps',
    coverImage: '/article-images/puppy-testing-positive-for-parvo.webp',
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
