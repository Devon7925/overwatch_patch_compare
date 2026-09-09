"""Add only official Blizzard assets for the summer 2026 additions."""
import json
import os
from pathlib import Path
from extract_patch_notes import Parser

cache = Path(os.environ['TEMP']) / 'overwatch-september-audit'
mapping = json.loads(Path('image_map.json').read_text(encoding='utf-8'))
needed = {
    'Shion', 'Kira Pistols', 'Execution', 'Joyride', 'Evade', 'Satsuriku Spree',
    'Rapid Reload', 'X Machina', 'Refuel', 'Faces of Death',
    'D.Mon', 'Plasma Saber', 'Portable Fusion Repeater', 'Power Barrier',
    'Surging Strike', 'Fusion Repeater', 'Propulsors', 'Eject!', 'Limit Break',
    'Call Mech', 'Beast Within', 'MEKA Mobility', 'Overstrike', 'Focused Fusion',
    'Corporate Retreat', 'Smart Bomb', 'Heavy Javelin', 'Giddy Up',
    'Aerial Munitions', 'Temporal Regen', 'Purrfect Form',
}
found = {}
for slug in ['shion', 'dmon', 'domina', 'bastion', 'orisa', 'cassidy', 'echo', 'tracer', 'jetpack-cat']:
    root = Parser((cache / f'{slug}.html').read_text(encoding='utf-8')).root
    for node in root.walk():
        if node.tag == 'blz-tab-control' and 'label' in node.attrs:
            name = node.attrs['label'].strip()
            src = next((n.attrs.get('src') for n in node.walk() if n.tag == 'blz-image'), None)
        elif node.tag in ('img', 'blz-image'):
            name, src = node.attrs.get('alt', '').strip(), node.attrs.get('src')
        else:
            continue
        name = {'MEKA Mobilitiy': 'MEKA Mobility'}.get(name, name)
        if name in needed and src:
            found[name] = src
for month in ['06', '08']:
    root = Parser((cache / f'{month}.html').read_text(encoding='utf-8')).root
    for node in root.walk():
        if node.tag == 'img' and node.has_class('PatchNotesHeroUpdate-icon'):
            if node.attrs.get('alt') in ('Shion', 'D.Mon'):
                found[node.attrs['alt']] = node.attrs['src']
assert needed <= found.keys(), needed - found.keys()
for name, src in found.items():
    assert src.startswith('https://d15f34w2p8l1cc.cloudfront.net/overwatch/'), src
    if name == 'Call Mech':
        name = 'Call Mech (D.Mon)'
    mapping[name] = src
Path('image_map.json').write_text(json.dumps(mapping, ensure_ascii=False, indent=4) + '\n', encoding='utf-8')
print(f'Verified official source mappings for {len(found)} labels.')
