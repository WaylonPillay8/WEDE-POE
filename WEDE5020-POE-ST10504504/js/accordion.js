/* ==========================================================================
   Desai's Bakery | accordion.js  (FAQ on the contact page)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   ACCORDION following the W3C ARIA Authoring Practices pattern
   (W3C WAI, 2026a). Each question is a <button> with aria-expanded and
   aria-controls. The answer panel opens with a smooth height transition.
   Without JavaScript all answers are simply shown.
   ========================================================================== */

(function () {
    "use strict";

    var accordions = document.querySelectorAll(".accordion");
    if (!accordions.length) { return; }

    accordions.forEach(function (accordion) {
        var buttons = accordion.querySelectorAll(".accordion-trigger");

        function setOpen(button, open) {
            var panel = document.getElementById(button.getAttribute("aria-controls"));
            button.setAttribute("aria-expanded", String(open));
            panel.classList.toggle("is-open", open);
            /* max-height is animated in CSS; scrollHeight is the panel's real height */
            panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
        }

        buttons.forEach(function (button, index) {
            setOpen(button, false);                     // start closed once JS is running

            button.addEventListener("click", function () {
                var isOpen = button.getAttribute("aria-expanded") === "true";
                /* Only one answer open at a time */
                buttons.forEach(function (other) { setOpen(other, false); });
                setOpen(button, !isOpen);
            });

            /* Up / Down / Home / End move between questions */
            button.addEventListener("keydown", function (event) {
                var target = null;
                if (event.key === "ArrowDown") { target = buttons[(index + 1) % buttons.length]; }
                if (event.key === "ArrowUp") { target = buttons[(index - 1 + buttons.length) % buttons.length]; }
                if (event.key === "Home") { target = buttons[0]; }
                if (event.key === "End") { target = buttons[buttons.length - 1]; }
                if (target) { event.preventDefault(); target.focus(); }
            });
        });

        accordion.classList.add("is-enhanced");
    });
})();
