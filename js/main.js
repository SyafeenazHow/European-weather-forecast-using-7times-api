var rows;

$(document).ready(function () {
    // Fetch CSV data and populate the dropdown
    $.get("city_coordinates.csv", function (data) {
        // Split CSV into rows
        rows = data.split("\n");

        // Initialize the dropdown
        var dropdown = $("#locationDropdown");

        // Add a placeholder option
        dropdown.append("<option value='' selected disabled>Select Location</option>");

        // Loop through rows and add options to the dropdown
        for (var i = 1; i < rows.length; i++) {
            // Split each row into columns
            var columns = rows[i].split(",");

            // Ensure that the row has the expected number of columns
            if (columns.length >= 4) {
                // Extract city and country from columns
                var city = columns[2].trim();  // Assuming city is in the third column (index 2)
                var country = columns[3].trim();  // Assuming country is in the fourth column (index 3)

                // Create option text and value
                var optionText = city + ", " + country;
                var optionValue = city + "-" + country;

                // Create and append option element
                var option = $("<option></option>")
                    .attr("value", optionValue)
                    .text(optionText);

                dropdown.append(option);
            } else {
                console.error("Skipping row " + i + " due to unexpected number of columns:", rows[i]);
            }
        }

        // Event listener for dropdown change
        dropdown.on("change", function () {
            var selectedLocation = $(this).val();
            if (selectedLocation) {
                // Call function to fetch weather data based on the selected location
                fetchWeatherData(selectedLocation);
            }
        });
    }).fail(function (xhr, status, error) {
        console.error("Error fetching CSV data:", status, error);
    });

    // Function to fetch weather data based on the selected city and country
    function fetchWeatherData(selectedLocation) {
        $("#loading-indicator").show();
        // Extract city and country from the selected value
        var locationParts = selectedLocation.split("-");
        var city = locationParts[0];
        var country = locationParts[1];

        // Fetch weather data from 7Timer API
        var apiUrl = "http://www.7timer.info/bin/api.pl";
        var queryParams = {
            product: "civillight",
            output: "json",
            lon: getLongitude(city),
            lat: getLatitude(country)
        };

        // Fetch data from the API
        $.ajax({
            type: "GET",
            url: apiUrl,
            data: queryParams,
            dataType: "json",
            success: function (weatherData) {
                $("#loading-indicator").hide();
                // Update HTML content with weather information
                updateWeatherInfo(city, country, weatherData);
                console.log(weatherData);
            },
            error: function (xhr, status, error) {
                console.error("Error fetching weather data:", status, error);
            }
        });
    }

    // Function to get longitude from the CSV data based on the city
    function getLongitude(city) {
        // Find longitude from CSV data based on the city
        var longitude = 0;  // Default value
        for (var i = 1; i < rows.length; i++) {
            var columns = rows[i].split(",");
            if (columns.length >= 4 && columns[2].trim() === city) {
                longitude = parseFloat(columns[1].trim());
                break;
            }
        }
        return longitude;
    }

    // Function to get latitude from the CSV data based on the country
    function getLatitude(country) {
        // Find latitude from CSV data based on the country
        var latitude = 0;  // Default value
        for (var i = 1; i < rows.length; i++) {
            var columns = rows[i].split(",");
            if (columns.length >= 4 && columns[3].trim() === country) {
                latitude = parseFloat(columns[0].trim());
                break;
            }
        }
        return latitude;
    }

    // Function to update the HTML content with weather information
    // Function to update the HTML content with weather information
    function updateWeatherInfo(city, country, weatherData) {
        var weatherInfoDiv = $("#weather-info");

        // Check if the data contains valid information
        if (weatherData && weatherData.dataseries && weatherData.dataseries.length > 0) {
            // Create HTML content for all data series
            var htmlContent = "<h2>Weather Information for " + city + ", " + country + "</h2>";
            htmlContent += '<div class="weather-card">';
            for (var i = 0; i < weatherData.dataseries.length; i++) {
                var dataSeries = weatherData.dataseries[i];

                // Format the date
                var date = new Date(dataSeries.date.toString().slice(0, 4),  // Year
                    parseInt(dataSeries.date.toString().slice(4, 6)) - 1,  // Month (0-indexed)
                    dataSeries.date.toString().slice(6));  // Day

                var formattedDate = date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

                // Create a card for each data series
                htmlContent += '<div class="card">';
                htmlContent += '<div class="card-title"> <b>' + formattedDate + '</b></div>';
                htmlContent += '<div class="card-body">';
                htmlContent += `<img src="images/${dataSeries.weather}.png" alt="weather image">`;
                htmlContent += '<p class="card-text">Weather: ' + dataSeries.weather + '</p>';
                htmlContent += '<p class="card-text">Max Temperature: ' + dataSeries.temp2m.max + '°C</p>';
                htmlContent += '<p class="card-text">Min Temperature: ' + dataSeries.temp2m.min + '°C</p>';
                htmlContent += '<p class="card-text">Max Wind Speed: ' + dataSeries.wind10m_max + '</p>';
                // Add more information as needed
                htmlContent += '</div>'; // card-body
                htmlContent += '</div>'; // card
            }

            // Update HTML content
            weatherInfoDiv.html(htmlContent);
        } else {
            // Display an error message if data is not valid
            weatherInfoDiv.html('<p>Error: Unable to fetch weather data</p>');
        }
    }
});