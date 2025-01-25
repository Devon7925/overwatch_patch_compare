import os
import json

def rename_property_in_json(obj, old_path, new_path):
    old_keys = old_path.split('/')
    new_keys = new_path.split('/')

    def get_nested_dict(obj, keys):
        for key in keys[:-1]:
            obj = obj.setdefault(key, {})
        return obj

    old_parent = get_nested_dict(obj, old_keys)
    new_parent = get_nested_dict(obj, new_keys)

    old_key = old_keys[-1]
    new_key = new_keys[-1]

    if old_key in old_parent:
        new_parent[new_key] = old_parent.pop(old_key)

def add_property_in_json(obj, path, new_key, new_value):
    keys = path.split('/')
    current_key = keys.pop(0)

    if current_key not in obj:
        obj[current_key] = {}

    if keys:
        add_property_in_json(obj[current_key], '/'.join(keys), new_key, new_value)
    else:
        obj[new_key] = new_value

def process_json_files(folder_path, old_path, new_path=None, new_value=None, rename=False):
    for root, dirs, files in os.walk(folder_path):
        for filename in files:
            if filename.endswith('.json'):
                file_path = os.path.join(root, filename)
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                if rename:
                    rename_property_in_json(data, old_path, new_path)
                else:
                    add_property_in_json(data, old_path, new_path, new_value)

                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)

folder_path = 'patches'

# Example usage for adding
new_property_name = "Damage amplification"
new_value = 25
process_json_files(folder_path, 'heroes/support/Zenyatta/abilities/Orb of Discord/Damage amplification', new_property_name, new_value, rename=False)