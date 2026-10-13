# Scoolabs comprehensive subject learning roadmap

## Direction
Scoolabs is a science learning system, not just twelve stand-alone calculation widgets. Each Nigerian secondary-school subject should have connected study, visual explanation, recognition, experiment, analysis, and assessment workflows. The original project proposal describes personalised educational content, adaptive assessment, learning analytics and access for limited-connectivity classrooms. These are **targets**, not validated outcomes.

## Current implementation
| Subject | Existing reference experience | Current hands-on experiments | Expansion to validate with teachers |
| --- | --- | --- | --- |
| Chemistry | Key concepts, 118-element table, reference compounds, glassware/apparatus | Titration, pH/indicator, mixtures | Bonding models, molecular structures, reaction balancing, gas laws, electrolysis |
| Physics | Key concepts, equations, CODATA physical constants, electrical/measuring apparatus | Ohm's law, pendulum, convex lens | Forces, work/energy, wave optics, motion graphs, magnetism |
| Biology | Cell and life-process concepts, specimen atlas, microscopes and biological equipment | Microscopy, osmosis, potometer | Comparative cell explorer, human systems, inheritance, ecology |
| Agricultural science | Crops, livestock, soil and agronomic reference, tools | Germination, soil fractions, plant nutrients | Crop life cycles, farm tools, soils, climate and animal husbandry |

## Library structure for each subject
1. **Learn:** clearly indexed concepts and vocabulary in short plain-language lessons, with diagrams and examples.
2. **Identify:** local/offline apparatus and specimen illustrations with names, parts, uses, limitations and safety.
3. **Investigate:** interactive apparatus simulations in which students change variables and see results.
4. **Record:** numerical observations, diagrams and scientific explanation, distinguished from real measurements.
5. **Check:** formative questions with misconceptions and explanatory feedback.
6. **Teach:** offline lesson templates, assignments, rosters, markbooks and printable reports.
7. **Improve:** independently evaluated learning objectives and performance analytics, with student privacy protections.

## Datasets and offline packages
- 118-element property reference is already bundled. Values include source citations and unknowns remain null.
- The physics reference bundles selected CODATA values and records their source provenance.
- Chemistry additionally acquires and checks 15 PubChem compound records using GitHub Actions; this does not introduce live calls into the desktop application.
- A future biology source (e.g. species taxonomy) needs licensing, coverage and review before it can be used. The same applies to an agricultural image library.
- **AI models are not yet included.** Only consider an optional, quantised, locally runnable science tutor after CPU/memory benchmarking, model-licence review, hallucination/safety evaluation, curriculum review and an explicit offline packaging decision. Auto-downloading multi-GB weights into the installer would make classroom distribution harder.

## Educational acceptance
Before expanding each subject, have an educator verify terminology, calculations, specimen illustrations and level-specific outcomes. Reference cards should identify their provenance; missing fields should not be filled by AI guesses. Test teacher-led 30-45 minute lessons on low-powered Windows machines before calling Scoolabs classroom-ready.
