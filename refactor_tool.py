import os
import json

def rename_property_in_json(obj, path, new_key):
    keys = path.split('/')
    if not keys:
        return obj

    current_key = keys.pop(0)

    if current_key in obj:
        if not keys:  # If this is the last key in the path
            obj[new_key] = obj.pop(current_key)
        else:
            rename_property_in_json(obj[current_key], '/'.join(keys), new_key)

def add_property_in_json(obj, path, new_key, new_value):
    keys = path.split('/')
    if not keys or keys == ['']:
        obj[new_key] = new_value
        return

    current_key = keys.pop(0)

    if current_key not in obj:
        return
    add_property_in_json(obj[current_key], '/'.join(keys), new_key, new_value)

def process_json_files(folder_path, path, new_key, new_value=None, rename=False):
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            if filename.endswith('.json'):
                file_path = os.path.join(root, filename)
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                if rename:
                    rename_property_in_json(data, path, new_key)
                else:
                    add_property_in_json(data, path, new_key, new_value)

                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)

folder_path = 'patches'

# Example usage for adding
new_property_name = 'modes'
new_value = {
    "Control": {
        "Start locked time": 30,
        "Seconds per percent": 1.2,
    },
    "Escort": {
        "Attackers cart healing": 10,
        "Time until cart rollback": 10,
    },
    "Flashpoint": {
        "Seconds per percent": 0.7,
    },
    "Hybrid": {
        "Attackers cart healing": 10,
        "Time until cart rollback": 10,
    },
    "Push": {
        "Time limit": 600,
        "Forward spawn respawn timer": 12,
        "Robot checkpoint delay time": 9,
        "Robot speed multiplier when pushing barrier": 1,
    }
}
process_json_files(folder_path, '', new_property_name, new_value, rename=False)