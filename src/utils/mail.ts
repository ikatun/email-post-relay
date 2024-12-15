import EventEmitter from 'node:events';
import { Stream } from 'node:stream';

import Imap from 'imap';
import { ParsedMail as ParsedEmailBody, simpleParser } from 'mailparser';
import TypedEmitter from 'typed-emitter';

import { streamToString } from './stream-to-string';

export function minutesAgo(min: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - min);

  return date;
}

export function connect(config: Imap.Config) {
  const imap = new Imap(config);

  imap.connect();

  return new Promise<Imap>((resolve, reject) => {
    imap.once('ready', () => resolve(imap));
    imap.once('error', reject);
  });
}

type MailListener = TypedEmitter<{
  mail(count: number): void;
}>;

export function openInbox(imap: Imap, { mailboxName, openReadOnly }) {
  return new Promise<{ box: Imap.Box; mailEmitter: MailListener }>((resolve, reject) => {
    imap.openBox(mailboxName, openReadOnly, (error, box) => {
      if (error) {
        reject(error);
        return;
      }
      const mailEmitter = new EventEmitter() as MailListener;

      imap.on('mail', (count) => {
        mailEmitter.emit('mail', count);
      });

      resolve({ box, mailEmitter });
    });
  });
}

export function search(imap: Imap, search: any[]) {
  return new Promise<number[]>((resolve, reject) => {
    imap.search(search, (error, seqIds) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(seqIds);
    });
  });
}

export interface ParsedEmail {
  bodies: string[];
  attributes: Imap.ImapMessageAttributes;
}

function readMessageStream(message: Imap.ImapMessage) {
  return new Promise<ParsedEmail>((resolve, reject) => {
    const bodiesPromises = new Array<Promise<string>>();
    let attributes: Imap.ImapMessageAttributes;

    message.on('body', (bodyStream: Stream) => bodiesPromises.push(streamToString(bodyStream)));
    message.on('attributes', (attr) => (attributes = attr));
    message.on('end', async () => resolve({ bodies: await Promise.all(bodiesPromises), attributes }));
    message.on('error', reject);
  });
}

export function fetch(imap: Imap, sequenceIds: number[], options: Imap.FetchOptions) {
  const fetched = imap.fetch(sequenceIds, options);

  const messagesPromises = new Array<Promise<ParsedEmail>>();

  return new Promise<ParsedEmail[]>((resolve, reject) => {
    fetched.on('message', (imapMessage) => {
      const msg = readMessageStream(imapMessage);
      messagesPromises.push(msg);
    });
    fetched.once('error', reject);
    fetched.once('end', () => resolve(Promise.all(messagesPromises)));
  });
}
