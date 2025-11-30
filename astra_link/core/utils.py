import requests
from django.utils.dateparse import parse_datetime

from .models import Launch

LAUNCH_LIBRARY_BASE_URL = "https://ll.thespacedevs.com/2.2.0"


def fetch_upcoming_launches(limit: int = 30) -> int:

    url = f"{LAUNCH_LIBRARY_BASE_URL}/launch/upcoming/"
    params = {
        "limit": limit,
        "ordering": "net",  
    }

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    count = 0

    for item in data.get("results", []):
        external_id = item.get("id")
        name = item.get("name")
        net = parse_datetime(item.get("net")) if item.get("net") else None

        if not (external_id and name and net):
            continue

        mission_name = None
        mission_description = None
        if item.get("mission"):
            mission_name = item["mission"].get("name")
            mission_description = item["mission"].get("description")

        
        provider = None
        if item.get("launch_service_provider"):
            provider = item["launch_service_provider"].get("name")

        pad_name = None
        location_name = None
        if item.get("pad"):
            pad_name = item["pad"].get("name")
            if item["pad"].get("location"):
                location_name = item["pad"]["location"].get("name")

        rocket_name = None
        if item.get("rocket"):
            conf = item["rocket"].get("configuration")
            if conf:
                rocket_name = conf.get("full_name") or conf.get("name")

        image_url = item.get("image")
        info_urls = item.get("info_urls") or []
        vid_urls = item.get("vid_urls") or item.get("vidURLs") or []
        info_url = info_urls[0] if info_urls else None
        webcast_url = vid_urls[0] if vid_urls else None

        window_start = parse_datetime(item.get("window_start")) if item.get("window_start") else None
        window_end = parse_datetime(item.get("window_end")) if item.get("window_end") else None

        status = None
        if item.get("status"):
            status = item["status"].get("name")

        Launch.objects.update_or_create(
            external_id=external_id,
            defaults={
                "name": name,
                "provider": provider,
                "mission_name": mission_name,
                "mission_description": mission_description,
                "net": net,
                "window_start": window_start,
                "window_end": window_end,
                "pad_name": pad_name,
                "location_name": location_name,
                "rocket_name": rocket_name,
                "image_url": image_url,
                "info_url": info_url,
                "webcast_url": webcast_url,
                "status": status,
            },
        )

        count += 1

    return count
