from django.core.management.base import BaseCommand

from core.models import Launch


class Command(BaseCommand):
    help = "Backfill launch_success from existing launch status values"

    def handle(self, *args, **options):
        successes = 0
        failures = 0
        unchanged = 0

        for launch in Launch.objects.filter(launch_success__isnull=True):
            if launch.status and "Success" in launch.status:
                launch.launch_success = True
                launch.save(update_fields=["launch_success"])
                successes += 1
            elif launch.status and "Failure" in launch.status:
                launch.launch_success = False
                launch.save(update_fields=["launch_success"])
                failures += 1
            else:
                unchanged += 1

        self.stdout.write(
            f"Backfilled {successes} successes, {failures} failures, "
            f"{unchanged} unchanged"
        )
