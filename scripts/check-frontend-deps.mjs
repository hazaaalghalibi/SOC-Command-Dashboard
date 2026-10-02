import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const marker = join(root, "node_modules", "react-router-dom", "package.json");

if (!existsSync(marker)) {
  console.error(
    'Missing dependency "react-router-dom". From the project root run:\n  npm install\n\n' +
      "Or start the app with Start-Dashboard.ps1 / START DASHBOARD.bat (they run npm install for you)."
  );
  process.exit(1);
}
