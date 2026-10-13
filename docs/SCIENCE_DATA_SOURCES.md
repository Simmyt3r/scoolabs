# Science reference data provenance

This is a **build-time** download, never an application-time network request.

## Chemistry

Source: https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/9090b1c472a1e68f7295e77280f374f8d125cefc/PeriodicTableJSON.json

Upstream Git revision: \`9090b1c472a1e68f7295e77280f374f8d125cefc\`. The existing 118-element licensed Scoolabs adaptation remains unchanged. The workflow compares all names, numbers and symbols against the pinned upstream snapshot. Original licensing and transformation information: [ELEMENT_DATA_ATTRIBUTION.md](ELEMENT_DATA_ATTRIBUTION.md). Reference tables are not chemical safety data sheets.

## Physics

Source: https://physics.nist.gov/cuu/Constants/Table/allascii.txt

Reference: 2022 CODATA recommended values, NIST Standard Reference Database 121 (May 2024). Only ten selected entries are distributed in \`src/data/physical-constants.json\`, including uncertainties and units. Displayed values are source strings so no precision is silently invented.

## Review boundary

New upstream data is validated automatically but still requires a qualified science-teacher review. Source hashes from each download are published in the workflow artifact, not generated during app use.
