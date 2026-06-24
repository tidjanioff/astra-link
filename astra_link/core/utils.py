import json
import os
import time

import anthropic
import requests
from datetime import datetime
from django.utils.timezone import is_aware, make_aware
from .models import Launch, LaunchStatusHistory, RocketStats


API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50"
HISTORICAL_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/previous/?limit=100"


def build_mission_briefing_snapshot(launch):
    rocket_stats = None
    if launch.rocket_family:
        rocket_stats = RocketStats.objects.filter(
            rocket_family=launch.rocket_family
        ).first()

    reliability_context = None
    if rocket_stats:
        reliability_context = {
            "success_rate": rocket_stats.success_rate,
            "avg_status_changes": rocket_stats.avg_status_changes,
        }

    return {
        "launch_name": launch.name,
        "provider": launch.provider,
        "rocket_name": launch.rocket_name,
        "rocket_family": launch.rocket_family,
        "mission_name": launch.mission_name,
        "mission_description": launch.mission_description,
        "target_orbit": launch.orbit,
        "mission_type": launch.mission_type,
        "launch_site": {
            "pad": launch.pad_name,
            "location": launch.location_name,
        },
        "net": launch.net.isoformat() if launch.net else None,
        "status": launch.status,
        "reliability_context": reliability_context,
    }


def generate_mission_briefing(launch):
    client = anthropic.Anthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY")
    )
    launch_data = build_mission_briefing_snapshot(launch)

    system_prompt = (
        "You are a space mission analyst. Write concise, factual mission "
        "briefings for space launches. Use clear technical language "
        "appropriate for space enthusiasts and professionals. Never speculate "
        "beyond the provided data."
    )
    user_prompt = (
        "Launch data:\n"
        f"{json.dumps(launch_data, indent=2)}\n\n"
        "Write a 3-4 paragraph mission briefing covering: mission objectives, "
        "vehicle profile and reliability history, launch site and orbital "
        "parameters, and mission significance. Write in plain prose only — "
        "no markdown, no headers, no bullet points, no hashtags. Just clean "
        "paragraphs separated by line breaks."
    )

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    return response.content[0].text


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


def launch_success_from_status(status):
    if not status:
        return None
    if "Success" in status:
        return True
    if "Failure" in status:
        return False
    return None


def upsert_launch(external_id, defaults):
    launch = Launch.objects.filter(external_id=external_id).first()

    if launch and launch.status != defaults["status"]:
        LaunchStatusHistory.objects.create(
            launch=launch,
            previous_status=launch.status,
            new_status=defaults["status"],
        )

    Launch.objects.update_or_create(
        external_id=external_id,
        defaults=defaults,
    )


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
            launch_success = launch_success_from_status(status)

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
                    "launch_success": launch_success,
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
            launch_success = launch_success_from_status(status)

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
                    "launch_success": launch_success,
                    "image_url": image_url,
                    "info_url": info_url,
                    "webcast_url": webcast_url,
                }
            )

            count += 1

        url = data.get("next")
        time.sleep(1)

    return count
