from collections import Counter
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from mongoengine import DoesNotExist

from core.models import AgencyStats, Launch, LaunchStatusHistory, RocketStats


def most_common_value(launches, field_name):
    counts = Counter(
        value
        for value in (getattr(launch, field_name) for launch in launches)
        if value
    )
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def average_status_changes(launches):
    counts = [
        LaunchStatusHistory.objects(launch=launch).count()
        for launch in launches
    ]
    if not counts:
        return None
    return round(sum(counts) / len(counts), 2)


def success_rate(successful_launches, total_launches):
    if total_launches == 0:
        return None
    return round(successful_launches / total_launches * 100, 2)


def save_agency_stats(provider, defaults):
    try:
        stats = AgencyStats.objects.get(provider=provider)
        for field_name, value in defaults.items():
            setattr(stats, field_name, value)
    except DoesNotExist:
        stats = AgencyStats(provider=provider, **defaults)
    stats.save()


def save_rocket_stats(rocket_family, defaults):
    try:
        stats = RocketStats.objects.get(rocket_family=rocket_family)
        for field_name, value in defaults.items():
            setattr(stats, field_name, value)
    except DoesNotExist:
        stats = RocketStats(rocket_family=rocket_family, **defaults)
    stats.save()


class Command(BaseCommand):
    help = "Compute launch reliability analytics from historical launch data"

    def handle(self, *args, **options):
        agency_count = 0
        rocket_count = 0

        providers = sorted(
            provider
            for provider in Launch.objects.distinct("provider")
            if provider
        )

        for provider in providers:
            launches = list(Launch.objects(provider=provider))
            total_launches = Launch.objects(
                provider=provider,
                launch_success__ne=None
            ).count()
            successful_launches = Launch.objects(
                provider=provider,
                launch_success=True
            ).count()
            failed_launches = Launch.objects(
                provider=provider,
                launch_success=False
            ).count()

            save_agency_stats(
                provider,
                {
                    "total_launches": total_launches,
                    "successful_launches": successful_launches,
                    "failed_launches": failed_launches,
                    "success_rate": success_rate(
                        successful_launches,
                        total_launches
                    ),
                    "avg_status_changes": average_status_changes(launches),
                    "most_common_orbit": most_common_value(launches, "orbit"),
                    "most_common_mission_type": most_common_value(
                        launches,
                        "mission_type"
                    ),
                    "last_computed": datetime.now(timezone.utc),
                },
            )
            agency_count += 1
            self.stdout.write(f"Processed agency: {provider}")

        rocket_families = sorted(
            rocket_family
            for rocket_family in Launch.objects.distinct("rocket_family")
            if rocket_family
        )

        for rocket_family in rocket_families:
            launches = list(Launch.objects(rocket_family=rocket_family))
            total_launches = Launch.objects(
                rocket_family=rocket_family,
                launch_success__ne=None
            ).count()
            successful_launches = Launch.objects(
                rocket_family=rocket_family,
                launch_success=True
            ).count()
            failed_launches = Launch.objects(
                rocket_family=rocket_family,
                launch_success=False
            ).count()

            save_rocket_stats(
                rocket_family,
                {
                    "total_launches": total_launches,
                    "successful_launches": successful_launches,
                    "failed_launches": failed_launches,
                    "success_rate": success_rate(
                        successful_launches,
                        total_launches
                    ),
                    "avg_status_changes": average_status_changes(launches),
                    "most_common_orbit": most_common_value(launches, "orbit"),
                    "last_computed": datetime.now(timezone.utc),
                },
            )
            rocket_count += 1
            self.stdout.write(f"Processed rocket family: {rocket_family}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {agency_count} agency records, "
                f"{rocket_count} rocket records computed."
            )
        )
