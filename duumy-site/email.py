import random
import pandas as pd

# Original email
email = "ikechukwungoesina@gmail.com"

# Function to generate randomized email
def generate_random_email(email):
    username, domain = email.split("@")
    positions = list(range(1, len(username)))  # Possible positions to place a dot
    num_dots = random.randint(1, min(9, len(positions)))  # Randomly place 1 to 3 dots
    dot_positions = random.sample(positions, num_dots)  # Select random positions
    
    new_username = ""
    for i, char in enumerate(username):
        if i in dot_positions:
            new_username += "."
        new_username += char

    return f"{new_username}@{domain}"

# Specify the quantity of emails needed
quantity = 1000  # Change this number as needed

# Generate the emails
random_emails = [generate_random_email(email) for _ in range(quantity)]

# Save results to an Excel file
df = pd.DataFrame({"Randomized Emails": random_emails})
file_path = "randomized_emaile.xlsx"
df.to_excel(file_path, index=False)

print(f"Generated {quantity} randomized emails and saved them to {file_path}")