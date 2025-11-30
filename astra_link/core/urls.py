from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("launch/<int:launch_id>/", views.launch_detail, name="launch_detail"),
    path("launch/<int:launch_id>/follow/", views.follow_launch, name="follow_launch"),
    path("launch/<int:launch_id>/unfollow/", views.unfollow_launch, name="unfollow_launch"),
    path("my-launches/", views.followed_launches, name="my_launches"),
]