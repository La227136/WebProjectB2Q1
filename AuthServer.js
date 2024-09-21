// ------------------------
// Configuration and Setup
// ------------------------

import express from "express";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {open} from "sqlite";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express()
const jwt = jsonwebtoken;
dotenv.config();
const port = 4000;
app.use(cors());

app.use(express.json());


// ------------------------
// Database Connection
// ------------------------
async function connectDB() {  //function to connect to the database
    return await open({
        filename: './coiffeurs.db',
        driver: sqlite3.Database
    });
}

// ------------------------
// POST route
// ------------------------
app.post('/login', async (req, res) => { //login route
    const db = await connectDB();
    let {login, password } = req.body;

    try{
        const sql = `SELECT * FROM admin WHERE login = ?`; //select the user from the database
        const params = [login]; //parameters to pass to the query
       // console.log(params)
       // console.log(login)
        const result = await db.get(sql, params); //execute the query
        if(!result){
            res.status(500).send({ error: "User not found" }) //if the user is not found in the database
        }
        try{
            const match = await bcrypt.compare(password, result.passwordHashed); //compare the password with the password in the database
         //   console.log(match);
            if (match === true) {
                const accessToken = GenerateAccessToken({ name: login }); //generate the access token
                const refreshToken = jwt.sign({name: login}, process.env.REFRESH_TOKEN_SECRET);
                const decodedToken = jwt.decode(accessToken,{complete:true}); //decode the token to get the expiration date
                const expiration = decodedToken.payload.exp;
                const creation = decodedToken.payload.iat;
                const sql = `UPDATE tokens set user = ? ,access_token = ?, refresh_token = ?, expiration = ?, creation = ? WHERE user = user`; //update the tokens table
                const params = [login, accessToken, refreshToken, expiration, creation]; //parameters to pass to the query
                const result = await db.run(sql, params);
                res.status(200).json({ message: "Welcome admin" , accessToken: accessToken, refreshToken: refreshToken, expiration: expiration, creation: creation});
            } else if(match === false){
                res.status(401).json({ error: "Wrong login or password" });
            }
        }catch(error){
            console.error(error);
            res.status(500).send("Erreur lors de la récupération des données");
        }finally {
            await db.close();
        }
    }catch (error){
        console.error(error);
        res.status(500).json({ error: "Internal server error"})
    }
})

app.post('/token', async (req, res) => { //token route
    const refreshToken = req.body.token //get the refresh token from the request body
    if (!refreshToken){
        return res.sendStatus(401); //if there is no refresh token
    }
    const db = await connectDB();
    try{

        const sql = `SELECT * FROM tokens WHERE refresh_token = ?`; //select the token from the database
        const params = [refreshToken];
        const result = await db.get(sql, params);
        if (!result){
            return res.sendStatus(403); //if the token is not found in the database
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err){
                return res.sendStatus(403);
            }
            const accessToken = GenerateAccessToken({name: user.name}); //generate the access token
            res.json({accessToken: accessToken});

        })

    }catch (error){
       // console.log(error)
        res.status(500).json({ error: "Internal server error" }); // Internal server error

    }finally {
        await db.close();
    }

})
// ------------------------
// DELETE route
// ------------------------
app.delete('/logout', async (req, res) => {  //logout route
    const refreshToken = req.body.token //get the refresh token from the request body
    const db = await connectDB();
    const sql = `DELETE FROM tokens WHERE refresh_token = ?`; //delete the token from the database
    const params = [refreshToken];
    const result = await db.get(sql, params);
    if (!result){
        return res.sendStatus(204); //if the token is not found in the database
    }
    res.sendStatus(403); //if the token is found in the database
})
function GenerateAccessToken(user){
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'} ) //generate the access token
   // console.log(accessToken)
    return accessToken;
}

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})