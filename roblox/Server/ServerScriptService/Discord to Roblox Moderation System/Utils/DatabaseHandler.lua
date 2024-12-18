local DatastoreService = game:GetService("DataStoreService")
local config = require(script.Parent.Parent.Config)
local database = DatastoreService:GetDataStore(config.DATASTORE_NAME)

type ModerationData = {
	banData: {
		isBanned: boolean,
		reason: string,
		releaseTime: number
	},
	muteData: {
		isMuted: boolean,
		reason: string,
		releaseTime: number
	}
}

local module = {}

function module:GetModerationInformation(userID: number) : ModerationData
	local modData: ModerationData = nil
	local s,e = pcall(function()
		modData = database:GetAsync(tostring(userID) .. "-moderationData")
	end)
	if e then return nil end
	if(modData == nil) then
		modData = {
			banData = {
				isBanned = false,
				reason = ""
			},
			muteData = {
				isMuted = false,
				reason = ""
			}
		}
	end
	return modData
end

function module:UnbanPlayer(userID: number, modData: ModerationData)
	local s,e = pcall(function()
		database:SetAsync(tostring(userID) .. "-moderationData", {banData = {isBanned = false, reason = ""}, muteData = {isMuted = modData.muteData.isMuted, reason = modData.muteData.reason, releaseTime = modData.muteData.releaseTime}})
	end)
	if(e) then
		task.wait(10)
		module:UnbanPlayer(userID, modData)
	end
end

function module:UnmutePlayer(userID: number, modData: ModerationData)
	local s,e = pcall(function()
		database:SetAsync(tostring(userID) .. "-moderationData", {banData = {isBanned = modData.banData.isBanned, reason = modData.banData.reason, releaseTime = modData.banData.releaseTime}, muteData = {isMuted = false, reason = ""}})
	end)
	if(e) then
		task.wait(10)
		module:UnmutePlayer(userID, modData)
	end
end

return module