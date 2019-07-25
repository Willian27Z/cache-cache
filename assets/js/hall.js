var serverAddress = "https://cache-cache.herokuapp.com/"

window.document.addEventListener("DOMContentLoaded", function () {
    socket = io(serverAddress);

    socket.on("connect", function(){
        socket.emit("hall", myUsername);

        /******************************* 
        *********ON CONNECTION**********
        *******************************/

        socket.on("games list", function(gamesList){
            $("#gamesList").empty();
            // console.log("TCL: gamesList", gamesList)
            // game = {
            //     name: "",
            //     players: [{name: "", color: ""}]
            // }
            //for each game
            for(var i = 0 ; i < gamesList.length ; i++){
                var nameOfTheGame = gamesList[i].name.split(" ").join("");
                //<div class="card">
                var gameDiv = $('<div class="card">');
                    //<div class="card-header" id="heading + i">
                    var headingDiv = $('<div class="card-header" id="heading' + i + '">');
                        //<h2 class="mb-0">
                        var h2 = $('<h2 class="mb-0">');
                            //<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#game.name" aria-expanded="true" aria-controls= "game.name">
                            var button = $('<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#' + nameOfTheGame + '" aria-expanded="true" aria-controls= "' + nameOfTheGame + '">');
                                //value = game.name
                                button.text(gamesList[i].name);
                        h2.append(button);
                    headingDiv.append(h2);
                gameDiv.append(headingDiv)
                    /******************ADDING GAME CHAIRS********************/
                    var bodyDiv = $('<div id="' + nameOfTheGame + '" class="collapse show" aria-labelledby="heading' + i + '" data-parent="#gamesList">');
                    if(gamesList[i].initialized){
                        bodyDiv.addClass("bg-success");
                    }
                        //<div class="card-body">
                        var chairsDiv = $('<div class="card-body">');
                            //<p> Carte: game.map
                            var carte = $('<p> Carte: ' + gamesList[i].map + ' </p>');
                            chairsDiv.append(carte);
                            var colors = ["white", "blue", "green", "purple", "orange", "black"];
                            //*********START FOR LOOP FOR CHAIRS*****************
                            for(var gc = 1 ; gc < 6 ; gc++){
                            
                                //<div class="card d-inline-flex gameChair + i" style="width: 20%;>"
                                var gameChairDiv = $('<div class="card d-inline-flex gameChair' + gc + '" style="width: 20%;">');
                                // console.log("TCL: gameChairDiv", gameChairDiv)
                                    //<div class="card-img-top gameChair colors[i]" width="100%")>
                                    var coloredCircle = $('<div class="card-img-top gameChair ' + colors[gc] + '">');
                                    // console.log("TCL: coloredCircle", coloredCircle)
                                    var imageAvatar = $('<img src="/img/char' + gc + '-profil.png">');
                                    coloredCircle.append(imageAvatar);
                                    //<div class="card-body">
                                    var textAndButton = $('<div class="card-body">');
                                    // console.log("TCL: textAndButton", textAndButton)
                                        //<h5 class="card-title playername" align="center">
                                        var playerName = $('<h5 class="card-title playername" align="center">');
                                        
                                            //find player by color
                                            if(gamesList[i].players.length){
                                                playerName.text("");
                                                for(var p = 0 ; p < gamesList[i].players.length ; p++){
                                                    if(gamesList[i].players[p].color === colors[gc]){
                                                        playerName.text(gamesList[i].players[p].name);
                                                    }
                                                }
                                                if(playerName.text() === ""){
                                                    playerName.text("Libre");
                                                }
                                            } else {
                                                playerName.text("Libre");
                                            }
                                            // console.log("TCL: playerName", playerName);
                                        //<h6 class="card-subtitle mb-2" align="center">
                                        var role = $('<h6 class="card-subtitle mb-2" align="center">');
                                        if(gc === 1){
                                            role.text("Chasseur");
                                        } else {
                                            role.text("Cacheur");
                                        }
                                        // console.log("TCL: role", role)
                                    textAndButton.append(playerName);
                                    // console.log("TCL: playerName", playerName)
                                    textAndButton.append(role);
                                    // console.log("TCL: role", role)
                                    if(playerName.text() === "Libre"){
                                        //<button class="btn btn-primary" type="button" onClick="emit(join)">
                                        var joindre = $('<button class="btn btn-primary" type="button" onClick="emit.join(' + gc + ', \'' + gamesList[i].name + '\');" align="center" name="joindre">').text("Joindre");
                                        textAndButton.append(joindre);
                                        // console.log("TCL: joindre", joindre)
                                    }
                                gameChairDiv.append(coloredCircle);
                                gameChairDiv.append(textAndButton);
                                // console.log("TCL: gameChairDiv", gameChairDiv)
                                //append chair to card-body
                                chairsDiv.append(gameChairDiv);
                            }
                            //*********END FOR LOOP FOR CHAIRS*****************
                            // console.log("TCL: chairsDiv", chairsDiv)
                        
                        bodyDiv.append(chairsDiv)
                    //append bodyDiv to gameDiv
                    gameDiv.append(bodyDiv)
                //append gameDiv to #gamesList
                $("#gamesList").append(gameDiv);
            }
            emit.checkInitiatedGames();
        });

        socket.on("connected players", function(playersConnected){
            $("#joueurs").empty();
            $("#joueursEnJeux").empty();
            // console.log("TCL: playersConnected", playersConnected)
            var joueurs = $("#joueurs");
            var joueursEnJeu = $("#joueursEnJeux");
            var liJoueur;
            for(var i = 0 ; i < playersConnected.length ; i++){

                //Creates list item and adds to the right place
                liJoueur = $("<a href='/profil/" + encodeURIComponent(playersConnected[i].name) + "' class='list-group-item' id='" + playersConnected[i].name + "'>").text(playersConnected[i].name)
                if(playersConnected[i].in === "hall"){

                    if(playersConnected[i].joined){
                        var nameOfTheGame = playersConnected[i].joined.split(" ").join("");
                        //change chair background
                        $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "']").addClass("bg-primary");

                        //change chair name
                        $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='card-body'] > h5").text(playersConnected[i].name);

                        //hides the join button
                        $("div[id*='" + nameOfTheGame  + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='card-body'] > button").css("display", "none");
                        liJoueur.addClass("bg-primary");
                        liJoueur.text(playersConnected[i].name + " (" + playersConnected[i].joined + ")");
                    }
                    
                    joueurs.append(liJoueur)
                } else {
                    liJoueur.addClass("bg-success");

                    var text = playersConnected[i].name + " (" + playersConnected[i].joined + ")";
                    liJoueur.text(text).addClass("bg-success");
                    if(!$("#" + playersConnected[i].name).length){
                        joueursEnJeu.append(liJoueur);
                    }   

                    var nameOfTheGame = playersConnected[i].joined.split(" ").join("");

                    let selector = "div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='card-body'] > h5";

                    // console.log("TCL: selector", selector)
                    //change chair's player name
                    $(selector).text(playersConnected[i].name);
                    
                    //change chair background
                    $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "']").addClass("bg-success");
                }
            }
            emit.initiated = true;
            emit.checkInitiatedGames();
        });
        
        /******************************* 
        **********HALL ACTIONS**********
        *******************************/

        socket.on("player entered", function(user){
            console.log(user.name + " entered the hall");
            //Creates list item and adds to the right place
            var joueurs = $("#joueurs");
            var joueursEnJeu = $("#joueursEnJeux");
            var liJoueur = $("<a href='/profil/" + encodeURIComponent(user.name) + "' class='list-group-item' id='" + user.name + "'>").text(user.name)
            if(user.in === "hall"){
                if(!$("#" + user.name).length){
                    joueurs.append(liJoueur);
                }   
            } else {
                var text = user.name + " (" + user.joined + ")";
                liJoueur.text(text).addClass("bg-success");
                if(!$("#" + user.name).length){
                    joueursEnJeu.append(liJoueur);
                }   

                var nameOfTheGame = user.joined.split(" ").join("");

                let selector = "div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + user.gameChair + "'] >  div[class*='card-body'] > h5";

                // console.log("TCL: selector", selector)
                //change chair's player name
                $(selector).text(user.name);
                
                //change chair background
                $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + user.gameChair + "']").addClass("bg-success");
            }
        });
        // socket.on("game created", function(gameName){
    
        // });
        socket.on("player joined", function(info){
            // console.log("somebody joined!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            var nameOfTheGame = info.gameName.split(" ").join("");

            let selector = "div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > h5";

            // console.log("TCL: selector", selector)
            //change chair's player name
            $(selector).text(info.playerName);
            
            //change chair background
            $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "']").addClass("bg-primary");

            //hides the join button
            $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "none");
            
            //if you're the player who joined
            if(info.playerName === myUsername){
                //hides all other join buttons
                $("button[name='joindre']").css("display", "none");

                //adds ready and quit buttons
                // var ready = $('<button class="btn btn-warning" type="button" onClick="emit.ready(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="ready">').text("Prêt(e)");
                var quit = $('<button class="btn btn-danger" type="button" onClick="emit.quit(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="quit">').text("Sortir");
                $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body']").append(quit);
            }

            //change player list background and text
            $("a[id*='" + info.playerName + "']").addClass("bg-primary").text(info.playerName + " (" + info.gameName + ")");
            emit.checkInitiatedGames();
        });
        socket.on("player quit", function(info){
            // console.log("somebody quit!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            var nameOfTheGame = info.gameName.split(" ").join("");

            let selector = "div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > h5";

            //change chair's player name
            $(selector).text("Libre");
            
            //change chair background
            $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "']").removeClass("bg-primary bg-warning bg-success");

            //adds the join button if not joined yet
            if(!emit.joined){
                $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "block");
            }

            //if you're the player who quit
            if(info.playerName === myUsername){
                $("h5").each(function(index){
                    // console.log($(this));
                    if($(this).text() === "Libre"){
                        $(this.nextSibling.nextSibling).css("display", "block");
                        //style.display = "inline";
                    }
                });
                //if you were the hunter and was ready to launch
                if(info.gameChair === 1 && $("button[name='launch']").length){
                    $("button[name='launch']").remove();
                }
            }

            //shows all other join buttons
            // var buttons = $("button[name*='joindre']");
            // console.log("TCL: buttons", buttons);
            

            //removes buttons
            if(info.playerName === myUsername){
                // $(("button[name='ready']")).remove();
                $(("button[name='quit']")).remove();
            }

            //change player list background and text
            $("a[id*='" + info.playerName + "']").removeClass("bg-primary bg-warning").text(info.playerName);
            emit.checkInitiatedGames();
        });
        socket.on("player disconnected", function(user){
            // console.log("somebody quit!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            //removes li
            $("a[id*='" + user.name + "']").remove();

            if(user.joined){
                
                var nameOfTheGame = user.joined.split(" ").join("");

                //change chair background
                $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + user.gameChair + "']").removeClass("bg-primary bg-warning bg-success");
                
                //change chair name
                let selector = "div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + user.gameChair + "'] >  div[class*='card-body'] > h5";
                $(selector).text("Libre");

                //put join button again
                $("div[id*='" + nameOfTheGame + "'] > div > div[class*='gameChair" + user.gameChair + "'] >  div[class*='card-body'] > button").css("display", "block");
            }
            emit.checkInitiatedGames();
        });

        socket.on("game launched", function(gameName){
            var nameOfTheGame = gameName.split(" ").join("");
            //change backgrounds
            $("#" + nameOfTheGame).addClass("bg-success");
            //remove buttons
            emit.checkInitiatedGames();
        });

        socket.on("gameEnded", function(gameName){
            var nameOfTheGame = gameName.split(" ").join("");
            //change backgrounds
            $("#" + nameOfTheGame).removeClass("bg-success");
            //add buttons if not joined a game
            if(!$(("button[name='quit']")).length){
                $("#" + nameOfTheGame + " button").each(function(index){
                    $(this).css("display", "block");
                });
            }
        });

        /******************************* 
        ******TRANSITION TO GAME********
        *******************************/

        socket.on("can launch", function(gameName){
            console.log("You can launch game: " + gameName);

            //check if button isn't already there
            if(!$("button[name*='launch'").length){
                //creates button
                var lancer = $('<button class="btn btn-success" type="button" onClick="emit.launch(\'' + gameName + '\');" align="center" name="launch">').text("Lancer");
                //adds button
                $("div[id*='" + gameName.split(" ").join("") + "'] > div > div[class*='gameChair1'] >  div[class*='card-body']").append(lancer);
            }

        });

        socket.on("cannot launch", function(data){
            if($("button[name*='launch'").length){
                $("button[name*='launch'").remove();
            }
        });

        socket.on("go to game", function(gameName){
            var path = encodeURIComponent(gameName);
            var domain = document.referrer;
            console.log(domain + path);
            window.location.href = serverAddress + "game/" + path;
        });
    });

});

var emit = {
    joined: false,
    gameChair: null,
    join: function(gameChair, gameName){
        this.joined = true;
        this.gameChair = gameChair
        socket.emit("join game", {
            gameName: gameName,
            gameChair: gameChair,
        });
    },
    // ready: function(gameChair, gameName){
    //     socket.emit("ready", {
    //         gameName: gameName,
    //         gameChair: gameChair,
    //     });
    // },
    launch: function(gameName){
        console.log("launching game: " + gameName);
        socket.emit("launch", gameName);
    },
    quit: function(gameChair, gameName){
        this.joined = false;
        this.gameChair = null;
        socket.emit("quit", {
            gameName: gameName,
            gameChair: gameChair,
        });
    },
    checkInitiatedGames: function(){
        $("div[class~='bg-success'] button").each(function(index){
            $(this).css("display", "none");
        });
    }
}
