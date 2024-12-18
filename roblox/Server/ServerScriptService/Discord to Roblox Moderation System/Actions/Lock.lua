local module = {}

function module:Run(payload: {jobID: string, reason: string})
	if(game.JobId == payload.jobID) then
		local config = require(script.Parent.Parent.Config)
		config.INTERNAL_IS_SERVER_LOCKED = true
		config.INTERNAL_SERVER_LOCK_REASON = payload.reason
	end
end

return module