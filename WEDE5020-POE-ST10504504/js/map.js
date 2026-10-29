/* ==========================================================================
   Desai's Bakery | map.js  (contact page)
   WEDE5020 POE Part 3 – Waylon Pillay (ST10504504)

   INTERACTIVE MAPS with Leaflet 1.9.4 (Agafonkin, 2023) and OpenStreetMap
   map tiles (OpenStreetMap contributors, 2026). Leaflet is stored in
   js/vendor/leaflet so the site does not rely on an outside CDN.

   One map is drawn in each location card. Every map shows BOTH locations
   so visitors can see how close they are, with:
     - custom bakery-coloured markers and pop-ups with hours
     - a "Get directions" link that opens Google Maps
     - "Show shop" / "Show market" buttons that fly the map to a location
   Coordinates are approximate (the business is fictional).
   ========================================================================== */

(function () {
    "use strict";

    if (typeof L === "undefined") { return; }   // Leaflet failed to load
    var mapElements = document.querySelectorAll("[data-map]");
    if (!mapElements.length) { return; }

    var locations = {
        shop: {
            name: "Desai’s Bakery – main shop",
            address: "42 Victoria Road, Grassy Park",
            hours: "Mon–Fri 06:30–18:00 · Sat 07:00–14:00 · Sun 07:00–12:00",
            coords: [-34.0478, 18.4957]
        },
        market: {
            name: "Saturday market stall",
            address: "Community market, Klip Road, Grassy Park",
            hours: "Saturdays 08:00–13:00",
            coords: [-34.0398, 18.5046]
        }
    };

    /* Bakery-coloured marker drawn with CSS (see .map-pin in style.css) */
    function pin(label) {
        return L.divIcon({
            className: "map-pin",
            html: "<span><b>" + label + "</b></span>",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -34]
        });
    }

    /* Pop-up content built with DOM methods so no user data is ever parsed as HTML */
    function popupContent(place) {
        var wrap = document.createElement("div");
        var title = document.createElement("strong");
        title.textContent = place.name;
        var address = document.createElement("p");
        address.textContent = place.address;
        var hours = document.createElement("p");
        hours.textContent = place.hours;
        var link = document.createElement("a");
        link.href = "https://www.google.com/maps/dir/?api=1&destination=" + place.coords.join(",");
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Get directions →";
        wrap.append(title, address, hours, link);
        return wrap;
    }

    mapElements.forEach(function (element) {
        var focusKey = element.dataset.map;           // "shop" or "market"
        var focus = locations[focusKey];

        /* scrollWheelZoom off so the page still scrolls normally over the map */
        var map = L.map(element, { scrollWheelZoom: false }).setView(focus.coords, 15);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
        }).addTo(map);

        var markers = {
            shop: L.marker(locations.shop.coords, { icon: pin("S"), title: locations.shop.name, alt: locations.shop.name })
                .addTo(map).bindPopup(popupContent(locations.shop)),
            market: L.marker(locations.market.coords, { icon: pin("M"), title: locations.market.name, alt: locations.market.name })
                .addTo(map).bindPopup(popupContent(locations.market))
        };
        markers[focusKey].openPopup();

        /* Ctrl/Cmd + scroll still zooms, with a hint for mouse users */
        element.addEventListener("wheel", function (event) {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                map.setZoom(map.getZoom() + (event.deltaY < 0 ? 1 : -1));
            }
        }, { passive: false });

        /* Buttons under each map fly between the two locations */
        var card = element.closest(".location-card");
        card.querySelectorAll("[data-fly-to]").forEach(function (button) {
            button.addEventListener("click", function () {
                var key = button.dataset.flyTo;
                if (key === "both") {
                    map.flyToBounds(L.latLngBounds([locations.shop.coords, locations.market.coords]), { padding: [40, 40] });
                } else {
                    map.flyTo(locations[key].coords, 16);
                    markers[key].openPopup();
                }
            });
        });
    });

    /* Remove the "map needs JavaScript" fallback messages */
    document.querySelectorAll(".map-fallback").forEach(function (el) { el.remove(); });
})();
