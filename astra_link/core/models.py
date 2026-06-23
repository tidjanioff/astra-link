from django.db import models
from django.contrib.auth.models import User
from mongoengine import (
    CASCADE,
    BooleanField,
    DateTimeField,
    Document,
    FloatField,
    IntField,
    ReferenceField,
    StringField,
)


class Launch(Document):
    external_id = StringField(max_length=100, unique=True, required=True)
    name = StringField(max_length=255, required=True)
    provider = StringField(max_length=255, null=True)
    mission_name = StringField(max_length=255, null=True)
    mission_description = StringField(null=True)
    net = DateTimeField(required=True)
    window_start = DateTimeField(null=True)
    window_end = DateTimeField(null=True)
    pad_name = StringField(max_length=255, null=True)
    location_name = StringField(max_length=255, null=True)
    rocket_name = StringField(max_length=255, null=True)
    orbit = StringField(max_length=100, null=True)
    mission_type = StringField(max_length=100, null=True)
    rocket_family = StringField(max_length=100, null=True)
    launch_success = BooleanField(null=True)
    image_url = StringField(null=True)
    info_url = StringField(null=True)
    webcast_url = StringField(null=True)
    status = StringField(max_length=100, null=True)
    created_at = DateTimeField(required=True)
    updated_at = DateTimeField(required=True)

    meta = {
        "collection": "launches",
        "ordering": ["net"],
        "indexes": ["external_id", "net", "provider", "rocket_family"],
    }

    def __str__(self):
        return f"{self.name} ({self.net})"


class LaunchStatusHistory(Document):
    launch = ReferenceField(Launch, reverse_delete_rule=CASCADE, required=True)
    previous_status = StringField(max_length=100, null=True)
    new_status = StringField(max_length=100, required=True)
    recorded_at = DateTimeField(required=True)

    meta = {
        "collection": "launch_status_history",
        "ordering": ["-recorded_at"],
        "indexes": ["launch", "recorded_at"],
    }

    def __str__(self):
        return f"{self.launch.name}: {self.previous_status} → {self.new_status}"


class AgencyStats(Document):
    provider = StringField(max_length=255, unique=True, required=True)
    total_launches = IntField(default=0)
    successful_launches = IntField(default=0)
    failed_launches = IntField(default=0)
    success_rate = FloatField(null=True)
    avg_status_changes = FloatField(null=True)
    most_common_orbit = StringField(max_length=100, null=True)
    most_common_mission_type = StringField(max_length=100, null=True)
    last_computed = DateTimeField(required=True)

    meta = {
        "collection": "agency_stats",
        "ordering": ["provider"],
        "indexes": ["provider"],
    }

    def __str__(self):
        return f"{self.provider} — {self.success_rate}% success"


class RocketStats(Document):
    rocket_family = StringField(max_length=100, unique=True, required=True)
    total_launches = IntField(default=0)
    successful_launches = IntField(default=0)
    failed_launches = IntField(default=0)
    success_rate = FloatField(null=True)
    avg_status_changes = FloatField(null=True)
    most_common_orbit = StringField(max_length=100, null=True)
    last_computed = DateTimeField(required=True)

    meta = {
        "collection": "rocket_stats",
        "ordering": ["rocket_family"],
        "indexes": ["rocket_family"],
    }

    def __str__(self):
        return f"{self.rocket_family} — {self.success_rate}% success"


class UserProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    favorite_agency = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional preferred space agency."
    )

    def __str__(self):
        return f"Profile of {self.user.username}"


class FollowedLaunch(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followed_launches"
    )
    launch_external_id = models.CharField(max_length=100)
    followed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Datetime when the user started following this launch."
    )

    class Meta:
        unique_together = ("user", "launch_external_id")
        verbose_name = "Followed launch"
        verbose_name_plural = "Followed launches"

    def __str__(self):
        return f"{self.user.username} follows {self.launch_external_id}"
