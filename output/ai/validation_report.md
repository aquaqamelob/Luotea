# AI layer — statistical validation

Explainable analytics on hackathon datasets (no black-box predictions in production).

## Alarm signal strength

- Reactive repairs analyzed: **691**
- With 5+ pre-failure alarms (7d): **171** (24.7%)
- Mean alarms before reactive WO: **4.24**
- Mean alarms before EH-työ visit: **4.44**
- **Lift ratio** (reactive / EH baseline): **0.96×**

## Rule backtest (SEND NOW = 5+ alarms in 7d)

- Precision on reactive failures: **100.0%**
- Recall (failures caught): **24.7%**

## Logistic regression (EH-työ → failure within 14d)

- Test AUC: **0.794**
- Coefficients (standardized features):
  - `alarms_7d`: +2.615
  - `alarms_30d`: -1.240
  - `trend`: +3.189
