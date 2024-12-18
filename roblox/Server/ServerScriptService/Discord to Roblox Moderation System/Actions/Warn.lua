local Remote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].Announcement

local module = {}

function module:Run(payload: {username: string, reason: string})
	local plr = game:GetService("Players"):FindFirstChild(payload.username)
	if(plr) then
		Remote:FireClient(plr, "Warning Issued", "You've been issued a warning for the following reason: " .. payload.reason)
	end
end

return module