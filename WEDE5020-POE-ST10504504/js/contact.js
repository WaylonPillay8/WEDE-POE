/* ==========================================================================
   Desai's Bakery | contact.js  (Contact page form)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   1. Validates the contact form with JavaScript (inline error messages)
   2. Compiles the details into an EMAIL addressed to the bakery
      (RECIPIENT below) and opens it in the visitor's email app using a
      mailto: link (MDN Web Docs, 2026f)
   3. Shows a confirmation with the compiled message, a button to open the
      email again, and a button to copy the message
   ========================================================================== */

(function () {
    "use strict";

    var form = document.getElementById("contact-form");
    if (!form || !window.FormValidation) { return; }
    var V = window.FormValidation;

    /* The email recipient stated in the code */
    var RECIPIENT = "orders@desaisbakery.co.za";

    var message = document.getElementById("c-message");
    var response = document.getElementById("contact-response");

    var rules = {
        "c-name": function (value) {
            value = V.clean(value);
            if (!value) { return "Please enter your name."; }
            return V.patterns.name.test(value) ? "" : "Use letters only (2 to 60 characters).";
        },
        "c-email": function (value) {
            value = value.trim();
            if (!value) { return "Please enter your email address so we can reply."; }
            return V.patterns.email.test(value) ? "" : "Please enter a valid email address, e.g. name@example.com.";
        },
        "c-phone": function (value) {
            value = value.replace(/[\s-]/g, "");
            if (!value) { return ""; }                         // optional
            return V.patterns.phoneZA.test(value) ? "" : "Enter a 10-digit number starting with 0, or leave it blank.";
        },
        "c-type": function (value) {
            return value ? "" : "Please choose the type of message.";
        },
        "c-message": function (value) {
            var length = V.clean(value).length;
            if (length === 0) { return "Please type your message."; }
            if (length < 20) { return "Please give a little more detail (at least 20 characters)."; }
            if (length > 1000) { return "Please keep your message under 1000 characters."; }
            return "";
        }
    };
    V.liveValidate(form, rules);
    V.characterCounter(message, 1000);

    /* Compile the form into an email subject and body */
    function compileEmail() {
        var name = V.clean(document.getElementById("c-name").value);
        var email = document.getElementById("c-email").value.trim();
        var phone = document.getElementById("c-phone").value.trim() || "Not given";
        var type = document.getElementById("c-type").value;
        var text = message.value.trim();

        var subject = "[Website] " + type + " from " + name;
        var body =
            "Hello Desai's Bakery,\n\n" +
            text + "\n\n" +
            "-----------------------------\n" +
            "Name: " + name + "\n" +
            "Email: " + email + "\n" +
            "Phone: " + phone + "\n" +
            "Message type: " + type + "\n" +
            "Sent from the contact form on " + new Date().toLocaleString("en-ZA") + "\n";

        return {
            subject: subject,
            body: body,
            href: "mailto:" + RECIPIENT + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)
        };
    }

    function showResponse(mail) {
        response.innerHTML = "";

        var h = document.createElement("h2");
        h.textContent = "Your email is ready";
        var p = document.createElement("p");
        p.textContent = "Your email app should have opened with this message addressed to " + RECIPIENT + ". Press Send in your email app to deliver it.";

        var preview = document.createElement("pre");
        preview.className = "email-preview";
        preview.textContent = "To: " + RECIPIENT + "\nSubject: " + mail.subject + "\n\n" + mail.body;

        var actions = document.createElement("div");
        actions.className = "button-row";

        var openLink = document.createElement("a");
        openLink.className = "btn btn-primary";
        openLink.href = mail.href;
        openLink.textContent = "Open email again";

        var copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "btn btn-secondary";
        copyBtn.textContent = "Copy message";
        copyBtn.addEventListener("click", function () {
            var text = "To: " + RECIPIENT + "\nSubject: " + mail.subject + "\n\n" + mail.body;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    copyBtn.textContent = "Copied!";
                }, function () {
                    copyBtn.textContent = "Copy failed – select the text above";
                });
            }
        });

        var newBtn = document.createElement("button");
        newBtn.type = "button";
        newBtn.className = "btn btn-secondary";
        newBtn.textContent = "Write another message";
        newBtn.addEventListener("click", function () {
            form.reset();
            message.dispatchEvent(new Event("input"));
            response.hidden = true;
            form.hidden = false;
            document.getElementById("c-name").focus();
        });

        actions.append(openLink, copyBtn, newBtn);
        response.append(h, p, preview, actions);
        response.hidden = false;
        form.hidden = true;
        response.focus();
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!V.validate(form, rules)) {
            var summary = document.getElementById("contact-errors");
            var count = form.querySelectorAll("[aria-invalid='true']").length;
            summary.textContent = "Please fix " + count + (count === 1 ? " field" : " fields") + " marked in red.";
            summary.hidden = false;
            return;
        }
        document.getElementById("contact-errors").hidden = true;

        var mail = compileEmail();
        showResponse(mail);
        window.location.href = mail.href;      // opens the visitor's email app
    });

    form.noValidate = true;
})();
