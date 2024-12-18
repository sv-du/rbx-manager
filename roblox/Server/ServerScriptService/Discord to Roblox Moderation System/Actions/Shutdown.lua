local module = {}

function module:Run(payload: {isGlobal: boolean, jobID: string, reason: string})
	if(payload.isGlobal) then
		for i,v in pairs(game:GetService("Players"):GetChildren()) do
			v:Kick("This server has shutdown. Reason: " .. payload.reason)
		end
	else
		if(game.JobId == payload.jobID) then
			for i,v in pairs(game:GetService("Players"):GetChildren()) do
				v:Kick("This server has shutdown. Reason: " .. payload.reason)
			end
		end
	end
end

return module