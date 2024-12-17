import express from 'express';

import { relayEmailsToPostEndpoint } from './relay-emails-to-post-endpoint';

const app = express();
const port = process.env.PORT ?? '3000';

app.get('/', (req, res) => {
  res.send("I'm listening for emails :)");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

relayEmailsToPostEndpoint().catch(console.error);
