"""
Disease assessment engine — maps visual signals to possible conditions,
causes, treatments, and precautions.

Rule-based veterinary wellness knowledge (NOT a diagnostic system).
Always requires professional vet confirmation for treatment decisions.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

from app.services.pet_signals import ImageSignals


@dataclass
class DiseaseFinding:
    name: str
    likelihood: str          # "Likely" | "Possible" | "Less likely"
    confidence: float        # 0–1
    summary: str
    causes: List[str]
    cures: List[str]
    precautions: List[str]


@dataclass
class HealthReport:
    possible_diseases: List[DiseaseFinding] = field(default_factory=list)
    overall_assessment: str = ""
    urgent_action: str = ""
    general_precautions: List[str] = field(default_factory=list)


# ── Knowledge base ────────────────────────────────────────────────────────────

_CONDITIONS = {
    "sarcoptic_mange": {
        "name": "Sarcoptic Mange (Scabies)",
        "summary": "Highly contagious skin disease caused by mites burrowing into the skin, causing intense itching and hair loss.",
        "causes": [
            "Sarcoptes scabiei mites spread through direct contact with infected animals",
            "Common in street dogs, shelters, and overcrowded environments",
            "Weakened immune system increases susceptibility",
            "Can temporarily affect humans (zoonotic) — causes itchy rash",
        ],
        "cures": [
            "Vet-prescribed anti-parasitic medication (e.g. ivermectin, selamectin, or topical selamectin/moxidectin)",
            "Medicated baths with benzoyl peroxide or sulfur-based shampoos as directed by vet",
            "Treat all contact animals simultaneously to prevent re-infection",
            "Wash bedding and living areas thoroughly during treatment",
            "Recovery typically takes 4–8 weeks with consistent treatment",
        ],
        "precautions": [
            "Wear gloves when handling the animal until treatment begins",
            "Isolate from other pets during active infection",
            "Do not use human or livestock ivermectin without vet dosing — toxicity risk in some breeds",
            "Complete the full course of medication even if skin looks better",
        ],
    },
    "demodectic_mange": {
        "name": "Demodectic Mange (Demodicosis)",
        "summary": "Non-contagious mange from Demodex mites, often linked to immune suppression; causes patchy hair loss.",
        "causes": [
            "Demodex canis mites normally live on skin but overgrow when immunity is weak",
            "Common in malnourished, stressed, or young animals",
            "Can be associated with underlying hormonal or immune disorders",
        ],
        "cures": [
            "Veterinary diagnosis via skin scraping is essential",
            "Isoxazoline class medications (fluralaner, afoxolaner) are commonly used",
            "Address underlying malnutrition or concurrent illness",
            "Localized cases in young dogs may resolve as immunity develops",
        ],
        "precautions": [
            "Not contagious to humans or other dogs (usually)",
            "Avoid stress and poor nutrition during recovery",
            "Recheck with vet if patches spread or secondary infection develops",
        ],
    },
    "bacterial_dermatitis": {
        "name": "Bacterial Skin Infection (Pyoderma)",
        "summary": "Secondary bacterial infection of damaged skin, often following scratching, wounds, or mange.",
        "causes": [
            "Broken skin from scratching mange or allergies",
            "Poor hygiene in outdoor/street conditions",
            "Moisture trapped in skin folds or wounds",
            "Weakened skin barrier from malnutrition",
        ],
        "cures": [
            "Antibiotic course prescribed by vet based on culture/sensitivity if severe",
            "Medicated chlorhexidine washes for localized infection",
            "Treat the underlying cause (mites, allergies) simultaneously",
            "Keep affected areas clean and dry",
        ],
        "precautions": [
            "Do not apply human antibiotic creams without vet advice",
            "Prevent licking/scratching — use an Elizabethan collar if prescribed",
            "Watch for spreading redness, pus, or fever — emergency signs",
        ],
    },
    "fungal_dermatitis": {
        "name": "Fungal Skin Infection (Ringworm / Dermatophytosis)",
        "summary": "Contagious fungal infection causing circular hair loss, scaly skin, and crusting.",
        "causes": [
            "Microsporum or Trichophyton fungi from soil, other animals, or contaminated objects",
            "Humid environments and poor coat condition increase risk",
            "Spreads to humans and other pets via spores",
        ],
        "cures": [
            "Oral antifungal medication (griseofulvin, itraconazole) prescribed by vet",
            "Topical antifungal washes and lime sulfur dips",
            "Environmental decontamination — wash bedding, vacuum living areas",
            "Treatment continues 2–4 weeks beyond visible cure",
        ],
        "precautions": [
            "Wear gloves; ringworm is zoonotic",
            "Isolate infected animals from children and other pets",
            "UV sunlight helps kill spores on bedding (dry in sun)",
        ],
    },
    "malnutrition": {
        "name": "Malnutrition / Emaciation",
        "summary": "Severe undernourishment causing visible rib and hip bones, muscle wasting, and weak immunity.",
        "causes": [
            "Chronic starvation or inadequate food access (common in street dogs)",
            "Heavy parasite load (intestinal worms) stealing nutrients",
            "Chronic illness reducing appetite and absorption",
            "Dehydration compounding weakness",
        ],
        "cures": [
            "Gradual refeeding with high-quality commercial dog food — avoid overfeeding initially",
            "Vet-administered deworming (fenbendazole, pyrantel) on schedule",
            "Multivitamin and probiotic supplements as recommended by vet",
            "Subcutaneous fluids if dehydrated (vet procedure)",
            "Small, frequent meals (4–6 times daily) during recovery",
        ],
        "precautions": [
            "Do not feed large meals immediately — refeeding syndrome can be fatal",
            "Always provide clean fresh water",
            "Monitor for vomiting or diarrhea when restarting food",
            "Full weight recovery may take several weeks to months",
        ],
    },
    "allergic_dermatitis": {
        "name": "Allergic Dermatitis",
        "summary": "Inflammatory skin reaction from food, environmental, or flea allergies causing itching and redness.",
        "causes": [
            "Flea allergy dermatitis (single flea bite can trigger reaction)",
            "Food allergens (chicken, beef, grains)",
            "Environmental pollen, dust mites, or grass contact",
        ],
        "cures": [
            "Strict flea control program (vet-approved spot-on or oral)",
            "Elimination diet trial under vet supervision for food allergies",
            "Antihistamines or short-term steroids for flare-ups (vet only)",
            "Hypoallergenic shampoos to soothe skin",
        ],
        "precautions": [
            "Identify and remove the trigger allergen where possible",
            "Avoid frequent bathing with harsh soaps — strips natural oils",
            "Secondary infections are common — watch for worsening lesions",
        ],
    },
    "healthy": {
        "name": "No Significant Disease Detected",
        "summary": "Visual analysis did not find strong indicators of skin disease, malnutrition, or acute distress.",
        "causes": [],
        "cures": [
            "Continue regular balanced diet and fresh water",
            "Annual veterinary wellness check-ups",
            "Routine grooming and parasite prevention",
        ],
        "precautions": [
            "Monitor for sudden changes in appetite, energy, or coat quality",
            "Keep vaccinations and deworming up to date",
            "Photograph in good lighting for more accurate future scans",
        ],
    },
}


def assess_health(signals: ImageSignals, species: str = "dog") -> HealthReport:
    """Build a structured health report from extracted image signals."""
    findings: List[DiseaseFinding] = []

    skin_high = signals.skin_exposure_ratio > 0.35
    skin_moderate = signals.skin_exposure_ratio > 0.20
    irritation_high = signals.skin_irritation_score > 0.35
    irritation_moderate = signals.skin_irritation_score > 0.20
    emaciated = signals.emaciation_score > 0.40
    emaciated_mild = signals.emaciation_score > 0.25

    # ── Mange (most common in street dogs with hair loss) ─────────────────
    if skin_high and irritation_moderate:
        score = min(0.95, 0.55 + signals.skin_exposure_ratio * 0.35 + signals.skin_irritation_score * 0.15)
        findings.append(_make_finding("sarcoptic_mange", score))

    if skin_moderate and (emaciated_mild or irritation_moderate):
        score = min(0.85, 0.40 + signals.skin_exposure_ratio * 0.30 + signals.emaciation_score * 0.20)
        findings.append(_make_finding("demodectic_mange", score))

    # ── Secondary infections ──────────────────────────────────────────────
    if irritation_high and skin_moderate:
        score = min(0.80, 0.45 + signals.skin_irritation_score * 0.35)
        findings.append(_make_finding("bacterial_dermatitis", score))

    if skin_moderate and irritation_moderate and signals.coat_health_score < 0.5:
        score = min(0.65, 0.35 + (1 - signals.coat_health_score) * 0.30)
        findings.append(_make_finding("fungal_dermatitis", score))

    # ── Malnutrition ──────────────────────────────────────────────────────
    if emaciated:
        score = min(0.90, 0.50 + signals.emaciation_score * 0.40)
        findings.append(_make_finding("malnutrition", score))
    elif emaciated_mild and skin_moderate:
        score = min(0.70, 0.35 + signals.emaciation_score * 0.30)
        findings.append(_make_finding("malnutrition", score))

    # ── Allergies (milder skin signals) ───────────────────────────────────
    if irritation_moderate and not skin_high and signals.coat_health_score > 0.55:
        score = min(0.60, 0.30 + signals.skin_irritation_score * 0.40)
        findings.append(_make_finding("allergic_dermatitis", score))

    # Sort by confidence descending, deduplicate by keeping top scores
    findings.sort(key=lambda f: f.confidence, reverse=True)
    findings = _dedupe_findings(findings)

    # Healthy fallback
    if not findings or (findings and findings[0].confidence < 0.35):
        findings = [_make_finding("healthy", max(0.55, signals.coat_health_score * 0.7 + signals.image_quality_score * 0.2))]

    # Cap to top 3 most relevant
    findings = findings[:3]

    # Overall assessment text
    urgent = ""
    if any(f.confidence >= 0.65 and f.name != "No Significant Disease Detected" for f in findings):
        urgent = (
            "Professional veterinary examination is strongly recommended. "
            "Visual screening cannot replace lab tests, skin scrapings, or blood work."
        )
    elif findings[0].name == "No Significant Disease Detected":
        urgent = "No urgent concerns detected from this photo. Continue routine wellness care."

    assessment = _build_overall_assessment(findings, signals, species)
    precautions = _general_precautions(findings, signals, species)

    return HealthReport(
        possible_diseases=findings,
        overall_assessment=assessment,
        urgent_action=urgent,
        general_precautions=precautions,
    )


def _make_finding(key: str, confidence: float) -> DiseaseFinding:
    data = _CONDITIONS[key]
    if confidence >= 0.70:
        likelihood = "Likely"
    elif confidence >= 0.45:
        likelihood = "Possible"
    else:
        likelihood = "Less likely"

    return DiseaseFinding(
        name=data["name"],
        likelihood=likelihood,
        confidence=round(confidence, 3),
        summary=data["summary"],
        causes=list(data["causes"]),
        cures=list(data["cures"]),
        precautions=list(data["precautions"]),
    )


def _dedupe_findings(findings: List[DiseaseFinding]) -> List[DiseaseFinding]:
    seen = set()
    unique = []
    for f in findings:
        if f.name not in seen:
            seen.add(f.name)
            unique.append(f)
    return unique


def _build_overall_assessment(findings: List[DiseaseFinding], signals: ImageSignals, species: str) -> str:
    top = findings[0]
    if top.name == "No Significant Disease Detected":
        return (
            f"Based on visual analysis, this {species} appears to have a generally healthy coat and body "
            f"condition. No major disease indicators were detected in this photo."
        )

    conditions = ", ".join(f.name for f in findings if f.confidence >= 0.40)
    parts = [
        f"Visual analysis suggests possible health concerns: {conditions}.",
    ]
    if signals.skin_exposure_ratio > 0.30:
        parts.append("Extensive hair loss and exposed skin were detected.")
    if signals.emaciation_score > 0.35:
        parts.append("The animal may be underweight.")
    if signals.skin_irritation_score > 0.30:
        parts.append("Skin inflammation or lesions appear present.")
    parts.append("A veterinarian should confirm the diagnosis and prescribe treatment.")
    return " ".join(parts)


def _general_precautions(findings: List[DiseaseFinding], signals: ImageSignals, species: str) -> List[str]:
    precautions = [
        "This report is AI-generated from a photo — not a veterinary diagnosis.",
        "Always confirm findings with a licensed veterinarian before starting treatment.",
    ]
    if signals.skin_exposure_ratio > 0.25:
        precautions.append("Avoid touching broken skin without gloves; secondary infection risk is high.")
    if any("Mange" in f.name for f in findings):
        precautions.append("Keep the animal separated from other pets until a vet confirms contagion status.")
    if signals.emaciation_score > 0.35:
        precautions.append("Introduce food gradually — sudden large meals can harm a starved animal.")
    precautions.append("Re-scan after 2–4 weeks of treatment to track recovery progress.")
    return precautions


def health_report_to_dict(report: HealthReport) -> dict:
    return {
        "overall_assessment": report.overall_assessment,
        "urgent_action": report.urgent_action,
        "general_precautions": report.general_precautions,
        "possible_diseases": [
            {
                "name": d.name,
                "likelihood": d.likelihood,
                "confidence": d.confidence,
                "summary": d.summary,
                "causes": d.causes,
                "cures": d.cures,
                "precautions": d.precautions,
            }
            for d in report.possible_diseases
        ],
    }
