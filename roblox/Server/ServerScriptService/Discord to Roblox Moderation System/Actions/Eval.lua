local module = {}

function module:Run(payload: {isGlobal: boolean, code: string, jobID: string})
	if(payload.isGlobal) then
		local s,e = pcall(function()
			require(script.Parent.Parent.Utils.Loadstring)(payload.code)()
		end)
		if(e) then
			warn("Eval execution returned an error: " .. e)
		end
	else
		if(game.JobId == payload.jobID) then
			local s,e = pcall(function()
				require(script.Parent.Parent.Utils.Loadstring)(payload.code)()
			end)
			if(e) then
				warn("Eval execution returned an error: " .. e)
			end
		end
	end
end

return module