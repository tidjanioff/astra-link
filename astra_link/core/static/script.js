document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("countdown");
    if (!root) return;

    const launchDate = root.dataset.launchDate;
    const target = new Date(launchDate).getTime();

    const elD = document.getElementById("cd-days");
    const elH = document.getElementById("cd-hours");
    const elM = document.getElementById("cd-minutes");
    const elS = document.getElementById("cd-seconds");

    function update() {
        const now = Date.now();
        const diff = target - now;

        if (diff <= 0) {
            elD.textContent = "00";
            elH.textContent = "00";
            elM.textContent = "00";
            elS.textContent = "00";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        elD.textContent = d.toString().padStart(2, "0");
        elH.textContent = h.toString().padStart(2, "0");
        elM.textContent = m.toString().padStart(2, "0");
        elS.textContent = s.toString().padStart(2, "0");
    }

    update();
    setInterval(update, 1000);
});




document.addEventListener("DOMContentLoaded", async () => {

    const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=5");
    const data = await res.json();
    const articles = data.results;

    const slidesContainer = document.getElementById("hero-slides");
    const titleEl = document.getElementById("hero-title");
    const summaryEl = document.getElementById("hero-summary");
    const btnEl = document.getElementById("hero-btn");

    slidesContainer.className =
        "absolute inset-0 flex transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

    articles.forEach(a => {
        const div = document.createElement("div");
        div.className = "w-full h-full flex-shrink-0 relative overflow-hidden";
        div.innerHTML = `
            <img src="${a.image_url}"
                 class="w-full h-full object-cover brightness-[0.95]">
        `;
        slidesContainer.appendChild(div);
    });

    let index = 0;

    function updateSlide() {
        slidesContainer.style.transform = `translateX(-${index * 100}%)`;

        titleEl.style.opacity = 0;
        summaryEl.style.opacity = 0;
        btnEl.style.opacity = 0;

        setTimeout(() => {
            titleEl.textContent = articles[index].title;
            summaryEl.textContent = articles[index].summary.slice(0, 120) + "...";
            btnEl.href = articles[index].url;

            titleEl.style.opacity = 1;
            summaryEl.style.opacity = 1;
            btnEl.style.opacity = 1;
        }, 200);
    }

    updateSlide();

    setInterval(() => {
        index = (index + 1) % articles.length;
        updateSlide();
    }, 6000);
});

// MINI COUNTDOWN FOR CARDS
document.addEventListener("DOMContentLoaded", () => {
    const items = document.querySelectorAll("[data-mini-countdown]");

    items.forEach(el => {
        const iso = el.dataset.launchDate;
        if (!iso) return;

        const target = new Date(iso).getTime();

        function update() {
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                el.textContent = "Launched!";
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);

            el.textContent = `${d}d ${h}h remaining`;
        }

        update();
        setInterval(update, 60000); 
    });
});



document.addEventListener("DOMContentLoaded", () => {

    function getCSRFToken() {
        let cookieValue = null;
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith("csrftoken=")) {
                cookieValue = cookie.substring("csrftoken=".length);
                break;
            }
        }
        return cookieValue;
    }

    const buttons = document.querySelectorAll("[data-follow-btn]");

    buttons.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation(); 

            const id = btn.dataset.launchId;
            const isUnfollow = btn.textContent.trim() === "Unfollow";

            const url = isUnfollow
                ? `/api/unfollow/${id}/`
                : `/api/follow/${id}/`;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCSRFToken(),
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (res.ok) {

            
                if (isUnfollow) {
                    btn.textContent = "Follow";
                    btn.classList.remove("bg-red-600/80", "hover:bg-red-700");
                    btn.classList.add("bg-cyan-600/80", "hover:bg-cyan-700");
                } else {
                    btn.textContent = "Unfollow";
                    btn.classList.remove("bg-cyan-600/80", "hover:bg-cyan-700");
                    btn.classList.add("bg-red-600/80", "hover:bg-red-700");
                }

           
                const card = document.querySelector(`[data-launch-card="${id}"]`);
                if (card && isUnfollow) {

                    card.style.opacity = "0";
                    card.style.transition = "opacity 300ms";

                    setTimeout(() => {
                        card.remove();

                
                        const counter = document.getElementById("follow-counter");

                        if (counter) {
                            const current = parseInt(counter.textContent.match(/\d+/)[0]);
                            const next = current - 1;

                            if (next > 0) {
                                counter.textContent = `You are following ${next} launches 🚀`;
                            } else {
                                counter.remove();  
                            }
                        }

                        const grid = document.querySelector(".grid");
                        if (grid && grid.children.length === 0) {
                            grid.innerHTML = `
                                <div class="col-span-2 text-center py-20">
                                    <p class="text-gray-400 mb-3">
                                        You are not following any launches yet.
                                    </p>
                                    <a href="/"
                                       class="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 
                                              rounded-lg text-white text-sm">
                                        Browse Upcoming Launches
                                    </a>
                                </div>
                            `;
                        }

                    }, 300);
                }
            }
        });
    });

});

