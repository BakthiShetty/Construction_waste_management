using BackendApi.Models;
using Microsoft.AspNetCore.SignalR;

public class MaterialHub : Hub { }
public class MaterialNotifierService
{
    private readonly IHubContext<MaterialHub> _hubContext;

    public MaterialNotifierService(IHubContext<MaterialHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyMaterialPosted(Material material)
    {
        await _hubContext.Clients.All.SendAsync("MaterialPosted", new
        {
            material.Id,
            material.Name,
            material.Type,
            material.Location,
            material.ImageUrl,
            material.IsAvailable
        });
    }
}
