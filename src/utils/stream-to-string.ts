import { Stream } from 'node:stream';

export function streamToString(stream: Stream) {
  return new Promise<string>((resolve, reject) => {
    const chunks = new Array<any>();
    stream.on('data', (chunk: string) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}
