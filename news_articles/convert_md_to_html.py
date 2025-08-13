#!/usr/bin/env python3

import os
import json
import markdown
import datetime
from pathlib import Path

# Define the directories
articles_dir = Path('/home/ubuntu/timeoutdubai_rewrite_named/articles')
images_dir = Path('/home/ubuntu/timeoutdubai_rewrite_named/images')
output_dir = Path('/home/ubuntu/timeoutdubai_rewrite_named/output')

# Create output directory if it doesn't exist
output_dir.mkdir(exist_ok=True)

# Define file mappings
article_files = {
    "dubai-four-day-workweek.md": {
        "category": "News",
        "image": "dubai-four-day-workweek.jpg"
    },
    "four-day-week-explained.md": {
        "category": "News",
        "image": "four-day-week-explained.png"
    },
    "june-dubai-changes.md": {
        "category": "News",
        "image": "june-dubai-changes.jpg"
    },
    "islamic-new-year-weekend.md": {
        "category": "News",
        "image": "islamic-new-year-weekend.jpg"
    },
    "summer-solstice-guide.md": {
        "category": "News",
        "image": "summer-solstice-guide.jpg"
    },
    "june-fuel-prices.md": {
        "category": "News",
        "image": "june-fuel-prices.jpg"
    },
    "islamic-new-year-holiday.md": {
        "category": "News",
        "image": "islamic-new-year-holiday.png"
    },
    "summer-start-date.md": {
        "category": "News",
        "image": "summer-start-date.png"
    },
    "dubai-concerts-2025.md": {
        "category": "Things to Do",
        "image": "dubai-concerts-2025.jpg"
    },
    "uae-experiences-2025.md": {
        "category": "Things to Do",
        "image": "uae-experiences-2025.jpg"
    },
    "dubai-activities-guide.md": {
        "category": "Things to Do",
        "image": "dubai-activities-guide.jpg"
    },
    "nye-soho-garden.md": {
        "category": "Nightlife",
        "image": "nye-soho-garden.jpg"
    },
    "summer-dining-deals.md": {
        "category": "Food & Drink",
        "image": "summer-dining-deals.jpg"
    },
    "restaurant-week-deals.md": {
        "category": "Food & Drink",
        "image": "restaurant-week-deals.jpg"
    },
    "new-restaurants-guide.md": {
        "category": "Food & Drink",
        "image": "new-restaurants-guide.jpg"
    }
}

# Define image alt text and credits
image_metadata = {
    "dubai-four-day-workweek.jpg": {
        "alt": "Dubai public sector employees in a meeting discussing the four-day work week initiative",
        "credit": "Gulf Business (gulfbusiness.com)"
    },
    "four-day-week-explained.png": {
        "alt": "Graphic showing work-life balance concept with Dubai skyline",
        "credit": "JobXDubai (blog.jobxdubai.com)"
    },
    "june-dubai-changes.jpg": {
        "alt": "Fireworks display over Dubai during Islamic New Year celebrations",
        "credit": "Travel Saga Tourism (travelsaga.com)"
    },
    "islamic-new-year-weekend.jpg": {
        "alt": "Sheikh Zayed Grand Mosque illuminated during Islamic New Year",
        "credit": "Yalla Dubai Life (yalladubai.ae)"
    },
    "summer-solstice-guide.jpg": {
        "alt": "Dubai skyline at sunset during summer season",
        "credit": "Gulf News (gulfnews.com)"
    },
    "june-fuel-prices.jpg": {
        "alt": "ADNOC fuel station with car refueling",
        "credit": "Oil & Gas Middle East (www.oilandgasmiddleeast.com)"
    },
    "islamic-new-year-holiday.png": {
        "alt": "UAE Public Holidays calendar for 2025 showing Islamic New Year date",
        "credit": "The ZenHR Blog (blog.zenhr.com)"
    },
    "summer-start-date.png": {
        "alt": "Dubai weather temperature chart showing summer season temperatures",
        "credit": "On the Beach (www.onthebeach.ie)"
    },
    "dubai-concerts-2025.jpg": {
        "alt": "Crowd at Coca-Cola Arena Dubai during a concert",
        "credit": "The National (www.thenationalnews.com)"
    },
    "uae-experiences-2025.jpg": {
        "alt": "Museum of the Future Dubai exterior view",
        "credit": "Tripadvisor (www.tripadvisor.com)"
    },
    "dubai-activities-guide.jpg": {
        "alt": "Collage of indoor activities and attractions in Dubai",
        "credit": "Captain Dunes (captaindunes.com)"
    },
    "nye-soho-garden.jpg": {
        "alt": "Soho Garden Dubai nightclub during a New Year's Eve celebration",
        "credit": "Time Out Dubai (www.timeoutdubai.com)"
    },
    "summer-dining-deals.jpg": {
        "alt": "Prime68 restaurant interior at JW Marriott Marquis Hotel Dubai",
        "credit": "Marriott (www.marriott.com)"
    },
    "restaurant-week-deals.jpg": {
        "alt": "Dubai Restaurant Week promotional image showing gourmet dishes",
        "credit": "Curly Tales (curlytales.com)"
    },
    "new-restaurants-guide.jpg": {
        "alt": "Interior of a new luxury restaurant in Dubai with elegant bar area",
        "credit": "Platinumlist (platinumlist.net)"
    }
}

# Get current date for publication date
current_date = datetime.datetime.now().strftime("%Y-%m-%d")

# Process each article
all_articles = []
for article_filename, metadata in article_files.items():
    article_path = articles_dir / article_filename
    image_filename = metadata["image"]
    category = metadata["category"]
    
    # Read the article content
    with open(article_path, 'r') as f:
        content = f.read()
    
    # Extract headline (first line, remove # and whitespace)
    headline = content.split('\n')[0].lstrip('# ').strip()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(content)
    
    # Create article JSON
    article_data = {
        "headline": headline,
        "content": html_content,
        "image_path": f"images/{image_filename}",
        "image_alt": image_metadata[image_filename]["alt"],
        "image_credit": image_metadata[image_filename]["credit"],
        "category": category,
        "publish_date": current_date,
        "author": "TimeOut Dubai"
    }
    
    # Save individual article JSON
    output_filename = article_filename.replace('.md', '.json')
    with open(output_dir / output_filename, 'w') as f:
        json.dump(article_data, f, indent=2)
    
    # Add to all articles list
    all_articles.append(article_data)

# Save all articles in one JSON file
with open(output_dir / "all_articles.json", 'w') as f:
    json.dump({"articles": all_articles}, f, indent=2)

print(f"Converted {len(all_articles)} articles to HTML and saved as JSON files in {output_dir}")

