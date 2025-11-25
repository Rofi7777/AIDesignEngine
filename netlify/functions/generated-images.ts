import type { Handler } from "@netlify/functions";

// Netlify 上缺少 DB 支援時，先回傳空陣列避免 500；如未來接上 DB，可改為讀 storage
export const handler: Handler = async () => {
  try {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch generated images", message: err.message }),
    };
  }
};
