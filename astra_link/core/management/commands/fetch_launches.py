from django.core.management.base import BaseCommand

from core.utils import fetch_upcoming_launches


class Command(BaseCommand):
    help = "Fetch upcoming launches from Launch Library 2"

    def handle(self, *args, **options):
        try:
            count = fetch_upcoming_launches()
            self.stdout.write(
                self.style.SUCCESS(f"Successfully fetched {count} launches.")
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Error fetching launches: {exc}"))
