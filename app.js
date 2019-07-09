/******************************* 
***********NODE MODULES*********
*******************************/

const express = require("express");
const io = require("socket.io");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const cookieParser = require("cookie-parser")
const path = require("path");
const bd = require("./bd.js");
const app = express();

app.set("view engine", "pug");

/******************************* 
***********GAME MECHANIC********
*******************************/

const Game = require("./game/js/game.js");
const outils = require("./game/js/outils.js");
const tileset = require("./assets/maps/terrain.json");
const map = require("./assets/maps/map1.json");
const colors = ["white", "blue", "green", "purple", "darkorange", "black"];

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
        url: 'mongodb+srv://admin:G5JYxQAEzOqzrlTa@cache-cache-o1uzn.gcp.mongodb.net/jeuback?retryWrites=true&w=majority'
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
    res.locals.pageTemplate.map = map[0];
    res.locals.pageTemplate.tileset = tileset;

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
app.get("/signup", function(req, res){
    // vérification du formulaire ici;

    bd.connect(function(err) {
        if (err) {
            return console.log(err);
        } else {
            let coll = bd.get().db("jeuback").collection("users");
            coll.find({name: req.query.identifiant}).toArray(function(err, docs){
                if(err){
                    return console.log("this is an error: " + err);
                } else {
                    if(!docs.length){ // pas d'identifiant, ok pour faire inscription
                        coll.insertOne({
                            name: req.query.identifiant,
                            level:"player",
                            email:req.query.email,
                            password:req.query.mdp,
                            gamesPlayed: 0,
                            totalScore: 0
                        }, function(err, result){
                            if(err){
                                return console.log("Insertion Error: " + err);
                            } else {
                                // console.log(result);
                                req.session.utilisateur = {
                                    id: result.insertedId,
                                    name: req.query.identifiant,
                                    niveau: "player"
                                }
                                app.locals.message = {
                                    type: "success",
                                    text: "Bienvenu parmi nous " + req.query.identifiant + " ! Vous pouvez jouer à volonté =D"
                                };
                                bd.close();
                                res.redirect("/hall");
                            }
                        });

                    } else { // Not ok, il y a deja un identifiant comme ça
                        bd.close();
                        app.locals.message = {
                            type: "error",
                            text: "Désolé, l'identifiant choisi a déjà été pris. Veuillez choisir un autre."
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
        console.log(username + " a entré dans le hall");
        
        /*****  Getting user info ******/
        user.name = username;
        user.in = "hall";

        // Store user info in array
        playersConnected.push(user);
        console.log(playersConnected);
        
        // send list of current games
        let gamesList = [];
        games.forEach(function(game){
            let players = [];
            game.players.forEach(function(player){
                let playerInfo = {
                    name: player.name,
                    color: player.name
                }
                players.push(playerInfo);
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
                role: (data.gameChair === 1 ? "chasseur" : "cacheur"),
                pos: {x: null, y: null},
                radius: 11
            };
            
            if(data.gameChair === 1){
                //finds starting block
                player.pos.x = (currentGame.carte.base.x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                player.pos.y = (currentGame.carte.base.y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;

                //creates player
                let thisplayer = currentGame.addPlayer(player.name, player.role, player.pos.x, player.pos.y, player.radius, 20, 10, socket, "blue");
                
                // Initialize player
                outils.getMyBlock(thisplayer, currentGame);
                thisplayer.blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);

                // console.log(thisplayer);
            } else {
                //finds starting block
                player.pos.x = (currentGame.carte.departs[data.gameChair-2].x * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                player.pos.y = (currentGame.carte.departs[data.gameChair-2].y * currentGame.carte.tailleBlock) + currentGame.carte.tailleBlock/2;
                
                //creates player
                let thisplayer = currentGame.addPlayer(player.name, player.role, player.pos.x, player.pos.y, player.radius, 20, 10, socket, colors[data.gameChair]);
                
                // Initialize player
                outils.getMyBlock(thisplayer, currentGame);
                thisplayer.blocksVisibles = outils.getVisibleBlocks(thisplayer, currentGame);
                
                // console.log(thisplayer);
            }
            ioServer.emit("player joined", {gameName: data.gameName, playerName: player.name, gameChair: data.gameChair});

            //if 2 or more are ready, chasseur can launch
            if(outils.isGameReady(currentGame)){
                // console.log("Game " + data.gameName + " is good to go!");
                // console.log(outils.hunterSocket(currentGame));
                if(outils.hunterSocket(currentGame)){
                    // console.log("sending message to hunter");
                    outils.hunterSocket(currentGame).emit("can launch", data.gameName);
                }
            }
        });

        // socket.on("ready", function(data){
        //     let currentGame = games.find(function(game) {
        //         return game.name === data.gameName;
        //     });
        //     let thisplayer = currentGame.players.find(function(player){
        //         return player.name === user.name
        //     })
        //     thisplayer.ready = true;
            
        //     ioServer.emit("player ready", {gameName: data.gameName, playerName: user.name, gameChair: data.gameChair});

        //     //if 2 or more are ready, chasseur can launch
        //     if(currentGame.players.length >= 2){
        //         currentGame.players.forEach(function(player){
        //             if(player.role === "chasseur"){
        //                 player.socket.emit("can launch", data.gameName);
        //             }
        //         })
        //     }
            
        // });
        socket.on("launch", function(gameName){
            console.log("launching game: " + gameName);
            let currentGame = games.find(function(game) {
                return game.name === gameName;
            });
            if(currentGame){
                ioServer.emit("game launched", currentGame.name);
                currentGame.players.forEach(function(player){
                    player.socket.emit("go to game", gameName);
                })
            } else {
                console.log("game not found on launch");
            }
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
            if(!outils.isGameReady(currentGame)){
                console.log("Game " + data.gameName + " is not ready yet!");
                if(!outils.hunterSocket(currentGame)){
                    outils.hunterSocket(currentGame).emit("cannot launch", data.gameName);
                }
            }
            user.joined = null;
            user.gameChair = null;
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

                //delay for connection before deleting player
                thisplayer.connectionTimeout = setTimeout(function(){
                    currentGame.players.splice(playerIndexInGame, 1);
                }, 10000);

                if(!outils.isGameReady(currentGame)){
                    console.log("Game " + user.joined + " is not ready yet!");
                    if(outils.hunterSocket(currentGame)){
                        outils.hunterSocket(currentGame).emit("cannot launch", user.joined);
                    }
                }
            }


            //Warning other of disconnection
            console.log(user.name + " a sorti du hall");
            console.log(playersConnected);
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

        //Get game which player should be in
        currentGame = games.find(function(game) {
            return game.name === info.gameName;
        });

        //Check if he is in the game
        thisplayer = currentGame.players.find(function(element){
            return element.name === user.name
        })
        if(thisplayer){
            //cancel timeout
            clearTimeout(thisplayer.connectionTimeout);

            //Update player socket
            thisplayer.socket = socket;

            let thisgameChair = 0;
            switch(thisplayer.color){
                case "blue":
                    thisgameChair = 1;
                    break;
                case "green":
                    thisgameChair = 2;
                    break;
                case "purple":
                    thisgameChair = 3;
                    break;
                case "darkorange":
                    thisgameChair = 4;
                    break;
                case "black":
                    thisgameChair = 5;
                    break;
            }
            user.gameChair = thisgameChair;
            user.role = thisplayer.role;
            thisplayer.gameChair = thisgameChair;

            // Store user info in array
            playersConnected.push(user);

            // Send players already (array) connected to new player (socket)
            socket.emit("connected players", playersConnected);

            // Send new player to players already connected (broadcast)
            socket.broadcast.emit("player entered", user);
            
            console.log(info.username + " a entré dans le jeu: " + info.gameName);

            //check if everybody is connected
            let everybodyInGame = [];
            playersConnected.forEach(function(player){
                if(player.in === "game" && player.joined === currentGame.name){
                    everybodyInGame.push(player);
                    if(everybodyInGame.length === currentGame.players.length){
                        console.log("Everybody in. Let's start!");
                        
                        currentGame.players.forEach(function(player){
                            player.socket.emit("gameStarted", {
                                gameID: currentGame.name,
                                player: {
                                    id: player.name,
                                    role: player.role,
                                    pos: {x: player.pos.x, y: player.pos.y},
                                    radius: player.radius,
                                    blocksVisibles: player.blocksVisibles,
                                    color: player.color
                                }
                            });
                        })
                        
                    }
                }
            })

            socket.on("move", function(data){
                if(!thisplayer.done){
                    // let thisplayer = currentGame.players[gameChair-1];
                    outils.movePlayer(thisplayer, currentGame, data, socket);
                }
            });
            socket.on("stop", function(data){
                if(!thisplayer.done){
                    // let thisplayer = currentGame.players[gameChair-1];
                    outils.stopPlayer(thisplayer, currentGame, data, socket);
                }
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

            //Warning other of disconnection
            console.log(user.name + " a sorti du jeu: " + currentGame.name);
            console.log(playersConnected);
            ioServer.emit("player disconnected", user);
        });
    });
});