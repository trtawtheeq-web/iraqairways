function submitSearch(){
  var fromVal = document.getElementById("departure-input").value;
  var toVal = document.getElementById("destination-input").value;
  var fromCode = fromVal.split("|").pop().trim() || fromVal;
  var toCode = toVal.split("|").pop().trim() || toVal;
  var dateRaw = document.getElementById("start_date").value;
  var retDateRaw = document.getElementById("end_date") ? document.getElementById("end_date").value : "";
  // Convert from d/m/Y to Y-m-d format
  function convertDate(d) {
    if (!d) return "";
    // Handle "d/m/Y to d/m/Y" format (range picker)
    if (d.indexOf(" to ") > -1) {
      d = d.split(" to ")[1].trim();
    }
    var parts = d.split("/");
    if (parts.length === 3) return parts[2] + "-" + parts[1].padStart(2,"0") + "-" + parts[0].padStart(2,"0");
    // Already Y-m-d
    if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
    return d;
  }
  var date = convertDate(dateRaw);
  var retDate = convertDate(retDateRaw);
  var adults = document.getElementById("adult").value;
  var children = document.getElementById("child").value;
  var infants = document.getElementById("infant").value;
  var typeEl = document.querySelector("input[name=type]:checked");
  var tripType = (typeEl && typeEl.value.indexOf("عودة") > -1) ? "round" : "oneway";
  var url = "/flight-search?origin=" + encodeURIComponent(fromCode) + "&destination=" + encodeURIComponent(toCode) + "&date=" + encodeURIComponent(date) + "&returnDate=" + encodeURIComponent(retDate) + "&adult=" + adults + "&child=" + children + "&infant=" + infants + "&tripType=" + tripType;
  window.location.href = url;
}
