# TimeOut Dubai Articles Rewrite Project

This project contains 15 rewritten articles from TimeOut Dubai, along with matching images and structured JSON files ready for website upload. All files use descriptive names that reflect their content.

## Directory Structure

- `/articles/` - Contains the rewritten articles in Markdown format
- `/images/` - Contains the images for each article
- `/output/` - Contains the JSON files ready for website upload
- `image_references.md` - Contains references and credits for all images
- `convert_md_to_html.py` - Python script to convert Markdown to HTML and generate JSON files

## Article Naming Convention

Articles are named descriptively according to their content:

1. `dubai-four-day-workweek.md` - Dubai's four-day workweek for public sector
2. `four-day-week-explained.md` - Explanation of Dubai's four-day week
3. `june-dubai-changes.md` - Major changes in Dubai during June
4. `islamic-new-year-weekend.md` - Islamic New Year long weekend
5. `summer-solstice-guide.md` - Summer solstice and longest day of the year
6. `june-fuel-prices.md` - UAE petrol prices for June 2025
7. `islamic-new-year-holiday.md` - UAE Islamic New Year 2025 holiday announcement
8. `summer-start-date.md` - Dubai's summer start date
9. `dubai-concerts-2025.md` - Best concerts and gigs in Dubai 2025
10. `uae-experiences-2025.md` - 28 things to do in 2025 in the UAE
11. `dubai-activities-guide.md` - 112 best things to do in Dubai in 2025
12. `nye-soho-garden.md` - New Year's Eve at Soho Garden
13. `summer-dining-deals.md` - Dubai summer dining deals 2025
14. `restaurant-week-deals.md` - Dubai Restaurant Week deals (Dhs125)
15. `new-restaurants-guide.md` - New restaurants in Dubai 2025

## JSON Structure

Each article is available as an individual JSON file with a descriptive name (e.g., `dubai-four-day-workweek.json`) in the `/output/` directory. Additionally, all articles are combined in a single file `all_articles.json`.

The JSON structure for each article is as follows:

```json
{
  "headline": "Article headline",
  "content": "Full article content in HTML format",
  "image_path": "Path to the article image",
  "image_alt": "Alternative text for the image",
  "image_credit": "Source credit for the image",
  "category": "Article category (e.g., News, Food & Drink, etc.)",
  "publish_date": "Publication date",
  "author": "Article author"
}
```

## How to Use for Website Upload

### Option 1: Direct JSON Import

If your website CMS supports JSON import, you can directly use the `all_articles.json` file to import all articles at once. Make sure to also upload the images to the appropriate directory on your web server.

### Option 2: API Upload

If your website has an API for content management, you can use the individual JSON files to upload each article programmatically. Here's a sample Python code to do this:

```python
import json
import requests
import os

# API endpoint and authentication
API_URL = "https://your-website.com/api/articles"
API_KEY = "your_api_key"

# Directory containing JSON files
json_dir = "/path/to/output"

# Loop through each JSON file
for filename in os.listdir(json_dir):
    if filename.endswith(".json") and filename != "all_articles.json":
        # Load article data
        with open(os.path.join(json_dir, filename), 'r') as f:
            article_data = json.load(f)
        
        # Upload article via API
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(API_URL, json=article_data, headers=headers)
        
        if response.status_code == 200:
            print(f"Successfully uploaded {filename}")
        else:
            print(f"Failed to upload {filename}: {response.text}")
```

### Option 3: Manual Upload

If you need to manually upload the articles to your CMS:

1. Open each JSON file to view the article content
2. Copy the headline and HTML content into your CMS
3. Upload the corresponding image and set the alt text and credit as specified in the JSON
4. Set the category and other metadata as needed

## Image Credits

All images have been properly credited in the JSON files and in the `image_references.md` file. Make sure to maintain these credits when publishing the articles on your website.

## Regenerating JSON Files

If you make any changes to the Markdown files or need to regenerate the JSON files, you can run the conversion script:

```bash
python3 convert_md_to_html.py
```

This will process all articles and update the JSON files in the `/output/` directory.

