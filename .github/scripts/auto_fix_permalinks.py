import os
import re

PAGES_DIR = "src/content/pages"

PERMALINK_REGEX = re.compile(r'^\s*permalink\s*:\s*(.+?)\s*$', re.IGNORECASE)

def safe_filename(text: str) -> str:
    return text.strip().replace(" ", "-")

for root, _, files in os.walk(PAGES_DIR):
    for file in files:
        if not file.endswith(".yaml"):
            continue

        file_path = os.path.join(root, file)
        filename_without_ext = os.path.splitext(file)[0]

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception:
            continue  # silently ignore unreadable files

        permalink_value = None
        permalink_line_index = None

        # ----------------------------
        # 🔍 Find permalink line (TEXT ONLY)
        # ----------------------------
        for i, line in enumerate(lines):
            match = PERMALINK_REGEX.match(line)
            if match:
                permalink_value = match.group(1).strip().strip('"\'')
                permalink_line_index = i
                break

        # ----------------------------
        # ✅ CASE 1: permalink exists → rename file ONLY
        # ----------------------------
        if permalink_value:
            expected_filename = f"{safe_filename(permalink_value)}.yaml"
            expected_path = os.path.join(root, expected_filename)

            if expected_filename != file:
                if not os.path.exists(expected_path):
                    os.rename(file_path, expected_path)
                    print(f"✅ Renamed: {file_path} → {expected_path}")
                else:
                    print(f"⚠️ Rename skipped (conflict): {expected_path}")

            continue  # ⚠️ DO NOT MODIFY FILE CONTENT

        # ----------------------------
        # ✅ CASE 2: permalink missing → insert ONLY that line
        # ----------------------------
        inferred_permalink = safe_filename(fil
