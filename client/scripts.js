document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const sortButton = document.getElementById('sortButton');
    const getDetailButton = document.getElementById('getDetailButton');
    const searchQuery = document.getElementById('searchQuery');
    const detailField = document.getElementById('detailField');
    const superheroID = document.getElementById('superheroID');
    const detailResult = document.getElementById('detailResult');
    let sortedHeroes = [];


    searchButton.addEventListener('click', function() {
        const query = searchQuery.value;
        const filterBy = document.getElementById('filterBy').value;
        searchSuperheroes(query, filterBy);
    });

    sortButton.addEventListener('click', function() {
        const query = searchQuery.value;
        const sortCriteria = document.getElementById('sortCriteria').value;
        searchSuperheroes(query, 'name', sortCriteria.value);
    });
    //getDetailButton will display superhero detils for each ID

    getDetailButton.addEventListener('click', function() {
        const id = superheroID.value;
        const field = detailField.value;
        let url = `/api/superheroes/detail?field=${encodeURIComponent(field)}`;
        //Create proper url
        if(id.trim()!==''){
            url+=`&id=${encodeURIComponent(id.trim())}`;
        }
        //fetch url 
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (field.toLowerCase()==="publisher"&&id.trim()=== ''){
                    const publisherList = data.Publisher.join(', ')
                    detailResult.innerHTML = `<strong>All Publishers:</strong> ${publisherList}`;
                }
                else{
                    //format output capitalize first letter of field
                detailResult.innerHTML = '<strong>Name:</strong> '+data.name+'<br> <strong>' + field.charAt(0).toUpperCase()+field.slice(1,field.length) + ':</strong> ' + JSON.stringify(data.detail);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                detailResult.innerHTML = 'Error fetching details.';
            });
    });
    


    
    

    function searchSuperheroes(query, filterBy = 'name', sortCriteria = 'name') {
        fetch(`/api/superheroes/search?q=${encodeURIComponent(query)}&filterBy=${encodeURIComponent(filterBy)}&sort=${sortCriteria}`)
            .then(response => response.json())
            .then(data => {
                // Retrieve the value of 'n' from the input or default to the length of the data
                const n = document.getElementById('numberOfResults').value || data.length;
                sortedHeroes.push(data)
                displayResults(data, parseInt(n, 10)); // Parse the input to be an integer
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
    
    function displayResults(results, n) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';
        const ul = document.createElement('ul');
    
        // Display the results up to n items
        results.slice(0, n).forEach(superhero => {
            const li = document.createElement('li');
            // Setup the innerHTML with superhero details
            li.innerHTML = generateSuperheroHTML(superhero);
            ul.appendChild(li);
        });
    
        resultsDiv.appendChild(ul);
    }
    

// This function is triggered when the sort button is clicked
function sortAndDisplayResults(sortCriteria) {
    // Sort last results based on the selected criteria
    sortedHeroes.sort((a, b) => {
        // Compare values as lowercase strings to ensure the sort is case-insensitive
        const valueA = (a[sortCriteria] || '').toString().toLowerCase();
        const valueB = (b[sortCriteria] || '').toString().toLowerCase();
        return valueA.localeCompare(valueB);
    });

    // After sorting, display the results
    displayResults(sortedHeroes, sortedHeroes.length);
}

// Function to generate HTML for each superhero
function generateSuperheroHTML(superhero) {
    return `
        <h1>${superhero.name}</h1>
        <strong>ID:</strong> ${superhero.id}<br>
        <strong>Gender:</strong> ${superhero.Gender || 'N/A'}<br>
        <strong>Eye color:</strong> ${superhero['Eye color'] || 'N/A'}<br>
        <strong>Race:</strong> ${superhero.Race || 'N/A'}<br>
        <strong>Hair color:</strong> ${superhero['Hair color'] || 'N/A'}<br>
        <strong>Height:</strong> ${superhero.Height ? superhero.Height + ' cm' : 'N/A'}<br>
        <strong>Publisher:</strong> ${superhero.Publisher || 'N/A'}<br>
        <strong>Skin color:</strong> ${superhero['Skin color'] || 'N/A'}<br>
        <strong>Alignment:</strong> ${superhero.Alignment || 'N/A'}<br>
        <strong>Weight:</strong> ${superhero.Weight ? superhero.Weight + ' kg' : 'N/A'}<br>
        <strong>Powers:</strong> ${superhero.powers && superhero.powers.length > 0 ? superhero.powers.join(', ') : 'None'}<br>
    `;
}

// Event listener for the sort button
sortButton.addEventListener('click', function() {
    // Get the selected sort criteria
    const sortCriteria = document.getElementById('sortCriteria').value;
    // Sort and display the results based on the selected criteria
    sortAndDisplayResults(sortCriteria);
});


    
    
// Function to handle creating a new list
function createList() {
    let listName = document.getElementById('new-list-name').value;
    // Use Fetch API to send a POST request to your server
    fetch('/api/lists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listName: listName }) // assuming the server expects an object with the name property
    })
    .then(response => response.json())
    .then(data => {
      console.log('List created:', data);
      displayMessage("List created")

    })
    .catch(error => console.error('Error:', error));
  }
  
  // Function to handle saving IDS to list
  
function saveToList() {
    let listName = document.getElementById('list-name').value;
    let idsInput = document.getElementById('superhero-ids').value;
    
    // Split the input by comma, trim whitespace, and filter out any empty strings
    // This will create an array even if there is only one ID
    let ids = idsInput.split(',').map(id => id.trim()).filter(id => id !== '');
  
    // If no valid IDs were provided, show an error and return
    if (ids.length === 0) {
      console.error('No superhero IDs provided');
      
      return;
    }
  
    fetch(`/api/lists/${encodeURIComponent(listName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ superheroIds: ids })  // Ensure that ids is always an array
    })
    .then(response => {
      if (!response.ok) {
        displayMessage("List failed to update")
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
        console.log('List updated:', data);
        displayMessage(`List ${listName} has been updated`)
      
      
    })
    .catch(error => console.error('Error:', error));
  }
  // Helper function to display the superhero IDs
function displaySuperheroIDs(ids) {
    const listDisplayElement = document.getElementById('lists-display');
    const listSort = document.getElementById("sortCriteria")
    listDisplayElement.innerHTML = ''; // Clear any previous content
  
    // Check if there are IDs to display
    if (ids.length === 0) {
      listDisplayElement.innerHTML = '<p>No superheroes in this list.</p>';
    } else {
      // Create a list to display the superhero IDs
      const list = document.createElement('ul');
      ids.forEach(id => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `Superhero ID: ${id}`;
        list.appendChild(listItem);
      });
      listDisplayElement.appendChild(list);
    }
  }
  
  
  // Function to handle getting the list of superhero IDs
  function getListOfSuperheroIDs() {
    let listName = document.getElementById('action-list-name').value;
    fetch(`/api/lists/${encodeURIComponent(listName)}`) // Use encodeURIComponent to encode the list name for URL
    .then(response => response.json())
    .then(data => {
      console.log('List of IDs:', data);
      displayMessage(`<h2>ID List (${listName})</h2>`)
      displaySuperheroIDs(data)
    })
    .catch(error => console.error('Error:', error));
  }
  function displayMessage(mes=''){
    document.getElementById('message-container').innerHtml=''
    document.getElementById('message-container').innerHTML=mes

  }
  
  // Function to handle deleting a list
  function deleteList() {
    let listName = document.getElementById('action-list-name').value;
    displayMessage("List deleted")
    fetch(`/api/lists/${encodeURIComponent(listName)}`, {
      method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
      console.log('List deleted:', data);
      
      
      
      
    })
    .catch(error => console.error('Error:', error));
    displayMessage("List deleted")
  }

  function displayListDetails(details) {
    const detailsDisplay = document.getElementById('lists-display');
    detailsDisplay.innerHTML = ''; // Clear any existing content
  //Display each super hero in list 
    details.forEach(detail => {
      const detailContainer = document.createElement('div');
      detailContainer.className = 'superhero-detail';
  
      const name = document.createElement('h2');
      name.innerHTML = detail.name || 'Name not available';
  
      const publisher = document.createElement('p');
      publisher.innerHTML = `Publisher: ${detail.Publisher || 'Publisher not available'}`;
  
      const race = document.createElement('p');
      race.innerHTML = `Race: ${detail.Race || 'Race not available'}`;
  
      const powers = document.createElement('p');
      powers.innerHTML = `Powers: ${detail.powers.join(', ') || 'No powers listed'}`;


      const gender = document.createElement('p');
      gender.innerHTML = `Gender: ${detail.Gender|| 'No Gender listed'}`;

      const eyeColor = document.createElement('p');
      eyeColor.innerHTML = `Eye Color: ${detail["Eye color"]|| 'No eye color listed'}`;

      const hairColor = document.createElement('p');
      hairColor.innerHTML = `Eye Color: ${detail["Hair color"]|| 'No hair color listed'}`;

      const height = document.createElement('p');
      height.innerHTML = `Height: ${detail.Height|| 'No height listed'}`;

      const skinColor = document.createElement('p');
      skinColor.innerHTML = `Skin Color: ${detail["Skin color"]|| 'No skin color listed'}`;

      const alignment = document.createElement('p');
      alignment.innerHTML = `Alignment: ${detail.Alignment|| 'No alignment listed'}`;

      const weight = document.createElement('p');
      weight.innerHTML = `Weight: ${detail.Weight|| 'No weight listed'}`;
      

  
      detailContainer.appendChild(name);
      detailContainer.appendChild(publisher);
      detailContainer.appendChild(race);
      detailContainer.appendChild(powers);
      detailContainer.appendChild(gender);
      detailContainer.appendChild(eyeColor);
      detailContainer.appendChild(hairColor);
      detailContainer.appendChild(height);
      detailContainer.appendChild(skinColor);
      detailContainer.appendChild(alignment);
      detailContainer.appendChild(weight);

  
      detailsDisplay.appendChild(detailContainer);
    });
  }
  function clear(){
    document.getElementById('lists-display').innerHTML='';
    document.getElementById('new-list-name').value='';
    document.getElementById('list-name').value = '';
    document.getElementById('superhero-ids').value = '';
    document.getElementById('action-list-name').value=''
    document.getElementById('message-container').innerHTML=''

  }
  
  
  // Function to get list details
  function getListDetails() {
    let listName = document.getElementById('action-list-name').value;
    fetch(`/api/lists/details/${encodeURIComponent(listName)}`)
    .then(response => response.json())
    .then(data => {
      console.log('List details:', data);
      displayMessage(`<h2>Details List (${listName})</h2>`)
      displayListDetails(data)
    })
    .catch(error => console.error('Error:', error));
  }
  
  // Set up click event listeners for the buttons
  document.getElementById('create-list-button').addEventListener('click', createList);
  document.getElementById('save-to-list-button').addEventListener('click', saveToList);
  document.getElementById('get-list').addEventListener('click', getListOfSuperheroIDs);
  document.getElementById('delete-list').addEventListener('click', deleteList);
  document.getElementById('get-list-details').addEventListener('click', getListDetails);
  document.getElementById('clear').addEventListener('click', clear);
  
  
  
});


