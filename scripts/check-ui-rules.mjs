import { execSync } from "child_process";

console.log("Checking UI accessibility rules...");
let failed = false;

function check(pattern, description) {
  try {
    const output = execSync(`git grep -E "${pattern}" -- "app/*.tsx" "components/*.tsx"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    if (output.trim()) {
      console.error(`❌ Found violations for: ${description}`);
      console.error(output.trim().split("\n").slice(0, 5).join("\n"));
      failed = true;
    }
  } catch {
    // Exit code 1 from git grep means 0 matches, which is what we want!
  }
}

check("text-\\[1[01]px\\]", "Text size <= 11px (use text-xs >= 12px)");
check("text-neutral-500", "Low contrast text-neutral-500 (use text-neutral-600)");

if (failed) {
  console.error("\nUI rule check failed.");
  process.exit(1);
} else {
  console.log("✅ All UI accessibility rules passed!");
}
