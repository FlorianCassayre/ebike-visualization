import fs from 'fs';
import { favicons } from 'favicons';

const source = 'public/icon.svg', output = 'public/';

const configuration = {
  path: '/',
  appName: 'Florian Cassayre\'s bike',
  appShortName: 'Florian Cassayre\'s bike',
  appDescription: 'Bike trips visualization',
  developerName: 'Florian Cassayre',
  developerURL: 'https://florian.cassayre.me',
  dir: 'auto',
  lang: 'fr-FR',
  background: '#fff',
  theme_color: '#fff',
  appleStatusBarStyle: 'black-translucent',
  display: 'standalone',
  orientation: 'any',
  scope: '/',
  start_url: '/',
  preferRelatedApplications: false,
  relatedApplications: undefined,
  version: '1.0',
  logging: false,
  pixel_art: false,
  loadManifestWithCredentials: false,
  manifestMaskable: false,
  icons: {
    // https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
    android: [
      'android-chrome-192x192.png',
      'android-chrome-512x512.png',
    ],
    appleIcon: ['apple-touch-icon.png'],
    appleStartup: false,
    favicons: ['favicon.ico'],
    windows: false,
    yandex: false,
  },
};

favicons(source, configuration).then((response) => {
  [response.images, response.files].forEach(files => files.forEach(({ name, contents }) => {
    fs.writeFileSync(output + name, contents);
  }));
  console.log(response.html.join('\n'));
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
