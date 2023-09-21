import os
from sys import argv
import tinify

tinify.key = "4NN774xxvLwFCcxXK9vMYFk78RZ0wcDZ"


def tiny_png(src):
    source = tinify.from_file(src)
    source.to_file(src)

directory = argv[1]
for root, subdirectories, files in os.walk(directory):
    for file in files:
        src = os.path.join(root, file)
        if src.endswith(("png", "jpg")):
            tiny_png(src)
            print(f"Compressing: {src}")

print(f"Compression count: {tinify.compression_count}")
