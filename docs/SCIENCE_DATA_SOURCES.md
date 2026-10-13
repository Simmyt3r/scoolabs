# Science reference data provenance

An automated GitHub Actions workflow retrieves the pinned Periodic-Table-JSON revision (CC BY-SA 3.0) and checks 118 element identities against Scoolabs' existing adaptation. It separately downloads the NIST 2022 CODATA recommended physical constants and saves ten selected values with their source uncertainties and units.

Sources: https://github.com/Bowserinator/Periodic-Table-JSON and https://physics.nist.gov/cuu/Constants/Table/allascii.txt. No network access is needed to use these datasets in Scoolabs after packaging. Further specialist review remains necessary.
