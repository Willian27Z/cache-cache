window.document.addEventListener("DOMContentLoaded", function () {
    socket = io("http://192.168.1.10:2727");

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
            $("#joueurs").empty();
            $("#joueursEnJeux").empty();
            // console.log("TCL: playersConnected", playersConnected)
            var joueurs = $("#joueurs");
            var joueursEnJeu = $("#joueursEnJeux");
            var liJoueur;
            for(var i = 0 ; i < playersConnected.length ; i++){

                //Creates list item and adds to the right place
                liJoueur = $("<li class='list-group-item' id='" + playersConnected[i].name + "'>").text(playersConnected[i].name)
                if(playersConnected[i].in === "hall"){

                    if(playersConnected[i].joined){

                        //change chair background
                        $("div[id*='" + playersConnected[i].joined + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "']").addClass("bg-primary");

                        //change chair name
                        $("div[id*='" + playersConnected[i].joined + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='card-body'] > h5").text(playersConnected[i].name);

                        //hides the join button
                        $("div[id*='" + playersConnected[i].joined  + "'] > div > div[class*='gameChair" + playersConnected[i].gameChair + "'] >  div[class*='card-body'] > button").css("display", "none");
                        liJoueur.addClass("bg-primary");
                        liJoueur.text(playersConnected[i].name + " (" + playersConnected[i].joined + ")");
                    }
                    
                    joueurs.append(liJoueur)
                } else {
                    liJoueur.addClass("bg-success");
                    joueursEnJeu.append(liJoueur);
                }
            }
            emit.initiated = true;
        });
        
        /******************************* 
        **********HALL ACTIONS**********
        *******************************/

        socket.on("player entered", function(user){
            console.log(user.name + " entered the hall");
            //Creates list item and adds to the right place
            var joueurs = $("#joueurs");
            var joueursEnJeu = $("#joueursEnJeux");
            var liJoueur = $("<li class='list-group-item' id='" + user.name + "'>").text(user.name)
            if(user.in === "hall"){
                // console.log($("li[id*='" + user.name + "']"));
                if(!$("li[id*='" + user.name + "']").length){
                    joueurs.append(liJoueur);
                }   
            } else {
                var text = user.name + " (" + user.joined + ")";
                liJoueur.text(text).addClass("bg-success");
                joueursEnJeu.append(liJoueur);
            }
        });
        // socket.on("game created", function(gameName){
    
        // });
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

            //hides the join button
            $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "none");
            
            //if you're the player who joined
            if(info.playerName === myUsername){
                //hides all other join buttons
                $("button[name='joindre']").css("display", "none");

                //adds ready and quit buttons
                // var ready = $('<button class="btn btn-warning" type="button" onClick="emit.ready(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="ready">').text("Prêt(e)");
                var quit = $('<button class="btn btn-danger" type="button" onClick="emit.quit(' + info.gameChair + ', \'' + info.gameName + '\');" align="center" name="quit">').text("Sortir");
                $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body']").append(quit);
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

            //adds the join button if not joined yet
            if(!emit.joined){
                $("div[id*='" + info.gameName + "'] > div > div[class*='gameChair" + info.gameChair + "'] >  div[class*='card-body'] > button").css("display", "inline");
            }

            //if you're the player who quit
            if(info.playerName === myUsername){
                $("h5").each(function(index){
                    // console.log($(this));
                    if($(this).text() === "Libre"){
                        $(this.nextSibling.nextSibling).css("display", "inline");
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
            $("li[id*='" + info.playerName + "']").removeClass("bg-primary bg-warning").text(info.playerName);

        });
        socket.on("player disconnected", function(user){
            console.log("somebody quit!");
            // info.gameName
            // info.playerName
            // info.gameChair div[id*='man']

            //removes li
            $("li[id*='" + user.name + "']").remove();

            if(user.joined){
                
                //change chair background
                $("div[id*='" + user.joined + "'] > div > div[class*='gameChair" + user.gameChair + "']").removeClass("bg-primary bg-warning");
                
                //change chair name
                let selector = "div[id*='" + user.joined + "'] > div > div[class*='gameChair" + user.gameChair + "'] >  div[class*='card-body'] > h5";
                $(selector).text("Libre");

                //put join button again
                $("div[id*='" + user.joined + "'] > div > div[class*='gameChair" + user.gameChair + "'] >  div[class*='card-body'] > button").css("display", "inline");
            }
        });


        // socket.on("player ready", function(info){
        //     info.gameName
        //     info.playerName
        // });


        /******************************* 
        ******TRANSITION TO GAME********
        *******************************/

        socket.on("can launch", function(gameName){
            console.log("You can launch game: " + gameName)
            var lancer = $('<button class="btn btn-success" type="button" onClick="emit.launch(\'' + gameName + '\');" align="center" name="launch">').text("Lancer");
            //adds button
            $("div[id*='" + gameName + "'] > div > div[class*='gameChair1'] >  div[class*='card-body']").append(lancer);
        });

        socket.on("cannot launch", function(data){
            if($("button[name*='launch'").length){
                $("button[name*='launch'").remove();
            }
        });

        socket.on("game launched", function(gameName){
            // //remove buttons
            // $("#" + gameName + " button").remove();
            // //change backgrounds
            // $("#" + gameName + " > .card.d-inline-flex").each(function(card){
            //     card.removeClass("bg-warning bg-primary");
            //     card.addClass("bg-success");
            // })
        });
        socket.on("go to game", function(gameName){
            var path = encodeURIComponent(gameName);
            var domain = document.referrer;
            console.log(domain + path);
            window.location.href = "http://192.168.1.10:2727/game/" + path;
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
    }
}
