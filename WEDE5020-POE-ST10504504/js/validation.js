/* ==========================================================================
   Desai's Bakery | validation.js  (shared by enquiry.html and contact.html)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   Small helper library for CLIENT-SIDE FORM VALIDATION.
   The HTML5 attributes (required, type, pattern, min, max) stay in the
   HTML as a first layer. The forms use "novalidate" so these JavaScript
   checks can show clear, friendly messages under each field instead of
   the browser's default pop-ups (MDN Web Docs, 2026d).

   Exposes one global object: window.FormValidation
   ========================================================================== */

(function () {
    "use strict";

    var patterns = {
        // letters (incl. accented), spaces, apostrophes and hyphens, 2–60 characters
        name: /^[A-Za-zÀ-ÿ' -]{2,60}$/,
        // standard "something@domain.tld" check
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        // South African cellphone/landline: 10 digits starting with 0
        phoneZA: /^0[0-9]{9}$/
    };

    /* Show an error under a field and mark it invalid for screen readers */
    function showError(field, message) {
        var wrapper = field.closest(".field") || field.closest("fieldset");
        var error = wrapper.querySelector(".error-message");
        if (!error) {
            error = document.createElement("p");
            error.className = "error-message";
            error.id = (field.id || field.name) + "-error";
            wrapper.appendChild(error);
        }
        error.textContent = message;
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", error.id);
        wrapper.classList.add("has-error");
    }

    function clearError(field) {
        var wrapper = field.closest(".field") || field.closest("fieldset");
        var error = wrapper.querySelector(".error-message");
        if (error) { error.textContent = ""; }
        field.removeAttribute("aria-invalid");
        wrapper.classList.remove("has-error");
    }

    /* Removes leading/trailing spaces and collapses repeated spaces */
    function clean(value) {
        return String(value).replace(/\s+/g, " ").trim();
    }

    /* Runs every rule in "rules" ({ fieldId: function(value, field) -> message or "" }).
       Returns true when the whole form is valid and focuses the first error. */
    function validate(form, rules) {
        var firstInvalid = null;
        Object.keys(rules).forEach(function (id) {
            var field = form.querySelector("#" + id);
            if (!field) { return; }
            var message = rules[id](field.type === "file" ? field.files : field.value, field);
            if (message) {
                showError(field, message);
                if (!firstInvalid) { firstInvalid = field; }
            } else {
                clearError(field);
            }
        });
        if (firstInvalid) { firstInvalid.focus(); }
        return firstInvalid === null;
    }

    /* Re-checks a single field when the visitor leaves it, and clears the
       error as soon as they fix it, so feedback is immediate but not noisy */
    function liveValidate(form, rules) {
        Object.keys(rules).forEach(function (id) {
            var field = form.querySelector("#" + id);
            if (!field) { return; }
            var check = function () {
                var message = rules[id](field.type === "file" ? field.files : field.value, field);
                if (message) { showError(field, message); } else { clearError(field); }
            };
            field.addEventListener("blur", check);
            field.addEventListener("change", check);
            field.addEventListener("input", function () {
                if (field.getAttribute("aria-invalid") === "true") { check(); }
            });
        });
    }

    /* Live "123 / 500 characters" counter under a textarea */
    function characterCounter(textarea, max) {
        var counter = document.createElement("p");
        counter.className = "char-counter";
        counter.setAttribute("aria-live", "polite");
        textarea.insertAdjacentElement("afterend", counter);
        function update() {
            var length = textarea.value.length;
            counter.textContent = length + " / " + max + " characters";
            counter.classList.toggle("is-over", length > max);
        }
        textarea.addEventListener("input", update);
        update();
    }

    window.FormValidation = {
        patterns: patterns,
        clean: clean,
        validate: validate,
        liveValidate: liveValidate,
        showError: showError,
        clearError: clearError,
        characterCounter: characterCounter
    };
})();
