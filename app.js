const express = require("express");
const io = require("socket.io");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser")
const path = require("path");
const app = express();
const bd = require("./bd.js");

//game mechanics
const Game = require("./game/js/game.js");
const outils = require("./game/js/outils.js");
const tileset = require("./assets/maps/terrain.json");
const map = require("./assets/maps/map1.json");

app.set("view engine", "pug");

/******************************* 
**********STATIC FILES**********
*******************************/
app.use("/js", express.static(path.normalize(__dirname + "/assets/js")));
app.use("/lib", express.static(path.normalize(__dirname + "/assets/libs")));
app.use("/img", express.static(path.normalize(__dirname + "/assets/img")));
app.use("/css", express.static(path.normalize(__dirname + "/assets/css")));
app.use("/maps", express.static(path.normalize(__dirname + "/assets/maps")));


/******************************* 
***********MIDDLEWARES**********
*******************************/
app.use(cookieParser());
app.use(session({
    secret: 'there is no spoon',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        url: 'mongodb+srv://admin:G5JYxQAEzOqzrlTa@cache-cache-o1uzn.gcp.mongodb.net/test?retryWrites=true&w=majority',
        database: "jeuback",
        collection: "sessions"
    })
}));

app.use(function (req, res, next) {
    // Initialise page template for pug
    res.locals.pageTemplate = {
        pageTitle: null,
        userIsLogged: false,
        message: {type: null, text: null},
        user: null,
    }
    //checks if user is connected / session initialised
    if(req.session.utilisateur){
        res.locals.pageTemplate.userIsLogged = true;
        res.locals.pageTemplate.user = req.session.utilisateur
    }
    next();
    //Intern message system
    
});

/******************************* 
*************ROUTES*************
*******************************/

app.get("/", function(req, res){
    res.locals.pageTemplate.pageTitle = "Accueil";
    if(app.locals.message){
        res.locals.pageTemplate.message.type = app.locals.message.type;
        res.locals.pageTemplate.message.text = app.locals.message.text;
        app.locals.message = null;
    }
    if(res.locals.pageTemplate.userIsLogged){
        res.redirect("/hall");
    } else {
        res.render("accueil", res.locals.pageTemplate);
    }
});

app.get("/hall", function(req, res){
    res.locals.pageTemplate.pageTitle = "Hall des Joueurs";
    if(app.locals.message){
        res.locals.pageTemplate.message.type = app.locals.message.type;
        res.locals.pageTemplate.message.text = app.locals.message.text;
        app.locals.message = null;
    }
    if(res.locals.pageTemplate.userIsLogged){
        // console.log(req.cookies);
        // console.log(req.session);
        res.render("games-list2", res.locals.pageTemplate);
    } else {
        app.locals.message = {
            type: "error",
            text: "Il faut se connecter pour accéder à cette page"
        }
        res.redirect("/");
    }
});
app.get("/game/:id", function(req, res){
    let gameName = decodeURIComponent(req.params.id);
    res.locals.pageTemplate.pageTitle = "Game";
    res.locals.pageTemplate.myGamename = gameName;
    if(res.locals.pageTemplate.userIsLogged){
        res.render("game-screen", res.locals.pageTemplate);
    } else {
        app.locals.message = {
            type: "error",
            text: "Il faut se connecter pour accéder à cette page"
        }
        res.redirect("/");
    }
});

app.get("/login", function(req, res){
    // console.log(req.query);
    bd.connect(function(err) {
        if (err) {
            return console.log(err);
        } else {
            let coll = bd.get().db("jeuback").collection("users");
            coll.find({name: req.query.identifiant}).next(function(err, doc){
                bd.close();
                if(err){
                    return console.log("this is an error: " + err);
                } else {
                    if(doc && doc.password === req.query.mdp){
                        // console.log("Trouvé!");
                        req.session.utilisateur = {
                            id: doc._id,
                            name: doc.name,
                            niveau: doc.level
                        }
                        app.locals.message = {
                            type: "success",
                            text: "Salut " + doc.name + ". Envie de jouer? =)"
                        };
                        res.redirect("/hall");
                    } else {
                        app.locals.message = {
                            type: "error",
                            text: "Identifiant ou mot de passe erroné! Veuillez réessayer."
                        };
                        res.redirect("/");
                    }
                }
            });
        }
    });
});

app.get("/logout", function(req, res){
    req.session.regenerate(function(err) {
        if(err){console.log(err)}else{
            res.redirect('/');
        }
    });
});

app.use(function (req, res) {
    res.status(404).render('404');
});

const httpServer = app.listen(2727, function(){
    console.log("Server listening at port: 2727");
});

/******************************* 
***********SOCKET.IO************
*******************************/

let ioServer = new io(httpServer);

let games = [];
let playersConnected = [];

//create game for testing
let newGame = Game("Test Game", map[0], 5, "TheGameMaster");
newGame.mapName = "map1";
newGame.drawMap(tileset);
games.push(newGame);
console.log("game '" + newGame.name + "' created");
// console.log(games);

ioServer.on("connection", function(socket){

    let user = {};
    
    // let page = socket.handshake.headers.referer;
    
    socket.on("hall", function(username){
        console.log("TCL: username", username);
        
        /*****  Getting user info ******/
        user.name = username;
        user.in = "hall";

        // Store user info in array
        playersConnected.push(user);
        
        // send list of current games
        let gamesList = [];
        games.forEach(function(game){
            let players = [];
            game.players.forEach(function(player){
                let playerInfo = {
                    name: player.name,
                    color: player.name
                }
                player.push(playerInfo);
            })
            let gameInfo = {
                name: game.name,
                map: game.mapName,
                players: players
            };
            gamesList.push(gameInfo)
        });
        socket.emit("games list", gamesList);

        // Send players already (array) connected to new player (socket)
        socket.emit("connected players", playersConnected);

        // Send new player to players already connected (broadcast)
        socket.broadcast.emit("player entered", user);

        
        socket.on("create game", function(data){
            let map = require("./assets/maps/" + data.map + ".json");
            let newGame = Game(data.name, map[0], data.maxPlayers, user.name);
            newGame.drawMap(tileset);
            games.push(newGame);
            console.log("game '" + newGame.name + "' created");
            ioServer.emit("game created", newGame.name);
        });

        // on join game
        socket.on("join game", function(data){
            user.joined = data.gameName;
            user.gameChair = data.gameChair;

            let currentGame = games.find(function(game) {
                return game.name === data.gameName;
            });
            
            let player = {
                name: user.name,
                role: data.role,
                pos: {x: null, y: null},
                radius: 11
            };
    
            if(data.gameChair === 1){
                //finds starting block
                player.pos.x = (currentGame.carte.base.x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                player.pos.y = (currentGame.carte.base.y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;

                //creates player
                let thisplayer = currentGame.addPlayer(player.name, player.role, player.pos.x, player.pos.y, player.radius, 20, 10, socket.id,data.color);
                
                // Initialize player
                thisplayer.socket = socket.id;
                outils.getMyBlock(thisplayer, currentGame);
                thisplayer.blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);
            } else {
                //finds starting block
                player.pos.x = (currentGame.carte.departs[data.gameChair-2].x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                player.pos.y = (currentGame.carte.departs[data.gameChair-2].y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                
                //creates player
                let thisplayer = currentGame.addPlayer(player.name, player.role, player.pos.x, player.pos.y, player.radius, 20, 10, socket.id ,data.color);
                
                // Initialize player
                thisplayer.socket = socket.id;
                outils.getMyBlock(thisplayer, currentGame);
                thisplayer.blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);
            }

            ioServer.emit("player joined", {gameName: data.gameName, playerName: player.name, gameChair: data.gameChair});
        });

        socket.on("ready", function(data){
            let currentGame = games.find(function(game) {
                return game.name === data.gameName;
            });
            let thisplayer = currentGame.players.find(function(player){
                return player.name === user.name
            })
            thisplayer.ready = true;
            
            ioServer.emit("player ready", {gameName: data.gameName, playerName: user.name, gameChair: data.gameChair});

            //if 2 or more are ready, chasseur can launch
            if(currentGame.players.length >= 2){
                currentGame.players.forEach(function(player){
                    if(player.role === "chasseur"){
                        player.socket.emit("can launch", "")
                    }
                })
            }
        });
        socket.on("launch", function(data){
            let currentGame = games.find(function(game) {
                return game.name === data.gameName;
            });
            ioServer.emit("game launched", currentGame.name);
            currentGame.players.forEach(function(player){
                player.socket.emit("go to game", currentGame.name);
            })
        });

        socket.on("quit", function(data){
            let currentGame = games.find(function(game) {
                return game.name === user.joined;
            });
            let thisplayer = currentGame.players.find(function(player) {
                return player.name === user.name;
            });
            let playerIndexInGame = currentGame.players.indexOf(thisplayer);
            currentGame.players.splice(playerIndexInGame, 1);
            ioServer.emit("player quit", {gameName: data.gameName, playerName: user.name, gameChair: data.gameChair})
        });


        // on disconnect: contact players still connected (server emit), splice array
        socket.on("disconnect", function(reason){
            //removing from playersConnected array
            let playerDisconnected = playersConnected.find(function(element){
                return element.name === user.name
            })
            let index = playersConnected.indexOf(playerDisconnected);
            playersConnected.splice(index, 1);

            //If player joined, liberating seat in game
            if(user.joined){
                let currentGame = games.find(function(game) {
                    return game.name === user.joined;
                });
                let thisplayer = currentGame.players.find(function(player) {
                    return player.name === user.name;
                });
                let playerIndexInGame = currentGame.players.indexOf(thisplayer);
                currentGame.players.splice(playerIndexInGame, 1);
            }

            //Warning other of disconnection
            ioServer.emit("player disconnected", user);
        });
    });

    socket.on("game", function(info){
        /*
        Need: username(to target player), game name(to target game)
        */
        let currentGame;
        let thisplayer;
        
        /*****  Getting user info ******/
        user.name = info.username;
        user.in = "game";
        user.joined = info.gameName;
        user.gameChair = info.gameChair;

        // Store user info in array
        playersConnected.push(user);

        // Send players already (array) connected to new player (socket)
        // socket.emit("connected players", playersConnected);

        // Send new player to players already connected (broadcast)
        ioServer.emit("player entered", user);
        
        console.log("Player " + user.name + " connected");

        //Get game which player should be in
        currentGame = games.find(function(game) {
            return game.name === info.gameName;
        });

        //Check if he is in the game
        thisplayer = currentGame.players.find(function(element){
            return element.name === user.name
        })
        if(thisplayer){
            //Update player socket
            thisplayer.socket = socket;
            let everybodyReady
            socket.emit("gameStarted", {
                gameID: currentGame.id,
                player: player
            });
            socket.on("move", function(data){
                let thisplayer = currentGame.players[gameChair-1];
                outils.movePlayer(thisplayer, currentGame, data, socket);
            });
            socket.on("stop", function(data){
                let thisplayer = currentGame.players[gameChair-1];
                outils.stopPlayer(thisplayer, currentGame, data, socket);
            });
        } else {
            socket.emit("access denied", "player not registered in game");
        }


        

        socket.on("disconnect", function(){
            console.log("Player " + user.name + " disconnected");

            //removing from playersConnected array
            let playerDisconnected = playersConnected.find(function(element){
                return element.name === user.name
            })
            let index = playersConnected.indexOf(playerDisconnected);
            playersConnected.splice(index, 1);

            //liberating seat in game
            let playerIndexInGame = currentGame.players.indexOf(thisplayer);
            currentGame.players.splice(playerIndexInGame, 1);
            

            // if(thisplayer === currentGame.host){
                //delete game and redirect others
                // }
            if(thisplayer.role === "chasseur"){
                ioServer.emit("game destroyed", currentGame.name);
                let gameIndex = games.indexOf(currentGame);
                games.splice(gameIndex, 1);
            } else {
                //remove from game
                let playerIndexInGame = currentGame.players.indexOf(thisplayer);
                currentGame.players.splice(playerIndexInGame, 1);
            }
            
            //Warning other of disconnection
            ioServer.emit("player disconnected", user);

        });
    });
});