import { exec } from "child_process";
import { promisify } from "util";
import { readFileSync, existsSync, unlinkSync } from "fs";

const execP = promisify(exec);

export async function captureScreenshot(): Promise<{ base64: string; mimeType: string } | null> {
  const tmpPath = `/tmp/raycast_snaptext_${Date.now()}.png`;

  try {
    // Wait for the user to take a screenshot.
    await execP(`/usr/sbin/screencapture -i "${tmpPath}"`);
  } catch {
    // The user likely cancelled the screenshot
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
    return null;
  }

  if (!existsSync(tmpPath)) {
    return null;
  }

  try {
    const buffer = readFileSync(tmpPath);
    const base64 = buffer.toString("base64");
    const mimeType = "image/png";

    // Clean up temporary image
    unlinkSync(tmpPath);

    return { base64, mimeType };
  } catch (error) {
    console.error("Error reading/cleaning up screenshot:", error);
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
    return null;
  }
}
