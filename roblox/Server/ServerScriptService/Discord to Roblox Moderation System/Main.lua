local Players = game:GetService("Players")
local MessagingService = game:GetService("MessagingService")
local TextChatService = game:GetService("TextChatService")
local Database = require(script.Parent.Utils.DatabaseHandler)
local muteRemote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].SendMutes

Players.PlayerAdded:Connect(function(plr)
	local config = require(script.Parent.Config)
	if(config.INTERNAL_IS_SERVER_LOCKED) then return plr:Kick("This server is currently locked. Reason: " .. config.INTERNAL_SERVER_LOCK_REASON) end
	local modData = Database:GetModerationInformation(plr.UserId)
	if(modData == nil) then return plr:Kick("Error loading moderation data, please rejoin") end
	if(modData.banData.releaseTime) then
		local currentTime = os.time() * 1000
		if(currentTime < modData.banData.releaseTime) then
			local s, e = pcall(function()
				Players:BanAsync({
					UserIds = {plr.UserId},
					Duration = math.floor((modData.banData.releaseTime - currentTime) / 1000),
					DisplayReason = modData.banData.reason,
					PrivateReason = modData.banData.reason,
					ExcludeAltAccounts = false,
					ApplyToUniverse = true
				})
			end)
			plr:Kick("You are banned from this game. Reason: " .. modData.banData.reason)
			if(not e) then
				Database:UnbanPlayer(plr.UserId, modData)
			end
			return
		end
		Database:UnbanPlayer(plr.UserId, modData)
	else
		if(modData.banData.isBanned) then
			local s, e = pcall(function()
				Players:BanAsync({
					UserIds = {plr.UserId},
					Duration = -1,
					DisplayReason = modData.banData.reason,
					PrivateReason = modData.banData.reason,
					ExcludeAltAccounts = false,
					ApplyToUniverse = true
				})
			end)
			plr:Kick("You are banned from this game. Reason: " .. modData.banData.reason)
			if(not e) then
				Database:UnbanPlayer(plr.UserId, modData)
			end
			return
		end
	end
	if(modData.muteData.isMuted) then
		local continueOn = true
		if(modData.muteData.releaseTime) then
			local currentTime = os.time() * 1000
			if(currentTime >= modData.muteData.releaseTime) then
				continueOn = false
				Database:UnmutePlayer(plr.UserId, modData)
			end
		end
		if(continueOn) then
			local s, e = pcall(function()
				if(TextChatService.ChatVersion == Enum.ChatVersion.LegacyChatService) then
					task.wait(1) -- Wait for player speaker object to be created
					local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
					local channel = chatService:GetChannel("All")
					channel:MuteSpeaker(plr.DisplayName, modData.muteData.reason)
				else
					for i,v:TextChannel in pairs(TextChatService.TextChannels:GetChildren()) do
						v[plr.DisplayName].CanSend = false
					end
					muteRemote:FireClient(plr, true, modData.muteData.reason)
				end
			end)
			if(e) then
				plr:Kick("Error while muting") -- Kick player if fail on mute
			end
		end
	end
end)

MessagingService:SubscribeAsync("DiscordModerationSystemCall", function(data: {type: string, payload: any})
	local formattedData = game:GetService("HttpService"):JSONDecode(data.Data)
	local typeOfCall = formattedData["type"]
	local s,e = pcall(function()
		require(script.Parent.Actions[typeOfCall]):Run(formattedData.payload)
	end)
	if(e) then
		warn("Moderation System Error: " .. e)
	end
end)