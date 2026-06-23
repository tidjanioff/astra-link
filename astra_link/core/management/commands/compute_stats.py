from django.core.management.base import BaseCommand
from django.db.models import Count

from core.models import AgencyStats, Launch, RocketStats


def most_common_value(queryset, field_name):
    result = (
        queryset.exclude(**{f"{field_name}__isnull": True})
        .exclude(**{field_name: ""})
        .values(field_name)
        .annotate(total=Count("id"))
        .order_by("-total", field_name)
        .first()
    )
    if not result:
        return None
    return result[field_name]


def average_status_changes(queryset):
    status_change_counts = queryset.annotate(
        status_change_count=Count("status_history")
    ).values_list("status_change_count", flat=True)
    counts = list(status_change_counts)
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

        providers = (
            Launch.objects.exclude(provider__isnull=True)
            .exclude(provider="")
            .values_list("provider", flat=True)
            .distinct()
            .order_by("provider")
        )

        for provider in providers:
            launches = Launch.objects.filter(provider=provider)
            completed_launches = launches.exclude(launch_success__isnull=True)
            total_launches = completed_launches.count()
            successful_launches = completed_launches.filter(
                launch_success=True
            ).count()
            failed_launches = completed_launches.filter(launch_success=False).count()

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

        rocket_families = (
            Launch.objects.exclude(rocket_family__isnull=True)
            .exclude(rocket_family="")
            .values_list("rocket_family", flat=True)
            .distinct()
            .order_by("rocket_family")
        )

        for rocket_family in rocket_families:
            launches = Launch.objects.filter(rocket_family=rocket_family)
            completed_launches = launches.exclude(launch_success__isnull=True)
            total_launches = completed_launches.count()
            successful_launches = completed_launches.filter(
                launch_success=True
            ).count()
            failed_launches = completed_launches.filter(launch_success=False).count()

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
