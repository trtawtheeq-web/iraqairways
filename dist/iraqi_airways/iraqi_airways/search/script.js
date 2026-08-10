let modalOpenedByInput = false;

const start_date = document.getElementById("start_date_flatpickr");
var start_date_handler = flatpickr(start_date, {
  minDate: "today",
  dateFormat: "d/m/Y",
  enableTime: false,
  placeholder: "",
  showIcon: false,
  disableMobile: "true"
});

const end_date = document.getElementById("end_date_flatpickr");
var end_date_handler = flatpickr(end_date, {
  minDate: "today",
  dateFormat: "d/m/Y",
  enableTime: false,
  placeholder: "",
  showIcon: false,
  disableMobile: "true",
  mode: 'range',
});

document.getElementById('end_date').disabled = true;
document.getElementById('end_date_container').style.backgroundColor = "#f0f0f0";
document.getElementById('end_date_label').style.color = "black";

function call_start_date_flat(){
    close_all_modals();
    document.getElementById('start_date_flatpickr').style.display = '';
    start_date.click();
}

function call_end_date_flat(){
    close_all_modals();
    if(isRoundTripSelected()){
        document.getElementById('end_date_flatpickr').style.display = '';
        end_date.click();
    }
}

function display_flight_selection(id){
    close_all_modals();
    document.getElementById(id).style.display = "";
}

function hide_flight_selection(){
    document.getElementById('dept_flights_data').style.display = "none";
    document.getElementById('dest_flights_data').style.display = "none";
}

function select_depart(dept){
    document.getElementById('departure-input').value = dept;
    close_all_modals()
}

function close_all_modals(){
    hide_flight_selection();
    hide_passenger_popup();
}

function show_passenger_popup(){
    document.getElementById('passenger_popup').style.display = "";
}

function hide_passenger_popup(){
    document.getElementById('passenger_popup').style.display = "none";
}

function increase_passenger(psngr){
    var increased_passenger = 0;

    if(psngr == "adult"){
        var get_current_passengers = Number(document.getElementById('adult_passengers').innerHTML);
        increased_passenger = get_current_passengers+1;
        document.getElementById('adult_passengers').innerHTML = increased_passenger;
        update_all_passengers_data();

    } else if(psngr == "child"){
        var get_current_passengers = Number(document.getElementById('child_passengers').innerHTML);
        increased_passenger = get_current_passengers+1;
        document.getElementById('child_passengers').innerHTML = increased_passenger;
        update_all_passengers_data();

    } else if(psngr == "infant"){
        var get_current_passengers = Number(document.getElementById('infant_passengers').innerHTML);
        increased_passenger = get_current_passengers+1;
        document.getElementById('infant_passengers').innerHTML = increased_passenger;
        update_all_passengers_data();
    }
}

function decrease_passenger(psngr){
    var decreased_passenger = 0;

    if(psngr == "adult"){
        var get_current_passengers = Number(document.getElementById('adult_passengers').innerHTML);
        if(!(get_current_passengers <= 1)){
            decreased_passenger = get_current_passengers-1;
            document.getElementById('adult_passengers').innerHTML = decreased_passenger;
            update_all_passengers_data();
        }
    } else if(psngr == "child"){
        var get_current_passengers = Number(document.getElementById('child_passengers').innerHTML);
        if(get_current_passengers > 0){
            decreased_passenger = get_current_passengers-1;
            document.getElementById('child_passengers').innerHTML = decreased_passenger;
            update_all_passengers_data();
        }
       
    } else if(psngr == "infant"){
        var get_current_passengers = Number(document.getElementById('infant_passengers').innerHTML);
        if(get_current_passengers > 0){
            decreased_passenger = get_current_passengers-1;
            document.getElementById('infant_passengers').innerHTML = decreased_passenger;
            update_all_passengers_data();
        }
    }
}

function isRoundTripSelected() {
    // Get references to the radio buttons
    const roundTripRadio = document.getElementById('twoway');

    // Check if the "ذهاب وعودة" radio button is selected
    if (roundTripRadio.checked) {
        return true;
    } else {
        return false;
    }
}


function get_selected_passenger_class_value(){
    var radioButtons = document.getElementsByName("passenger_class");
    var selectedValue;

    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            selectedValue = radioButtons[i].value;
            break;
        }
    }
    return selectedValue;
}

function update_all_passengers_data(){
    var selected_passenger_class = get_selected_passenger_class_value();

    var adult_psngrs = Number(document.getElementById('adult_passengers').innerHTML);
    var child_psngrs = Number(document.getElementById('child_passengers').innerHTML);
    var infant_psngrs = Number(document.getElementById('infant_passengers').innerHTML);

    document.getElementById('adult').value = adult_psngrs;
    document.getElementById('child').value = child_psngrs;
    document.getElementById('infant').value = infant_psngrs;

    var total_psngrs = adult_psngrs + child_psngrs + infant_psngrs;
    var psngr_nick = "مسافر";

    if(total_psngrs > 1){
        psngr_nick = "";
    } 

    document.getElementById('passenger_details').value = total_psngrs + " " + psngr_nick + " / " + selected_passenger_class;
}

// Function to reverse the order of columns on mobile
function reverseColumnsOnMobile() {
    var columnsContainer1 = document.getElementById('reverse_1');
    var columnsContainer2 = document.getElementById('reverse_2');
    var columnsContainer3 = document.getElementById('reverse_3');
    if (window.innerWidth < 768) { // Adjust the breakpoint as needed
        // Reverse the order of columns
        columnsContainer1.style.flexDirection = 'column-reverse';
        columnsContainer2.style.flexDirection = 'column-reverse';
        columnsContainer3.style.flexDirection = 'column-reverse';
    } else {
        // Reset the order for larger screens
        columnsContainer1.style.flexDirection = 'row';
        columnsContainer2.style.flexDirection = 'row';
        columnsContainer3.style.flexDirection = 'row';
    }
}

// Initial call to set the order based on the initial screen size
reverseColumnsOnMobile();

// Listen for window resize events and adjust the order
window.addEventListener('resize', reverseColumnsOnMobile);

function update_end_date_display(get_val){
    if(get_val == 'ذهاب'){
        document.getElementById('end_date').value = "";
        document.getElementById('end_date').disabled = true;
        document.getElementById('end_date_label').style.color = "black";
        document.getElementById('end_date_container').style.backgroundColor = "#f0f0f0";
    } else{
        document.getElementById('end_date').disabled = false;
        // document.getElementById('end_date_label').style.color = "red";
        document.getElementById('end_date_container').style.backgroundColor = "#FFFFFF";
    }
}

function performSearch(search_word, search_id) {
    const searchInput = search_word.toLowerCase();
    const flightDataContainer = document.getElementById(search_id);
    const flightItems = flightDataContainer.getElementsByClassName('flights-data-data-single');

    for (const flightItem of flightItems) {
        const englishName = flightItem.querySelector('.flight-loc-name-english').textContent.toLowerCase();
        const arabicName = flightItem.textContent.toLowerCase();
        const airportCode = flightItem.querySelector('.flight-loc-code').textContent.toLowerCase();

        // Check if the input text is found in any of the data elements
        if (englishName.includes(searchInput) || arabicName.includes(searchInput) || airportCode.includes(searchInput)) {
            flightItem.style.display = 'block';
        } else {
            flightItem.style.display = 'none';
        }

        if(search_id == "dest_flights_data"){
            var flightGet = document.getElementById('departure-input').value;
            var flightGetCodeArray = flightGet.split(' | ');

            if (flightGetCodeArray && flightGetCodeArray.length >= 3) {
                var flightGetCode = flightGetCodeArray[2].trim();
                
                if (airportCode.trim() == flightGetCode.toLowerCase()) {
                    flightItem.style.display = 'none';
                }
            }
        }

        if(search_id == "dept_flights_data"){
            var flightGet = document.getElementById('destination-input').value;
            var flightGetCodeArray = flightGet.split(' | ');

            if (flightGetCodeArray && flightGetCodeArray.length >= 3) {
                var flightGetCode = flightGetCodeArray[2].trim();
                
                if (airportCode.trim() == flightGetCode.toLowerCase()) {
                    flightItem.style.display = 'none';
                }
            }
        }
    }
}

document.addEventListener('click', function(event) {
    // Check if the click event occurred inside one of the specified modal bodies
    const isInsideModal = event.target.closest('#passenger_popup, #dept_flights_data, #dest_flights_data, #passenger_details, #departure-input, #destination-input');

    // If the click event is not inside any of the specified modal bodies, close all modals
    if (!isInsideModal) {
        close_all_modals();
    } 
});

function validate_with_start_date(){
    var start_date = document.getElementById('start_date_flatpickr').value;
    var end_date = document.getElementById('end_date_flatpickr').value;
   
    // Convert date strings to Date objects
    var startDate = new Date(start_date);
    var endDate = new Date(end_date);
    
    // Check if end date is greater than start date
    if (endDate < startDate) {
        document.getElementById('end_date').value ="";
        document.getElementById('end_date_flatpickr').value ="";
    }
}

function set_hidden_date_and_update_end_date(t){

    document.getElementById('start_date').value = t.value;
    t.style.display = 'none';

    end_date_handler.set('minDate', t.value);
    end_date_handler.setDate([t.value, '']);

    if(isRoundTripSelected()){
        
        end_date.click();

    }
}

function check_label(element, get_id){
    if(element.value == ""){
        document.getElementById(get_id).style.color = "red";
    }
}

document.getElementById('start_date').addEventListener("blur", function(){
   setTimeout(() => {
    if(document.getElementById('start_date').value == ""){
        document.getElementById('start_date_label').style.color = "red";
    }
   }, 200);
});

document.getElementById('end_date').addEventListener("blur", function(){
    setTimeout(() => {
     if(document.getElementById('end_date').value == ""){
        if(isRoundTripSelected()){
            document.getElementById('end_date_label').style.color = "red";
        }
     }
    }, 200);
 })

function updateDestinationFlights(selectedDepartureAirportCode, get_id) {
    // Get the list of destination flights
    const destinationFlightsList = document.getElementById(get_id);
    const destinationFlights = destinationFlightsList.getElementsByClassName('flights-data-data-single');

    // Iterate through destination flights and hide flights with the same airport code as the selected departure flight
    for (const flight of destinationFlights) {
        const flightAirportCode = flight.querySelector('.flight-loc-code').textContent;
        if (flightAirportCode === selectedDepartureAirportCode) {
            flight.style.display = 'none'; // Hide flights with the same airport code
        } else {
            flight.style.display = 'block'; // Show other destination flights
        }
    }
}

function select_depart(dept){
    const departureFlight = dept;
    document.getElementById('departure-input').value = departureFlight;
    close_all_modals()

    const departureAirportCode = (departureFlight.split(' | ')[2]);
    updateDestinationFlights(departureAirportCode, 'dest_flights_data');
}

function select_destination(dest){
    const departureFlight = dest;
    document.getElementById('destination-input').value = departureFlight;
    close_all_modals()

    const departureAirportCode = (departureFlight.split(' | ')[2]);
    updateDestinationFlights(departureAirportCode, 'dept_flights_data');
}

function interchangeValues(){
    var tempDept = document.getElementById('departure-input').value;
    var tempDest = document.getElementById('destination-input').value;
    document.getElementById('destination-input').value = tempDept;
    document.getElementById('departure-input').value = tempDest;
    updateDestinationFlights(tempDest.split(' | ')[2], 'dest_flights_data');
    updateDestinationFlights(tempDept.split(' | ')[2], 'dept_flights_data');


}