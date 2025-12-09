import os
import yaml

PAGES_DIR = "src/content/pages"

def safe_filename(name: str) -> str:
    return name.strip().replace(" ", "-")

def write_yaml(path, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.dump(data, f, sort_keys=False)

for root, _, files in os.walk(PAGES_DIR):
    for file in files:
        if not file.endswith(".yaml"):
            continue

        file_path = os.path.join(root, file)
        filename_without_ext = os.path.splitext(file)[0]

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
        except Exception:
            continue  # silently ignore unreadable YAML

        if not isinstance(data, dict):
            continue

        permalink = data.get("permalink")

        # ----------------------------
        # ✅ CASE 1: permalink exists → rename file
        # ----------------------------
        if isinstance(permalink, str) and permalink.strip():
            permalink = safe_filename(permalink)
            expected_filename = f"{permalink}.yaml"
            expected_path = os.path.join(root, expected_filename)

            if expected_filename != file:
                if not os.path.exists(expected_path):
                    os.rename(file_path, expected_path)
                    print(f"✅ Renamed: {file_path} → {expected_path}")
                else:
                    print(f"⚠️ Rename skipped due to conflict: {expected_path}")
            continue

        # ----------------------------
        # ✅ CASE 2: permalink missing → infer from filename
        # ----------------------------
        inferred_permalink = safe_filename(filename_without_ext)
        data["permalink"] = inferred_permalink
        write_yaml(file_path, data)

        print(f"✅ Added permalink to {file_path}: {inferred_permalink}")
