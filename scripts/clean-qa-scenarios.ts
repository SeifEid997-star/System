import { clearQaScenarios, prisma } from "./qa-scenarios";

clearQaScenarios()
  .then((result) => console.log(`Removed only QA15 scenario data: ${result.owners} owners and ${result.animals} animals, plus their related scenario records.`))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
