export interface DiseaseInfo {
  name: string
  category: 'infectious' | 'tick-borne' | 'environmental'
  pinTtlDays: number // how long the pin stays on the map
}

export const DISEASE_MAP: Record<string, DiseaseInfo> = {
  parvo:      { name: 'Parvovirus',       category: 'infectious',    pinTtlDays: 365 },
  distemper:  { name: 'Distemper',        category: 'infectious',    pinTtlDays: 90  },
  kennel:     { name: 'Kennel Cough',     category: 'infectious',    pinTtlDays: 90  },
  leptospira: { name: 'Leptospirosis',    category: 'infectious',    pinTtlDays: 90  },
  influenza:  { name: 'Dog Flu',          category: 'infectious',    pinTtlDays: 90  },
  giardia:    { name: 'Giardia',          category: 'infectious',    pinTtlDays: 90  },
  ringworm:   { name: 'Ringworm',         category: 'infectious',    pinTtlDays: 90  },
  brucella:   { name: 'Brucellosis',      category: 'infectious',    pinTtlDays: 90  },
  cyano:      { name: 'Blue-green Algae', category: 'environmental', pinTtlDays: 30  },
  lyme:       { name: 'Lyme Disease',     category: 'tick-borne',    pinTtlDays: 90  },
  rmsf:       { name: 'RMSF',             category: 'tick-borne',    pinTtlDays: 90  },
  anaplasma:  { name: 'Anaplasmosis',     category: 'tick-borne',    pinTtlDays: 90  },
  ehrlichia:  { name: 'Ehrlichiosis',     category: 'tick-borne',    pinTtlDays: 90  },
  tickspot:   { name: 'Tick Sighting',    category: 'tick-borne',    pinTtlDays: 30  },
}

export function getDiseaseName(key: string): string {
  return DISEASE_MAP[key]?.name ?? key
}
