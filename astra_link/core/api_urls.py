from django.urls import path

from . import api_views


urlpatterns = [
    path("launches/", api_views.LaunchListView.as_view(), name="api_launches"),
    path(
        "launches/<int:pk>/",
        api_views.LaunchDetailView.as_view(),
        name="api_launch_detail",
    ),
    path("agencies/", api_views.AgencyListView.as_view(), name="api_agencies"),
    path(
        "agencies/<str:provider>/",
        api_views.AgencyDetailView.as_view(),
        name="api_agency_detail",
    ),
    path(
        "rockets/<str:family>/",
        api_views.RocketFamilyDetailView.as_view(),
        name="api_rocket_family_detail",
    ),
    path(
        "my-launches/",
        api_views.FollowedLaunchListView.as_view(),
        name="api_my_launches",
    ),
    path("follow/", api_views.FollowToggleView.as_view(), name="api_follow"),
]
