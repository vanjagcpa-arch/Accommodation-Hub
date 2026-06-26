// Human-authored per-category slot checklists. Edit this file to adjust
// what the triage agent asks for each category. The model fills these slots;
// it never invents fields outside this schema.

export type InputType = 'chips' | 'dropdown' | 'toggle' | 'text' | 'photo'

export interface SlotSpec {
  key: string
  question: string
  input: InputType
  options?: string[]
  // Return false to skip this slot (evaluated against accumulated slots so far).
  // Expressed as a string to keep the config serialisable; eval'd in agent.ts.
  when?: (slots: Record<string, unknown>) => boolean
}

export interface CategorySlotConfig {
  categorySlug: string
  displayName: string
  defaultPriority: 'urgent' | 'high' | 'medium' | 'low'
  defaultSlaHours: number
  routing: string
  slots: SlotSpec[]
  emergencyTriggers?: string[]
}

export const SLOT_CONFIG: CategorySlotConfig[] = [
  {
    categorySlug: 'plumbing',
    displayName: 'Plumbing',
    defaultPriority: 'high',
    defaultSlaHours: 24,
    routing: 'internal_plumber',
    emergencyTriggers: ['burst', 'flood', 'flooding', 'overflowing', 'sewage', 'gas leak'],
    slots: [
      {
        key: 'issue_type',
        question: 'What type of plumbing issue is this?',
        input: 'chips',
        options: ['Leaking / dripping', 'Blocked drain', 'No hot water', 'Low water pressure', 'Toilet problem', 'Other'],
      },
      {
        key: 'is_active_leak',
        question: 'Is water actively leaking right now?',
        input: 'toggle',
        when: (s) => String(s.issue_type ?? '').toLowerCase().includes('leak'),
      },
      {
        key: 'leak_rate',
        question: 'How fast is the leak?',
        input: 'chips',
        options: ['Drip / trickle', 'Steady stream', 'Gushing'],
        when: (s) => s.is_active_leak === true || s.is_active_leak === 'true',
      },
      {
        key: 'location',
        question: 'Which area of the property?',
        input: 'chips',
        options: ['Bathroom', 'Kitchen', 'Laundry', 'Toilet', 'Hallway / other'],
      },
      {
        key: 'photo',
        question: 'Can you share a photo? (tap Skip to continue without one)',
        input: 'photo',
      },
    ],
  },

  {
    categorySlug: 'electrical',
    displayName: 'Electrical',
    defaultPriority: 'high',
    defaultSlaHours: 24,
    routing: 'internal_electrician',
    emergencyTriggers: ['sparks', 'burning smell', 'smoke', 'fire', 'shock', 'electrocuted'],
    slots: [
      {
        key: 'issue_type',
        question: 'What is the electrical issue?',
        input: 'chips',
        options: ['No power / outage', 'Tripped circuit / RCD', 'Faulty outlet or switch', 'Light fitting issue', 'Appliance wiring', 'Other'],
      },
      {
        key: 'scope',
        question: 'How much of the property is affected?',
        input: 'chips',
        options: ['Single outlet or light', 'One room', 'Multiple rooms', 'Whole flat'],
      },
      {
        key: 'has_safety_concern',
        question: 'Is there any burning smell, sparks, or visible damage?',
        input: 'toggle',
      },
      {
        key: 'photo',
        question: 'Can you share a photo of the affected area?',
        input: 'photo',
        when: (s) => s.has_safety_concern !== true && s.has_safety_concern !== 'true',
      },
    ],
  },

  {
    categorySlug: 'heating',
    displayName: 'Heating & Cooling',
    defaultPriority: 'medium',
    defaultSlaHours: 48,
    routing: 'hvac_contractor',
    emergencyTriggers: ['gas leak', 'carbon monoxide', 'no heat in winter', 'freezing'],
    slots: [
      {
        key: 'issue_type',
        question: 'What is the heating / cooling issue?',
        input: 'chips',
        options: ['No heating', 'No cooling', 'Unit making noise', 'Leaking unit', 'Remote / controls not working', 'Other'],
      },
      {
        key: 'scope',
        question: 'Which areas are affected?',
        input: 'chips',
        options: ['One room', 'Multiple rooms', 'Whole flat'],
      },
      {
        key: 'has_error_code',
        question: 'Is there an error code showing on the unit?',
        input: 'toggle',
      },
      {
        key: 'error_code',
        question: 'What error code is displayed?',
        input: 'text',
        when: (s) => s.has_error_code === true || s.has_error_code === 'true',
      },
      {
        key: 'photo',
        question: 'Photo of the unit or display? (tap Skip to continue)',
        input: 'photo',
      },
    ],
  },

  {
    categorySlug: 'appliance',
    displayName: 'Appliance',
    defaultPriority: 'medium',
    defaultSlaHours: 72,
    routing: 'appliance_tech',
    slots: [
      {
        key: 'appliance_type',
        question: 'Which appliance has the issue?',
        input: 'chips',
        options: ['Oven / cooktop', 'Dishwasher', 'Washing machine', 'Dryer', 'Fridge / freezer', 'Range hood', 'Other'],
      },
      {
        key: 'issue_type',
        question: 'What is wrong with the appliance?',
        input: 'chips',
        options: ['Not working / no power', 'Not heating / cooling', 'Making unusual noise', 'Leaking', 'Error code / fault light', 'Other'],
      },
      {
        key: 'error_code',
        question: 'What error code or fault light is showing?',
        input: 'text',
        when: (s) => String(s.issue_type ?? '').toLowerCase().includes('error'),
      },
      {
        key: 'photo',
        question: 'Photo of the appliance or error display? (tap Skip)',
        input: 'photo',
      },
    ],
  },

  {
    categorySlug: 'other',
    displayName: 'General / Other',
    defaultPriority: 'medium',
    defaultSlaHours: 72,
    routing: 'internal_manager',
    slots: [
      {
        key: 'issue_type',
        question: 'What area does the issue relate to?',
        input: 'chips',
        options: ['Doors / locks', 'Windows', 'Flooring', 'Walls / ceiling', 'Pest / vermin', 'Rubbish / cleaning', 'Other'],
      },
      {
        key: 'description',
        question: 'Please describe the issue in a few words.',
        input: 'text',
      },
      {
        key: 'photo',
        question: 'Do you have a photo? (tap Skip to continue)',
        input: 'photo',
      },
    ],
  },
]

// Emergency keywords — scanned deterministically BEFORE any model call.
// Any match in the tenant's raw text triggers an immediate emergency response.
export const EMERGENCY_KEYWORDS = [
  'gas leak', 'smell gas', 'gas smell',
  'carbon monoxide', 'co alarm',
  'fire', 'flames', 'smoke',
  'electrocuted', 'electric shock',
  'burst pipe', 'flooding', 'flood',
  'sewage overflow', 'sewage leak',
  'structural collapse', 'ceiling collapse', 'roof collapse',
  'building unsafe', 'evacuate',
]

export const SAFETY_ESCALATION_SCRIPT = `This sounds like an emergency. Please take the following steps immediately:
1. If there is an immediate danger to life — call 000 (police/fire/ambulance).
2. If you smell gas — leave the property now, do not use switches or phones inside, call 1800 GAS LEAKS (1800 427 532).
3. If there is a fire — evacuate immediately, then call 000.
4. Once you are safe, a property manager will contact you shortly.

Your property manager has been alerted. Do not re-enter the property until told it is safe.`

export function getSlotConfig(categorySlug: string): CategorySlotConfig | undefined {
  return SLOT_CONFIG.find((c) => c.categorySlug === categorySlug)
}
