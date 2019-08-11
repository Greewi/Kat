const Discord = require('discord.io');
const fs = require('fs');
const config = require('./config.json');

/**
 * Les symboles pour les faces des dés
 * @type {string[]}
 */
const symbolesDes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

/**
 * Base pour un bot Discord
 */
class Bot {

    /**
     * Initialise le bot
     * 
     * @param {*} auth 
     */
    constructor(config) {
        console.log(`Hey ! C'est ${config.nom} !`);
        this._config = config;
        this._canaux = {};
        this._ready = false;
        this._bot = new Discord.Client({
            token: this._config.token,
            autorun: false
        });
        this._bot.on('ready', (event) => {
            console.log(`${this._config.nom} est prêt !`);
            this.onReady(event);
        });
        this._bot.on('message', (user, userID, channelID, message, event) => {
            this.onMessage(user, userID, channelID, message, event);
        });
    }

    /**
     * Connecte le bot au serveur
     */
    connecte(callback) {
        this._bot.connect();
        return new Promise((accept, reject) => {
            this._callbackReady = accept;
            if (this._ready)
                accept();
        });
    }

    /**
     * Écoute et réagit aux messages du canal spécifié
     * @param {string} idCanal 
     */
    ecouteCanal(idCanal) {
        this._canaux[idCanal] = true;
    }

    /**
     * Lorsque le bot est enfin connecté sur serveur
     * 
     * @param {*} event 
     */
    onReady(event) {
        this._ready = true;
        if (this._callbackReady)
            this._callbackReady();
        console.log('Connected & logged in as: ', this._bot.username + ' - (' + this._bot.id + ')');
    }

    /**
     * Lorsque le bot voit un message sur le serveur
     * @param {*} user 
     * @param {*} userID 
     * @param {*} channelID 
     * @param {*} message 
     * @param {*} event 
     */
    onMessage(user, userID, channelID, message, event) {
        // le bot est restreint aux canaux appropriés
        if (!this._canaux[channelID])
            return;

        // Les commandes de le bot
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
     * Envoie un message
     * @param {string} channelID 
     * @param {string} message 
     */
    envoieMessage(channelID, message) {
        this._bot.sendMessage({
            to: channelID,
            message: message
        });
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
        if (succes >= 0) {
            message += ` vs ${scoreABattre}`;
            message += ` (${succes} succès)`;
        }

        // Envoi du message
        console.log(message);
        this._bot.sendMessage({
            to: channelID,
            message: message
        });

        // Nettoyage du message de la commande (inutile de la garder dans le chat)
        setTimeout(() => {
            this._bot.deleteMessage({
                channelID: channelID,
                messageID: messageID
            });
        }, 500);
    }
};

/**
 * Affiche l'aide et quitte l'application
 */
const usageEtQuitter = (message) => {
    if(message)
        console.log(message);
    console.log("USAGE : node bot.js BOT ACTION PARAMETRES");
    console.log("Liste des actions :");
    console.log("\tmessage CANAL FICHIER : envoie un message sur le canal en le lisant depuis le fichier indiqué");
    console.log("\twatch CANAL... : écoute un canal et exécute les commandes qui lui sont envoyées");
    process.exit(1);
};


let parametres = process.argv;

// Sélection du bot
let idBot = parametres[2];
if (!idBot || !config.bots[idBot])
    usageEtQuitter("Pas de bot sélectionné");
let configBot = config.bots[idBot];
let bot = new Bot(configBot);

// Récupération de l'action
let action = parametres[3];
if (!action)
    usageEtQuitter("Pas d'action");

switch (action) {
    case "message": {
        let idCanal = parametres[4];
        if (!idCanal || !config.canaux[idCanal])
            usageEtQuitter("Pas de canal (Il faut le mettre entre guillement à cause du #)");
        let canal = config.canaux[idCanal]
        let fichierMessage = parametres[5];
        if (!fichierMessage)
            usageEtQuitter("Fichier du message non trouvé");
        bot.connecte().then(() => {
            fs.readFile(fichierMessage, "utf8", function (err, data) {
                if (err) {
                    console.error(`Erreur de lecteur du fichier ${fichierMessage} : `, err);
                    process.exit(1);
                }
                bot.envoieMessage(canal, data);
            });
        });
        break;
    }
    case "watch": {
        let idCanal = parametres[4];
        if (idCanal === undefined)
            usageEtQuitter("Pas de canal (Il faut le mettre entre guillement à cause du #)");
        bot.connecte().then(() => {
            for (let i = 4; i < parametres.length; i++) {
                if (config.canaux[parametres[i]])
                    bot.ecouteCanal(config.canaux[parametres[i]]);
                else
                    console.error(`Erreur : Canal ${parametres[i]} non trouvé`)
            }
        });
        break;
    }
    default: {
        usageEtQuitter();
    }
}
