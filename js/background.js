// (c) Andrew
// Icon by dunedhel: http://dunedhel.deviantart.com/
// Supporting functions by AdThwart - T. Joseph

//'use strict'; - enable after testing
var version = (function () {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
	xhr.send(null);
	return JSON.parse(xhr.responseText).version;
}());
var cloakedTabs = [];
var uncloakedTabs = [];
var contextLoaded = false;
var dpicon, dptitle;
var blackList, whiteList;

// ----- Supporting Functions

function enabled(tab, dpcloakindex) {
	var dpdomaincheck = domainCheck(extractDomainFromURL(tab.url));
	var dpcloakindex = dpcloakindex || cloakedTabs.indexOf(tab.windowId+"|"+tab.id);
	if ((localStorage["enable"] == "true" || dpdomaincheck == '1') && dpdomaincheck != '0' && (localStorage["global"] == "true" || (localStorage["global"] == "false" && (dpcloakindex != -1 || localStorage["newPages"] == "Cloak" || dpdomaincheck == '1')))) return 'true';
	return 'false';
}
function domainCheck(domain) {
	if (!domain) return '-1';
	if (in_array(domain, whiteList) == '1') return '0';
	if (in_array(domain, blackList) == '1') return '1';
	return '-1';
}
function in_array(needle, haystack) {
	if (!haystack || !needle) return false;
	if (binarySearch(haystack, needle) != -1) return '1';
	if (needle.indexOf('www.') == 0) {
		if (binarySearch(haystack, needle.substring(4)) != -1) return '1';
	}
	for (var i in haystack) {
		if (haystack[i].indexOf("*") == -1 && haystack[i].indexOf("?") == -1) continue;
		if (new RegExp('^(?:www\\.|^)(?:'+haystack[i].replace(/\./g, '\\.').replace(/^\[/, '\\[').replace(/\]$/, '\\]').replace(/\?/g, '.').replace(/\*/g, '[^.]+')+')').test(needle)) return '1';
	}
	return false;
}
function binarySearch(list, item) {
    var min = 0;
    var max = list.length - 1;
    var guess;
	var bitwise = (max <= 2147483647) ? true : false;
	if (bitwise) {
		while (min <= max) {
			guess = (min + max) >> 1;
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	} else {
		while (min <= max) {
			guess = Math.floor((min + max) / 2);
			if (list[guess] === item) { return guess; }
			else {
				if (list[guess] < item) { min = guess + 1; }
				else { max = guess - 1; }
			}
		}
	}
    return -1;
}
function extractDomainFromURL(url) {
	if (!url) return "";
	if (url.indexOf("://") != -1) url = url.substr(url.indexOf("://") + 3);
	if (url.indexOf("/") != -1) url = url.substr(0, url.indexOf("/"));
	if (url.indexOf("@") != -1) url = url.substr(url.indexOf("@") + 1);
	if (url.match(/^(?:\[[A-Fa-f0-9:.]+\])(:[0-9]+)?$/g)) {
		if (url.indexOf("]:") != -1) return url.substr(0, url.indexOf("]:")+1);
		return url;
	}
	if (url.indexOf(":") > 0) url = url.substr(0, url.indexOf(":"));
	return url;
}
function domainHandler(domain,action) {
	// Initialize local storage
	if (typeof(localStorage['whiteList'])=='undefined') saveSetting('whiteList', JSON.stringify([]));
	if (typeof(localStorage['blackList'])=='undefined') saveSetting('blackList', JSON.stringify([]));
	var tempWhitelist = JSON.parse(localStorage['whiteList']);
	var tempBlacklist = JSON.parse(localStorage['blackList']);
	
	// Remove domain from whitelist and blacklist
	var pos = tempWhitelist.indexOf(domain);
	if (pos>-1) tempWhitelist.splice(pos,1);
	pos = tempBlacklist.indexOf(domain);
	if (pos>-1) tempBlacklist.splice(pos,1);
	
	switch(action) {
		case 0:	// Whitelist
			tempWhitelist.push(domain);
			break;
		case 1:	// Blacklist
			tempBlacklist.push(domain);
			break;
		case 2:	// Remove
			break;
	}
	saveSetting('blackList', JSON.stringify(tempBlacklist));
	saveSetting('whiteList', JSON.stringify(tempWhitelist));
	blackList = tempBlacklist.sort();
	whiteList = tempWhitelist.sort();
	return false;
}
// ----- Options
function optionExists(opt) {
	return (typeof localStorage[opt] != "undefined");
}
function defaultOptionValue(opt, val) {
	if (!optionExists(opt)) saveSetting(opt, val);
}
function deleteSetting(opt) {
	delete localStorage[opt];
	browser.storage.local.remove([opt]);
}
function saveSetting(opt, val) {
	localStorage[opt] = val;
	browser.storage.local.set({[opt]: val});
}
function checkLocalStorage() {
	if (!optionExists('version')) {
		loadSettingsFromStorage();
		return false;
	}
	return true;
}
function loadSettingsFromStorage() {
	let getSettings = browser.storage.local.get();
	getSettings.then(function(setting) {
		for (var i in setting) {
			localStorage[i] = setting[i];
		}
	}, null);
}
function setDefaultOptions() {
	defaultOptionValue("version", version);
	defaultOptionValue("enable", "true");
	defaultOptionValue("enableToggle", "true");
	defaultOptionValue("hotkey", "CTRL F12");
	defaultOptionValue("paranoidhotkey", "ALT P");
	defaultOptionValue("global", "false");
	defaultOptionValue("newPages", "Uncloak");
	defaultOptionValue("sfwmode", "SFW");
	defaultOptionValue("savedsfwmode", "");
	defaultOptionValue("opacity1", "0.05");
	defaultOptionValue("opacity2", "0.5");
	defaultOptionValue("collapseimage", "false");
	defaultOptionValue("showIcon", "true");
	defaultOptionValue("iconType", "coffee");
	defaultOptionValue("iconTitle", "Decreased Productivity");
	defaultOptionValue("disableFavicons", "false");
	defaultOptionValue("hidePageTitles", "false");
	defaultOptionValue("pageTitleText", "Mozilla Firefox");
	defaultOptionValue("enableStickiness", "false");
	defaultOptionValue("maxwidth", "0");
	defaultOptionValue("maxheight", "0");
	defaultOptionValue("showContext", "true");
	defaultOptionValue("showUnderline", "true");
	defaultOptionValue("removeBold", "false");
	defaultOptionValue("showUpdateNotifications", "true");
	defaultOptionValue("font", "Arial");
	defaultOptionValue("customfont", "");
	defaultOptionValue("fontsize", "12");
	defaultOptionValue("s_bg", "FFFFFF");
	defaultOptionValue("s_link", "000099");
	defaultOptionValue("s_table", "cccccc");
	defaultOptionValue("s_text", "000000");
	defaultOptionValue("customcss", "");
	// fix hotkey shortcut if in old format (if using + as separator instead of space)
	if (localStorage["hotkey"].indexOf('+') != -1) {
		saveSetting('hotkey', localStorage["hotkey"].replace(/\+$/, "APLUSA").replace(/\+/g, " ").replace(/APLUSA/, "+"));
	}
	// delete old option if exists
	if (optionExists("globalEnable"))
		deleteSetting("globalEnable");
	// delete old option if exists
	if (optionExists("style"))
		deleteSetting("style");
	// set SFW Level to SFW (for new change in v0.46.3)
	if (localStorage["sfwmode"] == "true")
		saveSetting('sfwmode', "SFW");
	if (!optionExists("blackList")) saveSetting('blackList', JSON.stringify([]));
	if (!optionExists("whiteList")) saveSetting('whiteList', JSON.stringify([]));
}
// Context Menu
chrome.contextMenus.create({"title": chrome.i18n.getMessage("whitelistdomain"), "contexts": ['browser_action','page_action'], "onclick": function(info, tab){
	if (tab.url.substring(0, 4) != 'http') return;
	domainHandler(extractDomainFromURL(tab.url), 0);
	if (localStorage["enable"] == "true") magician('false', tab.id);
}});
chrome.contextMenus.create({"title": chrome.i18n.getMessage("blacklistdomain"), "contexts": ['browser_action','page_action'], "onclick": function(info, tab){
	if (tab.url.substring(0, 4) != 'http') return;
	domainHandler(extractDomainFromURL(tab.url), 1);
	if (localStorage["enable"] == "true") magician('true', tab.id);
}});
chrome.contextMenus.create({"title": chrome.i18n.getMessage("removelist"), "contexts": ['browser_action','page_action'], "onclick": function(info, tab){
	if (tab.url.substring(0, 4) != 'http') return;
	domainHandler(extractDomainFromURL(tab.url), 2);
	if (localStorage["enable"] == "true")  {
		var flag = 'false';
		if (localStorage['newPages'] == 'Cloak' || localStorage['global'] == 'true') flag = 'true';
		magician(flag, tab.id);
	}
}});
chrome.contextMenus.create({"title": chrome.i18n.getMessage("dpoptions"), "contexts": ['browser_action','page_action'], "onclick": function(info, tab){
	chrome.tabs.create({ url: chrome.extension.getURL('options.html'), active: true });
}});

// Called by clicking on the context menu item
function newCloak(info, tab) {
	// Enable cloaking (in case its been disabled) and open the link in a new tab
	saveSetting('enable', "true");
	// If it's an image, load the "src" attribute
	if (info.mediaType) chrome.tabs.create({'url': info.srcUrl}, function(tab){ cloakedTabs.push(tab.windowId+"|"+tab.id);recursiveCloak('true', localStorage["global"], tab.id); });
	// Else, it's a normal link, so load the linkUrl.
	else chrome.tabs.create({'url': info.linkUrl}, function(tab){ cloakedTabs.push(tab.windowId+"|"+tab.id);recursiveCloak('true', localStorage["global"], tab.id); });
}
// Add context menu item that shows only if you right-click on links/images.
function dpContext() {
	if (localStorage["showContext"] == 'true' && !contextLoaded) {
		chrome.contextMenus.create({"title": chrome.i18n.getMessage("opensafely"), "contexts": ['link', 'image'], "onclick": function(info, tab){newCloak(info, tab);}});
		contextLoaded = true;
	}
}
// ----- Main Functions
function checkChrome(url) {
	if (url.substring(0, 6) == 'chrome') return true;
	return false;
}
function hotkeyChange() {
	chrome.windows.getAll({"populate":true}, function(windows) {
		windows.map(function(window) {
			window.tabs.map(function(tab) {
				if (!checkChrome(tab.url)) chrome.tabs.executeScript(tab.id, {code: 'hotkeySet("'+localStorage["enableToggle"]+'","'+localStorage["hotkey"]+'","'+localStorage["paranoidhotkey"]+'");', allFrames: true});
			});
		});
	});
}
function optionsSaveTrigger(prevglob, newglob) {
	var enable = localStorage["enable"];
	var global = newglob;
	if (prevglob == 'true' && newglob == 'false') {
		global = 'true';
		enable = 'false';
	}
	if (global == 'false') {
		for (var i=cloakedTabs.length-1; i>=0; --i) {
			magician(enable, parseInt(cloakedTabs[i].split("|")[1]));
		}
		if (enable == 'false') cloakedTabs = [];
	} else recursiveCloak(enable, global);
}
function recursiveCloak(enable, global, tabId) {
	if (global == 'true') {
		chrome.windows.getAll({"populate":true}, function(windows) {
			windows.map(function(window) {
				window.tabs.map(function(tab) {
					if (!checkChrome(tab.url)) {
						var enabletemp = enable;
						var dpdomaincheck = domainCheck(extractDomainFromURL(tab.url));
						// Ensure whitelisted or blacklisted tabs stay as they are
						if (enabletemp == 'true' && dpdomaincheck == '0') enabletemp = 'false';
						else if (enabletemp == 'false' && dpdomaincheck == '1') enabletemp = 'true';
						magician(enabletemp, tab.id);
						var dpTabId = tab.windowId+"|"+tab.id;
						var dpcloakindex = cloakedTabs.indexOf(dpTabId);
						var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
						if (enabletemp == 'false') {
							if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
							if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
						} else {
							if (dpcloakindex == -1) cloakedTabs.push(dpTabId);
							if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
						}
					}
				});
			});
		});
	} else {
		if (tabId) magician(enable, tabId);
	}
}
function magician(enable, tabId) {
	if (enable == 'true') {
		if (localStorage["disableFavicons"] == 'true' && localStorage["hidePageTitles"] == 'true')
			chrome.tabs.executeScript(tabId, {code: 'init();faviconblank();replaceTitle("'+localStorage["pageTitleText"]+'");titleBind("'+localStorage["pageTitleText"]+'");', allFrames: true});
		else if (localStorage["disableFavicons"] == 'true' && localStorage["hidePageTitles"] != 'true')
			chrome.tabs.executeScript(tabId, {code: 'init();faviconblank();titleRestore();', allFrames: true});
		else if (localStorage["disableFavicons"] != 'true' && localStorage["hidePageTitles"] == 'true')
			chrome.tabs.executeScript(tabId, {code: 'init();faviconrestore();replaceTitle("'+localStorage["pageTitleText"]+'");titleBind("'+localStorage["pageTitleText"]+'");', allFrames: true});
		else if (localStorage["disableFavicons"] != 'true' && localStorage["hidePageTitles"] != 'true')
			chrome.tabs.executeScript(tabId, {code: 'init();faviconrestore();titleRestore();', allFrames: true});
	} else chrome.tabs.executeScript(tabId, {code: "removeCss();", allFrames: true});
	if (localStorage["showIcon"] == 'true') {
		if (enable == 'true') chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+".png", tabId: tabId});
		else chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+"-disabled.png", tabId: tabId});
		chrome.pageAction.setTitle({title: dptitle, tabId: tabId});
		chrome.pageAction.show(tabId);
	} else chrome.pageAction.hide(tabId);
}
function dpHandle(tab) {
	if (checkChrome(tab.url)) return;
	if (localStorage["global"] == "true" && domainCheck(extractDomainFromURL(tab.url)) != 1) {
		if (localStorage["enable"] == "true") {
			recursiveCloak('false', 'true');
			saveSetting('enable', "false");
		} else {
			recursiveCloak('true', 'true');
			saveSetting('enable', "true");
		}
	} else {
		var dpTabId = tab.windowId+"|"+tab.id;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
		saveSetting('enable', "true");
		if (dpcloakindex != -1) {
			magician('false', tab.id);
			if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
			cloakedTabs.splice(dpcloakindex, 1);
		} else {
			magician('true', tab.id);
			cloakedTabs.push(dpTabId);
			if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
		}
	}
}
function setDPIcon() {
	dpicon = localStorage["iconType"];
	dptitle = localStorage["iconTitle"];
	chrome.windows.getAll({"populate":true}, function(windows) {
		windows.map(function(window) {
			window.tabs.map(function(tab) {
				if (cloakedTabs.indexOf(tab.windowId+"|"+tab.id) != -1) chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+".png", tabId: tab.id});
				else chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+"-disabled.png", tabId: tab.id});
				chrome.pageAction.setTitle({title: dptitle, tabId: tab.id});
				if (localStorage["showIcon"] == 'true') chrome.pageAction.show(tab.id);
				else chrome.pageAction.hide(tab.id);
			});
		});
	});
}
function initLists() {
	blackList = JSON.parse(localStorage['blackList']).sort();
	whiteList = JSON.parse(localStorage['whiteList']).sort();	
}
// ----- Request library to support content script communication
chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
	if (changeinfo.status == "loading") {
		var dpTabId = tab.windowId+"|"+tabid;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var enable = enabled(tab, dpcloakindex);
		if (localStorage["showIcon"] == "true") {
			if (enable == "true") chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+".png", tabId: tabid});
			else chrome.pageAction.setIcon({path: "img/addressicon/"+dpicon+"-disabled.png", tabId: tabid});
			chrome.pageAction.setTitle({title: dptitle, tabId: tabid});
			chrome.pageAction.show(tabid);
		} else chrome.pageAction.hide(tabid);
		if (checkChrome(tab.url)) return;
		var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
		if (enable == "true") {
			magician('true', tabid);
			if (localStorage["global"] == "false" && localStorage["enable"] == "false") saveSetting('enable', "true");
			if (dpcloakindex == -1) cloakedTabs.push(dpTabId);
			if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
		} else {
			if (localStorage["enableStickiness"] == "true") {
				if (tab.openerTabId) {
					if (cloakedTabs.indexOf(tab.windowId+"|"+tab.openerTabId) != -1 && dpuncloakindex == -1) {
						if (domainCheck(extractDomainFromURL(tab.url)) != '0') {
							magician('true', tabid);
							cloakedTabs.push(dpTabId);
							return;
						}
					}
					if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
					if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
				} else {
					chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						if (tabs[0].windowId == tab.windowId && cloakedTabs.indexOf(tabs[0].windowId+"|"+tabs[0].id) != -1 && dpuncloakindex == -1) {
							if (domainCheck(extractDomainFromURL(tab.url)) != '0') {
								magician('true', tabid);
								cloakedTabs.push(dpTabId);
								return;
							}
						}
						if (dpuncloakindex == -1) uncloakedTabs.push(dpTabId);
						if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
					});
				}
			}
		}
	}
});	
chrome.tabs.onRemoved.addListener(function(tabid, windowInfo) {
	var dpTabId = windowInfo.windowId+"|"+tabid;
	var dpcloakindex = cloakedTabs.indexOf(dpTabId);
	var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
	if (dpcloakindex != -1) cloakedTabs.splice(dpcloakindex, 1);
	if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
});
var requestDispatchTable = {
	"get-enabled": function(request, sender, sendResponse) {
		checkLocalStorage();
		var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
		var dpcloakindex = cloakedTabs.indexOf(dpTabId);
		var enable = enabled(sender.tab, dpcloakindex);
		if (enable == 'true' && dpcloakindex == -1) cloakedTabs.push(dpTabId);
		sendResponse({enable: enable, background: localStorage["s_bg"], favicon: localStorage["disableFavicons"], hidePageTitles: localStorage["hidePageTitles"], pageTitleText: localStorage["pageTitleText"], enableToggle: localStorage["enableToggle"], hotkey: localStorage["hotkey"], paranoidhotkey: localStorage["paranoidhotkey"]});
	},
	"toggle": function(request, sender, sendResponse) {
		if (localStorage["savedsfwmode"] != "") {
			saveSetting('sfwmode', localStorage["savedsfwmode"]);
			saveSetting('savedsfwmode', "");
			if (localStorage["global"] == "true") recursiveCloak('true', 'true');
			else {
				magician('true', sender.tab.id);
				var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
				var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
				if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
				if (cloakedTabs.indexOf(dpTabId) == -1) cloakedTabs.push(dpTabId);
			}
			saveSetting('enable', "true");
		} else {
			dpHandle(sender.tab);
		}
	},
	"toggleparanoid": function(request, sender, sendResponse) {
		if (localStorage["savedsfwmode"] == "") {
			saveSetting('savedsfwmode', localStorage["sfwmode"]);
			saveSetting('sfwmode', "Paranoid");
			if (localStorage["global"] == "true") recursiveCloak('true', 'true');
			else {
				magician('true', sender.tab.id);
				var dpTabId = sender.tab.windowId+"|"+sender.tab.id;
				var dpuncloakindex = uncloakedTabs.indexOf(dpTabId);
				if (dpuncloakindex != -1) uncloakedTabs.splice(dpuncloakindex, 1);
				if (cloakedTabs.indexOf(dpTabId) == -1) cloakedTabs.push(dpTabId);
			}
			saveSetting('enable', "true");
		} else {
			saveSetting('sfwmode', localStorage["savedsfwmode"]);
			saveSetting('savedsfwmode', "");
			dpHandle(sender.tab);
		}
	},
	"get-settings": function(request, sender, sendResponse) {
		var enable, fontface;
		if (localStorage["font"] == '-Custom-') {
			if (localStorage["customfont"]) fontface = localStorage["customfont"];
			else fontface = 'Arial';
		} else fontface = localStorage["font"];
		if (localStorage["global"] == "false") enable = 'true';
		else enable = enabled(sender.tab);
		sendResponse({enable: enable, sfwmode: localStorage["sfwmode"], font: fontface, fontsize: localStorage["fontsize"], underline: localStorage["showUnderline"], background: localStorage["s_bg"], text: localStorage["s_text"], table: localStorage["s_table"], link: localStorage["s_link"], bold: localStorage["removeBold"], opacity1: localStorage["opacity1"], opacity2: localStorage["opacity2"], collapseimage: localStorage["collapseimage"], maxheight: localStorage["maxheight"], maxwidth: localStorage["maxwidth"], customcss: localStorage["customcss"]});
	}
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.reqtype in requestDispatchTable) requestDispatchTable[request.reqtype](request, sender, sendResponse);
	else sendResponse({});
});
// ----- If page action icon is clicked, either enable or disable the cloak
chrome.pageAction.onClicked.addListener(function(tab) {
	dpHandle(tab);
});
// Execute
loadSettingsFromStorage();
setDefaultOptions();
// save blacklist and whitelist in global variable for faster lookups
initLists();
setDPIcon();
dpContext();
if ((!optionExists("version") || localStorage["version"] != version) && localStorage["showUpdateNotifications"] == 'true') {
	//chrome.tabs.create({ url: chrome.extension.getURL('updated.html'), selected: false }); - minor update so don't show update page
	saveSetting('version', version);
}
chrome.runtime.onUpdateAvailable.addListener(function (details) {
	// an update is available, but wait until user restarts their browser as to not disrupt their current session and cloaked tabs.
});