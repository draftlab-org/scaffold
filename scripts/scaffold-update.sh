#!/usr/bin/env bash
# Pull Scaffold template updates while strictly preserving downstream state
# of src/content/, src/assets/, and public/ — including files you've deleted
# (Git would otherwise resurrect them as modify/delete conflicts).
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
PROTECTED=(src/content src/assets public)

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

# --- fetch -----------------------------------------------------------------

echo "→ Fetching $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"

# Snapshot protected-path file list so we can identify new arrivals later.
BEFORE=$(mktemp)
AFTER=$(mktemp)
trap 'rm -f "$BEFORE" "$AFTER"' EXIT
git ls-files -- "${PROTECTED[@]}" 2>/dev/null | sort > "$BEFORE"

# --- merge -----------------------------------------------------------------
# First merge after `npx create-astro --template ...` has no shared root and
# needs --allow-unrelated-histories. Detect by checking for a merge base.

if git merge-base HEAD "$REMOTE/$BRANCH" > /dev/null 2>&1; then
  echo "→ Merging $REMOTE/$BRANCH"
  git merge --no-edit "$REMOTE/$BRANCH" || true
else
  echo "→ Merging $REMOTE/$BRANCH (no shared history → --allow-unrelated-histories)"
  git merge --no-edit --allow-unrelated-histories "$REMOTE/$BRANCH" || true
fi

# --- modify/delete handling ------------------------------------------------
# .gitattributes `merge=ours` resolves content conflicts but not modify/delete.
# For files in protected paths that we previously deleted (status DU = deleted
# by us, modified by them), re-apply the deletion.

RM_COUNT=0
while IFS= read -r line; do
  [ "${line:0:2}" = "DU" ] || continue
  path="${line:3}"
  for p in "${PROTECTED[@]}"; do
    if [[ "$path" == "$p"/* ]]; then
      [ "$RM_COUNT" -eq 0 ] && echo "→ Re-applying your deletions in protected paths"
      echo "    git rm $path"
      git rm -f -- "$path" > /dev/null
      RM_COUNT=$((RM_COUNT + 1))
    fi
  done
done < <(git status --porcelain)

# --- finalize --------------------------------------------------------------
# If no code-side conflicts remain, commit the merge.

if [ -f .git/MERGE_HEAD ]; then
  if git status --porcelain | grep -qE '^(UU|AA|DD|UD|AU|UA) '; then
    echo
    echo "⚠ Code-side conflicts remain. Resolve them, then run:"
    echo "    git commit"
    exit 1
  fi
  git commit --no-edit > /dev/null
  echo "✓ Merge committed."
else
  echo "✓ Already up to date."
fi

# --- report new upstream files in protected paths --------------------------
# We don't auto-delete these — a new file might be genuinely useful (e.g. a
# section component shipped as a demo). Leave the call to the user.

git ls-files -- "${PROTECTED[@]}" 2>/dev/null | sort > "$AFTER"
NEW=$(comm -13 "$BEFORE" "$AFTER" || true)

if [ -n "$NEW" ]; then
  echo
  echo "ℹ New files landed in protected paths from upstream:"
  echo "$NEW" | sed 's/^/    /'
  echo
  echo "  If you don't want any of these, remove with:"
  echo "    git rm <path> && git commit -m 'Remove unwanted upstream files'"
fi
