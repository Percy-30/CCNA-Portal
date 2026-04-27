import requests
from bs4 import BeautifulSoup
import json
import os
import time

# Configuration
BASE_URL = "https://itexamanswers.net/"
DATA_DIR = "data"
MODULES = [
    {"id": 1, "name": "Networking Today", "url": "ccna-1-v7-0-curriculum-module-1-networking-today.html"},
    {"id": 2, "name": "Basic Switch and End Device Configuration", "url": "ccna-1-v7-0-curriculum-module-2-basic-switch-and-end-device-configuration.html"},
    {"id": 3, "name": "Protocols and Models", "url": "ccna-1-v7-0-curriculum-module-3-protocols-and-models.html"},
    {"id": 4, "name": "Physical Layer", "url": "ccna-1-v7-0-curriculum-module-4-physical-layer.html"},
    {"id": 5, "name": "Number Systems", "url": "ccna-1-v7-0-curriculum-module-5-number-systems.html"},
    {"id": 6, "name": "Data Link Layer", "url": "ccna-1-v7-0-curriculum-module-6-data-link-layer.html"},
    {"id": 7, "name": "Ethernet Switching", "url": "ccna-1-v7-0-curriculum-module-7-ethernet-switching.html"},
    {"id": 8, "name": "Network Layer", "url": "ccna-1-v7-0-curriculum-module-8-network-layer.html"},
    {"id": 9, "name": "Address Resolution", "url": "ccna-1-v7-0-curriculum-module-9-address-resolution.html"},
    {"id": 10, "name": "Basic Router Configuration", "url": "ccna-1-v7-0-curriculum-module-10-basic-router-configuration.html"},
    {"id": 11, "name": "IPv4 Addressing", "url": "ccna-1-v7-0-curriculum-module-11-ipv4-addressing.html"},
    {"id": 12, "name": "IPv6 Addressing", "url": "ccna-1-v7-0-curriculum-module-12-ipv6-addressing.html"},
    {"id": 13, "name": "ICMP", "url": "ccna-1-v7-0-curriculum-module-13-icmp.html"},
    {"id": 14, "name": "Transport Layer", "url": "ccna-1-v7-0-curriculum-module-14-transport-layer.html"},
    {"id": 15, "name": "Application Layer", "url": "ccna-1-v7-0-curriculum-module-15-application-layer.html"},
    {"id": 16, "name": "Network Security Fundamentals", "url": "ccna-1-v7-0-curriculum-module-16-network-security-fundamentals.html"},
    {"id": 17, "name": "Build a Small Network", "url": "ccna-1-v7-0-curriculum-module-17-build-a-small-network.html"},
]

def fetch_module(module):
    print(f"Fetching Module {module['id']}: {module['name']}...")
    url = BASE_URL + module['url']
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements
        for unwanted in soup.select('.sidebar, .header, .footer, .comments-area, .nav-links, script, style, .adsbygoogle'):
            unwanted.decompose()
            
        content = soup.select_one('.entry-content')
        if not content:
            content = soup.select_one('article')
            
        if content:
            # Fix relative image URLs
            for img in content.find_all('img'):
                if img.get('src') and not img['src'].startswith('http'):
                    img['src'] = BASE_URL + img['src'].lstrip('/')
            
            # Save data
            module_data = {
                "id": module['id'],
                "title": module['name'],
                "html": str(content)
            }
            
            with open(os.path.join(DATA_DIR, f"module_{module['id']}.json"), 'w', encoding='utf-8') as f:
                json.dump(module_data, f, ensure_ascii=False, indent=2)
            return True
    except Exception as e:
        print(f"Error fetching module {module['id']}: {e}")
    return False

def main():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    for module in MODULES:
        success = fetch_module(module)
        if success:
            print(f"Module {module['id']} saved.")
        time.sleep(1) # Be nice to the server

    # Save index
    with open(os.path.join(DATA_DIR, "index.json"), 'w', encoding='utf-8') as f:
        json.dump(MODULES, f, ensure_ascii=False, indent=2)
    print("Scraping complete.")

if __name__ == "__main__":
    main()
