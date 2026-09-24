import { prisma, seedQaScenarios } from "./qa-scenarios";

seedQaScenarios()
  .then((count) => console.log(`Loaded ${count} QA15 scenarios. See QA_SCENARIOS.md; run npm run qa:scenarios:clean when finished.`))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
