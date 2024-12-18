-- CONFIGURATION --

local DATASTORE_NAME = "moderations" -- Change this if you changed the datastore name

-- MAIN CODE --

local httpService = game:GetService("HttpService")
local scriptEditor = game:GetService("ScriptEditorService")

local SERVER_FILES_URL = "https://api.github.com/repos/sv-du/rbx-manager/contents/roblox/Server/ServerScriptService/Discord%20to%20Roblox%20Moderation%20System?ref=master"
local CLIENT_FILES_URL = "https://api.github.com/repos/sv-du/rbx-manager/contents/roblox/Client/StarterPlayer/StarterPlayerScripts/Discord%20to%20Roblox%20Moderation%20System?ref=master"

local folderName = "Discord to Roblox Moderation System"

local regularScripts = {"Main.lua"}

function hasValue(tab, val)
	for i,v in ipairs(tab) do
		if(v == val) then
			return true
		end
	end
	return false
end

function downloadGUI(folder: Folder)
	local objects = game:GetObjects("rbxassetid://13157806758")
	for i,v in pairs(objects) do
		v.Parent = folder
	end
end

function parseURL(url: string, folder: Folder, isServer: boolean)
	local res = httpService:JSONDecode(httpService:GetAsync(url))
	for _,file in pairs(res) do
		if(string.find(file.name, ".lua")) then
			local scriptInstance;
			if(isServer) then
				if(hasValue(regularScripts, file.name)) then
					scriptInstance = Instance.new("Script", folder)
				else
					scriptInstance = Instance.new("ModuleScript", folder)
				end
			else
				scriptInstance = Instance.new("LocalScript", folder)
			end
			scriptInstance.Name = file.name:gsub(".lua", "")
			scriptEditor:OpenScriptDocumentAsync(scriptInstance)
			local script = scriptEditor:FindScriptDocument(scriptInstance)
			local source = httpService:GetAsync(file.download_url)
			if(file.name == "Config.lua") then
				local temp = 'DATASTORE_NAME = "con"'
				source = source:gsub('DATASTORE_NAME = "moderations"', temp:gsub("con", DATASTORE_NAME))
			end
			script:EditTextAsync(source, 1, 1, 1, 1)
			script:CloseAsync()
		else
			Instance.new("Folder", folder).Name = file.name
			parseURL(file.url, folder[file.name], isServer)
		end
	end
end

pcall(function()
	local config = require(game:GetService("ServerScriptService")[folderName].Config)
	DATASTORE_NAME = config.DATASTORE_NAME
end)

pcall(function()
	game:GetService("ReplicatedStorage")[folderName]:Destroy()
	game:GetService("ServerScriptService")[folderName]:Destroy()
	game:GetService("StarterPlayer").StarterPlayerScripts[folderName]:Destroy()
end)

local replicatedStorageFolder = Instance.new("Folder", game:GetService("ReplicatedStorage"))
replicatedStorageFolder.Name = folderName
downloadGUI(replicatedStorageFolder)
Instance.new("RemoteEvent", replicatedStorageFolder).Name = "Announcement"
Instance.new("RemoteEvent", replicatedStorageFolder).Name = "SendMutes"

local serverFolder = Instance.new("Folder", game:GetService("ServerScriptService"))
serverFolder.Name = folderName
parseURL(SERVER_FILES_URL, serverFolder, true)

local clientFolder = Instance.new("Folder", game:GetService("StarterPlayer").StarterPlayerScripts)
clientFolder.Name = folderName
parseURL(CLIENT_FILES_URL, clientFolder, false)