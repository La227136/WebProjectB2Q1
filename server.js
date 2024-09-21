// ------------------------
// Configuration and Setup
// ------------------------

// Import dependencies
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import jsonwentoken from 'jsonwebtoken';
import dotenv from 'dotenv';

// Initialize variables
const jwt = jsonwentoken;
const app = express();
const port = 3000;

// Configure dotenv for environment variables
dotenv.config();

// Initialize Express and middleware
app.use(express.static('public'));
app.use(express.json());

// ------------------------
// Database Connection
// ------------------------
async function connectDB() { //function to connect to the database
    return await open({
        filename: './coiffeurs.db',
        driver: sqlite3.Database
    });
}

// ------------------------
// Middleware
// ------------------------
function AuthTOKEN(req, res, next){ //middleware to check if the user is authenticated
    const authHeader = req.headers['authorization']; //retrieve the authorization header
    const token = authHeader && authHeader.split(' ')[1]; //retrieve the token from the header
    // console.log(token)
    if (token == null) return res.status(401).json({ error: "No Token" });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Wrong Token" });
      //  console.log(user.name)
        req.user = user; //store the user in the request
        next(); //call the next middleware
    })
}

// ------------------------
// GET route
// ------------------------
app.get('/data', async (req, res) => {
    const searchQuery = req.query.search || ''; // Retrieves the search parameter
    const page = req.query.page ? parseInt(req.query.page) : 0;
    const limit = 10;
    const offset = page * limit; // Calculates the offset based on the page number

    try {
        const db = await connectDB();
        const sql = `SELECT * FROM hairdressers  
                        WHERE name LIKE ? 
                        OR city LIKE ? 
                        ORDER BY name 
                        LIMIT ? OFFSET ?`; // SQL query with parameters
        const params = [`%${searchQuery}%`, `%${searchQuery}%`, limit, offset];
        const rows = await db.all(sql, params)

            res.json(rows.map(row => { // Returns the rows as JSON
                return {
                    id:row.id,
                    name: row.name,
                    number: row.number,
                    street:row.street,
                    zipCode: row.zipCode,
                    city: row.city,
                    longitude: row.longitude,
                    latitude : row.latitude
                }
            }));
        await db.close();
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données");
    }
});
app.get('/nbHairdressers', async (req, res) => { //route to get the number of hairdressers
    const searchTerm = req.query.search || '';
    try{
        const db = await connectDB();
        const sql = `SELECT COUNT(*) as totalResults FROM hairdressers 
                        WHERE name LIKE ? 
                        OR city LIKE ?`; // SQL query with parameters
        const params = [`%${searchTerm}%`, `%${searchTerm}%`];
        const result = await db.get(sql, params); // Returns the rows as JSON
       // console.log(result.totalResults)
        res.json( {totalResults: result.totalResults} ); // Returns the rows as JSON
        await db.close();
    }catch (error){
        console.error(error);
        res.status(500).send("Erreur lors de la récupération des données");
    }
})
app.get('/isAdmin', AuthTOKEN, (req, res) => { //route to check if the user is an admin
    res.json({isValid: true})
})

// ------------------------
// POST route
// ------------------------
app.post('/signup', async (req, res) => {
    const {login, password} = req.body; //get the login and password from the request body
    const saltRounds = 10;
    const db = await connectDB(); //connect to the database
    try{
        const hash = await bcrypt.hash(password, saltRounds); //hash the password
        const sql = `INSERT INTO admin (login, passwordHashed) VALUES (?, ?)`;
        const params = [login, hash]; //parameters to pass to the query
        const result = await db.run(sql, params);
       // console.log(result)
        res.status(200).json({ message: "admin Created" });
    }catch (error){
        console.error(error);
        res.status(500).json({ error: "Interal server error"})
    }finally {
        await db.close();
    }
})
app.post('/addHairdresser', AuthTOKEN, async (req, res) => { //route to add a hairdresser
    const {name, number, street, zipCode, city, latitude, longitude} = req.body; // I reversed lat and long so that it's in the same order 99%.
                                                                                // it doesn't change anything, but I'll say it just in case
   // console.log(req.body)
    const db = await connectDB();
    try{
        const sql = `INSERT INTO hairdressers (name, number, street, zipCode, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`; //query to insert the hairdresser
        const params = [name, number, street, zipCode, city, latitude, longitude];
      //  console.log(params)
        const result = await db.run(sql, params); //execute the query
        res.status(200).json({ message: "Hairdresser Created" });
    }catch (error){
        console.error(error);
        res.status(500).json({ error: "Internal server error"})
    }finally {
        await db.close();
    }
})

// ------------------------
// PUT route
// ------------------------
app.put('/updateHairdresser', AuthTOKEN, async (req, res) => { //route to update a hairdresser
    const { id, name, number, street, zipCode, city, latitude, longitude } = req.body;

    const db = await connectDB();
    try {
        const sql = ` 
            UPDATE hairdressers
            SET name = ?, number = ?, street = ?, zipCode = ?, city = ?, latitude = ?, longitude = ?
            WHERE id = ?`; //query to update the hairdresser
        const params = [name, number, street, zipCode, city, latitude, longitude, id];
        await db.run(sql, params);

        res.status(200).json({ message: "Hairdresser Updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await db.close();
    }
});

// ------------------------
// Server Initialization
// -----------------------
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});