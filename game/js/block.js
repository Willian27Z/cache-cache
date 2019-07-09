const Block = (function(){
    let OneBlock = function(taille, x, y, type, base, depart){
        this.taille = taille; //taille du carre en pixel
        this.x = x; //coordonnées dans la carte
        this.y = y;
        this.type = type; //string "mur" ou "sol" 
        this.playerIn = null; //sera populé in runtime, reference à un joueur
        // this.image = urlImage; //string
        this.base = base; //boolean
        this.baseColor = "orange";
        this.depart = depart; //boolean
        // this.cachable = cachable; //boolean
    };
    OneBlock.prototype.draw = function(){
        // ctx.rect(this.x*taille, this.y*taille, this.taille, this.taille);
        if(this.type === "mur"){
            ctx.fillStyle = "brown";
        } else {
            if(this.base){
                ctx.fillStyle = this.baseColor;
            } else if (this.depart){
                ctx.fillStyle = "yellow";
            } else {
                ctx.fillStyle = "white";
            }
            // if(this.playerIn === player){
            //     ctx.fillStyle = "rgba(255,255,255,0.5)";
            // }
        }
        ctx.fillRect(this.x*this.taille, this.y*this.taille, this.taille, this.taille);
    },
    // OneBlock.prototype.drawAgain = function(){
    //     ctx.fillStyle = "green";
    //     ctx.fillRect(this.x*taille, this.y*taille, this.taille, this.taille);
    // },
    // OneBlock.prototype.path = function(){
    //     ctx.beginPath();
    //     ctx.rect(this.x*taille, this.y*taille, this.taille, this.taille);
    //     ctx.closePath();
    // }
    OneBlock.prototype.flashBase = function(game){
        if(!this.flashing){
            this.flashing = setInterval(function(){
                // console.log("blip");
                if(game.carte.base.baseColor === "orange"){
                    game.carte.base.baseColor = "red";
                } else {
                    game.carte.base.baseColor = "orange";
                }
            }, 1000);
        }
    }

    return function(taille, x, y, type, base, depart){
        return new OneBlock(taille, x, y, type, base, depart);
    }
}());

module.exports = Block;