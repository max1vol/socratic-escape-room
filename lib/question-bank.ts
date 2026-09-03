import "server-only";

export const LEVELS = ["ks2", "ks3"] as const;
export const SUBJECTS = ["science", "maths", "history", "geography", "computing", "parliament"] as const;
export const ROUNDS = ["spot", "explain", "challenge", "defend"] as const;

export type Level = (typeof LEVELS)[number];
export type Subject = (typeof SUBJECTS)[number];
export type Round = (typeof ROUNDS)[number];

export type PublicQuestion = {
  id: string;
  level: Level;
  subject: Subject;
  round: Round;
  title: string;
  brief: string;
  prompt: string;
  aiClaim?: string;
  evidence?: string[];
  intervention?: string;
};

export type Question = PublicQuestion & {
  answer: string;
  criteria: string[];
};

type Seed = Omit<Question, "id" | "level" | "subject" | "round">;
type Pack = {
  level: Level;
  subject: Subject;
  variant: "a" | "b";
  rounds: Record<Round, Seed>;
};

const packs: Pack[] = [
  {
    level: "ks2", subject: "science", variant: "a", rounds: {
      spot: {
        title: "The shadow clock",
        brief: "At 9 am a flagpole's shadow points west. At 3 pm it points east.",
        aiClaim: "The Sun must have travelled around the flagpole during the day.",
        prompt: "What has the adviser confused?",
        answer: "The apparent movement comes mainly from Earth rotating, not the Sun circling the flagpole.",
        criteria: ["Identifies Earth's rotation or the Sun's apparent movement", "Rejects the Sun circling the flagpole"],
      },
      explain: {
        title: "The sealed syringe",
        brief: "A sealed syringe contains air. Its tip is blocked, but the plunger can still be pushed in a little.",
        prompt: "Explain how the plunger moves when the air cannot escape.",
        answer: "Gas particles have spaces between them. Pushing the plunger reduces those spaces and compresses the gas, raising its pressure.",
        criteria: ["Says the air is compressed into less space", "Explains that particles become closer or pressure rises"],
      },
      challenge: {
        title: "The winter coat",
        brief: "A coat helps a warm person stay warm outdoors.",
        aiClaim: "That proves the coat produces heat. Otherwise the person could not stay warm.",
        prompt: "Answer the adviser's strongest point.",
        answer: "The body produces heat; trapped air in the coat slows heat transfer to the colder surroundings.",
        criteria: ["Distinguishes making heat from slowing heat loss", "Mentions the body as the heat source or insulation/trapped air"],
      },
      defend: {
        title: "Restore the wetland",
        brief: "Parliament must choose whether to restore a drained wetland near a town.",
        evidence: ["Wetlands absorb water after heavy rain", "They provide habitats", "Restoration would reduce land available for building"],
        prompt: "Defend the motion: this wetland should be restored.",
        intervention: "Why not build higher flood walls instead?",
        answer: "A strong defence connects water storage and habitat benefits to the proposal while fairly addressing the lost building land and the alternative of walls.",
        criteria: ["Uses at least two supplied facts", "Makes a clear causal argument", "Answers the flood-wall alternative rather than ignoring it"],
      },
    },
  },
  {
    level: "ks2", subject: "science", variant: "b", rounds: {
      spot: {
        title: "The disappearing puddle",
        brief: "A shallow puddle vanishes on a cool, windy day, although it never boils.",
        aiClaim: "Water can become a gas only at 100°C, so it must have soaked entirely into the pavement.",
        prompt: "Find the scientific mistake.",
        answer: "Evaporation happens from a liquid's surface below its boiling point, and wind can speed it up.",
        criteria: ["States that evaporation can happen below boiling point", "Connects the disappearing water to water vapour"],
      },
      explain: {
        title: "The moonlit mirror",
        brief: "The Moon is visible at night but does not make its own visible light.",
        prompt: "Explain how moonlight reaches your eyes.",
        answer: "Sunlight travels to the Moon, reflects from its surface, and then travels into our eyes.",
        criteria: ["Identifies the Sun as the original light source", "Describes reflection from the Moon into the eye"],
      },
      challenge: {
        title: "Two falling papers",
        brief: "A flat sheet of paper falls slowly. The same sheet, crumpled into a tight ball, falls faster.",
        aiClaim: "Crumpling must make the paper heavier, because heavier things always fall faster.",
        prompt: "Rebut the claim using the evidence.",
        answer: "The mass barely changes; crumpling reduces the area facing the air, so air resistance has less effect.",
        criteria: ["Says the mass or weight is essentially unchanged", "Explains the changed fall using shape, area, or air resistance"],
      },
      defend: {
        title: "Lights after midnight",
        brief: "A council is considering dimming empty-office lights after midnight.",
        evidence: ["Electricity use would fall", "Some migrating animals are disrupted by artificial light", "Security staff need safe visibility"],
        prompt: "Defend a sensible dimming policy.",
        intervention: "Doesn't any dimming make the streets less safe?",
        answer: "A strong case supports targeted dimming while retaining necessary security lighting and uses energy and wildlife evidence.",
        criteria: ["Uses the energy or wildlife evidence", "Addresses safety with a targeted compromise", "States a clear policy"],
      },
    },
  },
  {
    level: "ks2", subject: "maths", variant: "a", rounds: {
      spot: {
        title: "The class average",
        brief: "Four quiz scores are 6, 7, 7 and 20. Their mean is 10.",
        aiClaim: "A typical pupil scored 10 because the mean is always one of the scores in the list.",
        prompt: "Identify the mistake in the conclusion.",
        answer: "A mean need not be an observed score, and the outlying 20 pulls it above the three clustered scores.",
        criteria: ["Says a mean need not appear in the data", "Recognises that 20 makes 10 unrepresentative or that 7 is more typical"],
      },
      explain: {
        title: "The folded strip",
        brief: "A strip is 24 cm long. One third is coloured green. Half of the remaining strip is coloured gold.",
        prompt: "Explain what fraction and length remain uncoloured.",
        answer: "One third, 8 cm, is green, leaving 16 cm. Half of that, 8 cm, is gold, leaving 8 cm or one third uncoloured.",
        criteria: ["Calculates 8 cm green and 16 cm remaining", "Concludes 8 cm or one third is uncoloured"],
      },
      challenge: {
        title: "The growing square",
        brief: "A square's side length doubles from 3 cm to 6 cm.",
        aiClaim: "Its area doubles too, because every side is only twice as long.",
        prompt: "Show why that reasoning fails.",
        answer: "Area depends on two dimensions: 3×3=9, while 6×6=36, so it becomes four times as large.",
        criteria: ["Compares the two areas correctly", "Explains that both dimensions double or the scale factor is squared"],
      },
      defend: {
        title: "The fairest queue",
        brief: "A museum has one fast lift. A class of 24 and six individual visitors arrive together.",
        evidence: ["The lift holds six people", "Each trip takes the same time", "Splitting the class across every trip delays all six individuals"],
        prompt: "Defend a fair boarding rule.",
        intervention: "Why shouldn't first arrival settle everything?",
        answer: "A defensible rule balances waiting times, applies consistently, and uses the six-person capacity rather than merely asserting fairness.",
        criteria: ["Proposes a clear rule", "Uses capacity or waiting-time evidence", "Answers the first-arrival objection"],
      },
    },
  },
  {
    level: "ks2", subject: "maths", variant: "b", rounds: {
      spot: {
        title: "The missing tile",
        brief: "A 5 by 5 tiled square has its centre tile removed.",
        aiClaim: "One tile out of five has gone, so 20% of the area is missing.",
        prompt: "Find the counting error.",
        answer: "There are 25 tiles in total, not five. One removed tile is 1/25, or 4%, of the area.",
        criteria: ["Counts 25 total tiles", "Gives 1/25 or 4% missing"],
      },
      explain: {
        title: "The mystery number",
        brief: "A number is doubled, then 7 is added. The result is 25.",
        prompt: "Explain how to recover the original number without guessing.",
        answer: "Undo the operations in reverse: subtract 7 from 25 to get 18, then halve 18 to get 9.",
        criteria: ["Reverses the operations in the correct order", "Finds 9 and checks or justifies it"],
      },
      challenge: {
        title: "Three red counters",
        brief: "A bag has three red and three blue counters. One red counter is removed without replacement.",
        aiClaim: "Red and blue are still equally likely because there are still only two colours.",
        prompt: "Answer the claim precisely.",
        answer: "There are now two red and three blue counters, so blue has probability 3/5 and red 2/5; the number of colour names is irrelevant.",
        criteria: ["Updates the counter totals to two red and three blue", "Explains probabilities depend on quantities, not number of categories"],
      },
      defend: {
        title: "Share the tablets",
        brief: "Two classes need 15 tablets. Class A has 20 pupils for one lesson; Class B has 30 pupils for two lessons.",
        evidence: ["Every tablet can be reissued between lessons", "Pairs can share one tablet", "Class B needs twice as much lesson time"],
        prompt: "Defend a fair allocation plan.",
        intervention: "Isn't equal always the same as fair?",
        answer: "A strong plan distinguishes equal from equitable allocation and accounts for pupil numbers, lesson time, pairing, and reuse.",
        criteria: ["Gives a workable allocation", "Uses at least two numerical facts", "Explains why the rule is fair rather than just calling it fair"],
      },
    },
  },
  {
    level: "ks2", subject: "history", variant: "a", rounds: {
      spot: {
        title: "The spotless diary",
        brief: "A ruler's official diary says every decision that year was wise and popular.",
        aiClaim: "It was written at the time, so historians can treat every judgement in it as fact.",
        prompt: "What is wrong with the source advice?",
        answer: "Being contemporary makes a source useful, not automatically unbiased; an official diary may protect the ruler's reputation.",
        criteria: ["Distinguishes contemporary from reliable or unbiased", "Identifies motive, viewpoint, or reputation as a possible bias"],
      },
      explain: {
        title: "Two accounts of a march",
        brief: "One newspaper calls a march peaceful. Another calls it threatening. Both watched the same event.",
        prompt: "Explain how both accounts can differ without one being entirely invented.",
        answer: "Writers select different details and interpret them through different viewpoints, audiences, or purposes.",
        criteria: ["Explains selection or interpretation of evidence", "Mentions differing viewpoint, audience, or purpose"],
      },
      challenge: {
        title: "The silent photograph",
        brief: "A photograph shows smiling workers outside a factory in 1910.",
        aiClaim: "No one in the photograph looks unhappy, so working conditions inside must have been good.",
        prompt: "Challenge what the photograph can prove.",
        answer: "A posed moment outside cannot show all conditions, and the photographer's selection or the workers' behaviour may be influenced.",
        criteria: ["Identifies limits of what is visible", "Notes posing, selection, context, or need for corroboration"],
      },
      defend: {
        title: "Keep the old station",
        brief: "A disused Victorian station may be demolished for new homes.",
        evidence: ["It is the town's oldest public building", "The roof needs costly repairs", "New homes are in short supply"],
        prompt: "Defend a balanced decision to Parliament.",
        intervention: "Why should the past block homes people need now?",
        answer: "A strong defence reaches a clear decision, weighs heritage against cost and housing, and responds to the competing public need.",
        criteria: ["Uses evidence from both sides", "Makes a clear recommendation", "Answers the homes-versus-heritage challenge"],
      },
    },
  },
  {
    level: "ks2", subject: "history", variant: "b", rounds: {
      spot: {
        title: "The empty map",
        brief: "A medieval map labels one kingdom but leaves a neighbouring region blank.",
        aiClaim: "The blank proves nobody lived in that region.",
        prompt: "Spot the historical mistake.",
        answer: "Absence from one map is not proof of absence; the mapmaker may have lacked knowledge or had a different purpose.",
        criteria: ["Rejects absence from the map as proof", "Suggests limits of knowledge, purpose, scale, or evidence"],
      },
      explain: {
        title: "Why the date changed",
        brief: "A textbook gives a different end date for an empire from a museum label.",
        prompt: "Explain why historians may choose different dates for a long change.",
        answer: "Large changes happen in stages, so historians may select different political, military, or cultural turning points.",
        criteria: ["Explains that change can be gradual or staged", "Shows that different criteria can produce different defensible dates"],
      },
      challenge: {
        title: "The royal law",
        brief: "A law was issued by a king, but records show some distant towns ignored it.",
        aiClaim: "Once the king signed it, everyone must immediately have obeyed.",
        prompt: "Rebut the assumption about power.",
        answer: "Making a law does not guarantee enforcement; communication, local officials, distance, and resistance affect obedience.",
        criteria: ["Distinguishes declaring a law from enforcing it", "Names a plausible practical limit on royal power"],
      },
      defend: {
        title: "Return the artefact",
        brief: "A museum is asked to return a ceremonial object acquired overseas in 1890.",
        evidence: ["The community still uses similar objects in ceremonies", "The museum has preserved and studied it", "The purchase record is disputed"],
        prompt: "Defend a fair next step, not a slogan.",
        intervention: "Would returning it erase access for everyone else?",
        answer: "A good case weighs ownership, cultural connection, preservation, and public access, then proposes a clear process or decision.",
        criteria: ["Uses evidence on both cultural claim and access/preservation", "Proposes a concrete next step", "Answers the access objection"],
      },
    },
  },
  {
    level: "ks2", subject: "geography", variant: "a", rounds: {
      spot: {
        title: "The crowded map",
        brief: "A country has 10 million people. Most live in two coastal cities; its interior is sparsely populated.",
        aiClaim: "Its population density must be the same everywhere because density is one number for the whole country.",
        prompt: "Find the geographical error.",
        answer: "A national average hides variation; local densities can be high in cities and low in the interior.",
        criteria: ["Recognises population density can vary within a country", "Explains the limitation of a national average"],
      },
      explain: {
        title: "The bending river",
        brief: "A river bend has fast water on its outer bank and slower water on its inner bank.",
        prompt: "Explain how that can make the bend grow over time.",
        answer: "Faster outer water erodes the bank, while slower inner water deposits sediment, making the meander more curved.",
        criteria: ["Connects faster outer flow to erosion", "Connects slower inner flow to deposition"],
      },
      challenge: {
        title: "A rainy week",
        brief: "A city has an unusually rainy week in July.",
        aiClaim: "That single week proves its climate has permanently become wetter.",
        prompt: "Challenge the evidence without denying the rain.",
        answer: "The rain is weather over a short period; climate requires long-term patterns and much more data.",
        criteria: ["Distinguishes weather from climate", "Says longer-term data or patterns are needed"],
      },
      defend: {
        title: "The new footbridge",
        brief: "A river divides homes from a school and shops.",
        evidence: ["The current walking route adds 25 minutes", "The floodplain sometimes covers the proposed site", "A raised bridge costs more but remains usable in floods"],
        prompt: "Defend the best bridge decision.",
        intervention: "Why spend more for floods that happen only sometimes?",
        answer: "A strong case uses accessibility and flood-risk evidence, compares long-term usefulness with upfront cost, and gives a clear recommendation.",
        criteria: ["Uses the time and flood evidence", "Compares options over time", "Answers the cost challenge"],
      },
    },
  },
  {
    level: "ks2", subject: "geography", variant: "b", rounds: {
      spot: {
        title: "North is not uphill",
        brief: "A map places a town above a lake because the town is farther north.",
        aiClaim: "Water will flow from the town to the lake because north is higher on the page.",
        prompt: "What has the adviser confused?",
        answer: "Position on a map is not elevation; water flows downhill according to height or contour data, not towards the bottom of a page.",
        criteria: ["Distinguishes north/south map position from elevation", "Says height, slope, or contours determine flow"],
      },
      explain: {
        title: "The cooler coast",
        brief: "A coastal town has cooler summers and milder winters than an inland town at the same latitude.",
        prompt: "Explain how the sea reduces temperature extremes.",
        answer: "Water heats and cools more slowly than land, so the sea cools nearby air in summer and releases stored heat in winter.",
        criteria: ["States that water changes temperature more slowly than land", "Links this to cooler summers and/or milder winters"],
      },
      challenge: {
        title: "The useful road",
        brief: "A new road shortens many journeys but cuts through a wildlife habitat.",
        aiClaim: "Shorter journeys make the road entirely sustainable, so the habitat does not matter.",
        prompt: "Challenge the one-sided judgement.",
        answer: "Sustainability weighs environmental, social, and economic effects; saved travel must be considered alongside habitat loss and possible extra traffic.",
        criteria: ["Identifies more than one dimension of sustainability", "Includes habitat loss as a real cost"],
      },
      defend: {
        title: "Homes on the edge",
        brief: "A town proposes 300 homes on farmland beside a railway station.",
        evidence: ["The town needs more homes", "Rail access could reduce car trips", "The land currently grows food and absorbs rain"],
        prompt: "Defend a planning decision with conditions.",
        intervention: "If homes are needed, why attach any conditions at all?",
        answer: "A good defence weighs housing and rail benefits against food and drainage, then proposes relevant conditions or an alternative.",
        criteria: ["Uses evidence from both sides", "States a clear decision or conditions", "Answers why conditions improve the proposal"],
      },
    },
  },
  {
    level: "ks2", subject: "computing", variant: "a", rounds: {
      spot: {
        title: "The secret password",
        brief: "A pupil changes a password from 'rocket1' to 'rocket2'.",
        aiClaim: "It is now secure because nobody has seen the new final digit.",
        prompt: "Spot the security mistake.",
        answer: "A predictable one-character change is easy to guess; a longer, unique password or passphrase is safer.",
        criteria: ["Identifies the change as predictable or easy to guess", "Recommends length and uniqueness or an unpredictable passphrase"],
      },
      explain: {
        title: "The shortest instructions",
        brief: "A robot faces north. The treasure is one square east and two squares north.",
        prompt: "Give an exact algorithm and explain why each instruction is needed.",
        answer: "For example: move forward twice, turn right, move forward once. The order and directions take the robot to the target.",
        criteria: ["Gives an unambiguous sequence reaching the target", "Accounts for the robot's starting direction"],
      },
      challenge: {
        title: "The popular search result",
        brief: "The first search result repeats a dramatic fact with no named source.",
        aiClaim: "It is first, so the search engine has certified it as true.",
        prompt: "Rebut the claim about ranking.",
        answer: "Ranking measures relevance and other signals, not guaranteed truth; the claim should be checked against identified, reliable sources.",
        criteria: ["Distinguishes ranking from verification", "Suggests checking source identity, evidence, or corroboration"],
      },
      defend: {
        title: "School facial recognition",
        brief: "A school considers face scanning at its entrance.",
        evidence: ["It may speed up entry", "Face data cannot be changed like a password", "The system sometimes misidentifies people"],
        prompt: "Defend a policy decision on the system.",
        intervention: "If it saves time, why not collect the data?",
        answer: "A strong case weighs convenience against privacy, permanence, and error, and sets a clear proportionate policy.",
        criteria: ["Uses at least two supplied facts", "Recognises sensitive or permanent biometric data", "Answers the convenience argument"],
      },
    },
  },
  {
    level: "ks2", subject: "computing", variant: "b", rounds: {
      spot: {
        title: "The endless loop",
        brief: "A game repeats 'move one step' until the player reaches square 10. The player begins on square 2 but the program never updates the square number.",
        aiClaim: "The loop must end after eight repeats because 2 + 8 = 10.",
        prompt: "Find the algorithmic flaw.",
        answer: "The condition never changes because the stored square number is not updated, so the loop cannot know the player has reached 10.",
        criteria: ["Identifies the missing state/position update", "Explains why the condition therefore remains true"],
      },
      explain: {
        title: "Compress the picture",
        brief: "A row of pixels is: green, green, green, gold, gold, green.",
        prompt: "Explain how run-length encoding could store the row and when it saves space.",
        answer: "Store 3 green, 2 gold, 1 green. It saves space when long runs make counts shorter than listing each pixel.",
        criteria: ["Encodes the row in the correct runs", "Explains that longer repeated runs make compression effective"],
      },
      challenge: {
        title: "The confident chatbot",
        brief: "A chatbot gives a fluent answer but cites a book that does not exist.",
        aiClaim: "Its detailed wording shows it checked the facts carefully.",
        prompt: "Challenge the connection between style and accuracy.",
        answer: "Fluency is not evidence of verification; the citation and claim need checking against real, reliable sources.",
        criteria: ["Separates confidence or detail from accuracy", "Calls for checking the cited source or corroborating evidence"],
      },
      defend: {
        title: "Keep the recommendation feed",
        brief: "A reading app recommends books to children.",
        evidence: ["Recommendations help readers discover books", "Click history can reveal interests", "Repeated suggestions can narrow what users encounter"],
        prompt: "Defend rules for a useful, fair recommendation system.",
        intervention: "Wouldn't any limits make recommendations worse?",
        answer: "A good defence retains useful personalisation while limiting data and giving control or varied choices.",
        criteria: ["Uses benefit and risk evidence", "Proposes a workable safeguard", "Answers the claim that safeguards necessarily reduce quality"],
      },
    },
  },
  {
    level: "ks2", subject: "parliament", variant: "a", rounds: {
      spot: {
        title: "The loudest petition",
        brief: "One petition receives 100,000 signatures. The country has tens of millions of voters.",
        aiClaim: "Parliament must pass it immediately because the signatures prove everyone agrees.",
        prompt: "Identify the democratic mistake.",
        answer: "The petition shows substantial support and deserves consideration, but it does not represent everyone or automatically settle competing arguments.",
        criteria: ["Recognises the petition as evidence of some support, not everyone", "Distinguishes consideration from automatic law"],
      },
      explain: {
        title: "Why debate a bill?",
        brief: "A proposed law has a popular aim, but its wording may cause unexpected effects.",
        prompt: "Explain why MPs still debate and amend it.",
        answer: "Debate tests the evidence and consequences; amendments can improve unclear or harmful details before the proposal becomes law.",
        criteria: ["Explains scrutiny or testing consequences", "Explains the purpose of amendments"],
      },
      challenge: {
        title: "The majority wins",
        brief: "A proposal would benefit a large majority but remove an important protection from a small group.",
        aiClaim: "Democracy means the majority wins, so minority rights are irrelevant.",
        prompt: "Challenge the incomplete definition of democracy.",
        answer: "Voting matters, but a democracy also uses rights, law, scrutiny, and representation to protect people from unfair majority power.",
        criteria: ["Accepts majority decision-making but says it is not the whole of democracy", "Mentions rights, law, fairness, scrutiny, or representation"],
      },
      defend: {
        title: "Lower the voting age?",
        brief: "A committee considers votes at 16 in local elections.",
        evidence: ["Sixteen-year-olds work and pay some taxes", "Voting habits can start young", "Some argue civic knowledge varies at every age"],
        prompt: "Defend either side of the motion with evidence.",
        intervention: "Why choose 16 rather than any other age?",
        answer: "Either conclusion can pass if it uses evidence, gives a principled reason for the threshold, and answers the age-boundary challenge.",
        criteria: ["Takes a clear position", "Uses at least two relevant facts or principles", "Answers why the chosen boundary is defensible"],
      },
    },
  },
  {
    level: "ks2", subject: "parliament", variant: "b", rounds: {
      spot: {
        title: "One MP, every view",
        brief: "An MP wins 55% of votes in a constituency.",
        aiClaim: "That means every constituent agrees with every decision the MP makes.",
        prompt: "Find the representation error.",
        answer: "Winning authorises the MP to represent the whole constituency, but voters hold different views and a majority vote is not unanimous agreement.",
        criteria: ["Distinguishes majority from unanimity", "Recognises varied constituent views or the duty to represent all"],
      },
      explain: {
        title: "Ask the minister",
        brief: "MPs publicly question a minister about a delayed programme.",
        prompt: "Explain how questioning can improve government even when no vote follows.",
        answer: "Questions force explanations into public view, expose missing evidence, and let Parliament and the public hold ministers accountable.",
        criteria: ["Explains public scrutiny or accountability", "Shows how questions can reveal evidence, reasons, or failures"],
      },
      challenge: {
        title: "The expert decides",
        brief: "A scientific adviser recommends one policy, but it has costs and ethical trade-offs.",
        aiClaim: "Experts know the facts, so elected representatives should simply obey them.",
        prompt: "Defend expertise without surrendering democratic judgement.",
        answer: "Experts inform Parliament about evidence, while representatives must weigh uncertainty, values, costs, and public accountability.",
        criteria: ["Values expert evidence", "Explains a legitimate separate role for elected judgement or accountability"],
      },
      defend: {
        title: "Fund the youth centre",
        brief: "A council can fund either longer library hours or reopen a youth centre; it cannot fully fund both.",
        evidence: ["The library serves 900 visits weekly", "The closed youth centre area has few free indoor spaces", "A shared building could reduce costs but limit hours"],
        prompt: "Defend a budget decision.",
        intervention: "Who loses out under your plan?",
        answer: "A strong case makes a clear allocation, uses the evidence, acknowledges who bears the cost, and explains mitigation or compromise.",
        criteria: ["Makes a concrete decision", "Uses at least two facts", "Answers who loses and how the impact might be reduced"],
      },
    },
  },
  {
    level: "ks3", subject: "science", variant: "a", rounds: {
      spot: {
        title: "The lunar drop",
        brief: "On the Moon, a 200 kg probe and a 2 kg probe are released from the same height. They land together.",
        aiClaim: "The Moon pulls on both probes with the same gravitational force. Equal force therefore gives equal acceleration.",
        prompt: "Identify the precise error, not merely the right result.",
        answer: "The forces are not equal: gravitational force is proportional to probe mass. The accelerations match because the heavier probe also has proportionally greater inertia.",
        criteria: ["Explicitly says the gravitational forces are unequal", "States that the heavier probe feels more force; full cancellation reasoning is optional in this round"],
      },
      explain: {
        title: "The return journey",
        brief: "A cyclist travels 12 km uphill at 12 km/h and the same 12 km downhill at 24 km/h.",
        prompt: "Explain the average speed for the whole journey and why it is not 18 km/h.",
        answer: "Uphill takes 1 hour and downhill takes 0.5 hour. Total distance is 24 km in 1.5 hours, so average speed is 16 km/h. Equal distances spend more time at the slower speed.",
        criteria: ["Uses total distance divided by total time", "Gets 24 km, 1.5 hours, and 16 km/h", "Explains why simply averaging 12 and 24 is invalid"],
      },
      challenge: {
        title: "The adapted bacteria",
        brief: "After an antibiotic treatment, resistant bacteria make up a larger share of the surviving population.",
        aiClaim: "The antibiotic taught individual bacteria how to become resistant because they needed to survive.",
        prompt: "Rebut the adviser's causal story.",
        answer: "Resistance variation existed before treatment through mutation or inherited genes. The antibiotic selected resistant bacteria, which survived and reproduced more.",
        criteria: ["Rejects need-driven change in individual bacteria", "Explains pre-existing variation and selection/reproduction"],
      },
      defend: {
        title: "Ban the bright sky",
        brief: "A council proposes limits on unnecessary outdoor lighting after midnight.",
        evidence: ["Shielded lamps can direct light downwards", "Artificial light disrupts some nocturnal species", "Businesses and pedestrians need adequate visibility"],
        prompt: "Defend a proportionate lighting rule.",
        intervention: "Are you putting wildlife above public safety?",
        answer: "A strong defence proposes targeted, shielded, or timed lighting, uses ecological evidence, and preserves necessary visibility.",
        criteria: ["Uses at least two evidence points", "Proposes a proportionate rather than absolute rule", "Directly answers the safety objection"],
      },
    },
  },
  {
    level: "ks3", subject: "science", variant: "b", rounds: {
      spot: {
        title: "The warmer metal",
        brief: "A metal chair and a wooden chair have been in the same room all night. The metal feels colder.",
        aiClaim: "The metal must be at a lower temperature because our skin is a reliable thermometer.",
        prompt: "Find the mistake in the inference.",
        answer: "They can be at the same room temperature. Metal conducts thermal energy away from skin faster, creating a colder sensation.",
        criteria: ["Says the objects can have the same temperature", "Explains the sensation using different rates of thermal conduction/energy transfer"],
      },
      explain: {
        title: "The floating ice",
        brief: "An ice cube floats in a completely full glass of water and then melts.",
        prompt: "Explain whether the water level rises, falls, or stays the same.",
        answer: "It stays the same. Floating ice displaces a weight of water equal to its own weight; when melted it becomes exactly that mass and volume of water.",
        criteria: ["Concludes the level stays the same", "Links floating displacement by weight to the melted water's amount"],
      },
      challenge: {
        title: "The sealed plant",
        brief: "A healthy plant gains dry mass while growing in a sealed transparent chamber supplied with light, water, and carbon dioxide.",
        aiClaim: "Nearly all the new mass must have come from the soil, because roots take in the plant's food.",
        prompt: "Challenge the mass accounting.",
        answer: "Most dry biomass carbon comes from carbon dioxide fixed during photosynthesis; roots absorb water and minerals, not ready-made food making most of the mass.",
        criteria: ["Identifies carbon dioxide as the main source of dry biomass carbon", "Distinguishes mineral/water uptake from making sugars by photosynthesis"],
      },
      defend: {
        title: "Release the gene-edited moth",
        brief: "Scientists propose releasing sterile moths to reduce a crop pest population.",
        evidence: ["The moths cannot establish a lasting new population", "Fewer pesticides may be needed", "Food-web effects are uncertain"],
        prompt: "Defend a cautious decision on a limited trial.",
        intervention: "If effects are uncertain, isn't any trial reckless?",
        answer: "A strong case weighs pesticide benefits against ecological uncertainty and explains how a monitored, reversible trial changes the risk.",
        criteria: ["Uses both benefit and uncertainty evidence", "Explains safeguards, monitoring, scale, or stopping rules", "Answers why uncertainty does or does not justify a trial"],
      },
    },
  },
  {
    level: "ks3", subject: "maths", variant: "a", rounds: {
      spot: {
        title: "The screening result",
        brief: "A rare condition affects 1 in 100 people. A test catches 90% of cases but falsely flags 10% of people without it.",
        aiClaim: "A positive result means there is a 90% chance the person has the condition.",
        prompt: "Identify the probability mistake.",
        answer: "The 90% is sensitivity, not the probability after a positive. In 1,000 people, about 9 true cases and 99 false positives are flagged, so the chance is about 9/108, or 8%.",
        criteria: ["Distinguishes test sensitivity from probability given a positive", "Uses the rarity/false positives to show the result is far below 90%; exact 8% desirable but not essential"],
      },
      explain: {
        title: "The painted cube",
        brief: "A 3×3×3 cube is painted on every outer face, then cut into 27 unit cubes.",
        prompt: "Explain how many small cubes have exactly two painted faces.",
        answer: "They are the middle cubes on the 12 edges. Corners have three painted faces, so there is one qualifying cube per edge: 12.",
        criteria: ["Locates qualifying cubes on edges but not corners", "Counts 12 edges and concludes 12 cubes"],
      },
      challenge: {
        title: "The shrinking gap",
        brief: "Sequence A is 1, 2, 3, 4... Sequence B is 2, 4, 6, 8... At every shown step B is larger.",
        aiClaim: "Because B is always ahead in the first four terms, any sequence beginning this way must stay ahead forever.",
        prompt: "Challenge what finite evidence can prove.",
        answer: "A finite list does not determine all later terms without a rule. A sequence could match these terms and then change, so the pattern needs a definition or proof.",
        criteria: ["Says finitely many terms do not uniquely determine a sequence", "Explains the need for a rule, proof, or counterexample"],
      },
      defend: {
        title: "Publish the league table",
        brief: "Schools would be ranked using one average test score.",
        evidence: ["Averages are easy to compare", "Schools serve pupils with different starting points", "A single average hides the spread of results"],
        prompt: "Defend a fairer reporting method.",
        intervention: "Doesn't extra context just make weak performance easier to excuse?",
        answer: "A strong proposal keeps useful attainment information while adding progress, distribution, or contextual measures and answers the transparency concern.",
        criteria: ["Uses the limitation of a single mean", "Proposes at least one concrete additional measure", "Answers why context improves rather than evades comparison"],
      },
    },
  },
  {
    level: "ks3", subject: "maths", variant: "b", rounds: {
      spot: {
        title: "The reversed equation",
        brief: "If a shape is a square, it has four equal sides. This shape has four equal sides.",
        aiClaim: "Therefore it must be a square.",
        prompt: "Find the logical gap.",
        answer: "The implication was reversed. A rhombus also has four equal sides but need not have right angles, so the given condition is not sufficient.",
        criteria: ["Identifies affirming/reversing the implication or insufficient information", "Provides right angles or a rhombus as the missing condition/counterexample"],
      },
      explain: {
        title: "The meeting hands",
        brief: "At 3:00, a clock's minute hand is at 12 and its hour hand is at 3. Both hands move continuously.",
        prompt: "Explain why they do not next overlap exactly at 3:15.",
        answer: "During 15 minutes the hour hand moves a quarter of the way towards 4, so at 3:15 it is ahead of 3 while the minute hand is at 3. The minute hand catches it later.",
        criteria: ["Recognises that the hour hand moves continuously", "Explains why it has moved beyond 3 by 3:15"],
      },
      challenge: {
        title: "The lucky spinner",
        brief: "A fair spinner lands red five times in a row.",
        aiClaim: "Blue is now more likely because the spinner must balance out soon.",
        prompt: "Rebut the gambler's fallacy.",
        answer: "If spins are independent and the spinner is fair, previous results do not change the probability of the next spin; blue and red remain equally likely.",
        criteria: ["States that independent past results do not affect the next spin", "Concludes the probabilities remain equal, assuming fairness"],
      },
      defend: {
        title: "Change the bus timetable",
        brief: "A bus is late on 8 of 40 morning journeys and 1 of 20 afternoon journeys.",
        evidence: ["Morning lateness is 20%", "Afternoon lateness is 5%", "Adding a morning bus costs the same as adding an afternoon bus"],
        prompt: "Defend where one extra bus should go, and state what the data cannot prove.",
        intervention: "Is 40 journeys enough to redesign a timetable?",
        answer: "The evidence favours mornings, but a sound case acknowledges sample size and possible causes, and proposes monitoring or a trial.",
        criteria: ["Compares the rates rather than raw counts only", "Favours or tests the morning option using evidence", "Addresses sample limitations and uncertainty"],
      },
    },
  },
  {
    level: "ks3", subject: "history", variant: "a", rounds: {
      spot: {
        title: "The victorious memoir",
        brief: "A general's memoir, written 30 years after a battle, says his plan alone secured victory.",
        aiClaim: "He was present, so his account is automatically the most reliable source.",
        prompt: "Identify the source-evaluation mistake.",
        answer: "Presence gives access but not automatic reliability. Time, self-justification, limited viewpoint, and comparison with other evidence all matter.",
        criteria: ["Rejects eyewitness status as automatic reliability", "Identifies memory, motive, perspective, or corroboration as relevant"],
      },
      explain: {
        title: "A revolution or a reform?",
        brief: "A country changes its ruler and constitution, but most local officials and land ownership remain unchanged.",
        prompt: "Explain how historians could reasonably disagree over whether this was a revolution.",
        answer: "They may weigh political rupture against social and economic continuity differently and use different definitions of revolution.",
        criteria: ["Uses both change and continuity", "Explains that definitions or weighting of significance can differ"],
      },
      challenge: {
        title: "The falling graph",
        brief: "Recorded crime falls after a new law, but police recording rules changed at the same time.",
        aiClaim: "The graph proves the law caused the fall.",
        prompt: "Challenge the causal conclusion.",
        answer: "Timing and correlation do not isolate the law's effect; changed recording or other factors could explain the fall, so comparison and more evidence are needed.",
        criteria: ["Distinguishes correlation/timing from proven causation", "Uses changed recording or another confounder and asks for further evidence"],
      },
      defend: {
        title: "Remove the statue?",
        brief: "A town debates a statue of an industrialist who funded schools but profited from severe exploitation.",
        evidence: ["The inscription mentions only philanthropy", "The statue occupies a place of civic honour", "A museum can display it with fuller context"],
        prompt: "Defend a specific decision about the statue.",
        intervention: "Is changing the display the same as erasing history?",
        answer: "Any position can pass if it distinguishes remembering history from honouring a person, uses the evidence, and gives a practical treatment of context.",
        criteria: ["Distinguishes commemoration from historical study", "Uses at least two evidence points", "Answers the erasure objection with a concrete proposal"],
      },
    },
  },
  {
    level: "ks3", subject: "history", variant: "b", rounds: {
      spot: {
        title: "The missing voices",
        brief: "All surviving written records of a tax revolt were produced by government officials.",
        aiClaim: "Because every record condemns the rebels, the whole population must have condemned them too.",
        prompt: "Find the inference error.",
        answer: "The surviving sample represents official viewpoints, not the whole population; rebel or non-literate voices may be missing.",
        criteria: ["Identifies selection/survival bias in the sources", "Says official records cannot establish the entire population's view"],
      },
      explain: {
        title: "Why empires endure",
        brief: "An empire controls distant regions with relatively few officials of its own.",
        prompt: "Explain two ways it could maintain power without direct force everywhere.",
        answer: "It could work through local elites, taxation, law, trade, religion, infrastructure, or negotiated privileges, backed by the possibility of force.",
        criteria: ["Explains at least two distinct mechanisms", "Shows how cooperation, incentives, institutions, or legitimacy can supplement force"],
      },
      challenge: {
        title: "The inevitable war",
        brief: "Tensions, alliances, and arms races exist before a war begins.",
        aiClaim: "Those long-term causes made war inevitable, so individual decisions at the time did not matter.",
        prompt: "Challenge the word 'inevitable'.",
        answer: "Structural pressures made conflict more likely but did not remove choices; leaders' decisions, triggers, and plausible alternatives still affected whether and when war occurred.",
        criteria: ["Distinguishes increased likelihood from inevitability", "Preserves a role for contingency, decisions, triggers, or alternatives"],
      },
      defend: {
        title: "Open the secret files",
        brief: "Fifty-year-old government files concern a past crisis.",
        evidence: ["Opening them could improve historical accountability", "Some living people are named", "Parts reveal methods still used for national security"],
        prompt: "Defend a release policy.",
        intervention: "If anything stays hidden, how can the public trust the account?",
        answer: "A strong policy favours disclosure while justifying narrow, reviewable redactions for current risks or personal privacy.",
        criteria: ["Uses accountability and at least one genuine risk", "Proposes specific, limited treatment such as redaction/review", "Answers the trust objection"],
      },
    },
  },
  {
    level: "ks3", subject: "geography", variant: "a", rounds: {
      spot: {
        title: "The larger footprint",
        brief: "Country A emits less carbon dioxide within its borders than Country B, but imports many carbon-intensive goods made in B.",
        aiClaim: "Country A has the smaller climate impact because only production inside its borders counts.",
        prompt: "Identify what the comparison leaves out.",
        answer: "Territorial emissions omit emissions embodied in imports; consumption-based emissions may assign some of B's production to demand in A.",
        criteria: ["Identifies emissions embodied in imports or consumption", "Explains why territorial totals alone can shift rather than remove responsibility"],
      },
      explain: {
        title: "The urban heat island",
        brief: "On a calm summer night, a city centre stays warmer than nearby countryside.",
        prompt: "Explain two processes that can create this pattern.",
        answer: "Dark built surfaces absorb and release heat, there is less evaporative cooling from vegetation, buildings trap radiation, and human activity adds heat.",
        criteria: ["Explains at least two valid urban heat mechanisms", "Connects built form/land cover to slower night-time cooling"],
      },
      challenge: {
        title: "Build one more lane",
        brief: "A congested road is widened and initially traffic moves faster.",
        aiClaim: "The extra lane permanently solves congestion because capacity has increased.",
        prompt: "Challenge the long-term prediction.",
        answer: "Lower travel cost can attract extra trips, routes, or development—induced demand—so traffic may grow until congestion returns.",
        criteria: ["Explains induced demand or behavioural response", "Distinguishes short-term improvement from uncertain long-term outcome"],
      },
      defend: {
        title: "Managed retreat",
        brief: "A low-lying coastal village faces increasingly frequent flooding.",
        evidence: ["A new sea wall would be expensive and need future upgrades", "Relocation disrupts homes and community ties", "Restored salt marsh can absorb waves and create habitat"],
        prompt: "Defend a long-term coastal plan.",
        intervention: "How can Parliament ask people to leave their homes?",
        answer: "A credible case weighs protection, relocation harms, cost, and adaptation over time and includes fair support for affected residents.",
        criteria: ["Uses evidence about both physical risk and people", "Takes a clear long-term position", "Answers the fairness of relocation or continued risk"],
      },
    },
  },
  {
    level: "ks3", subject: "geography", variant: "b", rounds: {
      spot: {
        title: "The distorted map",
        brief: "On a Mercator world map, Greenland appears almost as large as Africa.",
        aiClaim: "Their areas must be similar because maps preserve the size of countries.",
        prompt: "Find the cartographic mistake.",
        answer: "Flat map projections distort some properties. Mercator greatly enlarges high-latitude areas; Africa is about fourteen times Greenland's area.",
        criteria: ["Identifies projection distortion", "States that Mercator exaggerates high latitudes or that Africa is much larger"],
      },
      explain: {
        title: "Rain behind the mountain",
        brief: "Moist air crosses a mountain. The windward side is wet and the leeward side is dry.",
        prompt: "Explain the full rain-shadow process.",
        answer: "Air is forced up, expands and cools, water condenses and rains. Drier air descends the other side, compresses and warms, reducing relative humidity and rainfall.",
        criteria: ["Explains uplift, cooling, condensation, and rain", "Explains descending leeward air warming and becoming drier"],
      },
      challenge: {
        title: "The safer city",
        brief: "City A reports twice as many flood losses as City B after similar storms, but A has four times the property value in flood zones.",
        aiClaim: "City A must have twice the physical flood hazard.",
        prompt: "Separate hazard from risk and exposure.",
        answer: "Loss depends on hazard plus exposure and vulnerability. Greater property value in harm's way can raise losses without greater flood magnitude or probability.",
        criteria: ["Distinguishes physical hazard from exposure/vulnerability/risk", "Uses the property exposure to explain the loss difference"],
      },
      defend: {
        title: "Cap visitor numbers",
        brief: "A national park considers daily visitor limits.",
        evidence: ["Tourism supports local jobs", "Popular paths are eroding rapidly", "Timed booking spreads visits but disadvantages spontaneous visitors"],
        prompt: "Defend a visitor-management policy.",
        intervention: "Are protected landscapes only for people who plan ahead?",
        answer: "A strong case balances access, livelihoods, and carrying capacity, and answers fairness concerns with a workable design.",
        criteria: ["Uses environmental and social/economic evidence", "Proposes a specific workable policy", "Answers the access-fairness objection"],
      },
    },
  },
  {
    level: "ks3", subject: "computing", variant: "a", rounds: {
      spot: {
        title: "The anonymous data",
        brief: "A dataset removes names but keeps exact birth date, school, postcode, and daily location history.",
        aiClaim: "It is anonymous because the name column has been deleted.",
        prompt: "Identify the privacy flaw.",
        answer: "The remaining attributes can combine to re-identify people by linkage with other information; removing direct names is only pseudonymisation here.",
        criteria: ["Explains re-identification through combined/linkable attributes", "Rejects deletion of names as sufficient anonymity"],
      },
      explain: {
        title: "The binary search",
        brief: "A sorted list contains 1,024 names.",
        prompt: "Explain why repeatedly halving the search needs at most about 10 comparisons, not 512.",
        answer: "Each comparison discards half the remaining list. Since 1,024=2^10, ten halvings reduce the possibilities to one.",
        criteria: ["Explains that each comparison halves the remaining search space", "Connects 1,024 to ten halvings or 2^10"],
      },
      challenge: {
        title: "The accurate classifier",
        brief: "A system detecting a rare fault is 99% accurate on data where 99% of machines have no fault.",
        aiClaim: "Ninety-nine per cent accuracy proves it detects faults brilliantly.",
        prompt: "Challenge the metric.",
        answer: "A system that always predicts 'no fault' is already 99% accurate but detects none. We need the confusion matrix, especially recall and precision for faults.",
        criteria: ["Gives or explains the always-negative baseline", "Requests class-specific measures such as recall, precision, false negatives, or a confusion matrix"],
      },
      defend: {
        title: "Require explainable decisions",
        brief: "A council uses an algorithm to prioritise housing inspections.",
        evidence: ["The model may find patterns humans miss", "Residents can be affected by delayed inspection", "A simpler model is slightly less accurate but easier to audit"],
        prompt: "Defend an accountable deployment policy.",
        intervention: "Why sacrifice any accuracy for explanations?",
        answer: "A strong policy weighs performance against contestability, harm, and auditability and gives humans a defined oversight role.",
        criteria: ["Uses both accuracy and accountability evidence", "Proposes concrete human review/audit/appeal", "Answers the accuracy trade-off"],
      },
    },
  },
  {
    level: "ks3", subject: "computing", variant: "b", rounds: {
      spot: {
        title: "The faster algorithm",
        brief: "Algorithm A takes 1 second for 100 items and 100 seconds for 1,000 items. Algorithm B takes 3 seconds for 100 and 30 seconds for 1,000.",
        aiClaim: "A is always faster because it won the 100-item test.",
        prompt: "Find the performance reasoning error.",
        answer: "One small input does not establish scaling. B is slower initially but scales better and is already faster at 1,000 items.",
        criteria: ["Distinguishes fixed small-input speed from growth/scaling", "Uses the 1,000-item result to reject 'always'"],
      },
      explain: {
        title: "The checksum",
        brief: "A message sends the digits 4, 7, 2 and a final check digit equal to their sum modulo 10.",
        prompt: "Calculate the check digit and explain what one changed digit would reveal.",
        answer: "4+7+2=13, so the check digit is 3. If one data digit changes, the recomputed sum usually no longer matches, revealing an error though not correcting it.",
        criteria: ["Calculates check digit 3", "Explains detection by mismatch and does not claim the checksum always corrects errors"],
      },
      challenge: {
        title: "The unbiased training set",
        brief: "A speech recogniser is tested mostly on voices similar to those in its training data.",
        aiClaim: "High overall test accuracy proves it works equally well for every accent.",
        prompt: "Challenge the generalisation claim.",
        answer: "An unrepresentative aggregate can hide subgroup errors. Performance should be tested separately across relevant accents with adequate samples.",
        criteria: ["Identifies representation or aggregate-metric problem", "Calls for subgroup testing or broader data"],
      },
      defend: {
        title: "Limit persuasive design",
        brief: "A social app uses endless scroll and frequent notifications.",
        evidence: ["Notifications can alert users to wanted messages", "Endless scroll removes stopping cues", "Users can currently change settings, but defaults are hard to find"],
        prompt: "Defend a proportionate design rule.",
        intervention: "Shouldn't users, not Parliament, control their own attention?",
        answer: "A good defence preserves useful choice while addressing manipulative defaults and unequal information through transparent, easy controls or safer defaults.",
        criteria: ["Uses both utility and manipulation evidence", "Proposes a specific proportionate rule", "Answers the individual-choice objection"],
      },
    },
  },
  {
    level: "ks3", subject: "parliament", variant: "a", rounds: {
      spot: {
        title: "The opinion poll",
        brief: "An online poll on one newspaper's website finds 82% support for a bill. Visitors chose whether to answer.",
        aiClaim: "The result proves 82% of the whole country supports the bill because the sample is large.",
        prompt: "Identify the democratic evidence flaw.",
        answer: "A large self-selected sample can still be biased: the visitors and respondents may differ systematically from the population.",
        criteria: ["Identifies self-selection or unrepresentative sampling", "Explains why large size alone does not remove selection bias"],
      },
      explain: {
        title: "Scrutiny before speed",
        brief: "A popular bill responds to an urgent problem but delegates broad powers to ministers to change details later.",
        prompt: "Explain why Parliament might both pass the bill and narrow those powers.",
        answer: "Parliament can act on the urgent aim while limiting, time-bounding, or reviewing delegated powers to preserve accountability and prevent unintended use.",
        criteria: ["Balances urgent action with scrutiny", "Explains a safeguard such as limits, sunset clauses, approval, or review"],
      },
      challenge: {
        title: "The winning mandate",
        brief: "A government wins an election after campaigning on many policies. Surveys show voters supported it for varied reasons.",
        aiClaim: "Victory proves every voter approved every manifesto detail, so further scrutiny is unnecessary.",
        prompt: "Challenge the idea of an unlimited mandate.",
        answer: "Election victory authorises governing but does not show unanimous support for each measure; Parliament still tests detail, evidence, rights, and implementation.",
        criteria: ["Distinguishes electoral authority from unanimous policy consent", "Defends an ongoing role for scrutiny"],
      },
      defend: {
        title: "Citizens' assembly",
        brief: "Parliament considers a randomly selected citizens' assembly on a complex long-term issue.",
        evidence: ["Members would hear evidence and deliberate", "Random selection can reflect varied backgrounds", "Assembly members are not elected and cannot make law"],
        prompt: "Defend what role the assembly should have.",
        intervention: "Why listen to unelected people at all?",
        answer: "A strong case gives the assembly an advisory or agenda-setting role that enriches deliberation while leaving accountable decisions to Parliament.",
        criteria: ["Uses deliberation and representation benefits", "Recognises the limit of unelected authority", "Answers how the assembly complements rather than replaces Parliament"],
      },
    },
  },
  {
    level: "ks3", subject: "parliament", variant: "b", rounds: {
      spot: {
        title: "The balanced debate",
        brief: "A programme invites one climate scientist and one person who rejects basic climate measurements.",
        aiClaim: "Giving each side equal time guarantees the audience receives balanced evidence.",
        prompt: "Find the false-balance mistake.",
        answer: "Equal airtime does not guarantee evidential balance when expert evidence is overwhelmingly unequal; viewpoints should be weighted by their support and relevant expertise.",
        criteria: ["Distinguishes equal time from equal evidential support", "Says evidence/expertise should affect weight without claiming dissent can never be heard"],
      },
      explain: {
        title: "The loyal opposition",
        brief: "Opposition MPs criticise a government policy while accepting the government's lawful authority to govern.",
        prompt: "Explain why organised opposition strengthens rather than contradicts parliamentary democracy.",
        answer: "Opposition offers alternatives, tests evidence, exposes failures, and enables accountability while respecting constitutional rules and peaceful transfer of power.",
        criteria: ["Explains scrutiny/accountability or alternatives", "Distinguishes opposition to policy from rejection of lawful democratic government"],
      },
      challenge: {
        title: "Let the courts decide",
        brief: "A policy is lawful but creates a contested distribution of public money.",
        aiClaim: "Courts understand rules, so judges should decide whether the policy is wise as well as lawful.",
        prompt: "Defend legal oversight while preserving democratic choice.",
        answer: "Courts determine legality and protect rights; elected institutions normally decide contested policy merits and spending priorities, subject to law and accountability.",
        criteria: ["Gives courts a role in legality/rights", "Gives elected bodies a distinct role in policy merits, resources, or accountability"],
      },
      defend: {
        title: "A second chamber",
        brief: "A proposal would make a second chamber fully elected using the same electoral system and terms as the Commons.",
        evidence: ["Election could strengthen legitimacy", "Identical mandates could create deadlock", "Different expertise or longer terms could add distinct scrutiny"],
        prompt: "Defend a design for the second chamber.",
        intervention: "If members are not chosen exactly like MPs, why should they have influence?",
        answer: "A strong design balances legitimacy with a distinct revising role, explains composition and powers, and addresses democratic accountability.",
        criteria: ["Uses both legitimacy and deadlock/distinct-role evidence", "Proposes concrete composition or powers", "Answers the democratic legitimacy objection"],
      },
    },
  },
];

export const questions: Question[] = packs.flatMap((pack) =>
  ROUNDS.map((round) => ({
    ...pack.rounds[round],
    id: `${pack.level}-${pack.subject}-${round}-${pack.variant}`,
    level: pack.level,
    subject: pack.subject,
    round,
  })),
);

export function publicQuestions(): PublicQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    level: question.level,
    subject: question.subject,
    round: question.round,
    title: question.title,
    brief: question.brief,
    prompt: question.prompt,
    ...(question.aiClaim ? { aiClaim: question.aiClaim } : {}),
    ...(question.evidence ? { evidence: question.evidence } : {}),
    ...(question.intervention ? { intervention: question.intervention } : {}),
  }));
}

export function findQuestion(id: string): Question | undefined {
  return questions.find((question) => question.id === id);
}
