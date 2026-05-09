export const STORAGE_KEY = "edtrak-v1";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const defaultTodayTasks = [
  {
    id: "english",
    title: "English",
    category: "English",
    activity: "Phonics, reading or short writing task",
    note:
      "Short explicit literacy block completed using visual support, oral response options or reduced written load where needed.",
  },
  {
    id: "maths",
    title: "Maths",
    category: "Mathematics",
    activity: "Number, strategy or hands-on maths task",
    note:
      "Short maths block completed using hands-on materials, visual models or real-life examples.",
  },
  {
    id: "movement",
    title: "Movement break",
    category: "HPE",
    activity: "Movement, regulation or outdoor reset",
    note: "Movement break used to support attention, regulation and readiness for learning.",
  },
  {
    id: "reading",
    title: "Reading / audiobook",
    category: "English",
    activity: "Read, listen or orally retell",
    note:
      "Reading, listening or oral retell completed to support fluency, comprehension and vocabulary.",
  },
  {
    id: "outdoor",
    title: "Outdoor or project learning",
    category: "Project",
    activity: "Nature, practical learning or project work",
    note:
      "Practical or outdoor learning used to build engagement, observation, language and real-world understanding.",
  },
  {
    id: "regulation",
    title: "Regulation / wellbeing",
    category: "Wellbeing",
    activity: "Calm routine, choice, break or emotional check-in",
    note:
      "Regulation strategy practised or supported, including breaks, calm routine, choice or emotional check-in.",
  },
  {
    id: "evidence",
    title: "Optional evidence note",
    category: "Evidence",
    activity: "Photo, work sample, observation or oral response",
    note: "Work sample, photo, observation or oral response recorded where useful.",
  },
];

const roughDayTasks = [
  "Read together or listen to an audiobook",
  "Play a maths game",
  "Outdoor walk / movement",
  "Oral retell or conversation",
  "Life-skill task",
  "One photo or short note as evidence",
].map((title, index) => ({
  id: `rough-${index}`,
  title,
  category: "Reduced-load day",
  activity: "Gentle learning activity",
  note:
    "Reduced-load day used to support regulation while still maintaining connection, routine and learning.",
}));

export const defaultTodayTemplates = {
  full: defaultTodayTasks,
  gentle: roughDayTasks,
};

export const defaultWeeklyPlan = {
  Monday: ["English", "Maths", "Science / nature study", "Movement / regulation"],
  Tuesday: ["English", "Maths", "HASS / local community", "Reading / audiobook"],
  Wednesday: ["English", "Maths", "Outdoor learning / creek / Town Common", "Arts or practical project"],
  Thursday: ["English", "Maths", "Technologies / design task", "HPE / movement"],
  Friday: ["Tutor session", "Music lesson", "Review evidence", "Light literacy or maths revision"],
};

export const timetableRows = ["Block 1", "Block 2", "Block 3", "Block 4"];

export const defaultBlockData = {
  A: {
    English: ["Personal narratives, phonics review, high-frequency words, oral retell, handwriting.", "Decodable reading, oral retell, magnetic letters, short recounts, handwriting practice."],
    Mathematics: ["Counting and place value to 1000, addition and subtraction, skip counting, time.", "MAB blocks, number charts, movement skip counting, simple sums, analogue clocks."],
    Science: ["Living and non-living things, life cycles, nature study.", "Nature journal, sorting living/non-living things, plant and animal observations."],
    HASS: ["My history and family timeline, past and present, local community.", "Family timeline, photos, community places and people."],
    Arts: ["Self-portraits, drama retell, rhythm and action songs.", "Drawing, role-play, music, movement and simple performance."],
    Technologies: ["Digital safety and simple digital storytelling.", "Safe device use, photo sequencing, simple digital story."],
    HPE: ["Identity and strengths, emotions and regulation, fundamental movement skills.", "Emotion cards, calming strategies, running, jumping, throwing, balancing."],
    Japanese: ["Greetings, numbers, colours, songs and games.", "Flashcards, songs, counting objects, colour games."],
  },
  B: {
    English: ["Informative texts, comprehension strategies, sentence structure.", "Short information texts, who/what/where questions, fact sorting, simple information sentences."],
    Mathematics: ["Multiplication as equal groups, division as sharing, data and graphs.", "Grouping objects, sharing items, simple surveys, picture graphs."],
    Science: ["Heat sources, heat transfer, predicting and recording.", "Warm/cool tests, sun and shade comparisons, picture records."],
    HASS: ["Mapping familiar places, local places and features, community helpers.", "Draw maps, use symbols, discuss local helpers and places."],
    Arts: ["Science illustration, music patterns, simple media making.", "Observation drawing, rhythm patterns, photo story."],
    Technologies: ["Design challenge — keep things warm or cool.", "Plan, build, test and improve a simple container or shelter."],
    HPE: ["Healthy food and routines, cooperative games.", "Food sorting, snack preparation, hygiene routines, turn-taking games."],
    Japanese: ["Family and animal words, simple spoken phrases.", "Picture matching, role-play, phrase games."],
  },
  C: {
    English: ["Vocabulary development, persuasive speaking and writing, comparing texts.", "Compare two texts, sort describing words, give reasons, create persuasive posters."],
    Mathematics: ["Money, fractions 1/2, 1/4 and 1/8, 2D and 3D shapes, measurement.", "Count coins, shopping play, fold/share food, shape hunts, measure objects."],
    Science: ["Materials and their properties, sorting and comparing.", "Sort natural and human-made materials, test waterproofing, compare texture and strength."],
    HASS: ["Natural and human features, maps and symbols, caring for places.", "Sort features, map visited places, garden or rubbish collection."],
    Arts: ["Landscape art, cultural music and movement, nature craft.", "Draw local landscapes, respond to music, create with natural materials."],
    Technologies: ["Food production, simple recipes, garden or sustainability project.", "Plant herbs/vegetables, prepare simple food, photograph steps."],
    HPE: ["Safety at home and outdoors, outdoor physical activity.", "Safety signs, water/outdoor safety, walks, obstacle courses."],
    Japanese: ["Food and nature words, stories, songs and culture.", "Themed vocabulary, songs, stories, simple cultural craft."],
  },
  D: {
    English: ["Creative stories, editing with support, presentation and speaking.", "Plan short stories, add sentence detail, edit with prompts, share aloud."],
    Mathematics: ["Revision, consolidation, problem solving, real-life maths projects.", "Maths games, family tasks, measurement, counting and practical problem solving."],
    Science: ["Mini inquiry project, asking questions, recording and sharing findings.", "Choose a question, investigate, record with drawings or words, present findings."],
    HASS: ["Community participation, rules and responsibilities, sustainability.", "Rules posters, fair choices, family/community activities, sustainability project."],
    Arts: ["Multimedia project, performance, responding to artworks.", "Slideshow, simple performance, talk about favourite artworks."],
    Technologies: ["Design and build project, digital presentation, reflect and improve.", "Build a model/product, present with pictures, explain improvements."],
    HPE: ["Athletics skills, goal setting, health reflection.", "Running, jumping, throwing, goal chart, reflection."],
    Japanese: ["Review and performance, simple conversation practice.", "Review games, question-and-answer exchanges, song or greeting routine."],
  },
};

export const defaultProfile = {
  name: "Fox Lynch",
  yearLevel: "Year 2",
  age: "7",
  needs: "Autism Level 2, ADHD, suspected dyslexia",
  strengths:
    "Fox responds well to flexibility, choice, visual support, hands-on learning, outdoor learning, interest-based tasks and mini whiteboard work.",
  adjustments:
    "Use explicit instruction, predictable routines, multisensory teaching, movement breaks, reduced written load, oral response options, assistive technology and scaffolded tasks.",
  regulation:
    "Use short learning blocks, calm routines, movement breaks, outdoor time, visual schedules and choice where possible.",
  literacy:
    "Structured literacy, explicit systematic phonics, decoding accuracy, reading fluency, comprehension, spelling patterns and handwriting.",
  maths:
    "Number sense to 1000, addition and subtraction strategies, skip counting, time, equal groups, sharing, data, money, fractions, shapes and measurement.",
  social:
    "Music lessons, home education community, outdoor excursions, community visits, sport or group activities where suitable.",
};

export const defaultProgress = {
  worked: "Short, structured tasks with choice, movement breaks and visual support helped Fox engage.",
  hard: "Some tasks required extra support, reduced written load or a change of approach.",
  enjoyed: "Interest-based, practical, outdoor or hands-on learning increased engagement.",
  improved: "Progress was observed in confidence, participation, independence or skill use.",
  repeat: "Key literacy, numeracy or regulation skills will be repeated next week for consolidation.",
  tutor: "Tutor session supported English and/or maths progress and provided guidance for next steps.",
  focus: "Continue short explicit literacy and maths blocks, with practical learning and regulation support.",
};

export const defaultProgressOptions = {
  worked: [
    defaultProgress.worked,
    "Outdoor, practical or interest-based learning created the strongest engagement this week.",
    "Short literacy and maths blocks worked best when paired with movement breaks and clear choices.",
    "Visual supports, modelling and hands-on materials helped Fox stay with tasks more confidently.",
    "Routine and predictability helped Fox settle into learning more quickly this week.",
    "Custom response",
  ],
  hard: [
    defaultProgress.hard,
    "Sustained attention was difficult at times and tasks needed to be shortened or broken into smaller steps.",
    "Written work was hard this week, so oral responses, mini whiteboard work or reduced writing were used.",
    "Transitions between activities required extra support, warning and flexibility.",
    "Regulation needs affected learning, so the plan was adjusted to protect connection and routine.",
    "Custom response",
  ],
  enjoyed: [
    defaultProgress.enjoyed,
    "Fox enjoyed outdoor learning, nature observation, movement and practical tasks.",
    "Fox enjoyed hands-on maths, games, building, sorting or real-life learning tasks.",
    "Fox enjoyed reading together, listening, oral retell or talking about ideas instead of writing everything.",
    "Fox enjoyed creative tasks such as drawing, music, storytelling, making or digital work.",
    "Custom response",
  ],
  improved: [
    defaultProgress.improved,
    "Fox showed growth in willingness to begin tasks with less resistance.",
    "Fox showed improvement in confidence, oral responses, vocabulary or explaining ideas.",
    "Fox showed progress in decoding, reading fluency, spelling patterns or sentence construction.",
    "Fox showed progress in number sense, counting, calculation, grouping or practical maths language.",
    "Custom response",
  ],
  repeat: [
    defaultProgress.repeat,
    "Structured literacy skills need more repetition next week, especially phonics, decoding and fluency.",
    "Maths skills need more repetition next week, especially number sense, facts and practical problem solving.",
    "Regulation, transitions and independence routines need to be practised again next week.",
    "The same topic should continue next week because Fox is engaging but not yet secure.",
    "Custom response",
  ],
  tutor: [
    defaultProgress.tutor,
    "Tutor session focused mainly on English and gave guidance for phonics, reading or writing next steps.",
    "Tutor session focused mainly on maths and gave guidance for number, strategies or confidence building.",
    "Tutor feedback confirmed current supports are appropriate and skills should continue to be practised.",
    "No tutor note recorded this week.",
    "Custom response",
  ],
  focus: [
    defaultProgress.focus,
    "Next week will focus on short literacy blocks, decoding practice, oral language and reading confidence.",
    "Next week will focus on number sense, addition/subtraction strategies and hands-on maths tasks.",
    "Next week will use more outdoor, movement-based and practical learning to support engagement.",
    "Next week will prioritise regulation, routine, confidence and positive learning experiences.",
    "Custom response",
  ],
};

export const defaultYearGoals = {
  literacy: "Strengthen structured literacy, phonics, decoding, fluency and comprehension.",
  numeracy: "Build number sense, confidence with strategies and practical problem solving.",
  regulation: "Support attention, emotional regulation, flexible thinking and independence.",
  social: "Maintain positive social opportunities through community, music, sport or group activities.",
};

export const statuses = ["Not started", "Started", "Practising", "Secure enough for now"];
export const howOptions = ["Smooth", "Needed support", "Too much today", "Great engagement"];

function getInitialState() {
  return {
    todayRecords: {},
    evidence: [],
    weeklyReflections: [],
    blockStatus: {},
    blockNotes: {},
    profile: defaultProfile,
    weeklyPlan: defaultWeeklyPlan,
    todayTemplates: defaultTodayTemplates,
    blockData: defaultBlockData,
    yearGoals: defaultYearGoals,
    planYear: new Date().getFullYear().toString(),
    archives: [],
    progressOptions: defaultProgressOptions,
  };
}

export function loadState() {
  const fallback = getInitialState();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return fallback;

    const parsed = JSON.parse(saved) || {};
    const savedTemplates = parsed.todayTemplates || {};
    const savedProgressOptions = parsed.progressOptions || {};

    return {
      ...fallback,
      ...parsed,
      todayRecords: parsed.todayRecords || {},
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      weeklyReflections: Array.isArray(parsed.weeklyReflections) ? parsed.weeklyReflections : [],
      blockStatus: parsed.blockStatus || {},
      blockNotes: parsed.blockNotes || {},
      profile: { ...defaultProfile, ...(parsed.profile || {}) },
      weeklyPlan: { ...defaultWeeklyPlan, ...(parsed.weeklyPlan || {}) },
      todayTemplates: {
        full: Array.isArray(savedTemplates.full) ? savedTemplates.full : defaultTodayTemplates.full,
        gentle: Array.isArray(savedTemplates.gentle) ? savedTemplates.gentle : defaultTodayTemplates.gentle,
      },
      blockData: parsed.blockData || defaultBlockData,
      yearGoals: { ...defaultYearGoals, ...(parsed.yearGoals || {}) },
      planYear: parsed.planYear || new Date().getFullYear().toString(),
      archives: Array.isArray(parsed.archives) ? parsed.archives : [],
      progressOptions: { ...defaultProgressOptions, ...savedProgressOptions },
    };
  } catch {
    return fallback;
  }
}
