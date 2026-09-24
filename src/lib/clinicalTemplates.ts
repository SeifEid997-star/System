export interface ClinicalTemplate {
  id: string;
  name: string;
  species: "Canine" | "Feline" | "Both";
  diagnosis: string;
  symptoms: string;
  treatmentPlan: string;
  recommendedPrescriptions: Array<{
    medicationName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions: string;
  }>;
}

export const CLINICAL_TEMPLATES: ClinicalTemplate[] = [
  {
    id: "parvo",
    name: "Canine Parvovirus Protocol",
    species: "Canine",
    diagnosis: "Canine Parvoviral Enteritis (CPV)",
    symptoms: "Severe hemorrhagic diarrhea with characteristic foul odor, persistent vomiting, high fever, profound dehydration and lethargy.",
    treatmentPlan: "Aggressive IV Fluid therapy (Ringer Lactate), anti-emetics, broad spectrum antibiotic coverage against secondary sepsis, gastric protectants.",
    recommendedPrescriptions: [
      {
        medicationName: "Cerenia (Maropitant Citrate)",
        dosage: "1 mg/kg SC",
        frequency: "Once daily",
        durationDays: 5,
        instructions: "Administer subcutaneously for persistent vomiting.",
      },
      {
        medicationName: "Amoxicillin-Clavulanate 250mg",
        dosage: "12.5 mg/kg",
        frequency: "Every 12 hours",
        durationDays: 7,
        instructions: "Administer with light soft recovery diet when tolerated.",
      },
    ],
  },
  {
    id: "feline_uri",
    name: "Feline Upper Respiratory Infection (Cat Flu)",
    species: "Feline",
    diagnosis: "Feline Viral Rhinotracheitis / Calicivirus Complex",
    symptoms: "Sneezing, bilateral serous to mucopurulent oculonasal discharge, conjunctivitis, mild fever, partial anorexia.",
    treatmentPlan: "Steam inhalation / nebulization, gentle eye/nose cleansing, oral antibiotics for secondary bacterial pathogens, appetite stimulants.",
    recommendedPrescriptions: [
      {
        medicationName: "Doxycycline 50mg / Doxyvet",
        dosage: "5-10 mg/kg PO",
        frequency: "Once daily with water bolus",
        durationDays: 14,
        instructions: "Always flush with 5ml water to prevent esophageal stricture.",
      },
      {
        medicationName: "Tobramycin Ophthalmic Eye Drops",
        dosage: "1 drop each eye",
        frequency: "Every 8 hours",
        durationDays: 7,
        instructions: "Clean discharge before instilling drops.",
      },
    ],
  },
  {
    id: "otitis",
    name: "Otitis Externa (Ear Infection)",
    species: "Both",
    diagnosis: "Bilateral / Unilateral Erythematous Otitis Externa",
    symptoms: "Head shaking, ear scratching, brownish exudate in ear canal, pinnal erythema and pain on palpation.",
    treatmentPlan: "Deep ear canal flushing with ceruminolytic cleaner, topical antibiotic/antifungal/steroid combination.",
    recommendedPrescriptions: [
      {
        medicationName: "EasOtic / Posatex Otic Suspension",
        dosage: "1 pump each affected ear",
        frequency: "Once daily",
        durationDays: 7,
        instructions: "Massage base of the ear for 30 seconds after application.",
      },
    ],
  },
  {
    id: "gastroenteritis",
    name: "Acute Dietetic Gastroenteritis",
    species: "Both",
    diagnosis: "Acute Non-specific Gastroenteritis",
    symptoms: "Sudden onset loose watery stools, mild abdominal cramping, history of scavenging or diet indiscretion.",
    treatmentPlan: "Gastrointestinal rest 12h, bland gastrointestinal diet (boiled chicken & rice or Gastro GI kibble), probiotic paste.",
    recommendedPrescriptions: [
      {
        medicationName: "Pro-Kolin+ Probiotic Paste",
        dosage: "2-3 ml orally",
        frequency: "Twice daily",
        durationDays: 5,
        instructions: "Syringe directly into mouth.",
      },
      {
        medicationName: "Metronidazole 250mg",
        dosage: "10-15 mg/kg",
        frequency: "Every 12 hours",
        durationDays: 5,
        instructions: "Give strictly after meals.",
      },
    ],
  },
];
