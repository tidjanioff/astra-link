document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("countdown");
    if (!el) return;

    const isoDate = el.dataset.launchDate;
    console.log("Launch Date =", isoDate);

    if (!isoDate) {
        el.textContent = "No NET date available.";
        return;
    }

    const launchTime = new Date(isoDate).getTime();

    function updateCountdown() {
        const now = Date.now();
        const diff = launchTime - now;

        if (diff <= 0) {
            el.textContent = "Launched!";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        el.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
});