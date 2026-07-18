import { showHUD, Clipboard, getPreferenceValues } from "@raycast/api";
import { captureScreenshot } from "./utils/screenshot";
import { extractTextWithGemini } from "./services/api";
import { UNIFIED_EXTRACTOR_PROMPT } from "./services/prompts";

export default async function Command() {
  try {
    const preferences = getPreferenceValues<Preferences.SnapText>();
    const screenshot = await captureScreenshot();

    if (!screenshot) {
      await showHUD("Screenshot cancelled");
      return;
    }

    const text = await extractTextWithGemini(
      screenshot.base64,
      preferences.geminiApiKey,
      screenshot.mimeType,
      UNIFIED_EXTRACTOR_PROMPT,
    );

    if (!text || text.trim() === "") {
      await showHUD("No text found in selection");
      return;
    }

    await Clipboard.copy(text);
    await showHUD("Copied text to clipboard!");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract text";
    await showHUD(`Error: ${message}`);
  }
}
