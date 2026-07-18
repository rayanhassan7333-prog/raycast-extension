export async function extractTextWithGemini(
  base64Image: string,
  apiKey: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    let detailed = text;
    try {
      const json = JSON.parse(text);
      detailed = json?.error?.message || json?.error?.status || text;
    } catch {
      // fall back to raw text
    }
    throw new Error(`Gemini API error (status ${response.status}): ${detailed}`);
  }

  type GeminiCandidate = { content?: { parts?: { text?: string }[] } };
  const data = JSON.parse(text) as { candidates?: GeminiCandidate[] };
  const extracted = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return extracted || "";
}
