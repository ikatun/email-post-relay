import { Stream } from 'stream';

/**
 * Converts a readable stream to a string.
 * @param stream - A readable stream to be converted to a string.
 * @returns A promise that resolves to the string content of the stream.
 */
export async function streamToString(stream: Stream): Promise<string> {
  return new Promise((resolve, reject) => {
    let result = '';

    stream.on('data', (chunk) => {
      result += chunk.toString();
    });

    stream.on('end', () => {
      resolve(result);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}
