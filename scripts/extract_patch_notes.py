"""Extract readable Blizzard patch sections and official icon URLs from saved HTML."""

import json
import sys
from html.parser import HTMLParser
from pathlib import Path


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag = tag
        self.attrs = dict(attrs)
        self.children = []

    def has_class(self, name):
        return name in self.attrs.get('class', '').split()

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()

    def text(self):
        if self.tag in ('script', 'style'):
            return ''
        value = ''.join(c.text() if isinstance(c, Node) else c for c in self.children)
        return value + ('\n' if self.tag in ('p', 'li', 'h3', 'h4', 'h5', 'div', 'br') else '')


class Parser(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in ('area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'):
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


if __name__ == '__main__':
    root = Parser(Path(sys.argv[1]).read_text(encoding='utf-8')).root
    for patch in (n for n in root.walk() if n.has_class('PatchNotes-patch')):
        date = next(n.attrs['id'].removeprefix('patch-') for n in patch.walk() if n.attrs.get('id', '').startswith('patch-'))
        if len(sys.argv) > 2 and date != sys.argv[2]:
            continue
        print('\nDATE', date)
        for section in (n for n in patch.children if isinstance(n, Node) and n.has_class('PatchNotes-section')):
            title = next((n.text().strip() for n in section.walk() if n.has_class('PatchNotes-sectionTitle')), '')
            if title == 'Stadium Updates':
                break
            print('\n' + '\n'.join(s.strip() for s in section.text().splitlines() if s.strip()))
        icons = {}
        for node in patch.walk():
            if node.has_class('PatchNotesHeroUpdate') or node.has_class('PatchNotesAbilityUpdate'):
                name = next((n.text().strip() for n in node.walk() if n.has_class('PatchNotesHeroUpdate-name') or n.has_class('PatchNotesAbilityUpdate-name')), None)
                src = next((n.attrs['src'] for n in node.walk() if n.tag == 'img' and 'src' in n.attrs), None)
                if name and src:
                    icons[name] = src
        if '--icons' in sys.argv:
            print('ICONS', json.dumps(icons, ensure_ascii=True))
