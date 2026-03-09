#include "VpdCalculator.h"
#include <math.h>

float VpdCalculator::calculate(float tempC, float humidityPct) {
    double t  = static_cast<double>(tempC);
    double rh = static_cast<double>(humidityPct);
    double svp = 0.6108 * exp((17.27 * t) / (t + 237.3));
    double vpd = (1.0 - (rh / 100.0)) * svp;
    return static_cast<float>(vpd);
}

VpdStage VpdCalculator::classify(float vpd) {
    if (vpd < 0.4f)  return VpdStage::DangerLow;
    if (vpd < 0.8f)  return VpdStage::PropagationEarlyVeg;
    if (vpd < 1.0f)  return VpdStage::LateVeg;
    if (vpd < 1.2f)  return VpdStage::EarlyFlower;
    if (vpd <= 1.6f) return VpdStage::MidLateFlower;
    return VpdStage::DangerHigh;
}

VpdResult VpdCalculator::evaluate(float tempC, float humidityPct) {
    float vpd = calculate(tempC, humidityPct);
    return { vpd, classify(vpd) };
}

const char* VpdCalculator::stageName(VpdStage stage) {
    switch (stage) {
        case VpdStage::DangerLow:           return "DangerLow";
        case VpdStage::PropagationEarlyVeg: return "PropagationEarlyVeg";
        case VpdStage::LateVeg:             return "LateVeg";
        case VpdStage::EarlyFlower:         return "EarlyFlower";
        case VpdStage::MidLateFlower:       return "MidLateFlower";
        case VpdStage::DangerHigh:          return "DangerHigh";
    }
    return "Unknown";
}
