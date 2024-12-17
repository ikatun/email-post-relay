import 'dotenv/config';

import retry from 'async-retry';

import { assertValue } from './utils/assert-value';
import { labelToPostUrls } from './utils/label-to-post-urls';
import { connect, fetch, markAsRead, minutesAgo, openInbox, search } from './utils/mail';
import { postMessage } from './utils/post-message';

export async function relayUserEmailsToPostEndpoint({
  host,
  port,
  user,
  password,
}: {
  host: string;
  port: number;
  user: string;
  password: string;
}) {
  console.log('listening for', host, port, user, password);

  const imap = await connect({
    user: user,
    password: password,
    host: host,
    port: port,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  console.log('connected to IMAP server');
  const { mailEmitter } = await openInbox(imap, { mailboxName: 'INBOX', openReadOnly: false });

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

    try {
      console.log('marking as read', seqIds);
      await markAsRead(imap, seqIds);
    } catch (e) {
      console.log('marking as read error', e);
    }

    for (const message of messages) {
      const urls = labelToPostUrls(message.attributes);
      for (const url of urls) {
        await postMessage(url, message.bodies.join('\n\n'));
      }
    }
  });

  return new Promise((resolve, reject) => {
    imap.on('error', reject);
    imap.on('close', reject);
    imap.on('end', resolve);
  });
}

export async function relayEmailsToPostEndpoint() {
  const authsString = assertValue(process.env.IMAP_AUTHS, 'IMAP_AUTHS');
  const auths = authsString.split('|').map((auth) => {
    const [host, port, user, password] = auth.split(':');
    return { host, user, password, port: parseInt(port) };
  });
  for (const auth of auths) {
    retry(() => relayUserEmailsToPostEndpoint(auth), {
      retries: 5,
    }).catch(console.error);
  }
}
