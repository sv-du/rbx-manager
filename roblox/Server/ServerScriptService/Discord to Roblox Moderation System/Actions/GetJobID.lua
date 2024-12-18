local DatastoreService = game:GetService("DataStoreService")
local database = DatastoreService:GetDataStore("GetJobIDRequests")

local module = {}

function module:Run(payload: {msgID: string, channelID: string, username: string})
	if(game:GetService("Players"):FindFirstChild(payload.username)) then
		local s,e = pcall(function()
			database:SetAsync(payload.username, game.JobId .. "|" .. game.PlaceId);
		end)
		if(e) then
			warn("GetJobID execution returned an error: " .. e)
		end
	end
end

return module