const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const fetch=require("node-fetch");
const app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));
app.set("view engine", "ejs");

/* API Key */

/* including css */
app.use(express.static("public"));
process.stdin.setEncoding("utf8");
let portNumber = 5000;
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 

/* Database connectivity */
let apiKey = process.env.API_KEY
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const db = process.env.MONGO_DB_NAME;
const dbCollection = process.env.MONGO_COLLECTION;
const databaseAndCollection = {db: db, collection:dbCollection};
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${userName}:${password}@cluster0.vqkimth.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(`Web server started and running at: http://localhost:${portNumber}`);

/* Endpoints */
app.get("/", (request,response)=>{
    response.render("index");
})
app.get("/findComicHero", (request, response)=> {
    response.render("findComicHero")
})
app.get("/createOwnHero", (request,response)=> {
    response.render("createOwnHero")
})

app.post("/findComicHeroResult", async (request, response)=> {
    let marvelBaseUrl = `https://superheroapi.com/api/${apiKey}/search`;
    let heroName = request.body.name;
    try {
        let result = await fetch(marvelBaseUrl + `/${heroName}`);
        let json = await result.json();
        if (json.response != 'error') {
            let powerStats = json?.results[0]?.powerstats;
            let variables = {
                heroName: heroName,
                heroIntelligence: powerStats.intelligence,
                heroStrength: powerStats.strength,
                heroSpeed: powerStats.speed,
                heroImage: json.results[0]?.image.url
        }
        response.render("findComicHeroResult", variables);
        } else {
            response.render("noResults", {heroName: heroName});
        }
        
    } catch (e) {
        console.log(e);
        
    } finally {
        console.log("Worked");
    }
    
})
app.get("/getAllHeroes", async(request,response)=>{
    try {
        await client.connect();
        let filter = {};
        const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .find(filter);
        const heroArr = await result.toArray();
        resString =""
        heroArr.forEach((obj)=> {
            resString += `
            <h3>${obj.name}</h3>
            <p> Strength: ${obj.strength} </p>
            <p> Intelligence: ${obj.intelligence}</p>
            <hr>
            `
        })
        response.render("getAllHeroes", {resString:resString});
    } catch (e) {
        console.log(e);
    } finally {
        await client.close();
    }
    
})
app.post("/createOwnHeroResult", async (request,response)=> {
    try {
        await client.connect();
        const heroData = {
            name: request.body.name,
            strength: request.body.strength,
            intelligence: request.body.intelligence,
        };
        await insertHero(client, databaseAndCollection, heroData)
        response.render("createOwnHeroResult", heroData);

    } catch(e) {
        console.log(e)
    } finally {
        await client.close();
    }

})

async function insertHero(client, databaseAndCollection, newHero) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newHero);
}
app.listen(portNumber);
