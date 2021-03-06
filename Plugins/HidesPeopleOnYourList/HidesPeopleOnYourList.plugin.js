/**
 * @name HidesPeopleOnYourList
 * @version 1.0.9
 * @description This plugin allowes you to hide people from servers or dms they will show up as spam.
 * @author KillerFRIEND
 * @website https://github.com/killerfrienddk
 * @source https://github.com/killerfrienddk/BetterDiscordAddons/tree/master/Plugins/HidesPeopleOnYourList/
 * @updateUrl https://raw.githubusercontent.com/killerfrienddk/BetterDiscordAddons/main/Plugins/HidesPeopleOnYourList/HidesPeopleOnYourList.plugin.js
*/

module.exports = (_ => {
    const config = {
        "info": {
            "name": "HidesPeopleOnYourList",
            "author": "KillerFRIEND",
            "version": "1.0.9",
            "description": "This plugin allowes you to hide people from servers or dms they will show up as spam."
        },
		"changeLog": {
			"feature": {
				"Major Change": "Had to make the hide button not reload all of the messages because of too many api calls.",
				"HiddenPeople": "The hidden people now caches.",
                "OneDrive Support": "You can now set up your onedrive to have it on multipule computers and it will remember who you hid. You have to make a folder called BetterDiscordConfigs on there, if it finds a file it will use it instead if the file in your plugins folder. The file should be called HidesPeopleOnYourList.config.json",
				"Upcomming OneDrive Support toggle": "It is to be implimented in settings not gotten around to it yet though.",
			}
		}
    };

    return (window.Lightcord && !Node.prototype.isPrototypeOf(window.Lightcord) || window.LightCord && !Node.prototype.isPrototypeOf(window.LightCord) || window.Astra && !Node.prototype.isPrototypeOf(window.Astra)) ? class {
        getName() { return config.info.name; }
        getAuthor() { return config.info.author; }
        getVersion() { return config.info.version; }
        getDescription() { return "Do not use LightCord!"; }
        load() { BdApi.alert("Attention!", "By using LightCord you are risking your Discord Account, due to using a 3rd Party Client. Switch to an official Discord Client (https://discord.com/) with the proper BD Injection (https://betterdiscord.app/)"); }
        start() { }
        stop() { }
    } : !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        getName() { return config.info.name; }
        getAuthor() { return config.info.author; }
        getVersion() { return config.info.version; }
        getDescription() { return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`; }

        downloadLibrary() {
            require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
                if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", { type: "success" }));
                else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
            });
        }

        load() {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, { pluginQueue: [] });
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => { delete window.BDFDB_Global.downloadModal; },
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        this.downloadLibrary();
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
        }
        start() { this.load(); }
        stop() { }
        getSettingsPanel() {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {
        var fs = require('fs');
        var hiddenPeople = [];
        return class HidePeopleFromList extends Plugin {
            onLoad() {
                this.defaults = {
                    people: []
                };

                this.patchedModules = {
                    before: {
                        Message: "default",
                    },
                    after: {
                        Messages: "type",
                        DirectMessage: "render",
                        PrivateChannel: "render",
                    }
                };

                this.patchPriority = 8;
            }

            onUserContextMenu(e) {
                this.createMenuButton(e.instance.props.user, e.returnvalue);
            }

            onGroupDMContextMenu(e) {
                this.createMenuButton(e.instance.props.user, e.returnvalue);
            }

            onMessageContextMenu(e) {
                this.createMenuButton(e.instance.props.message.author, e.returnvalue);
            }

            createMenuButton(user, returnvalue) {
                if(user.email !== null) return;
                this.getPersonToHiddenList(false);

                if (user && returnvalue) {
                    let isHidden = this.checkIfIdExisits(user.id);
                    let [children, index] = BDFDB.ContextMenuUtils.findItem(returnvalue, { id: ["pin", "unpin"] });
                    if (index == -1) [children, index] = BDFDB.ContextMenuUtils.findItem(returnvalue, { id: ["devmode-copy-id"] });

                    /* console.log(BDFDB.LibraryComponents.MenuItems) */
                    children.splice(index > -1 ? index + 1 : 0, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuSeparator));

                    children.splice(index > -1 ? index + 1 : 0, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
                        label: isHidden ? "Unhide User" : "Hide User",
                        id: BDFDB.ContextMenuUtils.createItemId(this.name, isHidden ? "unhide-user" : "hide-user"),
                        action: _ => {
                            if (isHidden) this.removePersonFromList(user.id);
                            else this.addPersonToList(user.id, hiddenPeople);
                        }
                    }));

                    if(true) {
                        console.log(children[index > -1 ? index + 1 : 0]);
                    }
                }
            }

            createSpamGroup(messages) {
                if (this.isEmptyArray(messages)) return [];

                let result = {
                    "type": "MESSAGE_GROUP_SPAMMER",
                    "content": [
                        ...messages
                    ],
                    "key": messages[0].groupId
                };

                return result;
            }

            getHiddenPeopleInRow(oldStream, index) {
                let array = [];

                for (let i = index; i < oldStream.length; i++) {
                    index = i;

                    if (oldStream[i].type != "MESSAGE") {
                        break;
                    };

                    if (this.checkIfIdExisits(oldStream[i].content.author.id)) {
                        array.push(oldStream[i]);
                    }
                    else break;
                }

                return [this.createSpamGroup(array), index];
            }

            processMessages(e) {
                let messagesIns = e.returnvalue.props.children;
                this.getPersonToHiddenList(false);
                if (BDFDB.ArrayUtils.is(messagesIns.props.channelStream)) {
                    let oldStream = messagesIns.props.channelStream, newStream = [];

                    for (let i = 0; i < oldStream.length; i++) {
                        if (oldStream[i].type != "MESSAGE") {
                            newStream.push(oldStream[i]);
                            continue;
                        };

                        if (this.checkIfIdExisits(oldStream[i].content.author.id)) {
                            let [message, index] = this.getHiddenPeopleInRow(oldStream, i);

                            if (message.content.length >= 2) i = index - 1
                            newStream.push(message);
                        }
                        else newStream.push(oldStream[i]);
                    }

                    let groupId, author;
                    for (let i in newStream) {
                        if (newStream[i].type == "MESSAGE" && (newStream[i].content.type.type == BDFDB.DiscordConstants.MessageTypes.DEFAULT
                            || newStream[i].content.type.type == BDFDB.DiscordConstants.MessageTypes.REPLY) && groupId != newStream[i].groupId) {
                            if (author && author.id == newStream[i].content.author.id && author.username == newStream[i].content.author.username) {
                                newStream[i] = Object.assign({}, newStream[i], { groupId: groupId });
                            }
                            author = newStream[i].content.author;
                        }
                        else author = null;
                        groupId = newStream[i].groupId;

                        if (+i + 1 == newStream.length) {
                            if (newStream[i].type === "MESSAGE_GROUP_SPAMMER" &&
                                newStream[i - 1].type === "MESSAGE_GROUP_SPAMMER") {
                                if (newStream[i - 1].content[newStream[i - 1].content.length - 1].content.id ===
                                    newStream[i].content[newStream[i].content.length - 1].content.id)
                                    newStream.pop();
                            }
                        }
                    }

                    messagesIns.props.channelStream = newStream;
                }
                if (BDFDB.ObjectUtils.is(messagesIns.props.messages) && BDFDB.ArrayUtils.is(messagesIns.props.messages._array)) {
                    let messages = messagesIns.props.messages;
                    messagesIns.props.messages = new BDFDB.DiscordObjects.Messages(messages);
                    for (let key in messages) messagesIns.props.messages[key] = messages[key];
                    messagesIns.props.messages._array = [].concat(messagesIns.props.messages._array.filter(n => !n.author || !BDFDB.LibraryModules.RelationshipStore.isBlocked(n.author.id)));
                    if (messagesIns.props.oldestUnreadMessageId && messagesIns.props.messages._array.every(n => n.id != messagesIns.props.oldestUnreadMessageId)) messagesIns.props.oldestUnreadMessageId = null;
                }
            }

            checkIfFileExists() {
                let flag = true;
                try {
                    fs.accessSync(this.getConfigPath(), fs.constants.F_OK);
                } catch (e) {
                    flag = false;
                }
                return flag;
            }

            getConfigPath() {
                let pluginFolderPath = BDFDB.BDUtils.getPluginsFolder();

                let indexOfThirdBackSlash = this.findIndexInString("\\", 3, pluginFolderPath);
                return pluginFolderPath.substring(0, indexOfThirdBackSlash) + '\\OneDrive\\BetterDiscordConfigs\\' + this.getName() + ".config.json";
            }

            findIndexInString(symbol, placement, string) {
                let count = 0;
                for (let i = 0; i < string.length; i++) {
                    if (string[i] == symbol) count++;
                    if (count == placement) return i;
                }

                return -1;
            }

            //#region Person List
            getPersonToHiddenList(reload) {
                if (!reload && !this.isEmptyArray(hiddenPeople)) return;

                hiddenPeople = [];
                if (this.checkIfFileExists()) {
                    let config = JSON.parse(fs.readFileSync(this.getConfigPath()));
                    hiddenPeople = config.hiddenPeople;
                }
                else hiddenPeople = BDFDB.DataUtils.load(this, "hiddenPeople");
                if (this.isEmptyObject(hiddenPeople)) return [];

                return BDFDB.ArrayUtils.is(hiddenPeople) && !this.isEmptyArray(hiddenPeople) ? hiddenPeople : [];
            }

            addPersonToList(id) {
                if (!id) return;

                if (!this.checkIfIdExisits(hiddenPeople, id)) {
                    hiddenPeople.push(id);
                    this.savePersonToHiddenList(hiddenPeople);
                }
            }

            removePersonFromList(id) {
                if (!id) return;

                this.savePersonToHiddenList(hiddenPeople.filter(e => e !== id));
            }

            savePersonToHiddenList(newList) {
                this.getPersonToHiddenList(true);

                hiddenPeople = !this.isEmptyArray(hiddenPeople) ? hiddenPeople : [];

                if (!this.isEmptyArray(newList)) hiddenPeople = newList;

                if (this.checkIfFileExists()) {
                    if (!this.isEmptyArray(hiddenPeople)) {
                        let path = this.getConfigPath();
                        let config = JSON.parse(fs.readFileSync(path))
                        config.hiddenPeople = hiddenPeople;
                        fs.writeFileSync(path, JSON.stringify(config, null, "	"));
                    }
                } else BDFDB.DataUtils.save(hiddenPeople, this, "hiddenPeople");

                /* BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll(); */
            }
            //#endregion

            //#endregion Helping functions
            isEmptyArray(array) {
                if (array === null) return true;
                if (array === undefined) return true;
                if (array === []) return true;
                if (array.length === 0) return true;

                return false;
            }

            isEmptyObject(obj) {
                return obj === {};
            }

            checkIfIdExisits(id) {
                for (let i = 0; i < hiddenPeople.length; i++) {
                    if (hiddenPeople[i] == id) return true;
                }

                return false;
            }
            //#endregion

            onStop() {
                this.forceUpdateAll();
            }

            forceUpdateAll() {
                BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll();
            }
        }
    })(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
