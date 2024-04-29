list_of_lists = [['a', 'b', 'c'], ['c', 'b', 'd'], ['a', 'c', 'd']]

# Initialize an empty set to store unique first values
first_values = set()

# Iterate through the list and add the first element of each sublist to the set
for sublist in list_of_lists:
    first_values.add(sublist[0])

# Print the unique first values
print("Unique first values:", first_values)