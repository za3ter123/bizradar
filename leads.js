(function () {
  "use strict";

  var input = document.getElementById("lead-filter");
  var root = document.getElementById("leads-root");
  var emptyState = document.getElementById("empty-state");
  if (!input || !root) return;

  var regions = Array.prototype.slice.call(root.querySelectorAll(".region-block"));

  function normalize(s) {
    return s.toLowerCase();
  }

  function applyFilter() {
    var query = normalize(input.value.trim());
    var anyVisible = false;

    regions.forEach(function (region) {
      var counties = Array.prototype.slice.call(region.querySelectorAll(".county-block"));
      var regionHasVisible = false;

      counties.forEach(function (county) {
        var rows = Array.prototype.slice.call(county.querySelectorAll("tbody tr"));
        var countyHasVisible = false;

        rows.forEach(function (row) {
          var matches = query === "" || normalize(row.textContent).indexOf(query) !== -1;
          row.hidden = !matches;
          if (matches) countyHasVisible = true;
        });

        county.hidden = !countyHasVisible;
        if (countyHasVisible) regionHasVisible = true;
      });

      region.hidden = !regionHasVisible;
      if (regionHasVisible) anyVisible = true;
    });

    if (emptyState) emptyState.classList.toggle("is-visible", !anyVisible);
  }

  input.addEventListener("input", applyFilter);
})();
