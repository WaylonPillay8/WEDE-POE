/* ==========================================================================
   Desai's Bakery | enquiry.js  (Order & Enquire page)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   1. Changes the form to suit the order type (cake / catering / bulk bread)
   2. Validates every field with JavaScript and shows inline errors
   3. Works out an ESTIMATED QUOTE and checks AVAILABILITY for the date
   4. Shows the response to the visitor on the page
   5. Sends the enquiry with AJAX (fetch) to Formspree, if an endpoint is set,
      without reloading the page (MDN Web Docs, 2026e)
   ========================================================================== */

(function () {
    "use strict";

    var form = document.getElementById("enquiry-form");
    if (!form || !window.FormValidation) { return; }
    var V = window.FormValidation;

    /* --------------------------------------------------------------------
       SETTINGS
       To receive enquiries by email, create a free form at formspree.io and
       put its endpoint in the form's action attribute in enquiry.html,
       e.g. action="https://formspree.io/f/abcdwxyz".
       While the action is still the mailto: fallback, the quote is worked
       out and shown, but nothing is sent in the background.
       -------------------------------------------------------------------- */
    var action = form.getAttribute("action") || "";
    var FORM_ENDPOINT = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(action) ? action : "";
    var BAKERY_EMAIL = "orders@desaisbakery.co.za";

    /* Pricing rules (rand) – based on the prices on the menu page */
    var pricing = {
        "custom-cake": { label: "Custom celebration cake", base: 550, includes: 20, extra: 22, leadDays: 5, unit: "servings", min: 6, max: 150 },
        "catering":    { label: "Catering platters",       perUnit: 32, leadDays: 3, unit: "guests",  min: 10, max: 300 },
        "bulk":        { label: "Bulk bread order",        perUnit: 17, leadDays: 2, unit: "loaves",  min: 10, max: 300 }
    };
    var WEDDING_LEAD_DAYS = 21;
    var WEDDING_SURCHARGE = 0.25;        // tiered design and extra decoration
    var DELIVERY_FEE = 60;
    var budgetLimits = { "under-600": 600, "600-1000": 1000, "1000-2000": 2000, "over-2000": Infinity };

    /* ---- Elements ---- */
    var typeRadios = form.querySelectorAll("input[name='enquiry-type']");
    var servingsLabel = form.querySelector("label[for='servings']");
    var servings = document.getElementById("servings");
    var flavourField = document.getElementById("flavour").closest(".field");
    var deliveryRadios = form.querySelectorAll("input[name='fulfilment']");
    var addressField = document.getElementById("delivery-suburb").closest(".field");
    var dateInput = document.getElementById("date-needed");
    var details = document.getElementById("details");
    var response = document.getElementById("enquiry-response");
    var submitButton = form.querySelector("button[type='submit']");

    function selectedType() { return form.querySelector("input[name='enquiry-type']:checked").value; }
    function isDelivery() { return form.querySelector("input[name='fulfilment']:checked").value === "delivery"; }

    /* Dates are compared as "YYYY-MM-DD" in local time */
    function isoDate(date) {
        var m = String(date.getMonth() + 1).padStart(2, "0");
        var d = String(date.getDate()).padStart(2, "0");
        return date.getFullYear() + "-" + m + "-" + d;
    }
    function addDays(days) {
        var date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return date;
    }
    function leadDays() {
        var type = selectedType();
        if (type === "custom-cake" && document.getElementById("occasion").value === "Wedding / engagement") {
            return WEDDING_LEAD_DAYS;
        }
        return pricing[type].leadDays;
    }

    /* ---- 1. Adapt the form to the order type (DOM manipulation) ---- */
    function updateFormForType() {
        var rule = pricing[selectedType()];
        servingsLabel.textContent = "Number of " + rule.unit;
        servings.min = rule.min;
        servings.max = rule.max;
        servings.placeholder = "e.g. " + Math.max(rule.min, 20);
        flavourField.hidden = selectedType() !== "custom-cake";
        dateInput.min = isoDate(addDays(leadDays()));   // calendar greys out dates that are too soon
        var hint = document.getElementById("date-hint");
        hint.textContent = "Earliest date for this order: " + addDays(leadDays()).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" }) + ".";
    }
    function updateDelivery() {
        addressField.hidden = !isDelivery();
        if (!isDelivery()) { V.clearError(document.getElementById("delivery-suburb")); }
    }
    typeRadios.forEach(function (r) { r.addEventListener("change", updateFormForType); });
    document.getElementById("occasion").addEventListener("change", updateFormForType);
    deliveryRadios.forEach(function (r) { r.addEventListener("change", updateDelivery); });

    /* ---- 2. Validation rules: return an error message, or "" if valid ---- */
    var rules = {
        "occasion": function (value) {
            return value ? "" : "Please choose the occasion.";
        },
        "date-needed": function (value) {
            if (!value) { return "Please choose the date you need your order."; }
            var chosen = new Date(value + "T00:00:00");
            if (isNaN(chosen.getTime())) { return "Please enter a valid date."; }
            if (chosen < addDays(0)) { return "That date has already passed."; }
            if (chosen < addDays(leadDays())) {
                return "This order needs at least " + leadDays() + " days’ notice. The earliest date is " + isoDate(addDays(leadDays())) + ".";
            }
            if (chosen > addDays(365)) { return "We take orders up to one year ahead."; }
            return "";
        },
        "servings": function (value) {
            var rule = pricing[selectedType()];
            if (value === "") { return "Please enter the number of " + rule.unit + "."; }
            var n = Number(value);
            if (!Number.isInteger(n)) { return "Please enter a whole number."; }
            if (n < rule.min || n > rule.max) { return "Enter between " + rule.min + " and " + rule.max + " " + rule.unit + "."; }
            return "";
        },
        "delivery-suburb": function (value) {
            if (!isDelivery()) { return ""; }
            return value ? "" : "Please choose a delivery area, or select collection.";
        },
        "inspiration": function (files) {
            if (!files || files.length === 0) { return ""; }           // optional
            var file = files[0];
            if (!/^image\//.test(file.type)) { return "Please upload an image file (JPG, PNG or WebP)."; }
            if (file.size > 5 * 1024 * 1024) { return "The image must be smaller than 5 MB."; }
            return "";
        },
        "details": function (value) {
            return value.length > 500 ? "Please keep extra details under 500 characters." : "";
        },
        "full-name": function (value) {
            value = V.clean(value);
            if (!value) { return "Please enter your full name."; }
            if (!V.patterns.name.test(value)) { return "Use letters only (2 to 60 characters)."; }
            if (value.indexOf(" ") === -1) { return "Please enter your name and surname."; }
            return "";
        },
        "phone": function (value) {
            value = value.replace(/[\s-]/g, "");
            if (!value) { return "Please enter a cellphone number."; }
            return V.patterns.phoneZA.test(value) ? "" : "Enter a 10-digit number starting with 0, e.g. 071 234 5678.";
        },
        "email": function (value) {
            value = value.trim();
            if (!value) { return "Please enter your email address."; }
            return V.patterns.email.test(value) ? "" : "Please enter a valid email address, e.g. name@example.com.";
        }
    };
    V.liveValidate(form, rules);
    V.characterCounter(details, 500);

    /* ---- 3. Quote and availability ---- */
    function money(amount) {
        return "R" + Math.round(amount).toLocaleString("en-ZA");
    }

    function calculateQuote() {
        var type = selectedType();
        var rule = pricing[type];
        var qty = Number(servings.value);
        var lines = [];
        var subtotal;

        if (type === "custom-cake") {
            var extra = Math.max(0, qty - rule.includes) * rule.extra;
            subtotal = rule.base + extra;
            lines.push([rule.label + " (up to " + rule.includes + " servings)", rule.base]);
            if (extra) { lines.push([(qty - rule.includes) + " extra servings × " + money(rule.extra), extra]); }
            if (document.getElementById("occasion").value === "Wedding / engagement") {
                var surcharge = subtotal * WEDDING_SURCHARGE;
                lines.push(["Wedding design (tiers and decoration, +25%)", surcharge]);
                subtotal += surcharge;
            }
        } else {
            subtotal = qty * rule.perUnit;
            lines.push([qty + " " + rule.unit + " × " + money(rule.perUnit), subtotal]);
        }

        if (isDelivery()) {
            lines.push(["Delivery to " + document.getElementById("delivery-suburb").value, DELIVERY_FEE]);
            subtotal += DELIVERY_FEE;
        }
        return { lines: lines, total: subtotal, deposit: subtotal / 2 };
    }

    function availability() {
        var chosen = new Date(dateInput.value + "T00:00:00");
        var day = chosen.getDay();
        var nice = chosen.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        var daysAway = Math.round((chosen - addDays(0)) / 86400000);
        var note;
        if (day === 0) {
            note = "We are open until 12:00 on Sundays, so collection must be before noon.";
        } else if (day === 6) {
            note = "Saturdays are busy – you can collect from the shop until 14:00 or from our Klip Road market stall until 13:00.";
        } else {
            note = "Collection is from 06:30 to 18:00 at 42 Victoria Road.";
        }
        var status = daysAway >= leadDays() + 7
            ? "Good news – " + nice + " is available."
            : nice + " is available, but it is close. Please confirm quickly so we can reserve oven time.";
        return { status: status, note: note };
    }

    /* Builds the response panel with DOM methods (user input is only ever set with textContent) */
    function showResponse(reference, quote, avail, sendState) {
        var name = V.clean(document.getElementById("full-name").value).split(" ")[0];
        response.innerHTML = "";

        var h = document.createElement("h2");
        h.textContent = "Thank you, " + name + "! Here is your estimate";
        var ref = document.createElement("p");
        ref.className = "response-ref";
        ref.textContent = "Reference: " + reference;

        var table = document.createElement("table");
        table.className = "quote-table";
        var caption = document.createElement("caption");
        caption.textContent = "Estimated cost";
        table.appendChild(caption);
        var tbody = document.createElement("tbody");
        quote.lines.forEach(function (line) {
            var tr = document.createElement("tr");
            var th = document.createElement("th");
            th.scope = "row";
            th.textContent = line[0];
            var td = document.createElement("td");
            td.textContent = money(line[1]);
            tr.append(th, td);
            tbody.appendChild(tr);
        });
        [["Estimated total", quote.total], ["50% deposit to confirm", quote.deposit]].forEach(function (line) {
            var tr = document.createElement("tr");
            tr.className = "total-row";
            var th = document.createElement("th");
            th.scope = "row";
            th.textContent = line[0];
            var td = document.createElement("td");
            td.textContent = money(line[1]);
            tr.append(th, td);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        var status = document.createElement("p");
        status.className = "response-available";
        status.textContent = avail.status;
        var note = document.createElement("p");
        note.textContent = avail.note;

        var budgetValue = document.getElementById("budget").value;
        var budgetNote = document.createElement("p");
        budgetNote.className = "response-note";
        if (quote.total > budgetLimits[budgetValue]) {
            budgetNote.textContent = "This estimate is above the budget you chose. We can suggest a smaller size or simpler design when we reply.";
        } else {
            budgetNote.textContent = "This estimate fits within the budget you chose.";
        }

        var send = document.createElement("p");
        send.className = "response-send " + sendState.className;
        send.textContent = sendState.text;

        var next = document.createElement("p");
        var pref = form.querySelector("input[name='contact-pref']:checked").parentElement.textContent.trim();
        next.textContent = "Final prices depend on the design. We will contact you by " + pref + " within 24 hours (Mon–Sat) to confirm.";

        var again = document.createElement("button");
        again.type = "button";
        again.className = "btn btn-secondary";
        again.textContent = "Start a new enquiry";
        again.addEventListener("click", function () {
            form.reset();
            response.hidden = true;
            form.hidden = false;
            updateFormForType();
            updateDelivery();
            details.dispatchEvent(new Event("input"));
            document.getElementById("occasion").focus();
        });

        response.append(h, ref, table, status, note, budgetNote, send, next, again);
        response.hidden = false;
        form.hidden = true;
        response.focus();
        response.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ---- 4 & 5. Submit: validate -> quote -> send with AJAX -> respond ---- */
    form.addEventListener("submit", function (event) {
        event.preventDefault();                           // stop the normal page reload

        if (!V.validate(form, rules)) {
            var summary = document.getElementById("enquiry-errors");
            var count = form.querySelectorAll("[aria-invalid='true']").length;
            summary.textContent = "Please fix " + count + (count === 1 ? " field" : " fields") + " marked in red.";
            summary.hidden = false;
            return;
        }
        document.getElementById("enquiry-errors").hidden = true;

        var reference = "DB-" + Date.now().toString(36).toUpperCase().slice(-6);
        var quote = calculateQuote();
        var avail = availability();

        /* No endpoint set: show the quote without sending */
        if (!FORM_ENDPOINT) {
            showResponse(reference, quote, avail, {
                className: "is-info",
                text: "Online sending is not switched on for this demo site, so please WhatsApp 071 234 5678 or email " + BAKERY_EMAIL + " quoting reference " + reference + "."
            });
            return;
        }

        /* AJAX: send the form data in the background with fetch() */
        var data = new FormData(form);
        data.append("reference", reference);
        data.append("estimated-total", money(quote.total));
        data.append("_subject", "New enquiry " + reference + " – " + pricing[selectedType()].label);

        submitButton.disabled = true;
        submitButton.textContent = "Sending…";

        fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { "Accept": "application/json" } })
            .then(function (res) {
                if (!res.ok) { throw new Error("Server responded " + res.status); }
                showResponse(reference, quote, avail, { className: "is-success", text: "Your enquiry has been sent to the bakery." });
            })
            .catch(function () {
                showResponse(reference, quote, avail, {
                    className: "is-error",
                    text: "We could not send your enquiry just now. Please WhatsApp 071 234 5678 or email " + BAKERY_EMAIL + " quoting reference " + reference + "."
                });
            })
            .finally(function () {
                submitButton.disabled = false;
                submitButton.textContent = "Get my quote";
            });
    });

    form.addEventListener("reset", function () {
        window.setTimeout(function () {
            form.querySelectorAll("[aria-invalid]").forEach(V.clearError);
            updateFormForType();
            updateDelivery();
        }, 0);
    });

    form.noValidate = true;     // JavaScript now handles validation messages
    updateFormForType();
    updateDelivery();
})();
