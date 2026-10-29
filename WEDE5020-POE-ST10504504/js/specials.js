/* ==========================================================================
   Desai's Bakery | specials.js  (home page only)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   DYNAMIC CONTENT: the "Today at the bakery" cards are not written in the
   HTML. They are stored below as data (an array of objects, one per day)
   and built with DOM methods for the current day in Cape Town. The visitor
   can also click the day tabs to see what is baked on other days.
   ========================================================================== */

(function () {
    "use strict";

    var container = document.getElementById("todays-bakes");
    if (!container) { return; }

    /* Weekly baking schedule – one entry per day (0 = Sunday) */
    var schedule = [
        { day: "Sunday",    items: [
            { name: "Koesisters (6)", note: "Spiced and coconut-dusted – a Sunday tradition", price: "R42" },
            { name: "Milk tart", note: "By the slice or whole", price: "R22 / R180" }
        ]},
        { day: "Monday",    items: [
            { name: "Brown loaf", note: "Classic 700 g loaf", price: "R18" },
            { name: "Cupcakes (12)", note: "Vanilla and chocolate", price: "R180" }
        ]},
        { day: "Tuesday",   items: [
            { name: "Seed loaf", note: "Sunflower, linseed and pumpkin", price: "R42" },
            { name: "Carrot cake", note: "By the slice", price: "R36" }
        ]},
        { day: "Wednesday", items: [
            { name: "Jadeed’s sourdough", note: "48-hour ferment – mid-week batch", price: "R65" },
            { name: "Hertzoggies (6)", note: "Apricot jam and coconut tartlets", price: "R60" }
        ]},
        { day: "Thursday",  items: [
            { name: "Bread rolls (6)", note: "White or brown", price: "R24" },
            { name: "Red velvet", note: "By the slice", price: "R38" }
        ]},
        { day: "Friday",    items: [
            { name: "Rotis (6)", note: "Soft layered rotis – Fridays only", price: "R40" },
            { name: "Vetkoek", note: "Fresh from the fryer, plain or with mince", price: "R10" }
        ]},
        { day: "Saturday",  items: [
            { name: "Koesisters (6)", note: "Also at the Klip Road market stall", price: "R42" },
            { name: "Chocolate cake", note: "Whole cakes for the weekend", price: "R320" }
        ]}
    ];

    /* Today's day number in South African time */
    function todayInCapeTown() {
        var short = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", weekday: "short" })
            .format(new Date());
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
    }
    var today = todayInCapeTown();

    /* Build the day buttons (Mon–Sun order) */
    var tabs = document.createElement("div");
    tabs.className = "day-tabs";
    tabs.setAttribute("role", "group");
    tabs.setAttribute("aria-label", "Choose a day");

    var list = document.createElement("ul");
    list.className = "bake-list";
    list.setAttribute("aria-live", "polite");

    var heading = document.getElementById("todays-bakes-day");

    [1, 2, 3, 4, 5, 6, 0].forEach(function (dayIndex) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "day-tab";
        btn.textContent = schedule[dayIndex].day.slice(0, 3);
        btn.setAttribute("aria-label", schedule[dayIndex].day);
        btn.dataset.day = dayIndex;
        btn.addEventListener("click", function () { show(dayIndex); });
        tabs.appendChild(btn);
    });

    /* Replace the list items for the chosen day */
    function show(dayIndex) {
        list.innerHTML = "";
        schedule[dayIndex].items.forEach(function (item) {
            var li = document.createElement("li");
            li.className = "bake-item";

            var name = document.createElement("h3");
            name.textContent = item.name;
            var note = document.createElement("p");
            note.textContent = item.note;
            var price = document.createElement("p");
            price.className = "bake-price";
            price.textContent = item.price;

            li.append(name, note, price);
            list.appendChild(li);
        });

        if (heading) {
            heading.textContent = dayIndex === today ? "Baked today (" + schedule[dayIndex].day + ")" : "Baked on " + schedule[dayIndex].day;
        }
        tabs.querySelectorAll(".day-tab").forEach(function (btn) {
            var active = Number(btn.dataset.day) === dayIndex;
            btn.classList.toggle("is-active", active);
            btn.setAttribute("aria-pressed", String(active));
        });
    }

    container.innerHTML = "";          // removes the no-JavaScript fallback text
    container.append(tabs, list);
    show(today);
})();
