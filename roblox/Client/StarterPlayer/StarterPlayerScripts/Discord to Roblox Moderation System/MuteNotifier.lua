local muteRemote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].SendMutes
local TextChatService = game:GetService("TextChatService")

muteRemote.OnClientEvent:Connect(function(isMute: boolean, reason: string)
	if(isMute) then
		TextChatService.TextChannels:GetChildren()[1]:DisplaySystemMessage("SYSTEM: You've been muted in all channels for the reason of " .. reason .. " You can still talk, but it won't replicate to other players")
	else
		TextChatService.TextChannels:GetChildren()[1]:DisplaySystemMessage("SYSTEM: You've been unmuted from all channels")
	end
end)