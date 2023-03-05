import fs from 'fs';
import {
  EBikeConnectAuth,
  getActivityRide,
  getActivityTripHeaders,
  postAuth,
  ResponseActivityRide,
  ResponseActivityTripHeaders,
} from 'ebike-connect-js';

const DIRECTORY_OUTPUT = 'data';

const LOCALE = 'fr-FR';
const TIMEZONE = 'Europe/Paris';

const EXISTING_FILES_THRESHOLD = 3;

const credentials = {
  username: process.env.EBIKE_CONNECT_USERNAME ?? '',
  password: process.env.EBIKE_CONNECT_PASSWORD ?? '',
};

type CommonActivityRide = Omit<ResponseActivityTripHeaders[0]['ride_headers'][0], 'header_rides_ids'>;

const timestampToISO = (timestamp: string) => {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE }).split('/').reverse().join('') + date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE }).split(':').join('');
};

const getFilenameForRide = (ride: CommonActivityRide) => `${timestampToISO(ride.start_time)}-${ride.id}.json`;

const saveRide = (ride: ResponseActivityRide): boolean => {
  if (!fs.existsSync(DIRECTORY_OUTPUT)) {
    console.log(`Creating directory ${DIRECTORY_OUTPUT}`)
    fs.mkdirSync(DIRECTORY_OUTPUT);
  }
  const filename = getFilenameForRide(ride);
  const filePath = DIRECTORY_OUTPUT + '/' + filename;
  const contentToSave = JSON.stringify(ride);
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    if (contentToSave === existingContent) {
      console.log(`File ${filename} already exists and has the same content, ignoring`);
      return false;
    } else {
      console.log(`!!! File ${filename} exists but content differs, updating (${existingContent.length} -> ${contentToSave.length})`);
    }
  } else {
    console.log(`Saving new file ${filename}`);
  }
  fs.writeFileSync(filePath, contentToSave);
  return true;
};

const processData = async () => {
  const auth: EBikeConnectAuth = await postAuth(credentials);

  const max = 20;
  let offset = new Date().getTime();
  let lastFetched;
  let totalNoop = 0;
  loop:
  do {
    lastFetched = 0;
    const tripHeaders = await getActivityTripHeaders(auth)({ max, offset });
    for (const tripHeader of tripHeaders) {
      for (const rideHeader of tripHeader.ride_headers) {
        const ride = await getActivityRide(auth)({ id: rideHeader.id });
        const hasWritten = saveRide(ride);
        if (!hasWritten) {
          totalNoop++;
          if (totalNoop >= EXISTING_FILES_THRESHOLD) {
            console.log(`Reached a threshold of ${EXISTING_FILES_THRESHOLD} duplicate files, exiting`);
            break loop;
          }
        }
        offset = Math.min(parseInt(ride.start_time), offset);
        lastFetched++;
      }
    }
  } while (lastFetched > 0);
};

void processData();
