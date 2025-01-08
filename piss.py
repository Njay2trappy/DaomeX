import requests

url = "https://backend.x3na.com/"

try:
    response = requests.get(url)
    response.raise_for_status()  # Raise exception if status code is not 200
    data = response.json()  # Parse the JSON response
    print(data)  # Print the response
except requests.exceptions.RequestException as e:
    print(f"Error querying the API: {e}")
