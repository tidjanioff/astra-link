# AstraLink 🚀  

AstraLink is a **space launch tracking web app** that lets users browse, follow, and track **upcoming rocket launches** around the world.  
It combines live data from public space APIs with a **modern, dark-themed UI**, a personalized “My Launches” dashboard, and real-time countdowns for each mission.

<p align="center">
  <img src="astra_link/core/static/img/astralink.png" alt="AstraLink Logo" height="90">
</p>

---

## 🚀 Main Features  

- **Live Upcoming Launch Feed**  
  - Fetches upcoming launches from the **Launch Library 2 API**  
  - Displays mission name, rocket, NET time, image and status  
  - Hero section with a dynamic slider of recent **space news articles**

- **Launch Detail Pages**  
  - Dedicated page for each launch with:
    - Mission info (vehicle, provider, status)
    - Launch pad and location
    - Launch window (start / end)
    - External links (official info + webcast link)
  - Big, animated **countdown timer** until launch

- **Follow System & “My Launches”**  
  - Logged-in users can **follow / unfollow** any launch  
  - “My Launches” dashboard lists only followed launches  
  - Each card has:
    - A mini countdown  
    - A glowing **Unfollow** button  
  - Unfollowing via AJAX removes the card instantly and updates the counter

- **Real-Time UI Interactions (JavaScript)**  
  - Countdown timers on:
    - Launch detail page  
    - “My Launches” mini timers  
  - **Follow / Unfollow** buttons:
    - Use `fetch()` + CSRF token for POST requests  
    - Update button state + text without reloading  
    - Remove cards from the DOM when unfollowed  
  - Hero slider auto-rotates through space news articles

- **Authentication & Accounts**  
  - Custom **Register**, **Login**, and **Logout** pages  
  - Styled forms with logo, glow effects and dark UI  
  - Uses Django’s built-in authentication system  
  - Each user has a profile and their own followed launches

- **Responsive, Mobile-First UI**  
  - Fully responsive layout:
    - Mobile navigation bar  
    - Stacked cards on small screens  
    - Two-column grids on larger screens  
  - Dark, space-inspired aesthetic (deep blues, cyan glows, gradients)

---

## 🌐 APIs Used  

AstraLink uses two public APIs:

- **Launch Library 2 – Upcoming Launches**  
  Used to populate the main feed and details for each launch.  
  - `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=50`

- **Spaceflight News API – Space Articles for Hero Banner**  
  Used to show a rotating hero slider with the latest space news.  
  - `https://api.spaceflightnewsapi.net/v4/articles/?limit=5`

Data from these APIs is stored in a local database for launches and combined with user-specific data (follows) inside the Django app.

---

## 🛠 Tech Stack  

- **Backend:** Django (Python)  
- **Frontend:** HTML5, Tailwind CSS (via CDN), custom CSS  
- **JavaScript:** Vanilla JS for timers, AJAX follow/unfollow, hero slider  
- **Database:** SQLite (development)  
- **Auth:** Django’s authentication system (login, logout, register)  
- **APIs:** Launch Library 2, Spaceflight News API  

---

## 📸 UI Highlights  

- **Hero Section**
  - Full-width image slider powered by the Spaceflight News API  
  - Gradient overlay + “Read More” call-to-action

- **Upcoming Launches Grid**
  - Cards with mission image, name, NET time  
  - Hover effects (image zoom + overlay fade)  
  - Follow button integrated directly into each card

- **Launch Detail Page**
  - Large hero image for the selected launch  
  - Four-part animated countdown (days / hours / minutes / seconds)  
  - Two-column layout: Mission Info & Launch Pad  
  - Buttons for “More Info” and “Watch Webcast”

- **My Launches Dashboard**
  - Counter: “You are following _N_ launches” with glowing number  
  - Same card style as the homepage, but focused on followed launches  
  - Smooth removal animation when unfollowing

---

## 🎬 Live Demo

Check out the live demo of AstraLink in action:

🎥 [Live Demo on YouTube](https://youtu.be/OMstUhgU58c)


---

© 2025 **AstraLink** | Built by Tidjani. All rights reserved.
