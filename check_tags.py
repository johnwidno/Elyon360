import re

path = r"c:\Users\teach\Desktop\ElyonSys 360\frontend\src\pages\Admin\Members\MemberProfile.jsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # This is a very simple regex and will fail on many edge cases (like comments or strings containing tags)
    # but for identifying the main discrepancy it might work.
    
    # Filter out comments
    line_no_comments = re.sub(r'\{/\*.*?\*/\}', '', line)
    line_no_comments = re.sub(r'//.*', '', line_no_comments)
    
    # Find tags
    tags = re.findall(r'<([a-zA-Z0-9]+)|</([a-zA-Z0-9]+)>', line_no_comments)
    
    for open_tag, close_tag in tags:
        if open_tag:
            # Check if self-closing
            if re.search(r'<' + open_tag + r'[^>]*/>', line_no_comments):
                continue
            stack.append((open_tag, i + 1))
        elif close_tag:
            if not stack:
                print(f"ERROR: Unexpected closing tag </{close_tag}> at line {i + 1}")
                continue
            last_tag, last_line = stack.pop()
            if last_tag != close_tag:
                print(f"ERROR: Mismatched tag: expected </{last_tag}> (from line {last_line}), found </{close_tag}> at line {i + 1}")

print("\n--- Remaining stack ---")
for tag, line in stack:
    print(f"Unclosed <{tag}> at line {line}")
