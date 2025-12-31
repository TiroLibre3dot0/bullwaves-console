import re
from pathlib import Path

in_path = Path('public') / 'Registrations Report.csv'
out_path = Path('public') / 'Registrations Report.fixed.csv'

text = in_path.read_text(encoding='utf-8')
lines = text.splitlines()
if not lines:
    raise SystemExit('empty file')

first = lines[0]
headers = []
if first.startswith('"') and first.endswith('"'):
    inner = first[1:-1]
    parts = inner.split('\",\"')
    # if first part still contains a comma, split it
    new_parts = []
    for i, p in enumerate(parts):
        if i == 0 and ',' in p:
            sub = p.split(',')
            new_parts.extend(sub)
        else:
            new_parts.append(p)
    # clean double quotes and whitespace
    for p in new_parts:
        s = p.replace('""', '"').strip()
        s = re.sub(r'^\"+|\"+$', '', s).strip()
        headers.append(s)
else:
    headers = [h.strip().strip('"') for h in first.split(',')]

new_header = ','.join(headers)
out_lines = [new_header]
for line in lines[1:]:
    if line.startswith('"') and line.endswith('"'):
        inner = line[1:-1]
        parts = inner.split('\",\"')
        parts = [p.replace('""', '"') for p in parts]
        out_lines.append(','.join(parts))
    else:
        out_lines.append(line)

out_path.write_text('\n'.join(out_lines), encoding='utf-8')
print('Wrote', out_path)
