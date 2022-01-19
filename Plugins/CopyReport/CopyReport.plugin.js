/**
 * @name CopyReport
 * @version 1.0.1
 * @description Allows you to copy a users username and user id at the same time.
 * @author KillerFRIEND
 * @website https://github.com/killerfrienddk
 * @source https://github.com/killerfrienddk/BetterDiscordAddons/tree/master/Plugins/CopyReport/
 * @updateUrl https://raw.githubusercontent.com/killerfrienddk/BetterDiscordAddons/main/Plugins/CopyReport/CopyReport.plugin.js
**/

module.exports = (() => {
    const config = {
        "info": {
            "name": "CopyReport",
            "author": "KillerFRIEND",
            "version": "1.0.1",
            "description": "Allows you to copy a users username and user id at the same time."
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
		const copyToClipboard = require("electron").clipboard.writeText;

        return class CopyReport extends Plugin {
            onLoad() {
                this.patchPriority = 9;
            }

			onUserContextMenu(e) {
                this.createMenuButton(e.instance.props.user, e.returnvalue);
            }

            onGroupDMContextMenu(e) {
                this.createMenuButton(e.instance.props.user, e.returnvalue);
            }

            onMessageContextMenu(e) {
                if (e.instance.props.message.author.email !== null) return;
                this.createMenuButton(e.instance.props.message.author, e.returnvalue);
            }

            createMenuButton(user, returnvalue) {
                if (user && returnvalue) {
					const userID = user.id;
					const username = `${user.username}#${user.discriminator}`;

                    let [children, index] = BDFDB.ContextMenuUtils.findItem(returnvalue, { id: ["pin", "unpin"] });
                    if (index == -1) [children, index] = BDFDB.ContextMenuUtils.findItem(returnvalue, { id: ["devmode-copy-id"] });
                    children.splice(index > -1 ? index + 1 : 0, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
                        label: "Copy Username and U-ID",
                        id: BDFDB.ContextMenuUtils.createItemId(this.name, "evi-copy"),
                        action: () => copyToClipboard(`${username}\n${userID}`)
                    }));
                }
            }
		}
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
