# Scoolabs product rebuild after Windows pilot feedback

## Why the course correction matters
A user tested the Windows installation successfully but rated the product only **3/10 against the intended virtual science laboratory experience**. The app had a functional experiment collection, notebook, account management, and grading, but it lacked coherent subject-level knowledge and apparatus education.

## Correct product definition
Scoolabs is an **offline-first interactive science learning environment** for Nigerian secondary schools, not simply a list of simulated practicals. Each subject should let a learner move through:

1. **Learn:** structured principles, definitions, worked examples and misconceptions.
2. **Explore:** subject-specific references, tools and classification systems.
3. **Examine:** actual labelled equipment and apparatus, functions, parts, safety and usage.
4. **Experiment:** interact with working, scientifically stated simulations.
5. **Record:** capture observations and report conclusions.
6. **Assess:** self-check and teacher evaluation, without equating activity to mastery.

## Four-subject scope

| Layer | Chemistry | Physics | Biology | Agricultural Science |
|---|---|---|---|---|
| Core concepts | Atoms, bonding, reactions, pH, moles, periodic trends | Motion, forces, waves, electricity, lenses, energy | Cells, transport, enzymes, classification, ecosystems | Soil, crops, water, plant nutrition, pests, livestock |
| Interactive reference | 118-element periodic table, group families, properties | Units and formulas, quantities and graphing references | Cell diagrams, organism classification, human/plant systems | Crop, soil and livestock references and conditions |
| Apparatus | Glassware, burette, pipette, balances, meters | Meters, circuits, lenses, pendulum, measuring tools | Microscopes, slides, forceps, potometers, lab preparation | Farm tools, soil-test tools, seed trays, irrigation apparatus |
| Practical simulations | Existing titration/indicators/separation to deepen | Existing circuits/pendulum/lens to deepen | Existing microscopy/osmosis/potometer to deepen | Existing germination/soil/nutrients to deepen |

## Already implemented in the first correction
- [x] Offline factual chemistry dataset covering 118 confirmed elements, with name, symbol, atomic number, group/period, category, shells, configuration, selected phase and physical properties.
- [x] Searchable periodic table and element comparison, with documented source attribution and missing-value handling.
- [x] Ten foundational concepts per subject (40), with worked context and misconception checks.
- [x] Twelve identified apparatus/tools per subject (48), with purpose, introductory usage and safety notes.
- [x] Integrated subject tabs and links to existing practicals without dismantling student notebook/teacher workflows.
- [x] Automated content-integrity and browser regression coverage (see CI results).

## Priority releases still to build

**Priority 1: genuinely visual apparatus.** Representative interactive schematics (Beaker, Burette, Metre rule, Microscope, Hoe) are now integrated, with selectable labelled parts. Expand this approach to all 48 apparatus, commission scientifically accurate reference drawings with qualified teachers, and introduce meaningful manipulation/3D tools. Unsupported apparatus currently display clearly labelled generic reference symbols.

**Priority 2: real conceptual depth.** Expand the initial ten concepts into class-level chapters, explain key laws, examples and worked exercises, add Nigerian-curriculum lesson sequencing, and show prerequisite relationships. Ensure each reference item has objectives, illustrations, references, formative practice and a teacher review status.

**Priority 3: significantly better experiments.** More than sliders: model lab benches, arrangement of instruments, manipulation/assembly, trial repetitions and troubleshooting. Provide clearer distinctions between ideal simulation and real equipment. Add teacher-approved limitations and safe experimental guidance.

**Priority 4: intelligent learning, not empty AI branding.** The original proposal describes adaptive assessment, personalised resources and learning analytics. These have **not yet** been independently validated or implemented as a trained adaptive model. Build a transparent, privacy-preserving, offline learner pathway based on evidence first; evaluate before making efficacy claims.

**Priority 5: classroom acceptance.** Test on the already-installed Windows machine at target resolutions and offline, review actual content and usability with subject teachers, measure time-to-find-an-apparatus and time-to-complete a guided practical, then iterate based on actual findings.

## Definition of done for the next quality gate
- Users can identify and inspect a named instrument from each subject, with a labelled diagram and a factual usage description.
- A Chemistry student can find an element by symbol, view atomic number and electronic arrangement, compare it with another element, and continue into a relevant lab concept.
- Each subject has an organised, searchable beginner-to-senior-secondary concept sequence with clear links to reference tools and experiments.
- The installed Windows application remains offline and does not lose students, reports, teacher marks or assignments.
- Independent subject-teacher and accessibility validation is recorded. **Do not call a green CI run scientific certification.**

## Source-to-product distinction
The original uploaded proposal gives broad requirements for personalized learning, curriculum integration, learning analytics and offline access, but does **not** specify a detailed periodic table or apparatus inventory. The new subject reference requirements were supplied later through product-owner feedback. The current content is authored supplemental teaching material and must be reviewed against the intended Nigerian curriculum before production deployment.
