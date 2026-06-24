from collections import Counter

from django.core.management.base import BaseCommand

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
        LaunchStatusHistory.objects.filter(launch=launch).count()
        for launch in launches
    ]
    if not counts:
        return None
    return round(sum(counts) / len(counts), 2)


def success_rate(successful_launches, total_launches):
    if total_launches == 0:
        return None
    return round(successful_launches / total_launches * 100, 2)


class Command(BaseCommand):
    help = "Compute launch reliability analytics from historical launch data"

    def handle(self, *args, **options):
        agency_count = 0
        rocket_count = 0

        providers = sorted(
            provider
            for provider in Launch.objects.values_list(
                "provider",
                flat=True
            ).distinct()
            if provider
        )

        for provider in providers:
            launches = list(Launch.objects.filter(provider=provider))
            total_launches = Launch.objects.filter(
                provider=provider,
                launch_success__isnull=False
            ).count()
            successful_launches = Launch.objects.filter(
                provider=provider,
                launch_success=True
            ).count()
            failed_launches = Launch.objects.filter(
                provider=provider,
                launch_success=False
            ).count()

            AgencyStats.objects.update_or_create(
                provider=provider,
                defaults={
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
                },
            )
            agency_count += 1
            self.stdout.write(f"Processed agency: {provider}")

        rocket_families = sorted(
            rocket_family
            for rocket_family in Launch.objects.values_list(
                "rocket_family",
                flat=True
            ).distinct()
            if rocket_family
        )

        for rocket_family in rocket_families:
            launches = list(Launch.objects.filter(rocket_family=rocket_family))
            total_launches = Launch.objects.filter(
                rocket_family=rocket_family,
                launch_success__isnull=False
            ).count()
            successful_launches = Launch.objects.filter(
                rocket_family=rocket_family,
                launch_success=True
            ).count()
            failed_launches = Launch.objects.filter(
                rocket_family=rocket_family,
                launch_success=False
            ).count()

            RocketStats.objects.update_or_create(
                rocket_family=rocket_family,
                defaults={
                    "total_launches": total_launches,
                    "successful_launches": successful_launches,
                    "failed_launches": failed_launches,
                    "success_rate": success_rate(
                        successful_launches,
                        total_launches
                    ),
                    "avg_status_changes": average_status_changes(launches),
                    "most_common_orbit": most_common_value(launches, "orbit"),
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
