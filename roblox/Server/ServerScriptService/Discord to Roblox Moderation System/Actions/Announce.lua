local Remote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].Announcement
local config = require(script.Parent.Parent.Config)

local module = {}

function module:Run(payload: {title: string, message: string})
	Remote:FireAllClients(payload.title, payload.message)
end

return module