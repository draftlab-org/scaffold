import os
import re
import subprocess

PAGES_DIR = "src/content/pages"
PERMALINK_REGEX = re.compile(r'^(\s*permalink\s*:\s*)(.+?)(\s*)$', re.IGNORECASE)

def run(cmd):
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return ""

def safe_filename(text: str) -> str:
    return text.strip().replace(" ", "-")

# -------------------------------------------------
# ✅ Determine correct git diff base (PR vs push)
# -------------------------------------------------
BASE_REF = os.environ.get("GITHUB_BASE_REF")

if BASE_REF:
    diff_base = f"origin/{BASE_REF}"
else:
    diff_base = "HEAD~1"

# -------------------------------------------------
# ✅ Get changed files INCLUDING renames
# -------------------------------------------------
diff_output = run([
    "git", "diff", "--name-status", diff_base
]).splitlines()

changes = []

for line in diff_output:
    if not line:
        continue

    parts = line.split("\t")
    status = parts[0]

    if status.startswith("R"):  # Rename detected
        old_path = parts[1]
        new_path = parts[2]
        changes.append(("rename", old_path, new_path))
    elif status == "M":
        changes.append(("modify", parts[1]))

# -------------------------------------------------
# ✅ HANDLE FILE RENAMES → UPDATE PERMALINK
# -------------------------------------------------
for change in changes:
    if change[0] != "rename":
        continue

    old_path, new_path = change[1], change[2]

    if not new_path.startswith(PAGES_DIR) or not new_path.endswith(".yaml"):
        continue

    filename = os.path.basename(new_path)
    filename_without_ext = os.path.splitext(filename)[0]
    inferred_permalink = safe_filename(filename_without_ext)

    try:
        with open(new_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        continue

    updated = False

    for i, line in enumerate(lines):
        match = PERMALINK_REGEX.match(line)
        if match:
            prefix, _, suffix = match.groups()
            lines[i] = f"{prefix}{inferred_permalink}{suffix}\n"
            updated = True
            break

    if not updated:
        if lines:
            lines.insert(1, f"permalink: {inferred_permalink}\n")
        else:
            lines.append(f"permalink: {inferred_permalink}\n")

    try:
        with open(new_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        print(f"✅ Updated permalink from filename: {new_path} → {inferred_permalink}")
    except Exception:
        pass

# -------------------------------------------------
# ✅ HANDLE PERMALINK CHANGES → RENAME FILE
# -------------------------------------------------
for change in changes:
    if change[0] != "modify":
        continue

    file_path = change[1]

    if not file_path.startswith(PAGES_DIR) or not file_path.endswith(".yaml"):
        continue

    filename = os.path.basename(file_path)
    root = os.path.dirname(file_path)

    try:
        new_content = run(["git", "show", f"HEAD:{file_path}"])
        old_content = run(["git", "show", f"{diff_base}:{file_path}"])
    except Exception:
        continue

    old_permalink = None
    new_permalink = None

    for line in old_content.splitlines():
        match = PERMALINK_REGEX.match(line)
        if match:
            old_permalink = match.group(2).strip().strip('"\'')
            break

    for line in new_content.splitlines():
        match = PERMALINK_REGEX.match(line)
        if match:
            new_permalink = match.group(2).strip().strip('"\'')
            break

    # ✅ Only act when permalink actually changed
    if new_permalink and new_permalink != old_permalink:
        expected_filename = f"{safe_filename(new_permalink)}.yaml"
        expected_path = os.path.join(root, expected_filename)

        if os.path.basename(file_path) != expected_filename:
            if not os.path.exists(expected_path):
                try:
                    os.rename(file_path, expected_path)
                    print(f"✅ Renamed from permalink: {file_path} → {expected_path}")
                except Exception:
                    pass
