import 'dotenv/config';

import { assertValue } from './utils/assert-value';
import { labelToPostUrls } from './utils/label-to-post-urls';
import { connect, fetch, minutesAgo, openInbox, search } from './utils/mail';
import { postMessage } from './utils/post-message';

export async function relayEmailsToPostEndpoint() {
  const imap = await connect({
    user: assertValue(process.env.IMAPI_USER, 'IMAPI_USER'),
    password: assertValue(process.env.IMAPI_PASSWORD, 'IMAPI_PASSWORD'),
    host: assertValue(process.env.IMAPI_HOST, 'IMAPI_HOST'),
    port: parseInt(assertValue(process.env.IMAPI_PORT, 'IMAPI_PORT')),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  console.log('connected to IMAP server');
  const { mailEmitter } = await openInbox(imap, { mailboxName: 'INBOX', openReadOnly: true });

  console.log('inbox opened, waiting for new emails...');
  mailEmitter.on('mail', async () => {
    const searchCriteria = ['UNSEEN', ['SINCE', minutesAgo(10)], ['X-GM-LABELS', 'post-email']];

    const seqIds = await search(imap, searchCriteria);
    console.log('unread: ', seqIds);
    if (!seqIds.length) {
      return;
    }
    const messages = await fetch(imap, seqIds, {
      bodies: '',
      struct: true,
    });
    for (const message of messages) {
      const urls = labelToPostUrls(message.attributes);
      for (const url of urls) {
        await postMessage(url, message);
      }
    }
  });

  return new Promise((resolve, reject) => {
    imap.on('error', reject);
    imap.on('close', reject);
    imap.on('end', resolve);
  });
}
