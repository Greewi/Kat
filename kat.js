const Discord = require('discord.io');
const auth = require('./auth.json');

/**
 * Les symboles pour les faces des dés
 * @type {string[]}
 */
const symbolesDes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

/**
 * Kat est un bot pour Discord
 */
class Kat {

    /**
     * Initialise Kat
     * 
     * @param {*} auth 
     */
    constructor(auth) {
        console.log("Hey ! C'est Kat !");
        this._auth = auth;
        this._bot = new Discord.Client({
            token: this._auth.token,
            autorun: true
        });
        this._bot.on('ready', (event)=>{console.log("Hey !" );this.onReady(event)});
        this._bot.on('message', (user, userID, channelID, message, event)=>{this.onMessage(user, userID, channelID, message, event)});
    }

    /**
     * Connecte Kat au serveur
     */
    connecte(){
        //this._bot.connect();
    }

    /**
     * Lorsque Kat est enfin connecté sur serveur
     * 
     * @param {*} event 
     */
    onReady(event) {
        console.log('Connected & logged in as: ', this._bot.username + ' - (' + this._bot.id + ')');
    }

    /**
     * Lorsque Kat voit un message sur le serveur
     * @param {*} user 
     * @param {*} userID 
     * @param {*} channelID 
     * @param {*} message 
     * @param {*} event 
     */
    onMessage(user, userID, channelID, message, event) {
        // Kat est restreint aux canaux appropriés
        if (!this._auth.channel[channelID])
            return;

        // Les commandes de Kat
        if (message.substring(0, 1) == '!') {
            var args = message.substring(1).split(' ');
            var cmd = args[0];

            args = args.splice(1);
            switch (cmd) {
                // !d [score]
                case 'd':
                    this.lanceLesDes(user, args[0], channelID, event.d.id);
                    break;
            }
        }
    }

    /**
     * Lance les dés pour un joueur
     */
    lanceLesDes(utilisateur, scoreABattre, channelID, messageID) {
        console.log(`${utilisateur} lance les dés (score à battre : ${scoreABattre})`);

        // Lancement des dés et calcul des succès
        let succes = -1;
        let des = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        if (scoreABattre > 0) {
            succes = 0;
            for (let de of des)
                if (de <= scoreABattre)
                    succes++;
        }

        // Construction du message de réponse
        let message = `${utilisateur} fait `;
        for (let de of des)
            message += symbolesDes[de - 1];
        if (succes >= 0) {            message += ` vs ${scoreABattre}`;
            message += ` (${succes} succès)`;
        }

        // Envoi du message
        console.log(message);
        this._bot.sendMessage({
            to: channelID,
            message: message
        });

        // Nettoyage du message de la commande (inutile de la garder dans le chat)
        setTimeout(()=>{
            this._bot.deleteMessage({
                channelID: channelID,
                messageID: messageID
            });
        }, 500);
    }
};

const kat = new Kat(auth);
kat.connecte();