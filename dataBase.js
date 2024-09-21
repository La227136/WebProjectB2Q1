import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const API_URL = 'https://www.data.gouv.fr/fr/datasets/r/3c1e927c-9cf1-43c7-98b7-c32336879743';
const DB_PATH = './coiffeurs.db';

async function getHairdresserData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération de l'API: ", error);
    }
}
async function setupDatabase() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    await db.run(`CREATE TABLE IF NOT EXISTS hairdressers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number TEXT, 
        street TEXT NOT NULL,
        zipCode INTEGER NOT NULL CHECK (zipCode > 0),
        city TEXT NOT NULL,
        latitude REAL NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
        longitude REAL NOT NULL CHECK (longitude >= -180 AND longitude <= 180)
    )`);

    return db;
}
async function insertHairdressers(db, features) {
    const insertStmt = await db.prepare(`INSERT INTO hairdressers (name, number, street, zipCode, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const feature of features) {
        try {
            // Destructuring with renaming to match English column names
            let {
                nom: name,
                num: number,
                voie: street,
                codepostal: zipCode,
                ville: city,
                lat: latitude,
                lng: longitude
            } = feature.properties;

            // Insert the data into the database using the English column names
            await insertStmt.run(name, number, street, zipCode, city, latitude, longitude);
        } catch (error) {
            console.error("Erreur lors de l'insertion des données :", error);
        }
    }
    await insertStmt.finalize(); // Finalize the prepared statement
}

async function main() {
    try {
        const data = await getHairdresserData();
        const db = await setupDatabase();

        await insertHairdressers(db, data.data.features);

        const rows = await db.all('SELECT * FROM hairdressers LIMIT 3');
        rows.forEach(row => {
            console.log(row);
        });

        await db.close();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Do not call main just in case error of inattention (node dataBase)
// main();

async function deleteCoiffeurTable() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    try {
        await db.run(`DROP TABLE IF EXISTS hairdressers`);
        console.log("La table a été supprimée avec succès.");
    } catch (error) {
        console.error("Erreur lors de la suppression de la table :", error);
    }

    await db.close();
}

// deleteCoiffeurTable();