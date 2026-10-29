/* ==========================================================================
   Desai's Bakery – Jadeed's Bread | main.js
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   Shared JavaScript loaded (with "defer") on all five pages.
     1. Mobile navigation: closes the hamburger menu after a link is
        chosen or when Escape is pressed
     2. "Open now" status, worked out live from the trading hours
     3. Scroll-reveal animations (IntersectionObserver)
     4. Back-to-top button
     5. Current year in the footer
   Every feature checks that its elements exist first, so the same file
   can be used on every page without errors.
   ========================================================================== */

(function () {
    "use strict";

    /* Respect the user's "reduce motion" setting in all animations */
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* 1. MOBILE NAVIGATION ------------------------------------------------
       The hamburger menu itself is CSS-only (Part 2). JavaScript adds two
       usability improvements on top of it. */
    var navToggle = document.getElementById("nav-toggle");
    if (navToggle) {
        document.querySelectorAll(".main-nav a").forEach(function (link) {
            link.addEventListener("click", function () {
                navToggle.checked = false;
            });
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && navToggle.checked) {
                navToggle.checked = false;
                navToggle.focus();
            }
        });
    }


    /* 2. "OPEN NOW" STATUS -------------------------------------------------
       Trading hours are stored once as data. The current day and time are
       read in South African time (Africa/Johannesburg), so the message is
       correct even if the visitor's computer is set to another time zone. */
    var tradingHours = {
        // day number (0 = Sunday) : [open, close] in 24-hour "HH:MM"
        0: ["07:00", "12:00"],
        1: ["06:30", "18:00"],
        2: ["06:30", "18:00"],
        3: ["06:30", "18:00"],
        4: ["06:30", "18:00"],
        5: ["06:30", "18:00"],
        6: ["07:00", "14:00"]
    };
    var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    function toMinutes(hhmm) {
        var parts = hhmm.split(":");
        return Number(parts[0]) * 60 + Number(parts[1]);
    }

    /* Returns { day: 0-6, minutes: minutes since midnight } in SA time */
    function capeTownNow() {
        var parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Africa/Johannesburg",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).formatToParts(new Date());
        var lookup = {};
        parts.forEach(function (p) { lookup[p.type] = p.value; });
        var shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return {
            day: shortDays.indexOf(lookup.weekday),
            minutes: (Number(lookup.hour) % 24) * 60 + Number(lookup.minute)
        };
    }

    function openStatus() {
        var now = capeTownNow();
        var today = tradingHours[now.day];
        var opens = toMinutes(today[0]);
        var closes = toMinutes(today[1]);

        if (now.minutes >= opens && now.minutes < closes) {
            return { open: true, text: "Open now – closes at " + today[1] + " today" };
        }
        if (now.minutes < opens) {
            return { open: false, text: "Closed – opens at " + today[0] + " today" };
        }
        var next = (now.day + 1) % 7;
        return { open: false, text: "Closed – opens " + dayNames[next] + " at " + tradingHours[next][0] };
    }

    var statusEls = document.querySelectorAll("[data-open-status]");
    function renderStatus() {
        var status = openStatus();
        statusEls.forEach(function (el) {
            el.textContent = status.text;
            el.classList.toggle("is-open", status.open);
            el.classList.toggle("is-closed", !status.open);
            el.hidden = false;
        });
    }
    if (statusEls.length) {
        renderStatus();
        setInterval(renderStatus, 60000);   // refresh every minute
    }


    /* 3. SCROLL-REVEAL ANIMATIONS -------------------------------------------
       Elements with class "reveal" fade and slide in the first time they
       scroll into view. Without IntersectionObserver (or with reduced
       motion) they are simply shown straight away (MDN Web Docs, 2026h). */
    var revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
        if (!reduceMotion && "IntersectionObserver" in window) {
            document.documentElement.classList.add("js-reveal");
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            revealEls.forEach(function (el) { observer.observe(el); });
        }
    }


    /* 4. BACK-TO-TOP BUTTON -------------------------------------------------
       Created with DOM methods (not written in the HTML) because it is only
       useful when JavaScript is running. Appears after scrolling 600px. */
    var topButton = document.createElement("button");
    topButton.type = "button";
    topButton.className = "back-to-top";
    topButton.setAttribute("aria-label", "Back to top of page");
    topButton.innerHTML = "<span aria-hidden=\"true\">&uarr;</span>";
    document.body.appendChild(topButton);

    topButton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        var skipTarget = document.querySelector(".skip-link");
        if (skipTarget) { skipTarget.focus({ preventScroll: true }); }
    });

    var ticking = false;
    window.addEventListener("scroll", function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                topButton.classList.toggle("is-visible", window.scrollY > 600);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });


    /* 5. FOOTER YEAR --------------------------------------------------------- */
    document.querySelectorAll("[data-year]").forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });
})();
