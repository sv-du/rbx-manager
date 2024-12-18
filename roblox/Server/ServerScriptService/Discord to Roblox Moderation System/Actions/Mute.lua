local TextChatService = game:GetService("TextChatService")
local muteRemote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].SendMutes

local module = {}

function getPlayer(username: string): Player
	local plr = game:GetService("Players"):FindFirstChild(username)
	if(plr) then
		return plr
	end
end

function convertToDN(username: string): string
	return getPlayer(username).DisplayName
end

function module:Run(payload: {username: string, reason: string})
	local displayName = convertToDN(payload.username)
	if(game:GetService("TextChatService").ChatVersion == Enum.ChatVersion.LegacyChatService) then
		local chatService = require(game:GetService("ServerScriptService"):WaitForChild("ChatServiceRunner"):WaitForChild("ChatService"))
		local channel = chatService:GetChannel("All")
		local s, e = pcall(function()
			channel:MuteSpeaker(displayName, payload.reason)
		end)
		if(e) then
			local p = getPlayer(payload.username)
			if(p) then
				p:Kick("Error while muting")
			end
		end
	else
		for i,v:TextChannel in pairs(TextChatService.TextChannels:GetChildren()) do
			v[displayName].CanSend = false
		end
		muteRemote:FireClient(getPlayer(payload.username), true, payload.reason)
	end
end

return module