import { experiments } from './engine';
export type CheckQuestion={prompt:string;options:readonly [string,string,string];correctIndex:0|1|2;explanation:string};
export const checkQuestions:Record<string,readonly [CheckQuestion,CheckQuestion]> = {
  "titration": [
    {
      "prompt": "For a strong monoprotic acid and strong monobasic base, the equivalence point occurs when…",
      "options": [
        "the acid and base have reacted in equal mole amounts",
        "the indicator turns pink at any pH",
        "both solutions have the same volume"
      ],
      "correctIndex": 0,
      "explanation": "Equivalence is defined by the neutralisation stoichiometry, not by equal volumes or an indicator alone."
    },
    {
      "prompt": "Doubling the base concentration while keeping the acid sample fixed will…",
      "options": [
        "double the equivalence volume",
        "halve the equivalence volume",
        "leave the equivalence volume unchanged"
      ],
      "correctIndex": 1,
      "explanation": "The same amount of base is needed, so twice the concentration requires half as much volume."
    }
  ],
  "separation": [
    {
      "prompt": "In a sand and dissolved salt mixture, filtration primarily removes…",
      "options": [
        "dissolved salt",
        "water",
        "insoluble sand"
      ],
      "correctIndex": 2,
      "explanation": "The filter retains insoluble sand while the salt solution passes through."
    },
    {
      "prompt": "During evaporation of salt water, the substance leaving as vapour is mainly…",
      "options": [
        "water",
        "salt crystals",
        "sand"
      ],
      "correctIndex": 0,
      "explanation": "Water changes phase; salt generally remains as a solid residue under the illustrated conditions."
    }
  ],
  "ph-indicators": [
    {
      "prompt": "A drop from pH 5 to pH 4 represents roughly…",
      "options": [
        "ten times less hydrogen ion concentration",
        "ten times more hydrogen ion concentration",
        "no change in hydrogen ion concentration"
      ],
      "correctIndex": 1,
      "explanation": "Each whole pH unit represents a tenfold change in hydrogen ion concentration for the ideal model."
    },
    {
      "prompt": "A pH of 7 describes neutral pure water under this simulation's assumption of…",
      "options": [
        "25°C",
        "100°C",
        "any temperature"
      ],
      "correctIndex": 0,
      "explanation": "The reference pKw of 14 and a neutral pH of 7 are specified for 25°C."
    }
  ],
  "ohms-law": [
    {
      "prompt": "For an ideal fixed resistor, doubling voltage causes current to…",
      "options": [
        "halve",
        "remain constant",
        "double"
      ],
      "correctIndex": 2,
      "explanation": "I = V/R, so current doubles if resistance remains unchanged."
    },
    {
      "prompt": "For an ohmic resistor, the gradient of a current-versus-voltage graph is…",
      "options": [
        "1/R",
        "R",
        "power"
      ],
      "correctIndex": 0,
      "explanation": "The plotted current obeys I = V × (1/R); its gradient is conductance."
    }
  ],
  "pendulum": [
    {
      "prompt": "In the small-angle pendulum model, quadrupling length makes the period…",
      "options": [
        "four times as long",
        "twice as long",
        "half as long"
      ],
      "correctIndex": 1,
      "explanation": "T = 2π√(L/g), giving a period twice as long when length becomes four times larger."
    },
    {
      "prompt": "The slope of a period-squared-versus-length graph in the ideal model is…",
      "options": [
        "g / 4π²",
        "2π / g",
        "4π² / g"
      ],
      "correctIndex": 2,
      "explanation": "Squaring the small-angle pendulum equation gives T² = (4π²/g)L."
    }
  ],
  "convex-lens": [
    {
      "prompt": "A convex lens produces a real image that can reach a screen when the object is…",
      "options": [
        "outside the focal length",
        "between the lens and focal point",
        "exactly at the lens"
      ],
      "correctIndex": 0,
      "explanation": "The ideal thin-lens model produces a real image on the far side when object distance exceeds focal length."
    },
    {
      "prompt": "For an object inside the focal length, the ideal convex lens image is…",
      "options": [
        "real and inverted",
        "virtual and upright",
        "always absent"
      ],
      "correctIndex": 1,
      "explanation": "An object inside the focal length produces a virtual upright image, not a screen projection."
    }
  ],
  "microscopy": [
    {
      "prompt": "Total microscope magnification equals…",
      "options": [
        "eyepiece magnification plus objective magnification",
        "objective magnification divided by eyepiece magnification",
        "eyepiece magnification multiplied by objective magnification"
      ],
      "correctIndex": 2,
      "explanation": "The combined optical magnification is the product of the eyepiece and objective magnifications."
    },
    {
      "prompt": "When changing to a higher objective magnification, the field of view generally…",
      "options": [
        "gets smaller",
        "gets larger",
        "stays identical"
      ],
      "correctIndex": 0,
      "explanation": "Higher magnification typically covers a smaller specimen area."
    }
  ],
  "osmosis": [
    {
      "prompt": "A cell in a solution with lower effective osmolarity outside than inside generally experiences net water movement…",
      "options": [
        "out of the cell",
        "into the cell",
        "nowhere under all conditions"
      ],
      "correctIndex": 1,
      "explanation": "The outside solution is hypotonic in this model, so net water movement is inward."
    },
    {
      "prompt": "When the effective osmolarities on both sides are equal, the model predicts…",
      "options": [
        "no molecules move",
        "water moves in one direction only",
        "no net water movement"
      ],
      "correctIndex": 2,
      "explanation": "Water can cross both ways, but equal effective osmolarities give no net directional flow."
    }
  ],
  "transpiration": [
    {
      "prompt": "A simple potometer primarily measures…",
      "options": [
        "water uptake by the shoot",
        "carbon dioxide release",
        "direct mass of water evaporated from each leaf"
      ],
      "correctIndex": 0,
      "explanation": "The air bubble tracks water entering the shoot; uptake only approximates transpiration."
    },
    {
      "prompt": "For unchanged capillary diameter, doubling bubble displacement doubles…",
      "options": [
        "the capillary radius",
        "the calculated uptake volume",
        "the water density"
      ],
      "correctIndex": 1,
      "explanation": "Water volume is capillary cross-sectional area multiplied by bubble displacement."
    }
  ],
  "germination": [
    {
      "prompt": "Seed germination normally depends on suitable…",
      "options": [
        "watering only, regardless of temperature",
        "complete darkness for every species",
        "moisture, oxygen and temperature"
      ],
      "correctIndex": 2,
      "explanation": "Seeds generally need water, respiration and suitable temperature, with light requirements varying by species."
    },
    {
      "prompt": "The simulated germination estimate should be treated as…",
      "options": [
        "an illustrative prediction, not a calibrated field forecast",
        "a guaranteed yield for a named seed variety",
        "a replacement for an actual germination trial"
      ],
      "correctIndex": 0,
      "explanation": "This lesson uses a simplified illustrative model without variety-specific field calibration."
    }
  ],
  "soil": [
    {
      "prompt": "The mass fractions of sand, silt and clay in a dry sample should sum to…",
      "options": [
        "50%",
        "100%",
        "200%"
      ],
      "correctIndex": 1,
      "explanation": "Each fraction is its component mass divided by the total dry mass."
    },
    {
      "prompt": "A formal USDA soil texture class requires…",
      "options": [
        "soil colour alone",
        "soil pH alone",
        "sand, silt and clay percentages interpreted on a texture triangle"
      ],
      "correctIndex": 2,
      "explanation": "Mass fractions are inputs to a soil texture triangle; pH alone does not classify texture."
    }
  ],
  "nutrients": [
    {
      "prompt": "Yellowing leaves alone are sufficient to diagnose nitrogen deficiency with certainty.",
      "options": [
        "True, leaf colour always identifies the cause",
        "False, several stresses can produce similar symptoms",
        "True, if the plant grows in soil"
      ],
      "correctIndex": 1,
      "explanation": "Nutrient deficiency symptoms can overlap with disease, moisture stress and other factors."
    },
    {
      "prompt": "Before recommending fertiliser for a real field, an extension officer should…",
      "options": [
        "inspect conditions and use appropriate soil/plant evidence",
        "rely on a single illustrated leaf colour",
        "apply the maximum available dose"
      ],
      "correctIndex": 0,
      "explanation": "Real agronomic recommendations require field context and appropriate verified evidence."
    }
  ]
};
export function checkCoverage(){return experiments.filter(e=>e.ready&&!checkQuestions[e.id]).map(e=>e.id)}
export function evaluateCheck(id:string,answers:readonly number[]){const questions=checkQuestions[id];if(!questions||answers.length!==2||answers.some(a=>!Number.isInteger(a)||a<0||a>2))throw new RangeError('Complete both questions using available options.');return answers.reduce((sum,choice,i)=>sum+Number(choice===questions[i].correctIndex),0)}
