/**
 * @name CopyReport
 * @version 1.0.0
 * @description Allows you to copy a users username and user id at the same time.
 * @author KillerFRIEND
 * @website https://github.com/killerfrienddk
 * @source https://github.com/killerfrienddk/BetterDiscordAddons/tree/master/Plugins/CopyReport/
 * @updateUrl https://killerfrienddk.github.io/BetterDiscordAddons/Plugins/CopyReport/CopyReport.plugin.js
**/

module.exports = (() => {
	const config =
	{
		info:
		{
			name: "CopyReport",
			authors:
				[
					{
						name: "KillerFRIEND",
					}
				],
			version: "1.0.0",
			description: "Allows you to copy a users username and user id at the same time."
		}
	};

	return !global.ZeresPluginLibrary ? class {
		constructor() { this._config = config; }

		getName = () => config.info.name;
		getAuthor = () => config.info.description;
		getVersion = () => config.info.version;

		load() {
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (err, res, body) => {
						if (err) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}

		start() { }
		stop() { }
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const { DiscordModules, User, WebpackModules, Patcher } = Api;
			const { React } = DiscordModules

			const ContextMenu = WebpackModules.getByProps("MenuItem");

			const copyToClipboard = require("electron").clipboard.writeText;

			return class CopyReport extends Plugin {
				constructor() {
					super();
				}

				onStart() {
					console.log("Api")
					console.log(Api)
					const modules = WebpackModules.findAll(m => m.default && m.default.displayName 
					&& (m.default.displayName.endsWith("UserContextMenu") || m.default.displayName == "GroupDMContextMenu"));

					for (const m of modules) {
						Patcher.after(m, "default", (_, [props], re) => {
							const userID = props.user.id;
							const userName = `${props.user.username}#${props.user.discriminator}`;

							if (userID && userName)
								re.props.children.props.children.push(this.createContext(userID, userName));
						});
					}
				}

				createContext(userID, username) {
					return React.createElement(ContextMenu.MenuGroup,
						{
							children:
								[
									React.createElement(
										ContextMenu.MenuItem,
										{
											label: "Copy Username and U-ID",
											id: "evi-copy",
											action: () => copyToClipboard(`${username}\n${userID}`)
										}
									),
									React.createElement(
										ContextMenu.MenuItem,
										{
											label: "Copy Username",
											id: "eviu-copy",
											action: () => copyToClipboard(username)
										}
									)
								]
						});
				}

				onStop() {
					Patcher.unpatchAll();
				}
			}
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
