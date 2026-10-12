# Periodic element dataset attribution

The 118-element offline periodic-table dataset in `src/data/elements.json` is a **modified selection and restructuring** of Bowserinator's **Periodic-Table-JSON** dataset.

- Original project: https://github.com/Bowserinator/Periodic-Table-JSON/blob/master/PeriodicTableJSON.json
- Licence: Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- Original licence: https://github.com/Bowserinator/Periodic-Table-JSON/blob/master/LICENSE.md
- Data snapshot date: 2026-10-12
- Transformation: retained only atomic numbers 1–118 (the upstream dataset includes a provisional element 119); renamed and selected factual fields; removed images and encyclopedia summaries; preserved per-element reference URLs; sorted by atomic number and retained periodic-table grid coordinates.
- **Reuse:** the modified dataset file remains under CC BY-SA 3.0, including its attribution and ShareAlike conditions. This does not assert that the original author endorses Scoolabs.
- Numeric values can reflect experimental uncertainties or estimates. Unknown values remain `null` rather than invented zeroes. Melting and boiling data are Kelvin; density units vary by phase and are shown explicitly. Some superheavy element properties are theoretical predictions, not directly measured quantities.

Educational explanations and the rest of the Scoolabs source code are separately maintained. No network retrieval is required when using the periodic table inside the app.

**Content review required:** independent science-teacher review and spot checks against a current IUPAC or NIST reference before formal school release.
