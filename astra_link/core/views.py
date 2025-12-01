from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from .models import Launch, FollowedLaunch



def index(request):
    launches = Launch.objects.all()
    return render(request, "index.html", {"launches": launches})



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