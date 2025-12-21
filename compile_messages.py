#!/usr/bin/env python
"""
Compile .po to .mo using correct format for Django.
"""
import os
import sys
import struct
import array

def make_mo(messages, output_file):
    """Create a .mo file from a dict of translations."""
    # Sort keys (empty string first for header)
    keys = sorted(messages.keys())
    
    # Prepare the binary data
    offsets = []
    ids = b''
    strs = b''
    
    for key in keys:
        id_bytes = key.encode('utf-8')
        str_bytes = messages[key].encode('utf-8')
        offsets.append((len(ids), len(id_bytes), len(strs), len(str_bytes)))
        ids += id_bytes + b'\x00'
        strs += str_bytes + b'\x00'
    
    # Header is 7 32-bit unsigned integers
    keystart = 7 * 4 + 16 * len(keys)
    valuestart = keystart + len(ids)
    
    koffsets = []
    voffsets = []
    for o in offsets:
        koffsets.append(o[1])  # length of original
        koffsets.append(o[0] + keystart)  # offset of original
        voffsets.append(o[3])  # length of translation
        voffsets.append(o[2] + valuestart)  # offset of translation
    
    offsets_arr = array.array('i', koffsets + voffsets)
    
    output = struct.pack(
        'Iiiiiii',
        0x950412de,  # Magic
        0,           # Version
        len(keys),   # Number of strings
        7 * 4,       # Offset of originals table
        7 * 4 + len(keys) * 8,  # Offset of translations table
        0,           # Size of hashing table
        0            # Offset of hashing table
    )
    
    if sys.byteorder == 'big':
        offsets_arr.byteswap()
    
    output += offsets_arr.tobytes()
    output += ids
    output += strs
    
    with open(output_file, 'wb') as f:
        f.write(output)
    
    return len(keys)


def parse_po(filename):
    """Parse a .po file and return a dict of translations."""
    messages = {}
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into entries
    entries = content.split('\n\n')
    
    for entry in entries:
        lines = entry.strip().split('\n')
        
        # Skip comment-only entries
        non_comment_lines = [l for l in lines if not l.startswith('#')]
        if not non_comment_lines:
            continue
        
        msgid_parts = []
        msgstr_parts = []
        in_msgid = False
        in_msgstr = False
        
        for line in lines:
            line = line.strip()
            if line.startswith('#'):
                continue
            
            if line.startswith('msgid '):
                in_msgid = True
                in_msgstr = False
                content = line[6:].strip()
                if content.startswith('"') and content.endswith('"'):
                    msgid_parts.append(content[1:-1])
            elif line.startswith('msgstr '):
                in_msgid = False
                in_msgstr = True
                content = line[7:].strip()
                if content.startswith('"') and content.endswith('"'):
                    msgstr_parts.append(content[1:-1])
            elif line.startswith('"') and line.endswith('"'):
                content = line[1:-1]
                if in_msgid:
                    msgid_parts.append(content)
                elif in_msgstr:
                    msgstr_parts.append(content)
        
        msgid = ''.join(msgid_parts)
        msgstr = ''.join(msgstr_parts)
        
        # Process escape sequences
        msgid = msgid.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"')
        msgstr = msgstr.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"')
        
        if msgstr:  # Only add if there's a translation
            messages[msgid] = msgstr
    
    return messages


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    po_path = os.path.join(base_dir, 'locale', 'fr', 'LC_MESSAGES', 'django.po')
    mo_path = os.path.join(base_dir, 'locale', 'fr', 'LC_MESSAGES', 'django.mo')
    
    if not os.path.exists(po_path):
        print(f"Error: {po_path} not found")
        return
    
    messages = parse_po(po_path)
    print(f"Parsed {len(messages)} translations")
    
    # Debug: show a few translations
    for key in list(messages.keys())[:3]:
        print(f"  '{key}' -> '{messages[key]}'")
    
    count = make_mo(messages, mo_path)
    print(f"Compiled {count} entries to {mo_path}")


if __name__ == '__main__':
    main()
