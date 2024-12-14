import Imap from 'imap';

const labelStart = 'post-email:';

export function labelToPostUrls(attributes: Imap.ImapMessageAttributes) {
  const gmLabelsArray = attributes['x-gm-labels'] as string[] | string | undefined;

  if (!Array.isArray(gmLabelsArray)) {
    return [];
  }

  return gmLabelsArray
    .filter((label) => label?.startsWith(labelStart))
    .map((label) => label.substring(labelStart.length));
}
