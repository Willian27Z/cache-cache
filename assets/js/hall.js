window.document.addEventListener("DOMContentLoaded", function () {
    socket = io("http://192.168.106.118:2727");

    socket.on("connect", function(){
        socket.emit("hall", myUsername);

        socket.on("games list", function(gamesList){
        // console.log("TCL: gamesList", gamesList)
            // game = {
            //     name: "",
            //     players: [{name: "", color: ""}]
            // }
            //for each game
            for(var i = 0 ; i < gamesList.length ; i++){
                
                //<div class="card">
                var gameDiv = $('<div class="card">');
                    //<div class="card-header" id="heading + i">
                    var headingDiv = $('<div class="card-header" id="heading' + i + '">');
                        //<h2 class="mb-0">
                        var h2 = $('<h2 class="mb-0">');
                            //<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#game.name" aria-expanded="true" aria-controls= "game.name">
                            var button = $('<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#' + gamesList[i].name + '" aria-expanded="true" aria-controls= "' + gamesList[i].name + '">');
                                //value = game.name
                                button.text(gamesList[i].name);
                        h2.append(button);
                    headingDiv.append(h2);
                gameDiv.append(headingDiv)
                    /******************ADDING GAME CHAIRS********************/
                    var bodyDiv = $('<div id="' + gamesList[i].name + '" class="collapse show" aria-labelledby="heading' + i + '" data-parent="#gamesList">');
                        
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
                                    var coloredCircle = $('<div class="card-img-top gameChair ' + colors[gc] + '" width="100%">');
                                    // console.log("TCL: coloredCircle", coloredCircle)
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
        });

        socket.on("connected players", function(playersConnected){
        console.log("TCL: playersConnected", playersConnected)
            var joueurs = $("#joueurs");
            var joueursEnJeu = $("#joueursEnJeux");
            var liJoueur;
            for(var i = 0 ; i < playersConnected.length ; i++){

                //Creates list item and adds to the right place
                liJoueur = $("<li class='list-group-item' id='" + playersConnected[i].name + "'>").text(playersConnected[i].name)
                if(playersConnected[i].in === "hall"){
                    joueurs.append(liJoueur)

                    if(playersConnected[i].joined){
                        //Add player name to chair
                        var chair = $("#" + playersConnected[i].joined + " > ." + playersConnected[i].gameChair).value(playersConnected[i].name)
    
                        //if joined change to yellow
                        if(playersConnected[i].ready){
                            chair.addClass("bg-warning");
                        } else {
                            chair.addClass("bg-primary");
                        }

                        //remove button
                        $("#" + playersConnected[i].joined + " > ." + playersConnected[i].gameChair + " > button").remove();
                    }

                } else {
                    joueursEnJeu.append(liJoueur);

                    var chair = $("#" + playersConnected[i].joined + " > ." + playersConnected[i].gameChair).value(playersConnected[i].name).addClass("bg-success");

                }
            }
        });
        
        socket.on("player entered", function(user){
            //Creates list item and adds to the right place
            liJoueur = $("<li class='list-group-item' id='" + user.name + "'>").text(user.name)
            if(user.in === "hall"){
                joueurs.append(liJoueur)

                if(user.joined){
                    //Add player name to chair
                    var chair = $("#" + user.joined + " > ." + user.gameChair).value(user.name)

                    //if joined change to yellow
                    if(user.ready){
                        chair.addClass("bg-warning");
                    } else {
                        chair.addClass("bg-primary");
                    }

                    //remove button
                    $("#" + user.joined + " > ." + user.gameChair + " > button").remove();
                }

            } else {
                var text = user.name + " (" + user.joined + ")";
                liJoueur.text(text);
                joueursEnJeu.append(liJoueur);
            }
        });
        socket.on("game created", function(gameName){
    
        });
        socket.on("player joined", function(info){
            console.log("somebody joined!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            let selector = "div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > h5";

            // console.log("TCL: selector", selector)
            //change chair's player name
            $(selector).text(info.playerName);
            
            //change chair background
            $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "']").addClass("bg-primary");

            //removes the join button
            $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "none");
            
            //if you're the player who joined
            if(info.playerName === myUsername){
                //hides all other join buttons
                $("button[name='joindre']").css("display", "none");

                //adds ready and quit buttons
                var ready = $('<button class="btn btn-warning" type="button" onClick="emit.ready(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="ready">').text("Prêt(e)");
                var quit = $('<button class="btn btn-danger" type="button" onClick="emit.quit(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="quit">').text("Sortir");
                $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body']").append(ready).append(quit);
            }

            //change player list background and text
            $("li[id*='" + info.playerName + "']").addClass("bg-primary").text(info.playerName + " (" + info.gameName + ")");

        });
        socket.on("player quit", function(info){
            console.log("somebody quit!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            let selector = "div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > h5";

            //change chair's player name
            $(selector).text("Libre");
            
            //change chair background
            $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "']").removeClass("bg-primary bg-warning");

            //adds the join button
            $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "inline");

            //if you're the player who joined
            if(info.playerName === myUsername){
                $("button[name='joindre']").css("display", "inline");

            }

            //shows all other join buttons
            // var buttons = $("button[name*='joindre']");
            // console.log("TCL: buttons", buttons);
            

            //removes buttons
            if(info.playerName === myUsername){
                $(("button[name='ready']")).remove();
                $(("button[name='quit']")).remove();
            }

            //change player list background and text
            $("li[id*='" + info.playerName + "']").removeClass("bg-primary bg-warning").text(info.playerName);

        });
        socket.on("player ready", function(info){
            info.gameName
            info.playerName
        });
        socket.on("game launched", function(gameName){
            //remove buttons
            $("#" + gameName + " > button").forEach(function(button){
                button.remove();
            });
            //change backgrounds
            $("#" + gameName + " > .card.d-inline-flex").forEach(function(card){
                card.removeClass("bg-warning bg-primary");
                card.addClass("bg-success");
            })
        });
        socket.on("go to game", function(gameName){
    
        });

    });

});

var emit = {
    join: function(gameChair, gameName){
        socket.emit("join game", {
            gameName: gameName,
            gameChair: gameChair,
        });
    },
    ready: function(gameChair, gameName){
        socket.emit("ready", {
            gameName: gameName,
            gameChair: gameChair,
        });
    },
    launch: function(gameName){
        socket.emit("launch", {
            gameName: gameName,
        });
    },
    quit: function(gameChair, gameName){
        socket.emit("quit", {
            gameName: gameName,
            gameChair: gameChair,
        });
    }
}