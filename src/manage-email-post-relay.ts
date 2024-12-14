import retry from 'async-retry';

import { relayEmailsToPostEndpoint } from './relay-emails-to-post-endpoint';
export async function manageEmailPostRelay() {
  await retry(relayEmailsToPostEndpoint, {
    retries: 5,
  });
}
