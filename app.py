import time
import requests
from flask import Flask, jsonify, render_template, request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_DURATION = 600  # 10 minutes in seconds

cache = {
    "items": None,
    "last_updated": 0
}

def parse_feed_content(xml_data):
    root = ET.fromstring(xml_data)
    namespace = {"atom": "http://www.w3.org/2005/Atom"}
    
    parsed_items = []
    item_id_counter = 0
    
    for entry in root.findall("atom:entry", namespace):
        title_elem = entry.find("atom:title", namespace)
        date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
        
        updated_elem = entry.find("atom:updated", namespace)
        timestamp = updated_elem.text.strip() if updated_elem is not None else ""
        
        # Find the alternate link
        link = ""
        for l in entry.findall("atom:link", namespace):
            if l.get("rel") == "alternate":
                link = l.get("href")
                break
        if not link:
            l_any = entry.find("atom:link", namespace)
            if l_any is not None:
                link = l_any.get("href")
        
        content_elem = entry.find("atom:content", namespace)
        if content_elem is None or not content_elem.text:
            continue
            
        content_html = content_elem.text
        soup = BeautifulSoup(content_html, "html.parser")
        
        # Group siblings by h3 tag
        current_type = "Feature"
        current_tags = []
        
        for child in soup.contents:
            if child.name == "h3":
                if current_tags:
                    item_html = "".join(str(t) for t in current_tags).strip()
                    if item_html:
                        parsed_items.append({
                            "id": f"item-{item_id_counter}",
                            "date": date_str,
                            "timestamp": timestamp,
                            "type": current_type,
                            "content": item_html,
                            "link": link
                        })
                        item_id_counter += 1
                    current_tags = []
                current_type = child.get_text().strip()
            elif child.name is not None or (isinstance(child, str) and child.strip()):
                current_tags.append(child)
                
        # Append the final item
        if current_tags:
            item_html = "".join(str(t) for t in current_tags).strip()
            if item_html:
                parsed_items.append({
                    "id": f"item-{item_id_counter}",
                    "date": date_str,
                    "timestamp": timestamp,
                    "type": current_type,
                    "content": item_html,
                    "link": link
                })
                item_id_counter += 1
                
    return parsed_items

def get_release_notes(bypass_cache=False):
    global cache
    now = time.time()
    
    if not bypass_cache and cache["items"] is not None and (now - cache["last_updated"]) < CACHE_DURATION:
        return cache["items"], "cache", None
        
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        items = parse_feed_content(response.text)
        cache["items"] = items
        cache["last_updated"] = now
        return items, "live", None
    except Exception as e:
        if cache["items"] is not None:
            return cache["items"], "stale", str(e)
        return [], "error", str(e)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/releases")
def api_releases():
    refresh = request.args.get("refresh", "").lower() == "true"
    items, source, error = get_release_notes(bypass_cache=refresh)
    
    response_data = {
        "items": items,
        "source": source,
        "count": len(items),
        "last_updated": cache["last_updated"]
    }
    
    if error:
        response_data["error"] = error
        
    return jsonify(response_data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
