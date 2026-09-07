from app.services.disease_assessor import assess_health
from app.services.pet_signals import ImageSignals


def test_mange_street_dog_signals():
    signals = ImageSignals(
        skin_exposure_ratio=0.67,
        skin_irritation_score=0.36,
        emaciation_score=0.35,
        coat_health_score=0.25,
    )
    report = assess_health(signals, "dog")
    names = [d.name for d in report.possible_diseases]
    assert any("Mange" in n for n in names)
    assert report.possible_diseases[0].causes
    assert report.possible_diseases[0].cures
    assert report.possible_diseases[0].precautions
    assert report.overall_assessment
    assert len(report.general_precautions) >= 2


def test_healthy_signals():
    signals = ImageSignals(
        skin_exposure_ratio=0.05,
        skin_irritation_score=0.08,
        emaciation_score=0.10,
        coat_health_score=0.85,
    )
    report = assess_health(signals, "dog")
    assert report.possible_diseases[0].name == "No Significant Disease Detected"
    assert report.possible_diseases[0].precautions
