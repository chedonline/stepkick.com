// Publish the (out-of-Dropbox) build directory to the gh-pages branch.
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { publish } from 'gh-pages';

const dir = join(tmpdir(), 'stepkick-build');
publish(dir, { dotfiles: true }, (err) => {
  if (err) {
    console.error('publish failed:', err);
    process.exit(1);
  }
  console.log('Published', dir);
});
