import requests
from datetime import datetime
from django.utils.timezone import is_aware, make_aware
from .models import Launch


API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50"


def parse_datetime_safe(value: str):
    if not value:
        return None

    value = value.replace("Z", "+00:00")

    dt = datetime.fromisoformat(value)

    if is_aware(dt):
        return dt

    return make_aware(dt)


def fetch_upcoming_launches():
    count = 0
    url = API_URL

    while url:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
        except requests.RequestException as exc:
            print(f"Error fetching launches: {exc}")
            break

        data = response.json()

        for item in data.get("results", []):
            external_id = item["id"]

            net = parse_datetime_safe(item.get("net"))
            window_start = parse_datetime_safe(item.get("window_start"))
            window_end = parse_datetime_safe(item.get("window_end"))

            provider = (
                item.get("launch_service_provider", {}).get("name")
                if item.get("launch_service_provider")
                else None
            )

            rocket_name = (
                item.get("rocket", {})
                    .get("configuration", {})
                    .get("full_name")
                if item.get("rocket")
                else None
            )

            pad_name = item.get("pad", {}).get("name")
            location_name = (
                item.get("pad", {})
                    .get("location", {})
                    .get("name")
                if item.get("pad")
                else None
            )

            mission_name = None
            mission_description = None
            if item.get("mission"):
                mission_name = item["mission"].get("name")
                mission_description = item["mission"].get("description")

            status = item.get("status", {}).get("name")

            image_url = item.get("image")
            info_url = item.get("infoURLs")[0] if item.get("infoURLs") else None
            webcast_url = item.get("webcast") or None

            Launch.objects.update_or_create(
                external_id=external_id,
                defaults={
                    "name": item.get("name"),
                    "net": net,
                    "window_start": window_start,
                    "window_end": window_end,

                    "provider": provider,
                    "rocket_name": rocket_name,
                    "pad_name": pad_name,
                    "location_name": location_name,

                    "mission_name": mission_name,
                    "mission_description": mission_description,

                    "status": status,
                    "image_url": image_url,
                    "info_url": info_url,
                    "webcast_url": webcast_url,
                }
            )

            count += 1

        url = data.get("next")

    return count
