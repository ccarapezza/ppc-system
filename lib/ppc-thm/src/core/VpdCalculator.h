#ifndef VPD_CALCULATOR_H
#define VPD_CALCULATOR_H

enum class VpdStage {
    DangerLow,            // < 0.4
    PropagationEarlyVeg,  // 0.4 - 0.8
    LateVeg,              // 0.8 - 1.0
    EarlyFlower,          // 1.0 - 1.2
    MidLateFlower,        // 1.2 - 1.6
    DangerHigh            // > 1.6
};

struct VpdResult {
    float    vpd;
    VpdStage stage;
};

class VpdCalculator {
public:
    static float     calculate(float tempC, float humidityPct);
    static VpdStage  classify(float vpd);
    static VpdResult evaluate(float tempC, float humidityPct);
    static const char* stageName(VpdStage stage);
};

#endif
