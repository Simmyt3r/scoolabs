/**
 * Deterministic classroom models. These approximate idealised experimental conditions,
 * NOT laboratory safety advice or clinically/agronomically validated predictions.
 */
export type Subject = 'chemistry' | 'physics' | 'biology' | 'agriculture';

export interface Experiment {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  level: string;
  minutes: number;
  ready: boolean;
  objectives: string[];
}

export const experiments: Experiment[] = [
  { id: 'titration', subject: 'chemistry', title: 'Acid–Base Titration', description: 'Neutralise a strong acid and observe the indicator.', level: 'SS 2–3', minutes: 20, ready: true, objectives: ['Read a burette accurately', 'Identify the end point', 'Calculate an unknown concentration'] },
  { id: 'separation', subject: 'chemistry', title: 'Separation of Mixtures', description: 'Explore filtration and evaporation.', level: 'SS 1', minutes: 15, ready: true, objectives: [] },
  { id: 'ph-indicators', subject: 'chemistry', title: 'pH and Indicators', description: 'Classify solutions as acidic or alkaline.', level: 'SS 1–2', minutes: 15, ready: true, objectives: [] },
  { id: 'ohms-law', subject: 'physics', title: "Ohm’s Law", description: 'Build a simple circuit and investigate V = IR.', level: 'SS 2', minutes: 20, ready: true, objectives: ['Measure potential difference and current', 'Calculate resistance', 'Plot voltage against current'] },
  { id: 'pendulum', subject: 'physics', title: 'Simple Pendulum', description: 'Investigate the relationship between length and period.', level: 'SS 2', minutes: 20, ready: true, objectives: [] },
  { id: 'convex-lens', subject: 'physics', title: 'Convex Lens', description: 'Investigate image formation by lenses.', level: 'SS 3', minutes: 20, ready: true, objectives: [] },
  { id: 'microscopy', subject: 'biology', title: 'Using the Microscope', description: 'Explore prepared slides at different magnifications.', level: 'SS 1', minutes: 20, ready: true, objectives: ['Identify microscope parts', 'Select objective lenses', 'Describe observed cell structures'] },
  { id: 'osmosis', subject: 'biology', title: 'Osmosis', description: 'Investigate water movement across a membrane.', level: 'SS 2', minutes: 20, ready: true, objectives: [] },
  { id: 'transpiration', subject: 'biology', title: 'Transpiration', description: 'Study factors affecting water loss from leaves.', level: 'SS 2', minutes: 20, ready: true, objectives: [] },
  { id: 'germination', subject: 'agriculture', title: 'Seed Germination', description: 'Observe modelled effects of moisture and temperature.', level: 'SS 1–2', minutes: 20, ready: true, objectives: ['Identify conditions required for germination', 'Compare conditions', 'Record and interpret results'] },
  { id: 'soil', subject: 'agriculture', title: 'Soil Fractions and pH', description: 'Classify soil and interpret pH.', level: 'SS 1', minutes: 15, ready: true, objectives: [] },
  { id: 'nutrients', subject: 'agriculture', title: 'Plant Nutrients', description: 'Recognise nutrient deficiency symptoms.', level: 'SS 2', minutes: 15, ready: true, objectives: [] },
];

export type TitrationResult = { ph: number; equivalenceMl: number; indicator: 'colourless' | 'pale pink' | 'pink'; excess: 'acid' | 'base' | 'neutral' };
export function titrate(baseConcentration: number, volumeMl: number, acidConcentration = 0.1, acidVolumeMl = 25): TitrationResult {
  if (![baseConcentration, volumeMl, acidConcentration, acidVolumeMl].every(Number.isFinite) || baseConcentration <= 0 || volumeMl < 0 || acidConcentration <= 0 || acidVolumeMl <= 0) throw new RangeError('Invalid titration input');
  const acidMoles = acidConcentration * acidVolumeMl / 1000;
  const baseMoles = baseConcentration * volumeMl / 1000;
  const net = baseMoles - acidMoles;
  const totalL = (acidVolumeMl + volumeMl) / 1000;
  // Idealised strong monoprotic acid / strong monobasic base at 25 °C.
  const ph = Math.abs(net) < 1e-12 ? 7 : net < 0 ? -Math.log10(-net / totalL) : 14 + Math.log10(net / totalL);
  const clamped = Math.min(14, Math.max(0, ph));
  return { ph: clamped, equivalenceMl: acidMoles / baseConcentration * 1000, indicator: clamped < 8.2 ? 'colourless' : clamped < 10 ? 'pale pink' : 'pink', excess: Math.abs(net) < 1e-12 ? 'neutral' : net < 0 ? 'acid' : 'base' };
}

export function circuit(voltage: number, resistance: number) {
  if (!Number.isFinite(voltage) || voltage < 0 || !Number.isFinite(resistance) || resistance <= 0) throw new RangeError('Invalid circuit values');
  const current = voltage / resistance;
  return { current, power: voltage * current, voltage, resistance };
}

export function microscope(objective: 4 | 10 | 40, eyepiece = 10) {
  if (![4, 10, 40].includes(objective) || !Number.isFinite(eyepiece) || eyepiece <= 0) throw new RangeError('Invalid lens');
  return { magnification: objective * eyepiece, fieldOfViewMm: 18 / objective };
}

export type Crop = 'maize' | 'cowpea' | 'rice';
export function germination(crop: Crop, moisture: number, temperature: number, day: number) {
  if (!['maize', 'cowpea', 'rice'].includes(crop) || ![moisture, temperature, day].every(Number.isFinite) || moisture < 0 || moisture > 100 || temperature < 0 || temperature > 55 || day < 0 || day > 21) throw new RangeError('Invalid germination input');
  // Illustrative lesson model, not a field germination forecast.
  const speed = crop === 'rice' ? 0.75 : crop === 'cowpea' ? 1.15 : 1;
  const moistureFactor = Math.max(0, Math.min(1, (moisture - 10) / 30, (95 - moisture) / 25));
  const temperatureFactor = Math.max(0, Math.min(1, (temperature - 8) / 14, (43 - temperature) / 11));
  const viability = Math.max(0, Math.min(1, moistureFactor * temperatureFactor));
  const germinated = Math.round(100 * viability * Math.max(0, 1 - Math.exp(-0.35 * speed * Math.max(0, day - 1))));
  return { percentage: germinated, viable: Math.round(100 * viability), heightCm: Math.round(Math.max(0, day - 3) * speed * viability * 1.6 * 10) / 10 };
}


/** Strong monoprotic acid or monobasic base; ideal 25°C dilution, 1 mol/L max. */
export function solutionPH(kind: 'acid' | 'base' | 'water', concentration: number) {
  if (!['acid', 'base', 'water'].includes(kind) || !Number.isFinite(concentration) || concentration <= 0 || concentration > 1)
    throw new RangeError('Concentration must be between 0 and 1 mol/L');
  const ph = kind === 'water' ? 7 : kind === 'acid' ? -Math.log10(concentration) : 14 + Math.log10(concentration);
  const indicator = ph < 3 ? 'red' : ph < 6 ? 'orange/yellow' : ph < 8 ? 'green' : ph < 11 ? 'blue' : 'purple';
  return { ph, indicator, classification: ph < 7 ? 'acidic' : ph > 7 ? 'alkaline' : 'neutral' };
}
/** Ideal small-angle pendulum, length is metres, angle must be below 15 degrees. */
export function pendulum(lengthMeters: number, cycles: number, gravity = 9.81, amplitudeDegrees = 8) {
  if (![lengthMeters, cycles, gravity, amplitudeDegrees].every(Number.isFinite) ||
      lengthMeters <= 0 || lengthMeters > 10 || cycles < 1 || cycles > 100 || !Number.isInteger(cycles) ||
      gravity <= 0 || amplitudeDegrees <= 0 || amplitudeDegrees >= 15)
    throw new RangeError('Invalid small-angle pendulum settings');
  const periodSeconds = 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
  return { periodSeconds, frequencyHertz: 1 / periodSeconds, totalSeconds: cycles * periodSeconds };
}
/**
 * Solute concentrations are osmolarities in mOsm/L, not mass percent.
 * Qualitative tonicity; does not predict cell volume, pressure, or survival.
 */
export function osmosis(inside: number, outside: number) {
  if (![inside, outside].every(Number.isFinite) || inside < 0 || outside < 0 || inside > 2000 || outside > 2000)
    throw new RangeError('Invalid osmolarity');
  const diff = outside - inside;
  return {
    tonicity: diff === 0 ? 'isotonic' : diff < 0 ? 'hypotonic' : 'hypertonic',
    netWaterMovement: diff === 0 ? 'no net movement' : diff < 0 ? 'into the cell' : 'out of the cell',
  };
}
/** Dry soil particle mass fractions; the fractions are not a USDA texture-class label. */
export function soilSample(sandGrams: number, siltGrams: number, clayGrams: number, ph: number) {
  if (![sandGrams, siltGrams, clayGrams, ph].every(Number.isFinite) ||
      Math.min(sandGrams, siltGrams, clayGrams) < 0 || ph < 0 || ph > 14)
    throw new RangeError('Invalid soil measurement');
  const total = sandGrams + siltGrams + clayGrams;
  if (total <= 0) throw new RangeError('Sample mass must be positive');
  const fractions = {sand: 100*sandGrams/total, silt: 100*siltGrams/total, clay: 100*clayGrams/total};
  const dominant = (Object.keys(fractions) as Array<keyof typeof fractions>).reduce((a,b)=>fractions[b]>fractions[a]?b:a);
  return { fractions, totalGrams: total, dominant, acidity: ph < 7 ? 'acidic' : ph > 7 ? 'alkaline' : 'neutral' };
}


/** Classroom mass balance for a fully dissolved salt/sand mixture, with no losses. */
export function separateMixture(sandG: number, saltG: number, waterG: number) {
  if (![sandG,saltG,waterG].every(Number.isFinite) || sandG<0 || saltG<0 ||
      waterG<=0 || sandG>1000 || saltG>1000 || waterG>10000) throw new RangeError("Invalid mixture mass");
  // Restrict to below the approximate 20°C NaCl solubility, ~35.9 g per 100 g water.
  if(saltG>waterG*0.359)throw new RangeError("Salt exceeds assumed room-temperature solubility");
  const initialMassG=sandG+saltG+waterG;
  return {initialMassG,filterResidueG:sandG,filtrateG:saltG+waterG,
    recoveredSaltG:saltG,evaporatedWaterG:waterG,
    finalRecoveredG:sandG+saltG+waterG};
}
/** Ideal positive-focal-length thin lens in air; signed Gaussian image distance. */
export function convexLens(focalCm:number,objectCm:number){
  if (![focalCm,objectCm].every(Number.isFinite)||focalCm<=0||objectCm<=0||focalCm>1000||objectCm>10000)
    throw new RangeError("Invalid lens settings");
  if(Math.abs(objectCm-focalCm)<1e-9) return {imageCm:null,magnification:null,kind:"image at infinity" as const,orientation:"not finite" as const};
  const imageCm=focalCm*objectCm/(objectCm-focalCm);
  const magnification=-imageCm/objectCm;
  return {imageCm,magnification,kind:(imageCm>0?"real":"virtual") as "real"|"virtual",
          orientation:(magnification<0?"inverted":"upright") as "inverted"|"upright"};
}
/** Potometer estimates water uptake from capillary bubble movement, not direct transpiration. */
export function potometer(distanceMm:number,diameterMm:number,timeMinutes:number){
  if(![distanceMm,diameterMm,timeMinutes].every(Number.isFinite)||
     distanceMm<0||distanceMm>1000||diameterMm<=0||diameterMm>10||
     timeMinutes<=0||timeMinutes>10000)throw new RangeError("Invalid potometer measurement");
  const areaMm2=Math.PI*Math.pow(diameterMm/2,2);
  const waterUptakeMicrolitres=distanceMm*areaMm2; // 1 mm^3 = 1 µL
  return {areaMm2,waterUptakeMicrolitres,uptakeMicrolitresPerMinute:waterUptakeMicrolitres/timeMinutes};
}
export type LimitedNutrient="nitrogen"|"phosphorus"|"potassium";
/** Educational symptom example, NOT a disease/soil diagnosis. */
export function nutrientExample(nutrient:LimitedNutrient){
  const models={
    nitrogen:{affected:"older leaves first",appearance:"general pale-green or yellowing leaves",role:"leaf chlorophyll and vegetative growth",note:"Other stresses can produce similar yellowing."},
    phosphorus:{affected:"older leaves may be affected",appearance:"stunted growth; some crops show purple colouring",role:"energy transfer and root development",note:"Purple leaves are not universal across all crops."},
    potassium:{affected:"older leaves first",appearance:"yellowing and scorching along leaf margins",role:"water regulation and enzyme function",note:"Water stress can cause similar marginal damage."}
  } as const;
  if(!(nutrient in models))throw new RangeError("Unknown plant nutrient");
  return models[nutrient];
}
