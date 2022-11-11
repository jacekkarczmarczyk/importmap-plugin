import conventionalChangelog from 'conventional-changelog';
import fs from 'fs';

conventionalChangelog({
  preset: 'angular',
  releaseCount: 0,
}).pipe(fs.createWriteStream(`CHANGELOG.md`));
