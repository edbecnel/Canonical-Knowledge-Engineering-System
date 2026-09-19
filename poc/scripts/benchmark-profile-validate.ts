import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeProfileContentHash, validateBenchmarkRunProfile } from '@ckes/benchmark';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pocRoot = join(__dirname, '..');
const profilesDir = join(pocRoot, 'experiments/run-profiles');

function main(): void {
  const arg = process.argv[2];
  const files = arg
    ? [arg.endsWith('.json') ? arg : `${arg}.json`]
    : readdirSync(profilesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const path = join(profilesDir, file);
    const profile = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    validateBenchmarkRunProfile(profile);
    const hash = computeProfileContentHash(profile);
    console.log(`OK profile ${profile.profileId}: hash=${hash}`);
    if (!profile.trialPolicy && !profile.dryRun) {
      console.warn(`WARN ${profile.profileId}: missing trialPolicy`);
    }
  }
}

main();
