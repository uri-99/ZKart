def pack_bytes(byte_array, chunk_size=31):
    """
    Packs bytes into integers, similar to how the circom circuit does it.
    Each integer contains up to chunk_size bytes.
    """
    packed = []
    for i in range(0, len(byte_array), chunk_size):
        chunk = byte_array[i:i+chunk_size]
        value = 0
        for j, b in enumerate(chunk):
            value += b << (8 * j)  # 8 bits per byte
        packed.append(value)
    return packed

def text_to_numbers(text):
    """
    Converts text to an array of numbers, matching the circom circuit's PackRegexReveal output.
    """
    byte_array = [ord(c) for c in text]
    return pack_bytes(byte_array)

# Example usage:
text = "Maquina Patillera Trimmer Vintage T9 Negro Profesional Mixio"
numbers = text_to_numbers(text)
print(numbers)