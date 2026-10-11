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

## Third lesson per subject (v0.3)
- Chemistry, separation: NaCl/sand/water mass balance, assuming complete dissolution at approximately 20 C, ideal filtration and zero loss.
- Physics, convex lens: signed ideal thin-lens formula 1/f = 1/u + 1/v; real/virtual image and magnification m=-v/u. Source: https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses
- Biology, potometer: capillary bubble movement measures water uptake, not transpiration directly. Conversion: 1 cubic millimetre = 1 microlitre.
- Agriculture, nutrient limitation: student-selectable N, P and K textbook symptoms, NOT diagnosis or fertilizer advice.

Every newly added mathematical function has deterministic unit tests, explicit input validation, and documented simplifying assumptions. External teacher review is still required.

## Observational graphs, extension
- Pendulum graph plots **period squared (s²) versus length (m)** from student-captured ideal small-angle outputs. A line through the origin has slope 4π²/g, so the app displays a model-derived estimate of g. This does not represent independently measured acceleration.
- Potometer graph plots **water uptake (µL) versus elapsed time (min)**, computed using cylindrical capillary cross-section and bubble movement. Its through-origin slope estimates water-uptake rate and must never be labelled direct transpiration.
- Angle/oscillation-count changes reset the pendulum trial, while capillary diameter changes reset the potometer run, so differing controlled settings are not silently combined.
- All charts are intentionally identified as simulated, not sensor-calibrated, and require classroom review before adoption.

## Review boundaries for self-check questions
Twenty-four short classroom questions and explanations have internal coverage tests, and Rust stores results using independently checked local answer keys. This is not independent curriculum alignment or expert pedagogical validation. Subject-teacher review and classroom pilot acceptance remain required.
