def unpack_bytes(number, chunk_size=31):
    """
    Unpacks a number into bytes, reversing the pack_bytes operation.
    Each number contains up to chunk_size bytes.
    """
    bytes_array = []
    for i in range(chunk_size):
        byte = (number >> (8 * i)) & 0xFF
        bytes_array.append(byte)
    return bytes_array

def numbers_to_text(numbers):
    """
    Converts an array of numbers back to text, reversing the text_to_numbers operation.
    """
    all_bytes = []
    for num in numbers:
        bytes_array = unpack_bytes(num)
        all_bytes.extend(bytes_array)
    
    # Convert bytes to characters, stopping at first null byte
    text = ""
    for b in all_bytes:
        # if b == 0:  # Stop at null byte
            # text += ""
            # break
        text += chr(b)
    return text

# Example usage:
numbers = [599374706820268134214533627970740579, 0, 0, 118602315474515077779927224802545847333198224526552544027597071473787696705, 852239292522472296494, 0, 0]
text = numbers_to_text(numbers)
print(text) 


# ​​{
# "0": "6632353713085157925504008443078919716322386156160602218536961028046468237192",
# "1": "223503344335481019815264270958995988438",
# "2": "49955886729914646352350769046949425828",
# "3": "599374706820268134214533627970740579",
# "4": "0",
# "5": "0",
# "6": "118602315474515077779927224802545847333198224526552544027597071473787696705",
# "7": "852239292522472296494",
# "8": "0",
# "9": "0"
# }