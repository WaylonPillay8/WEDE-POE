/* ==========================================================================
   Desai's Bakery | menu.js  (menu page only)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   SEARCH, FILTER AND SORT for the menu.
   The menu stays in normal HTML tables (good for SEO and for visitors
   without JavaScript). This script reads every table row into an array of
   objects, then:
     - filters the rows by search text and category
     - sorts the rows inside each table by price or name
     - hides categories with no matches and shows a result count
   ========================================================================== */

(function () {
    "use strict";

    var form = document.getElementById("menu-finder");
    if (!form) { return; }

    var searchInput = document.getElementById("menu-search");
    var categorySelect = document.getElementById("menu-category");
    var sortSelect = document.getElementById("menu-sort");
    var resultCount = document.getElementById("menu-result-count");
    var emptyMessage = document.getElementById("menu-empty");
    var sections = document.querySelectorAll(".menu-section");

    /* Build an index of every menu item from the existing tables */
    var items = [];
    sections.forEach(function (section) {
        var tbody = section.querySelector("tbody");
        tbody.querySelectorAll("tr").forEach(function (row, position) {
            var name = row.querySelector("th").textContent.trim();
            var description = row.querySelector("td").textContent.trim();
            var priceText = row.querySelector(".price").textContent;
            var firstNumber = priceText.match(/\d+/);   // "R35 / R320" -> 35
            items.push({
                row: row,
                tbody: tbody,
                category: section.id,
                name: name,
                searchText: (name + " " + description).toLowerCase(),
                price: firstNumber ? Number(firstNumber[0]) : 0,
                originalPosition: position
            });
        });
    });

    function compare(a, b) {
        switch (sortSelect.value) {
            case "price-asc":  return a.price - b.price;
            case "price-desc": return b.price - a.price;
            case "name-asc":   return a.name.localeCompare(b.name);
            default:           return a.originalPosition - b.originalPosition;
        }
    }

    function update() {
        var term = searchInput.value.trim().toLowerCase();
        var category = categorySelect.value;
        var shown = 0;

        /* 1. Filter: show or hide each row */
        items.forEach(function (item) {
            var matchesText = term === "" || item.searchText.indexOf(term) !== -1;
            var matchesCategory = category === "all" || item.category === category;
            var visible = matchesText && matchesCategory;
            item.row.hidden = !visible;
            if (visible) { shown++; }
        });

        /* 2. Sort: re-append rows to their own table in the new order */
        sections.forEach(function (section) {
            var tbody = section.querySelector("tbody");
            items.filter(function (item) { return item.tbody === tbody; })
                .sort(compare)
                .forEach(function (item) { tbody.appendChild(item.row); });

            /* 3. Hide a whole category if none of its rows are visible */
            var anyVisible = tbody.querySelector("tr:not([hidden])") !== null;
            section.hidden = !anyVisible;
        });

        /* 4. Feedback for the visitor (read out by screen readers) */
        resultCount.textContent = shown === items.length
            ? "Showing all " + items.length + " menu items"
            : "Showing " + shown + " of " + items.length + " menu items";
        emptyMessage.hidden = shown !== 0;
    }

    /* Run on every keystroke and every change of the drop-downs */
    searchInput.addEventListener("input", update);
    categorySelect.addEventListener("change", update);
    sortSelect.addEventListener("change", update);

    /* The form never really submits – Enter just keeps the results */
    form.addEventListener("submit", function (event) { event.preventDefault(); });

    /* Reset button inside the "no results" message and the form */
    form.addEventListener("reset", function () {
        window.setTimeout(update, 0);   // wait until the browser clears the fields
    });
    var clearButton = document.getElementById("menu-clear");
    if (clearButton) {
        clearButton.addEventListener("click", function () {
            form.reset();
            searchInput.focus();
        });
    }

    /* Category jump links also set the filter back to "All" so the target exists */
    document.querySelectorAll(".jump-links a").forEach(function (link) {
        link.addEventListener("click", function () {
            if (categorySelect.value !== "all" || searchInput.value !== "") {
                form.reset();
                update();
            }
        });
    });

    form.hidden = false;   // the finder is only shown when JavaScript is running
    update();
})();
