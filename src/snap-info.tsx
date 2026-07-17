import { Detail, showToast, Toast, getPreferenceValues, ActionPanel, Action, Clipboard } from "@raycast/api";
import { useState, useEffect } from "react";
import { captureScreenshot } from "./utils/screenshot";
import { extractTextWithGemini } from "./services/api";
import { UNIFIED_EXTRACTOR_PROMPT } from "./services/prompts";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preferences = getPreferenceValues<Preferences.SnapInfo>();

  async function run() {
    setIsLoading(true);
    setError(null);
    setMarkdown("");

    try {
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: "Waiting for screenshot...",
        message: "Select an area on the screen",
      });

      const screenshot = await captureScreenshot();
      if (!screenshot) {
        toast.style = Toast.Style.Failure;
        toast.title = "Screenshot cancelled";
        toast.message = "Please try again";
        setError("Screenshot cancelled");
        setIsLoading(false);
        return;
      }

      toast.style = Toast.Style.Animated;
      toast.title = "Extracting text...";
      toast.message = "Running Gemini Flash...";

      const text = await extractTextWithGemini(
        screenshot.base64,
        preferences.geminiApiKey,
        screenshot.mimeType,
        UNIFIED_EXTRACTOR_PROMPT
      );

      setMarkdown(text);
      await Clipboard.copy(text);
      
      toast.style = Toast.Style.Success;
      toast.title = "Text Extracted!";
      toast.message = "Copied to clipboard";
    } catch (err: any) {
      setError(err?.message || "An unknown error occurred");
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to extract text",
        message: err?.message || "",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    run();
  }, []);

  return (
    <Detail
      isLoading={isLoading}
      markdown={
        error
          ? `### Error\n${error}`
          : markdown || "*Capturing screenshot and running Gemini...*"
      }
      actions={
        <ActionPanel>
          {!isLoading && (
            <>
              {markdown && (
                <Action.CopyToClipboard
                  title="Copy Extracted Text"
                  content={markdown}
                />
              )}
              <Action title="Retry / Take New Screenshot" onAction={run} shortcut={{ modifiers: ["cmd"], key: "r" }} />
            </>
          )}
        </ActionPanel>
      }
    />
  );
}
