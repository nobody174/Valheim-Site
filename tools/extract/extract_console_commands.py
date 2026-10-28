"""List the game's console commands from the decompiled Terminal class.

The commands are code, not asset data, so they are read from the game's own source: decompile it
first (needs `dotnet tool install ilspycmd`; run once per game patch):

    ilspycmd -t Terminal "<Valheim>/valheim_Data/Managed/assembly_valheim.dll" > Terminal.cs
    python tools/extract/extract_console_commands.py Terminal.cs data

Writes data/commands.json. Secret commands (the game hides them from its own help) are left out.
Needs Python 3.8+.
"""

import json
import os
import re
import sys

START = re.compile(r'^\t\tnew ConsoleCommand\("([^"]*)", "((?:[^"\\]|\\.)*)"', re.M)
FLAG = re.compile(r'\b(isCheat|isNetwork|onlyServer|isSecret|hideBehindDevCommands): (true|false)')
# The call closes with "}, isCheat: ..., ...);" two tabs deep (or "});" when it has no flags).
CLOSE = re.compile(r'^\t\t\}(?:, ([^\n]*))?\);\s*$', re.M)


def main(source, out_dir):
    text = open(source, encoding='utf8').read()
    starts = list(START.finditer(text))
    commands = []
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(text)
        chunk = text[m.end():end]
        close = CLOSE.search(chunk)
        flags = {k: v == 'true' for k, v in FLAG.findall(close.group(1) or '')} if close else {}
        name = m.group(1)
        desc = m.group(2).replace('\\"', '"').strip()
        if flags.get('isSecret') or not name:
            continue
        commands.append({'name': name, 'description': desc, 'cheat': flags.get('isCheat', False),
                         'serverOnly': flags.get('onlyServer', False)})
    examples_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'command_examples.json')
    with open(examples_path, encoding='utf8') as f:
        examples = {k: v for k, v in json.load(f).items() if not k.startswith('_')}
    for c in commands:
        if c['name'] in examples:
            c['example'] = examples[c['name']]
    commands.sort(key=lambda c: c['name'])
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'commands.json'), 'w', encoding='utf8', newline='\n') as f:
        json.dump(commands, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(len(commands), 'commands;', sum(c['cheat'] for c in commands), 'need devcommands')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
