from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Launch, FollowedLaunch, UserProfile
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages

from django.utils.timezone import now, make_aware
from datetime import datetime, timezone

def parse_date_safe(date_value):
    if isinstance(date_value, datetime):
        if date_value.tzinfo is None:
            return make_aware(date_value)
        return date_value

    if isinstance(date_value, str):
        cleaned = date_value.replace("Z", "+00:00")

        try:
            dt = datetime.fromisoformat(cleaned)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        except:
            pass
        try:
            dt = datetime.strptime(date_value, "%Y-%m-%d %H:%M:%S")
            return make_aware(dt)
        except:
            pass

    return None


def index(request):
    launches = Launch.objects.all()
    upcoming = []

    for launch in launches:
        dt = parse_date_safe(launch.net)

        if dt is None:
            upcoming.append(launch)  
        else:
            if dt > now():
                upcoming.append(launch)

    if request.user.is_authenticated:
        user_followed = list(
            request.user.followed_launches.values_list("launch_id", flat=True)
        )
    else:
        user_followed = []

    return render(request, "index.html", {
        "launches": upcoming,
        "user_followed": user_followed,
    })


def logout_view(request):
    logout(request)
    return redirect("index")

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect("index")
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "registration/login.html")

def register_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password1 = request.POST.get("password", "")
        password2 = request.POST.get("confirm", "")

        if not username or not password1 or not password2:
            messages.error(request, "Please fill in all fields.")
            return render(request, "registration/register.html")

        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return render(request, "registration/register.html")

        if User.objects.filter(username=username).exists():
            messages.error(request, "This username is already taken.")
            return render(request, "registration/register.html")

        user = User.objects.create_user(username=username, password=password1)

        UserProfile.objects.create(user=user)

        login(request, user)

        return redirect("index")

    return render(request, "registration/register.html")


def launch_detail(request, launch_id):
    launch = get_object_or_404(Launch, pk=launch_id)

    is_following = False
    if request.user.is_authenticated:
        is_following = launch.followers.filter(user=request.user).exists()

    return render(
        request,
        "detail.html",
        {
            "launch": launch,
            "is_following": is_following,
        }
    )



@login_required
def follow_launch(request, launch_id):
    launch = get_object_or_404(Launch, pk=launch_id)
    FollowedLaunch.objects.get_or_create(user=request.user, launch=launch)
    return redirect("launch_detail", launch_id=launch_id)


@login_required
def unfollow_launch(request, launch_id):
    launch = get_object_or_404(Launch, pk=launch_id)
    FollowedLaunch.objects.filter(user=request.user, launch=launch).delete()
    return redirect("launch_detail", launch_id=launch_id)



@login_required
def followed_launches(request):
    followed = request.user.followed_launches.select_related("launch").all()

    launches = [f.launch for f in followed]

    return render(request, "mylaunches.html", {"launches": launches})

@login_required
def api_follow(request, launch_id):
    launch = Launch.objects.get(id=launch_id)
    FollowedLaunch.objects.get_or_create(user=request.user, launch=launch)
    return JsonResponse({"status": "followed"})

@login_required
def api_unfollow(request, launch_id):
    launch = Launch.objects.get(id=launch_id)
    FollowedLaunch.objects.filter(user=request.user, launch=launch).delete()
    return JsonResponse({"status": "unfollowed"})