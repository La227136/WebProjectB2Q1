// ------------------------
// initialization of variables
// -----------------------

// Global variables for the map
let map
let marker

// Variable for fn loadHairdresses and createHairdresserElement to not create it 10times
const hairdresserDiv = document.getElementById("hairdressersContainerID")
const hairdresserTemplate = document.getElementById("hairdresserTemplateID")

// Variables for fn selectHairdresser
// Store the currently selected hairdresser
let selectedHairdresser = null;

// Variable for fn open and close panel
let slidingPanel = document.getElementById("slidingPanelID");
const mainContentID = document.getElementById('mainContentID')
let resultCount = document.getElementById('searchBarLabel');
let isClosing = false;

// variable for fn loadHairdressers and searchBar
let currentPage = 0;
const searchBar = document.querySelector('.searchBar');
const observerBtn = document.getElementById("observerBtnID")
let totalHairdressersDisplayed = 1;
const panelConfirmationBtn = document.getElementById("panelConfirmationBtnID")

// variables for fn adminInterface and userInterface
const LoginIcon = document.querySelector('.loginIconCLASS');
const AddUserIcon = document.querySelector('.addUserIconCLASS');
const LogoutIcon = document.querySelector('.logoutButtonCLASS');
const containerDetails = document.querySelector(".containerDetailsCLASS")
const inputGroup = document.querySelectorAll(".inputGroup")
const detailsText = document.getElementById("detailsTextID")
const detailsTextLabel = document.querySelectorAll(".detailsLabel")
const detailsTextInput = document.querySelectorAll(".detailsInputCLASS")
const adminButtonContainer = document.getElementById("buttonContainerID")

// ------------------------
// Initialization Functions
// -----------------------
async function verifyAdminAccess() {
    // console.log("Modif")
    const token = localStorage.getItem('accessToken');
    const url = 'http://localhost:3000/isAdmin'
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
       // console.log(response)
        if (!response.ok) {
            if (response.status === 403) {
                if (localStorage.getItem('isConnected') === 'true') {
                    await refreshToken();
                    await verifyAdminAccess();
                } else {
                   // console.log("Pas connecté")
                    localStorage.setItem('isConnected', false)
                    userInterface()
                }
            }else if (response.status === 401){
               // console.log("pas de token")
                userInterface()
            }

            else {
                console.error("Erreur:", response.status);
            }
        }else{
            const result = await response.json();
            if(result.isValid === true){
              //  console.log("Admin connecté")
                AdminInterface()
            }else{
             //   console.log("Pas admin")
                userInterface()
            }
        }
    } catch (error) {
        console.error('Erreur:', error.message || error);
    }
}
function createMap() {
    try{
        mapboxgl.accessToken = 'pk.eyJ1IjoibG9nMzEiLCJhIjoiY2xwNDk1bHB0MWN4ODJrcnBjdGg0Yno5ZCJ9.hb50fo-TAbCGx4mjVbJNrw';
        map = new mapboxgl.Map({
            container: document.querySelector('.mapContainerCLASS'),
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [10, 10],
            zoom: 17
        });
        marker = new mapboxgl.Marker()
            .setLngLat([10, 10])
            .addTo(map);
    }catch(err){console.error(err)}

}
function setupIntersectionObserver() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadHairdressers();
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 1.0
    });

    observer.observe(observerBtn);
}
function setupEventListeners(){
    panelConfirmationBtn.addEventListener("click", handlePanelConfirmationClick)
    searchBar.addEventListener('input', handleSearchInputChange);
}

// ------------------------
// Event Handler Functions
// -----------------------
async function handlePanelConfirmationClick() {
    if (selectedHairdresser) {
        await updateHairdresser();
    } else {
        await addHairdresser();
    }
}
function handleSearchInputChange() {
    hairdresserDiv.innerHTML = '';
    currentPage = 0;
    totalHairdressersDisplayed = 1;
    observerBtn.style.display = 'block';
}

// ------------------------
// UI Functions
// -----------------------
async function openPanel() {
    slidingPanel.classList.remove('displayNone')
    setTimeout(() => {
        slidingPanel.classList.remove("hidden")
        mainContentID.classList.add('reducedContent')
        map.resize();
    }, 10);

    const MapContainer = document.querySelector('.mapContainerCLASS');
    if(MapContainer.classList.contains('displayNone')){

        MapContainer.classList.remove('displayNone')
    }
    const closeButton = document.querySelector('.closeButtonImgCLASS');
    if(closeButton.classList.contains('start')){
        closeButton.classList.remove('start')
    }
    closeButton.classList.remove('leaving');
    if(!closeButton.classList.contains('positioned')){
        closeButton.classList.add('coming')
    }
    closeButton.addEventListener('animationend', () => {
        closeButton.classList.remove('coming');
    })
    closeButton.classList.add('positioned')
}
function closePanel() {
    const closeButton = document.querySelector('.closeButtonImgCLASS');
    closeButton.classList.remove('positioned');
    closeButton.classList.add('leaving');

    if (selectedHairdresser) {
        selectedHairdresser.classList.remove("selected");
        selectedHairdresser = null;
    }

    if (!slidingPanel.classList.contains("hidden") && !isClosing) {
        isClosing = true;

        setTimeout(() => {
            slidingPanel.classList.remove("hidden");

            slidingPanel.addEventListener('transitionend', function onTransitionEnd() {
                slidingPanel.removeEventListener('transitionend', onTransitionEnd);

                if (slidingPanel.classList.contains("hidden")) {
                    slidingPanel.classList.add('displayNone');
                }

                map.resize();
                isClosing = false;
            });

            if (!slidingPanel.classList.contains("hidden")) {
                slidingPanel.classList.remove('displayNone');
            }
            slidingPanel.classList.add("hidden");
            mainContentID.classList.remove('reducedContent');
        }, 100);
    }
}
function AdminInterface(){

    LoginIcon.style.display = 'none';

    AddUserIcon.style.display = 'inline-block';
    AddUserIcon.classList.add('visible')

    LogoutIcon.style.display = 'inline-block';
    LogoutIcon.classList.add('visible')

    containerDetails.classList.add("adminContainerDetailsCLASS")

    inputGroup.forEach(group => {
        group.classList.add("adminInputGroup")
    })


    detailsText.classList.add("adminDetailsTextCLASS")

    detailsTextLabel.forEach(function(label) {
        label.classList.add("adminDetailsLabelCLASS");
    });

    detailsTextInput.forEach(input => {
        input.classList.add("adminDetailsInputCLASS")
    })

    adminButtonContainer.classList.add("adminButtonContainer")

    panelConfirmationBtn.classList.add("adminPanelConfirmationBtn")
}
function userInterface(){

    LoginIcon.style.display = 'inline-block';

    AddUserIcon.style.display = 'none';

    LogoutIcon.style.display = 'none';

    containerDetails.classList.add("userContainerDetailsCLASS")

    detailsTextInput.forEach(input => {
        input.classList.remove("adminDetailsInputCLASS")
    })

    detailsTextInput.forEach(label => {
        label.disabled = true
    })

    panelConfirmationBtn.classList.add("displayNone")

    inputGroup.forEach(group => {
        group.classList.remove("adminInputGroup")
        group.classList.add("userInputGroup")
    })

    const nameInput = document.getElementById("nameInputID")
    nameInput.classList.add("userInputNameBold")

    detailsTextLabel.forEach(label => {
        label.classList.remove("adminDetailsLabelCLASS")
        label.classList.add("userDetailsLabel")
    })

    const adminOnly = document.querySelectorAll(".adminOnly")
    adminOnly.forEach(group => {
        group.classList.add("displayNone");
    })
}
function addHairdresserInterface(){
    if(selectedHairdresser){
        selectedHairdresser.classList.remove("selected");
        selectedHairdresser = null;
    }
    openPanel();
    if(selectedHairdresser){
        selectedHairdresser.classList.remove("selected");
        selectedHairdresser = null;
    }
    const MapContainer = document.querySelector('.mapContainerCLASS');
    MapContainer.classList.add('displayNone')
    detailsTextInput.forEach(input => {
        input.value = ""
    })
    panelConfirmationBtn.innerText = "Ajouter"
}

// ------------------------
// Operational Logic Functions
// -----------------------
async function loadHairdressers() {
    try {
        const searchQuery = searchBar.value
        const response = await fetch(`/data?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        // console.log(data);

        if (currentPage === 0) {
            const searchResponse = await fetch(`/nbHairdressers?search=${encodeURIComponent(searchQuery)}`);
            const searchData = await searchResponse.json();
           // console.log("Résultat de la recherche: ", searchData);

            resultCount.textContent = searchData.totalResults +  " coiffeurs trouvés";
        }

        if(data.length < 10){
            observerBtn.style.display = 'none';
        }
        data.forEach(row => {
            const hairdresserComponent = createHairdresserElement(row);
            hairdresserDiv.appendChild(hairdresserComponent);
        });
        currentPage++;
    } catch (error) {
        console.error('Erreur:', error);
    }
}
function createHairdresserElement(row) {

    // console.log(row)
    // Clone the content of the template to create a new hairdresser component
    const hairdresserComponent = hairdresserTemplate.content.cloneNode(true);

    // Fill in the hairdresser information in the component
    hairdresserComponent.querySelector(".nameCLASS").textContent = row.name ;
    hairdresserComponent.querySelector(".streetCLASS").textContent = row.number + " " + row.street;
    hairdresserComponent.querySelector(".cityCLASS").textContent = row.zipCode + " " + row.city;

    hairdresserComponent.querySelector(".indexOrderCLASS").textContent = totalHairdressersDisplayed;
    totalHairdressersDisplayed++;

    // We create hairdresserElement because we need to
    // add a class later, so we can't
    // pass hairdresserComponent
    const hairdresserElement = hairdresserComponent.querySelector(".hairdresserCLASS");

    hairdresserElement.dataset.id = row.id;
    // Add an event listener to handle the selection of a hairdresser
    hairdresserElement.addEventListener("click", () => selectHairdresser(hairdresserElement, row));

    return hairdresserComponent;
}
function selectHairdresser(hairdresser,row) {

    if (hairdresser === selectedHairdresser) {
        hairdresser.classList.remove("selected");
        selectedHairdresser = null;
        closePanel();
    } else {
        if (selectedHairdresser) {
            selectedHairdresser.classList.remove("selected");
        }
        hairdresser.classList.add("selected");
        selectedHairdresser = hairdresser;
        openPanel();
        FillPanel(row);
    }
}
function FillPanel(row){
    const inputValues= [row.name, row.number, row.street, row.zipCode, row.city,row.latitude, row.longitude];

    detailsTextInput.forEach((element, index) => {
        element.value = inputValues[index];
    })
    setMapPosition(row)

    panelConfirmationBtn.textContent = "Enregistrer"
}
async function addHairdresser(){

    if(!validateInputsExceptNumber(detailsTextInput)){
        return
    }
    const url = 'http://localhost:3000/addHairdresser'
    const token = localStorage.getItem('accessToken');

    const hairdresserData = {};
    detailsTextInput.forEach(input => {
        hairdresserData[input.name] = input.value;
    })

    try{
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(hairdresserData)
        })
        const result = await response.json();

        if(!response.ok){
            console.error('Erreur lors de l\'ajout :', result);
            alert("Erreur de l'ajout du coiffeur. Veuillez vérifier vos entrées")
        }else{
            alert("Coiffeur ajouté")
            location.reload();
        }
    }catch (error){
        console.error('Erreur:', error.message || error);
    }

}
async function updateHairdresser() {

    if(!validateInputsExceptNumber(detailsTextInput)){
        return
    }

    let hairdresserData = {
        id: selectedHairdresser.dataset.id
    };

    detailsTextInput.forEach(input => {
        hairdresserData[input.name] = input.value;
    });

    const url = 'http://localhost:3000/updateHairdresser'
    const token = localStorage.getItem('accessToken');

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(hairdresserData)
        });

        const result = await response.json();
        if (response.ok) {

            selectedHairdresser.querySelector(".nameCLASS").textContent = hairdresserData.name;
            selectedHairdresser.querySelector(".streetCLASS").textContent = hairdresserData.number + " " + hairdresserData.street;
            selectedHairdresser.querySelector(".cityCLASS").textContent = hairdresserData.zipCode + " " + hairdresserData.city;
            setMapPosition(hairdresserData)

            const modifyConfirmation = document.getElementById("modifyConfirmationID")

            modifyConfirmation.classList.remove("leave")
            modifyConfirmation.classList.add("appear")


            setTimeout(() => {
                modifyConfirmation.classList.remove("appear")
                modifyConfirmation.classList.add("leave")
            }, 1000);


        } else {
            console.error('Erreur lors de la mise à jour :', result);
            alert("Erreur de la mise à jour du coiffeur. Veuillez vérifier vos entrées")
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi des données:', error);
    }
}


// ------------------------
// Network Functions
// -----------------------
async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken'); // Retrieve refresh token from localStorage
    try {
        const tokenResponse = await fetch(`http://localhost:4000/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: refreshToken }) // Send refresh token in the request body
        });

        const tokenResult = await tokenResponse.json(); // Parse the JSON response
        if (tokenResult.accessToken) {
            localStorage.setItem('accessToken', tokenResult.accessToken); // Update localStorage with the new access token
          //  console.log("Nouvel access token généré"); // Log message indicating a new access token is generated
        } else {
          //  console.log("Erreur lors de la génération du nouvel access token"); // Log an error message if no access token is received
        }
    } catch (error) {
        console.error('Erreur:', error.message || error); // Log any errors that occur during the try block
    }
}
async function Logout(){
    const token = localStorage.getItem('refreshToken');
    const url = 'http://localhost:4000/logout'
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        })
        if (response.ok){
            localStorage.setItem('isConnected', false);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            userInterface()
            location.reload()
        }else{
            console.error("Erreur:", response.status);
        }

    } catch (error) {
        console.error('Erreur:', error.message || error);
    }
}

// ------------------------
// Utility Functions
// -----------------------
function setMapPosition(row){
    map.setCenter([row.longitude,row.latitude])
    marker.setLngLat([row.longitude,row.latitude])
}
function GoToLoginPage() {
    window.location.href = "login-page.html";
}
function validateInputsExceptNumber(detailsTextClassInput) {
    for (let input of detailsTextClassInput) {
        if (!input.value.trim() && input.name !== "number") {
            alert("Un ou plusieurs champs sont vides. Veuillez tous les remplir");
            console.error(`Le champ ${input.name} est vide.`);
            return false;
        }
    }
    return true;
}

// ------------------------
// Main Function
// -----------------------
function initializeApp(){
    verifyAdminAccess()
    createMap()
    setupIntersectionObserver()
    setupEventListeners()

}
initializeApp()