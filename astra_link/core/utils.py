import time

import requests
from datetime import datetime, timezone
from django.utils.timezone import is_aware, make_aware
from mongoengine import DoesNotExist
from .models import Launch, LaunchStatusHistory


API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50"
HISTORICAL_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=100"


def fetch_with_retry(url, max_retries=3):
    response = None

    for attempt in range(max_retries):
        response = requests.get(url, timeout=10)

        if response.status_code == 429:
            print(f"Rate limited. Waiting 60s before retry {attempt + 1}/{max_retries}...")
            time.sleep(60)
            continue

        response.raise_for_status()
        return response

    response.raise_for_status()


def parse_datetime_safe(value: str):
    if not value:
        return None

    value = value.replace("Z", "+00:00")

    dt = datetime.fromisoformat(value)

    if is_aware(dt):
        return dt

    return make_aware(dt)


def upsert_launch(external_id, defaults):
    now = datetime.now(timezone.utc)

    try:
        launch = Launch.objects.get(external_id=external_id)
        if launch.status != defaults["status"]:
            LaunchStatusHistory(
                launch=launch,
                previous_status=launch.status,
                new_status=defaults["status"],
                recorded_at=now,
            ).save()

        for field_name, value in defaults.items():
            setattr(launch, field_name, value)
        launch.updated_at = now
        launch.save()
    except DoesNotExist:
        Launch(
            external_id=external_id,
            created_at=now,
            updated_at=now,
            **defaults
        ).save()


def fetch_upcoming_launches():
    count = 0
    url = API_URL

    while url:
        try:
            response = fetch_with_retry(url)
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
            rocket_family = (
                item.get("rocket", {})
                    .get("configuration", {})
                    .get("family")
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
            orbit = None
            mission_type = None
            if item.get("mission"):
                mission_name = item["mission"].get("name")
                mission_description = item["mission"].get("description")
                mission_type = item["mission"].get("type")
                if item["mission"].get("orbit"):
                    orbit = item["mission"]["orbit"].get("name")

            status = item.get("status", {}).get("name")

            image_url = item.get("image")
            info_url = item.get("infoURLs")[0] if item.get("infoURLs") else None
            webcast_url = item.get("webcast") or None

            upsert_launch(
                external_id,
                {
                    "name": item.get("name"),
                    "net": net,
                    "window_start": window_start,
                    "window_end": window_end,

                    "provider": provider,
                    "rocket_name": rocket_name,
                    "rocket_family": rocket_family,
                    "pad_name": pad_name,
                    "location_name": location_name,

                    "mission_name": mission_name,
                    "mission_description": mission_description,
                    "mission_type": mission_type,
                    "orbit": orbit,

                    "status": status,
                    "launch_success": None,
                    "image_url": image_url,
                    "info_url": info_url,
                    "webcast_url": webcast_url,
                }
            )

            count += 1

        url = data.get("next")
        time.sleep(1)

    return count


def fetch_historical_launches():
    count = 0
    url = HISTORICAL_API_URL

    while url:
        try:
            response = fetch_with_retry(url)
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
            rocket_family = (
                item.get("rocket", {})
                    .get("configuration", {})
                    .get("family")
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
            orbit = None
            mission_type = None
            if item.get("mission"):
                mission_name = item["mission"].get("name")
                mission_description = item["mission"].get("description")
                mission_type = item["mission"].get("type")
                if item["mission"].get("orbit"):
                    orbit = item["mission"]["orbit"].get("name")

            status = item.get("status", {}).get("name")

            image_url = item.get("image")
            info_url = item.get("infoURLs")[0] if item.get("infoURLs") else None
            webcast_url = item.get("webcast") or None

            upsert_launch(
                external_id,
                {
                    "name": item.get("name"),
                    "net": net,
                    "window_start": window_start,
                    "window_end": window_end,

                    "provider": provider,
                    "rocket_name": rocket_name,
                    "rocket_family": rocket_family,
                    "pad_name": pad_name,
                    "location_name": location_name,

                    "mission_name": mission_name,
                    "mission_description": mission_description,
                    "mission_type": mission_type,
                    "orbit": orbit,

                    "status": status,
                    "launch_success": item.get("launch_success"),
                    "image_url": image_url,
                    "info_url": info_url,
                    "webcast_url": webcast_url,
                }
            )

            count += 1

        url = data.get("next")
        time.sleep(1)

    return count
