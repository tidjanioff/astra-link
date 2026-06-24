from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AgencyStats, FollowedLaunch, Launch, RocketStats
from .serializers import (
    AgencyStatsSerializer,
    FollowedLaunchSerializer,
    LaunchSerializer,
    RocketStatsSerializer,
)


class LaunchListView(generics.ListAPIView):
    serializer_class = LaunchSerializer

    def get_queryset(self):
        queryset = Launch.objects.all()
        provider = self.request.query_params.get("provider")
        rocket_family = self.request.query_params.get("rocket_family")
        orbit = self.request.query_params.get("orbit")
        mission_type = self.request.query_params.get("mission_type")
        search = self.request.query_params.get("search")
        upcoming = self.request.query_params.get("upcoming")
        show_all = self.request.query_params.get("all")

        if provider:
            queryset = queryset.filter(provider=provider)
        if rocket_family:
            queryset = queryset.filter(rocket_family=rocket_family)
        if orbit:
            queryset = queryset.filter(orbit=orbit)
        if mission_type:
            queryset = queryset.filter(mission_type=mission_type)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(mission_name__icontains=search)
            )
        if show_all == "true":
            return queryset.order_by("-net")

        if upcoming == "true" or upcoming is None:
            queryset = queryset.filter(net__gt=timezone.now())

        return queryset.order_by("net")


class LaunchDetailView(generics.RetrieveAPIView):
    queryset = Launch.objects.all()
    serializer_class = LaunchSerializer


class AgencyListView(generics.ListAPIView):
    queryset = AgencyStats.objects.order_by("-total_launches")
    serializer_class = AgencyStatsSerializer


class AgencyDetailView(generics.RetrieveAPIView):
    queryset = AgencyStats.objects.all()
    serializer_class = AgencyStatsSerializer
    lookup_field = "provider"
    lookup_url_kwarg = "provider"

    def retrieve(self, request, *args, **kwargs):
        agency = self.get_object()
        data = self.get_serializer(agency).data
        launches = Launch.objects.filter(provider=agency.provider)
        data["launches"] = LaunchSerializer(launches, many=True).data
        return Response(data)


class RocketFamilyDetailView(generics.RetrieveAPIView):
    queryset = RocketStats.objects.all()
    serializer_class = RocketStatsSerializer
    lookup_field = "rocket_family"
    lookup_url_kwarg = "family"

    def retrieve(self, request, *args, **kwargs):
        rocket_stats = self.get_object()
        data = self.get_serializer(rocket_stats).data
        launches = Launch.objects.filter(
            rocket_family=rocket_stats.rocket_family
        )
        data["launches"] = LaunchSerializer(launches, many=True).data
        return Response(data)


class FollowedLaunchListView(generics.ListAPIView):
    serializer_class = FollowedLaunchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FollowedLaunch.objects.filter(
            user=self.request.user
        ).select_related("launch")


class FollowToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        launch_external_id = request.data.get("launch_external_id")
        if not launch_external_id:
            return Response(
                {"detail": "launch_external_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        launch = Launch.objects.filter(external_id=launch_external_id).first()
        if not launch:
            return Response(
                {"detail": "Launch not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        followed_launch, created = FollowedLaunch.objects.get_or_create(
            user=request.user,
            launch=launch,
        )
        if not created:
            followed_launch.delete()

        return Response({"followed": created})


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        login(request, user)
        return Response({"username": user.username})


class LogoutView(APIView):
    def post(self, request, *args, **kwargs):
        logout(request)
        return Response({})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return Response(
            {"username": user.username},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"username": request.user.username})
