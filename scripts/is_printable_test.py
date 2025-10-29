# a script that prints if a char is printable or not
for i in range(256):
    char = chr(i)
    if char.isprintable():
        print(f"Character '{char}' (code {i}) is printable.")
    else:
        print(f"Character (code {i}) is NOT printable.")
