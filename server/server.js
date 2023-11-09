// Import the necessary modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize the app
const app = express();
let lists={};

// Middleware to handle json data
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

let favoriteLists = []; // This will hold our favorite lists

app.get('/api/superheroes/info', (req, res) => {
    const infoPath = path.join(__dirname, 'superhero_info.json');
    fs.readFile(infoPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading superhero information');
            return;
        }
        res.json(JSON.parse(data));
    });
});

// Endpoint to read from superhero_powers.json
app.get('/api/superheroes/powers', (req, res) => {
    const powersPath = path.join(__dirname, 'superhero_powers.json');
    fs.readFile(powersPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading superhero powers');
            return;
        }
        res.json(JSON.parse(data));
    });
});
//Endpoint to get heroes information and powers from json files

app.get('/api/superheroes/search', (req, res) => {
    const searchQuery = req.query.q.toLowerCase();
    const searchCriteria = req.query.filterBy            || 'name';
  
    
    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');
  
    Promise.all([
        fs.promises.readFile(infoPath, 'utf8'),
        fs.promises.readFile(powersPath, 'utf8')
    ])
    .then(([infoData, powersData]) => {
        const superheroesInfo = JSON.parse(infoData);
        const superheroesPowers = JSON.parse(powersData);
  
        // Combine superhero information with their powers based on the name
        const combinedData = superheroesInfo.map(hero => {
            // Find the powers for the hero
            const heroPowersEntry = superheroesPowers.find(powerEntry => powerEntry.hero_names === hero.name);
            // Filter out the powers that are marked as 'True'
            const heroPowers = heroPowersEntry ? Object.keys(heroPowersEntry).reduce((powers, powerName) => {
                if (heroPowersEntry[powerName] === "True") {
                    powers.push(powerName);
                }
                return powers;
            }, []) : [];
  
            return { ...hero, powers: heroPowers };
        });
  
        // Filter combined data based on search criteria
        const filteredSuperheroes = combinedData.filter(hero => {
            switch(searchCriteria) {
                case 'id':
                    return hero.id === parseInt(searchQuery);
                case 'name':
                    return hero.name.toLowerCase().includes(searchQuery);
                case 'Race':
                    return hero.Race && hero.Race.toLowerCase().includes(searchQuery);
                case 'Publisher':
                    return hero.Publisher && hero.Publisher.toLowerCase().includes(searchQuery);
                case 'Power':
                    // Now we can check if any of the hero's powers include the search query
                    return hero.powers.some(power => power.toLowerCase().includes(searchQuery));
                default:
                    return true;
            }
        });
        //Send response with all the filtered heroes
        res.json(filteredSuperheroes);
    })
    .catch(err => {
        res.status(500).send('Error reading superhero data');
    });
  });

  //Endpoint to get superhero details for specific id, if id not entered and publisher selected, all publishers will be sent

  app.get('/api/superheroes/detail', (req, res) => {
    const superheroId = req.query.id ? parseInt(req.query.id) : null;
    const detailField = req.query.field.toLowerCase();

    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');

    if (detailField === "publisher" && superheroId === null) {
        // Handling the request for all publishers
        fs.promises.readFile(infoPath, 'utf8')
            .then((infoData) => {
                const superheroesInfo = JSON.parse(infoData);
                const publisherSet = new Set();
                superheroesInfo.forEach(hero => {
                    if (hero.Publisher) {
                        publisherSet.add(hero.Publisher);
                    }
                });
                const allPublishers = Array.from(publisherSet);
                res.json({ Publisher: allPublishers });
            })
            .catch(err => {
                res.status(500).send('Error reading superhero data: ' + err.message);
            });
    } else {
        // Handling the request for a specific superhero detail
        fs.promises.readFile(infoPath, 'utf8')
            .then((infoData) => {
                const superheroesInfo = JSON.parse(infoData);
                const superhero = superheroesInfo.find(sh => sh.id === superheroId);

                if (!superhero && superheroId !== null) {
                    res.status(404).send('Superhero not found');
                    return;
                }

                if (detailField === 'powers') {
                    fs.promises.readFile(powersPath, 'utf8').then((powersData) => {
                        const superheroesPowers = JSON.parse(powersData);
                        const powersEntry = superheroesPowers.find(p => p.hero_names === superhero.name);
                        const powers = powersEntry ? Object.keys(powersEntry).filter(key => powersEntry[key] === "True") : [];
                        
                        res.json({ name: superhero.name, detail: powers });
                    });
                } else {
                    // Capitalize the first letter to match the JSON keys (e.g., 'Publisher')
                    const newDetailField = detailField.charAt(0).toUpperCase() + detailField.slice(1);
                    if (newDetailField in superhero) {
                        res.json({ name: superhero.name, detail: superhero[newDetailField] });
                    } else {
                        res.status(404).send(`Detail '${newDetailField}' not found for superhero with ID ${superheroId}`);
                    }
                }
            })
            .catch(err => {
                res.status(500).send('Error reading superhero data: ' + err.message);
            });
    }
});

app.post('/api/lists', (req, res) => {
    const { listName } = req.body;
    if (lists[listName]) {
      return res.status(400).send('List name already exists.');
    }
    lists[listName] = [];
    res.status(201).send('List created successfully.');
  });


  app.put('/api/lists/:name', (req, res) => {
    console.log(req.params);
    const listName = req.params.name;
    const { superheroIds } = req.body;
    
    // Validate that superheroIds is an array
    if (!Array.isArray(superheroIds)) {
      return res.status(400).send('Expected superheroIds to be an array.');
    }
  
    // Check if the list exists
    if (!lists[listName]) {
      return res.status(404).send('List name does not exist.');
    }
  
    // Update the list with new IDs, avoiding duplicates
    lists[listName] = [...new Set([...lists[listName], ...superheroIds])];
    
    res.status(200).send({message: 'List updated successfully.', list: lists[listName]});
  });


 //Endpoint to get ids  
app.get('/api/lists/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
      return res.status(404).send('List does not exist.');
    }
    res.status(200).json(lists[listName]);
  });
//Endpoint to delete list
  app.delete('/api/lists/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
      return res.status(404).send('List does not exist.');
    }
    delete lists[listName];
    res.status(200).send('List deleted successfully.');
  });
  
  //Endpoint to get detials for each ID
  app.get('/api/lists/details/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
      return res.status(404).send('List does not exist.');
    }
  
    // Paths to the JSON files
    const infoPath = path.join(__dirname, 'superhero_info.json');
    const powersPath = path.join(__dirname, 'superhero_powers.json');
  
    // Read the JSON files and find details for each superhero ID
    Promise.all([
        fs.promises.readFile(infoPath, 'utf8'),
        fs.promises.readFile(powersPath, 'utf8')
    ])
    .then(([infoData, powersData]) => {
        const superheroesInfo = JSON.parse(infoData);
        const superheroesPowers = JSON.parse(powersData);
  
        const superheroDetails = lists[listName].map(id => {
            const superheroInfo = superheroesInfo.find(hero => hero.id === parseInt(id));
            if (!superheroInfo) {
              return null; // Handle case where superhero ID is not found
            }
            const superheroPowersEntry = superheroesPowers.find(powerEntry => powerEntry.hero_names === superheroInfo.name);
            const heroPowers = superheroPowersEntry ? Object.keys(superheroPowersEntry).filter(key => superheroPowersEntry[key] === "True") : [];
  
            return { ...superheroInfo, powers: heroPowers };
        }).filter(detail => detail != null); // Filter out any null details
  
        res.status(200).json(superheroDetails);
    })
    .catch(err => {
        res.status(500).send('Error reading superhero data: ' + err.message);
    });
  });
  
// Endpoint to get the list of superhero IDs for a given list
app.get('/api/lists/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
        return res.status(404).send('List does not exist.');
    }
    res.status(200).json(lists[listName]);
});

// Endpoint to delete a list
app.delete('/api/lists/:name', (req, res) => {
    const listName = req.params.name;
    if (!lists[listName]) {
        return res.status(404).send('List does not exist.');
    }
    delete lists[listName];
    res.status(200).send(`List named ${listName} deleted successfully.`);
});



//The port to run the server on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
