import conventionalChangelog from 'conventional-changelog';
import fs from 'fs';

conventionalChangelog({
  preset: 'angular',
  releaseCount: 1,
  append: true,
}).pipe(fs.createWriteStream(`CHANGELOG.md`));
