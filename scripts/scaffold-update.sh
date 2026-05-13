#!/usr/bin/env bash
# Pull Scaffold template updates while strictly preserving downstream state
# of src/content/, src/assets/, src/styles/, and public/.
#
# Behaviour:
# - Modify/delete conflicts in protected paths: re-apply the downstream
#   deletion so demo content doesn't reappear.
# - Brand-new upstream files in src/content/, src/assets/, public/ are
#   auto-removed (demo content stays out of production). src/styles is
#   intentionally excluded — new stylesheets may be required by new
#   components.
# - If new directories appear under src/content/ (typically a new content
#   collection), an alert is shown at the end of the run.
# - Code-side conflicts halt the script for manual resolution.
#
# Usage:
#   ./scripts/scaffold-update.sh                     # remote=template, branch=main
#   ./scripts/scaffold-update.sh <remote>            # custom remote, branch=main
#   ./scripts/scaffold-update.sh <remote> <branch>   # custom both
#
# Or via npm:
#   npm run update-from-scaffold
#   npm run update-from-scaffold -- <remote> <branch>

set -euo pipefail

REMOTE="${1:-template}"
BRANCH="${2:-main}"

# Paths where modify/delete conflicts resolve to keep the downstream deletion.
PROTECTED=(src/content src/assets src/styles public)

# Subset of PROTECTED where brand-new upstream files are auto-removed. Demo
# content shouldn't sneak into production. src/styles is intentionally NOT
# here — new stylesheets may be required by new components.
AUTO_REMOVE=(src/content src/assets public)

# --- preflight -------------------------------------------------------------

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Working tree is dirty — commit or stash your changes first."
  exit 1
fi

if ! git remote get-url "$REMOTE" > /dev/null 2>&1; then
  echo "✗ Remote '$REMOTE' is not configured."
  echo "  Set it up once with:"
  echo "    git remote add $REMOTE https://github.com/draftlab-org/scaffold.git"
  exit 1
fi

# .gitattributes declares `merge=ours` on protected paths, but `ours` is NOT a
# built-in Git merge driver — it must be registered in local config. Without
# this, Git silently falls back to the default 3-way merge and the user gets
# conflicts on every protected file. Set it up idempotently on every run so
# fresh clones and new contributors don't trip over it.
if [ "$(git config --local --get merge.ours.driver || true)" != "true" ]; then
  echo "→ Registering 'ours' merge driver in local git config"
  git config --local merge.ours.driver true
fi

# --- fetch -----------------------------------------------------------------

echo "→ Fetching $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"

# Snapshot file list under auto-remove paths so we can identify new arrivals
# after the merge. sort -u dedupes paths that appear at multiple stages while
# the merge is in flight.
BEFORE=$(mktemp)
MID=$(mktemp)
trap 'rm -f "$BEFORE" "$MID"' EXIT
git ls-files -- "${AUTO_REMOVE[@]}" 2>/dev/null | sort -u > "$BEFORE"

# Snapshot package.json dependency sections so we can tell the user to run
# `npm install` if the merge bumps or adds packages. Lockfile bumps alone
# don't warrant the alert — the canonical signal is package.json deps.
# PARSE_ERROR sentinel covers a malformed package.json post-merge (e.g.
# conflict markers); we still want to fire the alert in that case.
deps_signature() {
  node -e "
    try {
      const p = require('./package.json');
      const pick = (o = {}) => Object.entries(o).sort().map(([k, v]) => k + '@' + v).join('\\n');
      console.log([
        pick(p.dependencies),
        pick(p.devDependencies),
        pick(p.peerDependencies),
        pick(p.optionalDependencies),
      ].join('\\n---\\n'));
    } catch (e) {
      console.log('PARSE_ERROR');
    }
  " 2>/dev/null || echo "PARSE_ERROR"
}
PKG_DEPS_BEFORE=$(deps_signature)

# --- merge (no commit; we modify the index before finalising) -------------
# First merge after `npx create-astro --template ...` has no shared root and
# needs --allow-unrelated-histories.

if git merge-base HEAD "$REMOTE/$BRANCH" > /dev/null 2>&1; then
  echo "→ Merging $REMOTE/$BRANCH"
  git merge --no-commit --no-edit "$REMOTE/$BRANCH" || true
else
  # No shared history: typical after `npx create-astro --template ...`. Without
  # a common base, every diverged file becomes an add/add conflict — even ones
  # the user never touched. `-X theirs` resolves those in favour of upstream
  # (the up-to-date template version), which is what the user wants for a
  # first-merge bootstrap. Protected paths still keep downstream because the
  # `merge=ours` driver overrides the strategy option.
  echo "→ Merging $REMOTE/$BRANCH (no shared history → --allow-unrelated-histories -X theirs)"
  git merge --no-commit --no-edit --allow-unrelated-histories -X theirs "$REMOTE/$BRANCH" || true
fi

# --- modify/delete handling -----------------------------------------------
# .gitattributes `merge=ours` resolves content conflicts but not modify/delete.
# DU = deleted by us, modified by them. Re-apply the deletion in protected
# paths so demo content the user removed doesn't come back.

RM_DU_COUNT=0
while IFS= read -r line; do
  [ "${line:0:2}" = "DU" ] || continue
  path="${line:3}"
  for p in "${PROTECTED[@]}"; do
    if [[ "$path" == "$p"/* ]]; then
      [ "$RM_DU_COUNT" -eq 0 ] && echo "→ Re-applying your deletions in protected paths"
      git rm -f -- "$path" > /dev/null
      RM_DU_COUNT=$((RM_DU_COUNT + 1))
    fi
  done
done < <(git status --porcelain)

# Snapshot AFTER the merge + DU resolution but BEFORE we auto-remove new files.
# This is the state we diff against BEFORE to find brand-new upstream files.
git ls-files -- "${AUTO_REMOVE[@]}" 2>/dev/null | sort -u > "$MID"

NEW_FILES=$(comm -13 "$BEFORE" "$MID" || true)

# Detect new directories under src/content/ (one level deep — collection level).
# Derived from the file list so it doesn't matter whether the dirs are
# tracked separately by Git.
NEW_CONTENT_DIRS=$(comm -13 \
  <(awk -F/ 'NF >= 3 && $1=="src" && $2=="content" {print $1"/"$2"/"$3}' "$BEFORE" | sort -u) \
  <(awk -F/ 'NF >= 3 && $1=="src" && $2=="content" {print $1"/"$2"/"$3}' "$MID"    | sort -u) \
  || true)

# --- auto-remove new files -------------------------------------------------
# All brand-new files in src/content/, src/assets/, public/ are removed.
# We don't enumerate them — the user just wants demo content gone.

if [ -n "$NEW_FILES" ]; then
  COUNT=$(printf '%s\n' "$NEW_FILES" | wc -l | tr -d ' ')
  echo "→ Removing $COUNT new upstream file(s) in protected paths"
  printf '%s\n' "$NEW_FILES" | while IFS= read -r f; do
    [ -n "$f" ] && git rm -f -- "$f" > /dev/null
  done
fi

# --- finalize --------------------------------------------------------------

print_collection_alert() {
  if [ -n "$NEW_CONTENT_DIRS" ]; then
    echo
    echo "ℹ There are new content collections on Scaffold — check out https://scaffold.org to see what's new"
  fi
}

print_deps_alert() {
  local after
  after=$(deps_signature)
  if [ "$PKG_DEPS_BEFORE" != "$after" ]; then
    echo
    if [ "$after" = "PARSE_ERROR" ]; then
      echo "ℹ package.json has unresolved conflicts — run 'npm install' after resolving."
    else
      echo "ℹ package.json dependencies changed — run 'npm install' to sync node_modules."
    fi
  fi
}

if [ -f .git/MERGE_HEAD ]; then
  if git status --porcelain | grep -qE '^(UU|AA|DD|UD|AU|UA) '; then
    echo
    echo "⚠ Code-side conflicts remain. Resolve them, then run:"
    echo "    git commit"
    print_collection_alert
    print_deps_alert
    exit 1
  fi
  git commit --no-edit > /dev/null
  echo "✓ Merge committed."
else
  echo "✓ Already up to date."
fi

print_collection_alert
print_deps_alert
