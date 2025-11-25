import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<html><body><h1>🧪 API Test Page</h1><p>This is a Netlify function test page.</p></body></html>`,
  };
};
