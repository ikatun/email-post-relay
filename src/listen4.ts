import 'dotenv/config';

import { assertValue } from './utils/assertValue';
import { connect, fetch, minutesAgo, openInbox, search } from './utils/mail';

const imap = await connect({
  user: assertValue(process.env.IMAPI_USER, 'IMAPI_USER'),
  password: assertValue(process.env.IMAPI_PASSWORD, 'IMAPI_PASSWORD'),
  host: assertValue(process.env.IMAPI_HOST, 'IMAPI_HOST'),
  port: parseInt(assertValue(process.env.IMAPI_PORT, 'IMAPI_PORT')),
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

console.log('connected');
const { mailEmitter } = await openInbox(imap, { mailboxName: 'INBOX', openReadOnly: true });

console.log('inbox opened');
mailEmitter.on('mail', async () => {
  console.log('got new email!');
  const seqIds = await search(imap, ['UNSEEN', ['SINCE', minutesAgo(10)]]);
  console.log('unread: ', seqIds);
  const messages = await fetch(imap, seqIds, {
    bodies: '',
    struct: true,
  });

  console.log('messages', JSON.stringify(messages, null, 2));
});
