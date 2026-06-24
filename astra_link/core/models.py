from django.db import models
from django.contrib.auth.models import User


class Launch(models.Model):
    external_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="ID of the launch in the external API."
    )
    name = models.CharField(max_length=255)
    provider = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Launch provider (e.g. SpaceX, NASA, ESA)."
    )
    mission_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Mission name if available."
    )
    mission_description = models.TextField(
        blank=True,
        null=True,
        help_text="Short description of the mission."
    )
    net = models.DateTimeField(
        help_text="No Earlier Than (NET) datetime of the launch."
    )
    window_start = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Launch window start datetime."
    )
    window_end = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Launch window end datetime."
    )
    pad_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Launch pad name."
    )
    location_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Launch site / location name."
    )
    rocket_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Rocket or launch vehicle name."
    )
    rocket_family = models.CharField(max_length=100, blank=True, null=True)
    orbit = models.CharField(max_length=100, blank=True, null=True)
    mission_type = models.CharField(max_length=100, blank=True, null=True)
    launch_success = models.BooleanField(null=True)
    image_url = models.URLField(
        blank=True,
        null=True,
        help_text="Main image URL for this launch."
    )
    info_url = models.URLField(
        blank=True,
        null=True,
        help_text="More information about this launch."
    )
    webcast_url = models.URLField(
        blank=True,
        null=True,
        help_text="Webcast or livestream URL."
    )
    status = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Launch status (e.g. Go, TBD, Success)."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Datetime when this record was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Datetime when this record was last updated."
    )

    class Meta:
        ordering = ["net"]

    def __str__(self):
        return f"{self.name} ({self.net})"


class LaunchStatusHistory(models.Model):
    launch = models.ForeignKey(
        Launch,
        on_delete=models.CASCADE,
        related_name="status_history"
    )
    previous_status = models.CharField(max_length=100, blank=True, null=True)
    new_status = models.CharField(max_length=100)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self):
        return f"{self.launch.name}: {self.previous_status} → {self.new_status}"


class AgencyStats(models.Model):
    provider = models.CharField(max_length=255, unique=True)
    total_launches = models.IntegerField(default=0)
    successful_launches = models.IntegerField(default=0)
    failed_launches = models.IntegerField(default=0)
    success_rate = models.FloatField(null=True)
    avg_status_changes = models.FloatField(null=True)
    most_common_orbit = models.CharField(max_length=100, blank=True, null=True)
    most_common_mission_type = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    last_computed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider} — {self.success_rate}% success"


class RocketStats(models.Model):
    rocket_family = models.CharField(max_length=100, unique=True)
    total_launches = models.IntegerField(default=0)
    successful_launches = models.IntegerField(default=0)
    failed_launches = models.IntegerField(default=0)
    success_rate = models.FloatField(null=True)
    avg_status_changes = models.FloatField(null=True)
    most_common_orbit = models.CharField(max_length=100, blank=True, null=True)
    last_computed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.rocket_family} — {self.success_rate}% success"


class MissionBriefing(models.Model):
    launch = models.OneToOneField(
        Launch,
        on_delete=models.CASCADE,
        related_name="briefing",
    )
    content = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    launch_data_snapshot = models.TextField(
        help_text="Snapshot of launch data used to generate this briefing"
    )

    def __str__(self):
        return f"Briefing for {self.launch.name}"


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
    launch = models.ForeignKey(
        Launch,
        on_delete=models.CASCADE,
        related_name="followers"
    )
    followed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Datetime when the user started following this launch."
    )

    class Meta:
        unique_together = ("user", "launch")
        verbose_name = "Followed launch"
        verbose_name_plural = "Followed launches"

    def __str__(self):
        return f"{self.user.username} follows {self.launch.name}"
