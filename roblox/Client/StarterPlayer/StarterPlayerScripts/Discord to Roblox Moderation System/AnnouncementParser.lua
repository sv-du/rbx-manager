local Remote = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"].Announcement
local GUI = game:GetService("ReplicatedStorage")["Discord to Roblox Moderation System"]["Announcement GUI"]

Remote.OnClientEvent:Connect(function(title, message)
	local clone = GUI:Clone()
	clone.Parent = game:GetService("Players").LocalPlayer.PlayerGui
	clone.Main.Title.Text = title
	clone.Main.Description.Text = message
	clone.Main.Visible = true
end)