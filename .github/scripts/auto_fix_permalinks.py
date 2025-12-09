import os
import re
import subprocess

PAGES_DIR = "src/content/pages"
PERMALINK_REGEX = re.compile(r'^(\s*permalink\s*:\s*)(.+?)(\s*)$', re.IGNORECASE)

def safe_filename(text: str) -> str:
    return text.strip().replace(" ", "-")

def run(cmd):
    return subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()

# ----------------------------
# 🔎 Get changed YAML files from git
# ----------------------------
try:
    diff_files = run([
        "git", "diff", "--name-only", "HEAD~1", "HEAD"
    ]).splitlines()
except Exception:
    diff_files = []

yaml_files = [
    f for f in diff_files
    if f.startswith(PAGES_DIR) and f.endswith(".yaml")
]

for file_path in yaml_files:
    if not os.path.exists(file_path):
        continue  # deleted file

    filename = os.path.basename(file_path)
    root = os.path.dirname(file_path)
    filename_without_ext = os.path.splitext(filename)[0]
    inferred_permalink = safe_filename(filename_without_ext)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        continue

    old_content = ""
    try:
        old_content = run(["git", "show", f"HEAD~1:{file_path}"])
    except Exception:
        pass

    old_permalink = None
    new_permalink = None

    for line in old_content.splitlines():
        match = PERMALINK_REGEX.match(line)
        if match:
            old_permalink = match.group(2).strip().strip('"\'')
            break

    permalink_line_index = None

    for i, line in enumerate(lines):
        match = PERMALINK_REGEX.match(line)
        if match:
            new_permalink = match.group(2).strip().strip('"\'')
            permalink_line_index = i
            break

    # --------------------------------------------------
    # ✅ CASE 1: PERMALINK CHANGED → RENAME FILE
    # --------------------------------------------------
    if new_permalink and new_permalink != old_permalink:
        expected_filename = f"{safe_filename(new_permalink)}.yaml"
        expected_path = os.path.join(root, expected_filename)

        if filename != expected_filename:
            if not os.path.exists(expected_path):
                os.rename(file_path, expected_path)
                print(f"✅ Renamed (permalink → filename): {file_path} → {expected_path}")
            else:
                print(f"⚠️ Rename skipped (conflict): {expected_path}")
        continue

    # --------------------------------------------------
    # ✅ CASE 2: FILENAME CHANGED → UPDATE PERMALINK
    # --------------------------------------------------
    if old_permalink != inferred_permalink:

        new_line = f"permalink: {inferred_permalink}\n"

        if permalink_line_index is not None:
            prefix_match = PERMALINK_REGEX.match(lines[permalink_line_index])
            if prefix_match:
                prefix, _, suffix = prefix_match.groups()
                lines[permalink_line_index] = f"{prefix}{inferred_permalink}{suffix}\n"
        else:
            if lines:
                lines.insert(1, new_line)
            else:
                lines.append(new_line)

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                f.writelines(lines)
            print(f"✅ Updated permalink (filename → permalink): {file_path} → {inferred_permalink}")
        except Exception:
            pass
