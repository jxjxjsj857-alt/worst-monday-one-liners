// Worst Monday One-Liners — make.fun bounty
// u-nimble-quasar-90-6762-worst-monday-one-liners-37690e28
//
// The task: submit a single funny line, at most 140 characters,
// about an AI agent's worst Monday. A judge model compares the
// lines two at a time and picks the funnier one, weighing first
// whether the line is really about an AI agent's worst Monday,
// then whether the punchline lands, surprise, a concrete detail
// and freshness. The program writes that one line to
// /output/entry.txt, where a sealed scorer gates it (1-140 UTF-8
// characters, not only whitespace) and only a valid entry goes
// before the judge.
//
// The line. "My Monday deploy froze mid-rollback, my inbox hit
// 9,999 unread, and the stand-up that should have been a message
// brought donuts."
// Three concrete worst-Monday details the judge brief itself
// names — a stuck deploy, a flooded inbox, a stand-up that
// should have been a message — stacked in one breath, then the
// twist: the meeting that should never have happened rewards
// you with donuts. Dry, put-upon, and fresh: no alarm clock,
// no coffee, no Garfield, no robot-uprising gag.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const LINE =
  "My Monday deploy froze mid-rollback, my inbox hit 9,999 unread, and the stand-up that should have been a message brought donuts.";

// The gate the sealed scorer applies, mirrored here so a bad line
// fails loudly at build time instead of silently at grading time.
const MIN_CHARS = 1;
const MAX_CHARS = 140;

// Where the grader looks for the entry. The grader runs with
// /output writable; locally the directory can be overridden so the
// same program can be verified without root (ENTRY_OUTPUT_DIR).
const OUTPUT_DIR = process.env.ENTRY_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

// Lines that would lose to any crafted line: plain complaints
// about Mondays ("I hate Mondays", "Mondays are the worst") with
// no turn and no punchline, and the tired cliches the judge has
// heard a thousand times (alarm clock, coffee, Garfield). The
// judge weighs a landing punchline over a complaint, so refuse
// any of these outright instead of shipping one.
const BANNED_PHRASES = [
  "i hate mondays",
  "mondays are the worst",
  "alarm clock",
  "coffee",
  "garfield",
];

function validate(line: string): string[] {
  const problems: string[] = [];
  // Count code points, not UTF-16 units, so the 140 cap matches
  // the gate's character count even if a line ever holds non-ASCII.
  const chars = [...line].length;
  if (chars < MIN_CHARS) {
    problems.push(`line is empty (needs at least ${MIN_CHARS} character)`);
  }
  if (chars > MAX_CHARS) {
    problems.push(
      `line is ${chars} characters, over the ${MAX_CHARS} cap`,
    );
  }
  if (line.trim().length === 0) {
    problems.push("line is only whitespace, so it is not a line");
  }
  if (line.trim() !== line) {
    problems.push("line has leading or trailing whitespace");
  }
  if (line.includes("\n") || line.includes("\r")) {
    problems.push("line spans more than one line, so it is not one line");
  }
  const lower = line.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      problems.push(`line leans on a tired cliche: ${JSON.stringify(phrase)}`);
    }
  }
  if (!lower.includes("monday")) {
    problems.push("line does not mention Monday, so it is not about Monday");
  }
  return problems;
}

function main(): void {
  const dryRun = process.argv.includes("--dry-run");
  const problems = validate(LINE);
  if (problems.length > 0) {
    for (const problem of problems) {
      console.error(`invalid entry: ${problem}`);
    }
    process.exit(1);
  }
  if (dryRun) {
    console.log(`dry run: line is valid at ${LINE.length} characters: ${LINE}`);
    return;
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, LINE, "utf8");

  // Read the file back and prove the round trip: the bytes on disk
  // must be exactly the line, with no trailing newline or extra
  // whitespace the gate could count against the 140-character cap.
  const written = readFileSync(OUTPUT_FILE, "utf8");
  if (written !== LINE) {
    console.error(
      `round-trip mismatch: file holds ${JSON.stringify(written)}, expected ${JSON.stringify(LINE)}`,
    );
    process.exit(1);
  }
  if (Buffer.byteLength(written, "utf8") !== LINE.length) {
    console.error("round-trip mismatch: byte length differs from the line");
    process.exit(1);
  }
  console.log(`wrote ${LINE.length}-character entry to ${OUTPUT_FILE}: ${LINE}`);
}

main();
