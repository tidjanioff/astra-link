from rest_framework import serializers

from .models import AgencyStats, FollowedLaunch, Launch, RocketStats


class LaunchSerializer(serializers.ModelSerializer):
    reliability_score = serializers.SerializerMethodField()

    class Meta:
        model = Launch
        fields = "__all__"

    def get_reliability_score(self, obj):
        if not obj.rocket_family:
            return None

        stats = RocketStats.objects.filter(
            rocket_family=obj.rocket_family
        ).first()
        if not stats:
            return None

        return {
            "success_rate": stats.success_rate,
            "avg_status_changes": stats.avg_status_changes,
        }


class AgencyStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyStats
        fields = "__all__"


class RocketStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = RocketStats
        fields = "__all__"


class FollowedLaunchSerializer(serializers.ModelSerializer):
    launch_external_id = serializers.CharField(
        source="launch.external_id",
        read_only=True
    )

    class Meta:
        model = FollowedLaunch
        fields = ["id", "launch_external_id", "followed_at"]
