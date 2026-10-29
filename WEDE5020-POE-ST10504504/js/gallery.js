/* ==========================================================================
   Desai's Bakery | gallery.js  (About page gallery)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   LIGHTBOX: clicking a gallery thumbnail opens the large version of the
   image in an overlay instead of leaving the page.
     - Previous / next buttons, plus Left and Right arrow keys
     - Escape key, the close button or a click on the dark background closes it
     - Swipe left / right on touch screens
     - Keyboard focus stays inside the lightbox while it is open and goes
       back to the thumbnail afterwards (W3C WAI, 2026b)
   Without JavaScript each thumbnail is still a normal link to the large image.
   ========================================================================== */

(function () {
    "use strict";

    var links = Array.prototype.slice.call(document.querySelectorAll(".gallery a[data-lightbox]"));
    if (!links.length) { return; }

    var current = 0;
    var lastFocused = null;

    /* ---- Build the lightbox once with DOM methods ---- */
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.hidden = true;

    overlay.innerHTML =
        '<figure class="lightbox-figure">' +
            '<img class="lightbox-image" src="" alt="">' +
            '<figcaption class="lightbox-caption"></figcaption>' +
        '</figure>' +
        '<p class="lightbox-counter" aria-live="polite"></p>' +
        '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close image viewer">&times;</button>' +
        '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>' +
        '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>';

    document.body.appendChild(overlay);

    var image = overlay.querySelector(".lightbox-image");
    var caption = overlay.querySelector(".lightbox-caption");
    var counter = overlay.querySelector(".lightbox-counter");
    var closeBtn = overlay.querySelector(".lightbox-close");
    var prevBtn = overlay.querySelector(".lightbox-prev");
    var nextBtn = overlay.querySelector(".lightbox-next");

    /* ---- Show a given image ---- */
    function show(index) {
        current = (index + links.length) % links.length;   // wraps around at both ends
        var link = links[current];
        var thumb = link.querySelector("img");

        image.classList.remove("is-loaded");
        image.onload = function () { image.classList.add("is-loaded"); };
        image.src = link.getAttribute("href");
        image.alt = thumb.alt;
        caption.textContent = link.dataset.caption || thumb.alt;
        counter.textContent = "Image " + (current + 1) + " of " + links.length;
    }

    function open(index) {
        lastFocused = document.activeElement;
        show(index);
        overlay.hidden = false;
        document.body.classList.add("no-scroll");
        // next frame so the CSS fade-in transition runs
        window.requestAnimationFrame(function () { overlay.classList.add("is-open"); });
        closeBtn.focus();
    }

    function close() {
        overlay.classList.remove("is-open");
        document.body.classList.remove("no-scroll");
        overlay.hidden = true;
        if (lastFocused) { lastFocused.focus(); }
    }

    /* ---- Events ---- */
    links.forEach(function (link, index) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            open(index);
        });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });

    /* Clicking the dark background (not the image) closes the viewer */
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) { close(); }
    });

    /* Keyboard: Escape, arrows, and Tab kept inside the dialog */
    document.addEventListener("keydown", function (event) {
        if (overlay.hidden) { return; }
        if (event.key === "Escape") { close(); }
        else if (event.key === "ArrowLeft") { show(current - 1); }
        else if (event.key === "ArrowRight") { show(current + 1); }
        else if (event.key === "Tab") {
            var focusable = [closeBtn, prevBtn, nextBtn];
            var position = focusable.indexOf(document.activeElement);
            event.preventDefault();
            var step = event.shiftKey ? -1 : 1;
            focusable[(position + step + focusable.length) % focusable.length].focus();
        }
    });

    /* Touch swipe */
    var touchStartX = null;
    overlay.addEventListener("touchstart", function (event) {
        touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    overlay.addEventListener("touchend", function (event) {
        if (touchStartX === null) { return; }
        var distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 50) { show(distance < 0 ? current + 1 : current - 1); }
        touchStartX = null;
    });
})();
