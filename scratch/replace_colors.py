import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Background Colors
    content = content.replace("background: '#0a0a0f'", "background: '#f4f7f6'")
    content = content.replace("background: '#000000'", "background: '#f4f7f6'")

    # Classes
    content = re.sub(r'\bbg-black/80\b', 'bg-white/90', content)
    content = re.sub(r'\bbg-black/90\b', 'bg-white/95', content)
    content = re.sub(r'\bbg-black/60\b', 'bg-white/80', content)
    content = re.sub(r'\bbg-black/40\b', 'bg-white/60', content)
    content = re.sub(r'\bbg-black/50\b', 'bg-white/70', content)
    content = re.sub(r'\bbg-black/70\b', 'bg-white/90', content)
    content = re.sub(r'\bbg-black/25\b', 'bg-white/40', content)
    content = re.sub(r'\bbg-black/20\b', 'bg-white/30', content)
    content = re.sub(r'\bbg-black\b', 'bg-white', content)

    # Text Colors
    content = re.sub(r'\btext-white/80\b', 'text-gray-800', content)
    content = re.sub(r'\btext-white/70\b', 'text-gray-700', content)
    content = re.sub(r'\btext-white/60\b', 'text-gray-600', content)
    content = re.sub(r'\btext-white/40\b', 'text-gray-500', content)
    content = re.sub(r'\btext-white/30\b', 'text-gray-400', content)
    content = re.sub(r'\btext-white/20\b', 'text-gray-300', content)
    content = re.sub(r'\btext-white\b', 'text-gray-900', content)

    # Border Colors
    content = re.sub(r'\bborder-white/20\b', 'border-gray-300', content)
    content = re.sub(r'\bborder-white/15\b', 'border-gray-200', content)
    content = re.sub(r'\bborder-white/10\b', 'border-gray-200', content)
    content = re.sub(r'\bborder-white/5\b', 'border-gray-100', content)
    content = re.sub(r'\bborder-white\b', 'border-gray-300', content)

    # Placeholders
    content = re.sub(r'\bplaceholder-white/40\b', 'placeholder-gray-400', content)

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.jsx', '.tsx', '.js')):
            replace_in_file(os.path.join(root, file))
