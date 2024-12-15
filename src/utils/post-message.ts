import axios from 'axios';

const authHeaders = JSON.parse(process.env.POST_HEADERS ?? '{}');

function printAxiosError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.error(`Error: ${error.response.status} - ${error.response.statusText}`);
    console.error('Response Data:', error.response.data);
  } else {
    // Something else triggered the error
    console.error('Error:', error.message);
  }
  // Optionally, log the full error for debugging
  // console.error(error);
}

export async function postMessage(url: string, message: string) {
  try {
    const headers = {
      ...authHeaders,
      'Content-Type': 'text/plain',
    };
    const config = { headers };
    await axios.post(url, message, config);
    console.log('POST to url OK', url);
  } catch (e) {
    console.log('POST to url ERROR', url);
    printAxiosError(e);
  }
}
