# Scientific validation evidence and limitations

This document records sources and algorithmic checks, **not approval by qualified external science educators**. Scoolabs has not been approved by WAEC, NECO or NERDC.

| Experiment | Scientific basis | Teaching-model limitation |
| --- | --- | --- |
| Acid-base titration | 1:1 mole balance, ideal strong-acid / strong-base mixture at 25°C | No activity coefficients or experimental uncertainty; phenolphthalein endpoint is not identical to stoichiometric equivalence |
| pH and indicators | pH = -log10[H+] and pOH = -log10[OH-]; pKw = 14 at 25°C | Ideal strong electrolyte dissociation; approximate universal-indicator colours |
| Ohm's law | V = IR and P = VI | Ideal source and ohmic resistor only |
| Simple pendulum | T = 2π sqrt(L/g) for angles below ~15° | Neglects friction, string mass and finite-bob effects |
| Microscope | Total magnification = objective × eyepiece | Schematic, not observed cells or a calibrated optical simulator |
| Osmosis | External hypotonic / isotonic / hypertonic environment governs net water movement direction | Tonicity is qualitative; diagrams do not calculate cell volume |
| Seed germination | Interactive educational demonstration | Artificial uncalibrated response model; **not scientifically validated** for farm predictions |
| Soil fractions and pH | Percent sand/silt/clay computed from dry particle masses | Does not implement the official USDA textural triangle or instrument calibration |

## References
- OpenStax College Physics 2e, *16.4 The Simple Pendulum*: https://openstax.org/books/college-physics-2e/pages/16-4-the-simple-pendulum
- OpenStax Biology 2e, *5.2 Passive Transport*: https://openstax.org/books/biology-2e/pages/5-2-passive-transport
- USDA NRCS, Soil Texture Calculator: https://www.nrcs.usda.gov/resources/education-and-teaching-materials/soil-texture-calculator

## Quality gates
- TypeScript unit tests cover stoichiometric titration, reference pH, Ohm's law, magnification, osmosis direction, pendulum scaling and soil mass conservation.
- Windows CI additionally executes Rust tests for database schema, PIN hashing and idempotent import.
- Classroom acceptance requires subject-teacher review, comparison with independently worked examples and offline hardware pilot testing.
- This virtual teaching aid complements, but does not replace, physically supervised lab practice.
