import { experiments } from './engine';
export interface LabGuide {
  equipment: string[];
  method: string[];
  questions: string[];
  modelLimit: string;
  safety: string;
}
export const guides: Record<string, LabGuide> = {
  titration:{
    equipment:['Burette','25 mL pipette','Conical flask','Indicator','Standard acid and base'],
    method:['Place 25 mL of 0.10 mol/L strong acid in the virtual flask.','Set the base concentration and begin with zero added.','Increase burette volume carefully as pH changes.','Record the near-colour-change region and calculate the stoichiometric equivalence volume.'],
    questions:['Why can the indicator endpoint differ from the exact equivalence point?','How would doubling base concentration affect the equivalence volume?'],
    modelLimit:'Ideal strong monoprotic acid and monobasic base at 25°C; no measurement uncertainty is simulated.',
    safety:'In a real laboratory, acids and bases require eye protection, teacher supervision and appropriate handling.'
  },
  separation:{
    equipment:['Beaker','Filter funnel','Filter paper','Evaporating dish','Mixture of sand and salt solution'],
    method:['Select dry sand, dissolved salt and water masses.','Mix and select the filtration stage.','Record the sand remaining in the filter paper and the liquid filtrate.','Select evaporation and verify total mass balance, including escaped water.'],
    questions:['Which component is captured by the filter paper?','Why is evaporated water included in total mass conservation?'],
    modelLimit:'Assumes all salt dissolves, filtration is complete and no material is lost.',
    safety:'Do not heat real glassware or chemical solutions without supervision.'
  },
  'ph-indicators':{
    equipment:['Universal pH indicator','Sample vessels','Acid/base reference solutions','pH chart'],
    method:['Choose an ideal strong acid, strong base or pure water.','Adjust the nominal concentration.','Observe the calculated pH and approximate indicator colour.','Compare acidic, neutral and alkaline conditions.'],
    questions:['What does one unit of pH difference mean for hydrogen-ion concentration?','Why does pure water have different pH at different temperatures?'],
    modelLimit:'Ideal full dissociation and pKw=14 at 25°C; colour bands are illustrative.',
    safety:'Never taste, smell closely or touch unknown chemicals to identify acidity.'
  },
  'ohms-law':{
    equipment:['DC supply','Resistor','Ammeter','Connecting wires','Voltmeter (conceptual)'],
    method:['Begin with a known positive resistor value.','Change the DC voltage in the circuit.','Record current for at least four voltages.','Check whether V/I is constant when voltage is nonzero.'],
    questions:['What shape should a voltage-current graph have for an ohmic resistor?','How does current change when resistance doubles at constant voltage?'],
    modelLimit:'Ideal Ohmic resistor, perfect supply and no instrument tolerance or heating.',
    safety:'Physical wiring should be done on safe low-voltage equipment under teacher supervision.'
  },
  pendulum:{
    equipment:['Retort stand','Light string','Pendulum bob','Metre rule','Stopwatch'],
    method:['Select a pendulum length and an angle under 15°.','Set the number of complete oscillations.','Observe total time and calculated period.','Repeat with a longer string and compare T²/L.'],
    questions:['What happens to period when length is quadrupled?','Why should release angle be small for this formula?'],
    modelLimit:'Ideal small-angle pendulum without air resistance; gravitational acceleration fixed to 9.81 m/s².',
    safety:'Secure the stand and keep clear of swinging objects during real lessons.'
  },
  'convex-lens':{
    equipment:['Convex lens','Lens holder','Screen','Illuminated object','Metre rule'],
    method:['Select a focal length and a distance from lens to object.','Observe the signed image position from the thin-lens equation.','Move the object inside and outside one focal length.','Compare virtual upright images with real inverted images.'],
    questions:['When can a real image be projected onto a screen?','Why does the image move to infinity when object distance equals focal length?'],
    modelLimit:'Ideal thin lens in air; diagram positions are schematic rather than to scale.',
    safety:'Never use lenses to focus direct sunlight at eyes or flammable materials.'
  },
  microscopy:{
    equipment:['Compound light microscope','Prepared slide','Eyepiece','4×, 10×, and 40× objectives','Focus controls'],
    method:['Select an illustrative cell specimen.','Begin with the lowest objective lens.','Adjust focus until the drawing is clear.','Increase magnification and calculate total magnification.'],
    questions:['How does field of view change with higher objective magnification?','Which visible features help distinguish plant from animal cells?'],
    modelLimit:'Schematic cell diagrams rather than actual photographic microscope images.',
    safety:'Real slide preparation with sharp glass requires teacher supervision.'
  },
  osmosis:{
    equipment:['Model cell membrane','Solutions of known effective osmolarity','Observation sheet'],
    method:['Set the inside-cell osmolarity.','Compare a lower, equal and higher outside osmolarity.','Observe the predicted direction of net water movement.','Identify hypotonic, isotonic and hypertonic conditions.'],
    questions:['Which side gains water when the outside is hypotonic?','Why is a simple osmolarity model insufficient for all real biological cells?'],
    modelLimit:'Qualitative movement only; ignores solute permeability, cellular regulation and actual volume changes.',
    safety:'Never interpret this teaching model as guidance for clinical fluid administration.'
  },
  transpiration:{
    equipment:['Potometer','Plant shoot','Water-filled capillary','Ruler','Stopwatch'],
    method:['Select capillary inside diameter.','Select air-bubble displacement and elapsed time.','Calculate water volume from the cylinder cross-section.','Divide by time to obtain water-uptake rate.'],
    questions:['Why does water uptake only approximate transpiration?','How would doubling capillary diameter affect measured volume at fixed displacement?'],
    modelLimit:'Assumes uniform capillary and no leakage, and measures water uptake rather than direct transpiration.',
    safety:'Avoid touching sharp glass tubing or cutting plant material without supervision.'
  },
  germination:{
    equipment:['Seed samples','Growth container','Water supply','Thermometer','Observation chart'],
    method:['Choose maize, cowpea or rice in the illustrative model.','Adjust moisture and temperature.','Change the number of elapsed days.','Compare estimated germination under different settings.'],
    questions:['Why are water and suitable temperature both important?','Why would measured germination differ from these model predictions?'],
    modelLimit:'Uncalibrated illustrative growth model, not a field forecast or validated variety-specific crop study.',
    safety:'Follow local hygiene and agricultural teacher guidance when working with seeds and soil.'
  },
  soil:{
    equipment:['Dry soil sample','Sieve','Balance','Sample fractions','pH meter (conceptual)'],
    method:['Select dry sand, silt and clay masses.','Observe each fraction as a percentage of total dry mass.','Adjust measured pH.','State which particle fraction has the largest mass, without guessing a formal texture class.'],
    questions:['Why must particle fractions add up to 100%?','What extra step is needed to determine formal USDA soil texture class?'],
    modelLimit:'Only mass fractions and measured pH; does not simulate USDA texture triangle or a real pH sensor.',
    safety:'Use gloves and hygiene measures for soil handling; avoid unknown contaminated samples.'
  },
  nutrients:{
    equipment:['Illustrated plant leaves','Nutrient reference cards','Observation notebook'],
    method:['Select nitrogen, phosphorus or potassium limitation.','Read the affected leaf region and textbook symptom.','Describe the role of the selected nutrient.','Explain at least two other possible causes of similar symptoms.'],
    questions:['Why is colour alone insufficient to diagnose nutrient deficiency?','What would a field agronomist measure before recommending fertilizer?'],
    modelLimit:'Schematic textbook examples only, not a disease detector or nutrient diagnosis.',
    safety:'Do not apply fertilizers or pesticides based only on this classroom exercise.'
  }
};
export function guideCoverage(){
  const missing=experiments.filter(experiment=>!guides[experiment.id]);
  return {total:experiments.length,covered:experiments.length-missing.length,missing:missing.map(e=>e.id)};
}
