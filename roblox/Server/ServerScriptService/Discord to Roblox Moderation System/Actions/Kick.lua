local module = {}

function module:Run(payload: {username: string, reason: string})
	local plr = game:GetService("Players"):FindFirstChild(payload.username)
	if(plr) then
		plr:Kick(payload.reason)
	end
end

return module