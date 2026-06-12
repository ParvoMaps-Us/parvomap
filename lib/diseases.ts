export type DiseaseCategory = 'infectious' | 'tick-borne' | 'environmental'
export type DiseaseSeverity = 'high' | 'moderate' | 'low' | 'info'

export interface DiseaseInfo {
  name: string
  category: DiseaseCategory
  pinTtlDays: number // how long the pin stays on the map
  // ─── Editorial content (Phase 3 disease pages) ───
  // General educational info — NOT veterinary advice.
  aka?: string
  severity: DiseaseSeverity
  blurb: string
  symptoms: string[]
  transmission: string
  prevention: string
}

export const DISEASE_MAP: Record<string, DiseaseInfo> = {
  parvo: {
    name: 'Parvovirus', category: 'infectious', pinTtlDays: 365, severity: 'high', aka: 'Parvo, CPV',
    blurb: 'A highly contagious viral infection that attacks the gastrointestinal tract. It is most dangerous — and often fatal without treatment — in unvaccinated puppies.',
    symptoms: ['Severe, often bloody diarrhea', 'Frequent vomiting', 'Lethargy and weakness', 'Loss of appetite', 'Fever', 'Rapid dehydration'],
    transmission: 'Spread fecal-orally; the virus is extremely hardy and survives months in soil, surfaces, and on shoes.',
    prevention: 'Core vaccination (puppy series + boosters); keep unvaccinated puppies away from unknown dogs and public ground.',
  },
  distemper: {
    name: 'Distemper', category: 'infectious', pinTtlDays: 90, severity: 'high', aka: 'CDV',
    blurb: 'A serious viral disease affecting the respiratory, gastrointestinal, and nervous systems. It can leave lasting neurological damage in survivors.',
    symptoms: ['Fever', 'Eye and nasal discharge', 'Coughing', 'Vomiting and diarrhea', 'Seizures, tremors, or twitching', 'Thickened/hardened paw pads'],
    transmission: 'Spread through airborne respiratory droplets and shared food/water bowls.',
    prevention: 'Core vaccination; avoid exposure to sick or wild animals.',
  },
  kennel: {
    name: 'Kennel Cough', category: 'infectious', pinTtlDays: 90, severity: 'low', aka: 'CIRDC, Bordetella',
    blurb: 'A contagious respiratory infection — usually mild — that spreads quickly where dogs gather, like boarding, daycare, and grooming.',
    symptoms: ['Persistent, honking cough', 'Retching or gagging', 'Runny nose', 'Mild fever', 'Usually normal appetite and energy'],
    transmission: 'Airborne and through close contact in crowded settings.',
    prevention: 'Bordetella and parainfluenza vaccines; avoid contact with coughing dogs.',
  },
  leptospira: {
    name: 'Leptospirosis', category: 'infectious', pinTtlDays: 90, severity: 'high', aka: 'Lepto',
    blurb: 'A bacterial infection that can damage the kidneys and liver. It is zoonotic — it can spread to people.',
    symptoms: ['Fever', 'Lethargy', 'Vomiting', 'Increased thirst and urination', 'Jaundice (yellow gums/eyes)', 'Muscle pain'],
    transmission: 'Contact with urine from infected wildlife, or contaminated water, soil, and mud.',
    prevention: 'Vaccination; keep dogs away from stagnant water and rodent-prone areas.',
  },
  influenza: {
    name: 'Dog Flu', category: 'infectious', pinTtlDays: 90, severity: 'moderate', aka: 'Canine Influenza (CIV)',
    blurb: 'A contagious respiratory virus. Most dogs recover, but it can progress to pneumonia in some cases.',
    symptoms: ['Persistent cough', 'Nasal and eye discharge', 'Fever', 'Lethargy', 'Reduced appetite'],
    transmission: 'Respiratory droplets, direct contact, and contaminated surfaces or hands.',
    prevention: 'Canine influenza vaccine; isolate sick dogs for up to 4 weeks.',
  },
  giardia: {
    name: 'Giardia', category: 'infectious', pinTtlDays: 90, severity: 'low',
    blurb: 'An intestinal parasite that causes persistent digestive upset, especially in puppies and dogs in group settings.',
    symptoms: ['Soft, greasy, or foul diarrhea', 'Gas', 'Weight loss', 'Occasional vomiting', 'Dehydration'],
    transmission: 'Ingesting cysts from contaminated water, feces, or surfaces.',
    prevention: 'Provide clean drinking water; prompt cleanup of feces and good hygiene.',
  },
  ringworm: {
    name: 'Ringworm', category: 'infectious', pinTtlDays: 90, severity: 'low',
    blurb: 'A fungal skin infection (not a worm) that is zoonotic and spreads easily by contact.',
    symptoms: ['Circular patches of hair loss', 'Scaly, crusty, or red skin', 'Brittle or broken hairs', 'Itching (variable)'],
    transmission: 'Direct contact with infected animals, people, or contaminated objects and spores.',
    prevention: 'Isolate infected animals; disinfect bedding and grooming tools; wash hands.',
  },
  brucella: {
    name: 'Brucellosis', category: 'infectious', pinTtlDays: 90, severity: 'moderate', aka: 'Canine Brucellosis',
    blurb: 'A bacterial infection of the reproductive system, important in breeding dogs. It is zoonotic and hard to clear.',
    symptoms: ['Infertility', 'Abortion or stillbirth', 'Swollen testicles or lymph nodes', 'Back pain', 'Often subtle or no signs'],
    transmission: 'Through breeding and contact with reproductive fluids or aborted tissue.',
    prevention: 'Test breeding dogs before mating; avoid contact with infected animals.',
  },
  screwworm: {
    name: 'New World Screwworm', category: 'infectious', pinTtlDays: 365, severity: 'high', aka: 'NWS, Screwworm myiasis',
    blurb: 'A reportable parasitic infestation in which the larvae (maggots) of the New World screwworm fly burrow into the living flesh of warm-blooded animals. Wounds enlarge rapidly and can be fatal if untreated. After decades of US eradication, cases have re-emerged as the fly spreads north from Central America and Mexico.',
    symptoms: ['A wound that keeps enlarging instead of healing', 'Visible maggots deep within a wound', 'Foul-smelling or bloody discharge', 'Pain, head-shaking, or constant licking of one spot', 'Loss of appetite and lethargy', 'Withdrawing from people or other animals'],
    transmission: 'Adult female flies lay eggs at the edges of open wounds — even tiny ones like tick bites or scratches — or on moist tissue (nostrils, eyes, genitals). The hatched larvae feed on living flesh. Not spread directly dog-to-dog.',
    prevention: 'Keep wounds clean and covered, treat injuries promptly, and inspect animals after travel to affected areas. Screwworm is a reportable foreign animal disease — if you suspect it, contact your veterinarian and state animal-health officials immediately.',
  },
  rabies: {
    name: 'Rabies', category: 'infectious', pinTtlDays: 180, severity: 'high', aka: 'Rabies Virus',
    blurb: 'A fatal virus that attacks the nervous system of all mammals, including dogs and people. Nearly 100% fatal once symptoms appear, but nearly 100% preventable by vaccine.',
    symptoms: ['Behavior changes (aggression or unusual tameness)', 'Excess drooling or foaming', 'Difficulty swallowing', 'Disorientation, staggering', 'Paralysis and seizures'],
    transmission: 'Bite of a rabid animal (virus is in saliva); also saliva in a scratch, cut, or mucous membrane. Main US reservoirs: raccoons, bats, skunks, foxes.',
    prevention: "Keep the rabies vaccine current (required by law in most states), avoid wildlife, supervise and leash, and don't leave food/trash that attracts wildlife.",
  },
  fleas: {
    name: 'Fleas', category: 'infectious', pinTtlDays: 90, severity: 'low', aka: 'Flea infestation, Ctenocephalides',
    blurb: 'A common external parasite. Beyond intense itching, fleas can trigger allergic dermatitis, transmit tapeworm and Bartonella, and cause anemia in puppies or heavy infestations.',
    symptoms: ['Persistent scratching, biting, or licking', 'Hair loss, especially near the tail base', 'Red, irritated, or scabbed skin', 'Visible fleas or black "flea dirt" in the coat', 'Restlessness', 'Pale gums in heavy infestations'],
    transmission: 'Picked up from infested animals, bedding, carpets, yards, or wildlife. Fleas jump onto a host and reproduce rapidly in the environment.',
    prevention: 'Year-round flea preventives, washing bedding in hot water, and treating the home and yard. Treat every pet in the household at once.',
  },
  cyano: {
    name: 'Blue-green Algae', category: 'environmental', pinTtlDays: 30, severity: 'high', aka: 'Cyanobacteria',
    blurb: 'A toxin produced by cyanobacteria in warm, stagnant water. Exposure can be rapidly fatal — treat any suspected case as an emergency.',
    symptoms: ['Vomiting and diarrhea', 'Drooling', 'Weakness or collapse', 'Seizures or tremors', 'Difficulty breathing'],
    transmission: 'Drinking, swimming in, or licking fur after contact with contaminated water.',
    prevention: 'Keep dogs out of scummy, discolored, or foul-smelling water; rinse immediately after exposure.',
  },
  lyme: {
    name: 'Lyme Disease', category: 'tick-borne', pinTtlDays: 90, severity: 'moderate', aka: 'Borreliosis',
    blurb: 'A bacterial infection spread by ticks. Many dogs show no signs, but it can cause joint disease and, rarely, serious kidney problems.',
    symptoms: ['Shifting-leg lameness', 'Fever', 'Lethargy', 'Swollen joints or lymph nodes', 'Reduced appetite'],
    transmission: 'Bite of an infected black-legged (deer) tick, usually attached 24–48 hours.',
    prevention: 'Year-round tick preventives, the Lyme vaccine, and daily tick checks.',
  },
  rmsf: {
    name: 'RMSF', category: 'tick-borne', pinTtlDays: 90, severity: 'high', aka: 'Rocky Mountain Spotted Fever',
    blurb: 'A tick-borne bacterial infection that can progress quickly and affect multiple organs. Early treatment matters.',
    symptoms: ['Fever', 'Lethargy', 'Joint and muscle pain', 'Swelling of limbs or face', 'Bruising or bleeding', 'Neurological signs'],
    transmission: 'Bite of an infected tick.',
    prevention: 'Tick preventives and prompt, complete tick removal.',
  },
  anaplasma: {
    name: 'Anaplasmosis', category: 'tick-borne', pinTtlDays: 90, severity: 'moderate',
    blurb: 'A tick-borne bacterial infection that affects blood cells, sometimes causing bleeding problems.',
    symptoms: ['Fever', 'Lethargy', 'Joint pain or stiffness', 'Loss of appetite', 'Bruising or low platelets'],
    transmission: 'Bite of an infected black-legged or brown dog tick.',
    prevention: 'Year-round tick preventives and tick checks.',
  },
  ehrlichia: {
    name: 'Ehrlichiosis', category: 'tick-borne', pinTtlDays: 90, severity: 'moderate',
    blurb: 'A tick-borne bacterial infection that can become chronic and suppress the bone marrow if untreated.',
    symptoms: ['Fever', 'Lethargy', 'Nosebleeds or bruising', 'Weight loss', 'Eye changes', 'Low blood cell counts'],
    transmission: 'Bite of an infected brown dog tick.',
    prevention: 'Tick preventives and prompt tick removal.',
  },
  tickspot: {
    name: 'Tick Sighting', category: 'tick-borne', pinTtlDays: 30, severity: 'info',
    blurb: 'Not a disease — a community-reported sighting of ticks in an area, flagging local exposure risk for tick-borne illnesses.',
    symptoms: ['No illness — an environmental risk marker', 'Watch for fever, lameness, or lethargy after exposure'],
    transmission: 'Ticks can carry Lyme, RMSF, anaplasmosis, and ehrlichiosis.',
    prevention: 'Use tick preventives, avoid tall grass and brush, and check your dog after time outdoors.',
  },
}

export function getDiseaseName(key: string): string {
  return DISEASE_MAP[key]?.name ?? key
}

export function getDiseaseInfo(key: string): DiseaseInfo | null {
  return DISEASE_MAP[key] ?? null
}

export const CATEGORY_LABELS: Record<DiseaseCategory, string> = {
  infectious: 'Infectious',
  'tick-borne': 'Tick-borne',
  environmental: 'Environmental',
}

export const SEVERITY_LABELS: Record<DiseaseSeverity, string> = {
  high: 'High severity',
  moderate: 'Moderate severity',
  low: 'Usually mild',
  info: 'Risk marker',
}
