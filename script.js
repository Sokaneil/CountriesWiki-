let countriesURL = "https://restcountries.com/v3.1/all";
let countriesList;
let map;
let defaultView = [0, 0];

window.onpopstate = function (event) {
    const state = event.state || {};

    if (state.page === 'details') {
        const url = new URL(window.location.href);
        const countryName = url.searchParams.get("country");
        if (countryName) {
            fetchCountryInfo(countryName);
        } else {
            loadPage();
        }
    } else {
        loadPage();
    }
};

loadPage();

function loadPage() {
    const url = new URL(window.location.href);
    const countryName = url.searchParams.get("country");

    if (performance.navigation.type === 1 || !countryName) {
        fetch(countriesURL)
            .then(response => response.json())
            .then(response => countriesList = response)
            .then(() => {
                countriesList.sort((a, b) => {
                    const nameA = a.name.common.toUpperCase();
                    const nameB = b.name.common.toUpperCase();
                    return nameA.localeCompare(nameB);
                });
                displayCountryList(countriesList, document.getElementById("section1"));
                constructSortDropdown(["Alphabetical Order", "Population Size", "Area Size"]);
                constructContinentDropdown(getUniqueContinents(countriesList));
            });
    } else {
        fetchCountryInfo(countryName);
    }
}

function goBackToMain() {
    const state = { page: 'main' };
    history.pushState(state, '', 'index.html');
    loadPage();
}

function displayCountryList(arr, parentElement) {
    parentElement.innerHTML = "";
    arr.forEach(country => {
        let countryElement;
        let flagURL = country.flags?.svg;
        let continent = country.continents[0]?.toUpperCase() || "N/A";
        let currencies = country.currencies ? Object.values(country.currencies).map(curr => curr.name).join(", ") : "N/A";

        let languages;
        if (country.languages) {
            let allLanguages = Object.values(country.languages);
            languages = allLanguages.slice(0, 5).join(", ");
            if (allLanguages.length > 5) {
                languages += ", etc.";
            }
        } else {
            languages = "N/A";
        }

        let capital = country.capital ? country.capital[0] : "N/A";

        countryElement = createElementFromHtml(`
            <div class="card">
                <img src="${flagURL}" alt="">
                <div class="info">
                    <div class="card-content">
                        <h2>${country.name.common}</h2>
                        <p class="description">
                            Population: ${country.population} <br>
                            Area: ${country.area} km² <br>
                            Continent: ${continent} <br>
                            Currency: ${currencies} <br>
                            Languages: ${languages} <br>
                            Capital: ${capital}
                        </p>
                    </div>
                </div>
            </div>`
        );

        parentElement.appendChild(countryElement);
    });
    addClickEventToCountryCards();
}

function addClickEventToCountryCards() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", function (event) {
            handleCountryCardClick(event);
        });
    });
}

function handleCountryCardClick(event) {
    const cardTitleElement = event.currentTarget.querySelector(".card-content h2");
    if (cardTitleElement) {
        const countryName = cardTitleElement.textContent.toLowerCase();
        fetchCountryInfo(countryName);

        const state = { page: 'details' };
        const url = `details?country=${countryName}`;
        history.pushState(state, '', url);
    }
}

function fetchCountryInfo(countryName) {
    fetch(`https://restcountries.com/v3.1/name/${countryName}`)
        .then(response => response.json())
        .then(countryData => {
            const country = countryData[0];
            const flagURL = country.flags?.svg || 'https://via.placeholder.com/150';
            const mapElement = createMap(country.latlng[0], country.latlng[1]);

            defaultView = [country.latlng[0], country.latlng[1]];
            displayCountryDetails(
                countryName,
                country.capital?.[0] || 'Not available',
                country.description?.common || 'Not available',
                flagURL,
                mapElement,
                country
            );
        })
        .catch(error => console.error("Error fetching country information:", error));
}

function createMap(lat, lng) {
    const containerId = 'map-container';
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Map container not found.");
        return null;
    }

    if (map) {
        map.off();
        map.remove();
    }

    const view = lat && lng ? [lat, lng] : defaultView;

    map = L.map(containerId).setView(view, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    return map;
}


function displayCountryDetails(countryName, capital, description, flagURL, mapElement, countryData) {
    const {
        alpha2Code,
        area,
        borders,
        callingCodes,
        continents,
        currencies,
        demonym,
        demonyms,
        independent,
        landlocked,
        languages,
        latlng,
        name,
        nativeName,
        numericCode,
        population,
        postalCodes,
        region,
        subregion,
        timezones,
        topLevelDomain,
        translations,
        unMember
    } = countryData;

    const countryElement = createElementFromHtml(`
        <section class="section2">
            <h2>${name.common?.toUpperCase()}</h2>
            <div class="content">
                <span>Country Code (Alpha-2): ${alpha2Code || 'Not available'}</span><br>
                <span>Geographical Size: ${area || 'Not available'} km²</span><br>
                <span>Border Countries: ${borders?.join(', ') || 'Not available'}</span><br>
                <span>Calling Codes: ${callingCodes?.join(', ') || 'Not available'}</span><br>
                <span>Continents: ${continents?.join(', ') || 'Not available'}</span><br>
                <span>Currencies: ${Array.isArray(currencies) ? currencies.map(curr => curr.name).join(', ') : 'Not available'}</span><br>
                <span>Demonym: ${demonym || 'Not available'}</span><br>
                <span>Genderized Demonyms: ${demonyms?.m || 'Not available'}, ${demonyms?.f || 'Not available'}</span><br>
                <span>Independence Status: ${independent || 'Not available'}</span><br>
                <span>Landlocked Country: ${landlocked || 'Not available'}</span><br>
                <span>Languages: ${Array.isArray(languages) ? languages.join(', ') : 'Not available'}</span><br>
                <span>Latitude and Longitude: ${latlng?.join(', ') || 'Not available'}</span><br>
                <span>Official Name: ${name.official || 'Not available'}</span><br>
                <span>Common Name: ${name.common || 'Not available'}</span><br>
                <span>Native Name: ${nativeName || 'Not available'}</span><br>
                <span>Native Official Name: ${nativeName?.official || 'Not available'}</span><br>
                <span>Native Common Name: ${nativeName?.common || 'Not available'}</span><br>
                <span>ISO 3166-1 Numeric Code: ${numericCode || 'Not available'}</span><br>
                <span>Population: ${population || 'Not available'}</span><br>
                <span>Postal Codes Format: ${postalCodes?.format || 'Not available'}</span><br>
                <span>Postal Codes Regex: ${postalCodes?.regex || 'Not available'}</span><br>
                <span>Region: ${region || 'Not available'}</span><br>
                <span>Subregion: ${subregion || 'Not available'}</span><br>
                <span>Timezones: ${timezones?.join(', ') || 'Not available'}</span><br>
                <span>Top Level Domain: ${topLevelDomain || 'Not available'}</span><br>
                <span>Translations: ${Array.isArray(translations) ? translations.join(', ') : 'Not available'}</span><br>
                <span>UN Member Status: ${unMember || 'Not available'}</span><br>
                <a href="https://en.wikipedia.org/wiki/${name.common}" target="_blank" rel="noopener noreferrer">Learn more</a>
            </div>
        </section>`
    );

    const backButton = createElementFromHtml('<button>Go Back to Main Page</button>');
    backButton.addEventListener('click', goBackToMain);
    countryElement.appendChild(backButton);

    document.getElementById("section1").innerHTML = '';
    document.getElementById("section1").appendChild(countryElement);
}

function handleSort(e) {
    document.getElementById("section1").innerHTML = "";
    let sortType = e.target.textContent.trim().toLowerCase();
    sortCountries(sortType);
}

function constructSortDropdown(arr) {
    const dropdownContainer = document.getElementById("types-dropdown");
    dropdownContainer.innerHTML = "";

    arr.forEach(option => {
        let optionElement = document.createElement("li");
        optionElement.innerHTML = `<a class="dropdown-item" href="#" data-sort="${option.toLowerCase()}">${option}</a></li>`;

        optionElement.addEventListener('click', function (event) {
            handleSort(event);
        });

        dropdownContainer.appendChild(optionElement);
    });
}

function sortCountries(typee) {
    switch (typee) {
        case "alphabetical order":
            countriesList.sort((a, b) => a.name.common.localeCompare(b.name.common));
            break;
        case "population size":
            countriesList.sort((a, b) => b.population - a.population);
            break;
        case "area size":
            countriesList.sort((a, b) => b.area - a.area);
            break;
        default:
            break;
    }

    displayCountryList(countriesList, document.getElementById("section1"));
}

function getUniqueContinents(countries) {
    const continentsSet = new Set();
    countries.forEach(country => {
        if (country.continents) {
            country.continents.forEach(continent => {
                continentsSet.add(continent);
            });
        }
    });
    return Array.from(continentsSet);
}

function constructContinentDropdown(arr) {
    const dropdownContainer = document.getElementById("continents-dropdown");
    dropdownContainer.innerHTML = "";

    arr.forEach(continent => {
        let continentElement = document.createElement("li");
        continentElement.innerHTML = `<a class="dropdown-item" href="#" data-continent="${continent}">${continent}</a></li>`;

        continentElement.addEventListener('click', function (event) {
            handleContinent(event);
        });

        dropdownContainer.appendChild(continentElement);
    });
}

function handleContinent(e) {
    document.getElementById("section1").innerHTML = "";
    let selectedContinent = e.target.dataset["continent"];

    const filteredCountries = countriesList.filter(country => country.continents && country.continents.includes(selectedContinent));
    displayCountryList(filteredCountries, document.getElementById("section1"));
}

let searchValue = "";

function handleSearch(e) {
    e.preventDefault();
    searchValue = e.target.value.toLowerCase();
    let filteredCountries = countriesList.filter(country => country.name.common.toLowerCase().includes(searchValue));
    displayCountryList(filteredCountries, document.getElementById("section1"));
}

function constructSearch(searchValue) {
    resetPage();
    document.querySelector(".title").textContent = searchValue.toUpperCase();
    let filteredCountries = countriesList.filter(country => country.name.common.toLowerCase().includes(searchValue));
    displayCountryList(filteredCountries, document.getElementById("section1"));
}

document.querySelector(".form-control").addEventListener("input", handleSearch);

function createElementFromHtml(str) {
    var divElement = document.createElement("div");
    divElement.innerHTML = str.trim();
    return divElement.firstChild;
}

function resetPage() {
    document.getElementById("section1").innerHTML = "";
}
